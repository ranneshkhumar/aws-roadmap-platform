import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizAttemptDto } from './dto/quiz-attempt.dto';
import { ModuleLevel, Prisma } from '../../generated/prisma/client.js';

const LEVEL_ORDER: Record<ModuleLevel, number> = {
  [ModuleLevel.BEGINNER]: 0,
  [ModuleLevel.INTERMEDIATE]: 1,
  [ModuleLevel.ADVANCED]: 2,
};

const LEVEL_VALUES: ModuleLevel[] = [
  ModuleLevel.BEGINNER,
  ModuleLevel.INTERMEDIATE,
  ModuleLevel.ADVANCED,
];

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private prisma: PrismaService) {}

  private async findFirstBeginnerModuleOfFirstTopic() {
    const firstTopic = await this.prisma.topic.findFirst({
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    });

    if (!firstTopic) return null;

    return this.prisma.module.findFirst({
      where: {
        topicId: firstTopic.id,
        level: ModuleLevel.BEGINNER,
      },
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    });
  }

  async getUserProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return {
      currentXP: user.xp,
    };
  }

  async getModuleProgress(userId: string, moduleId: string) {
    const progress = await this.prisma.userModuleProgress.findUnique({
      where: {
        userId_moduleId: { userId, moduleId },
      },
    });

    if (progress) {
      return { status: progress.status };
    }

    // Fallback: Check if it is the first Beginner module of the first Topic
    const firstBeginnerModule =
      await this.findFirstBeginnerModuleOfFirstTopic();

    if (firstBeginnerModule && firstBeginnerModule.id === moduleId) {
      return { status: 'UNLOCKED' };
    }

    return { status: 'LOCKED' };
  }

  async submitQuizAttempt(
    userId: string,
    moduleId: string,
    dto: QuizAttemptDto,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID "${moduleId}" not found`);
    }

    // Authorization guard: verify module is accessible
    const progress = await this.prisma.userModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });

    if (progress) {
      if (progress.status === 'LOCKED') {
        throw new ForbiddenException(
          'Module is locked. Complete the previous module first.',
        );
      }
    } else {
      // No progress record — only allow if this is the first Beginner module of the first Topic
      const firstBeginnerModule =
        await this.findFirstBeginnerModuleOfFirstTopic();
      if (firstBeginnerModule?.id !== moduleId) {
        throw new ForbiddenException(
          'Module is locked. Complete the previous module first.',
        );
      }
    }

    // Load questions to evaluate score server-side
    const questions = await this.prisma.quizQuestion.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Module has no quiz questions configured');
    }

    // Check correctness
    let correctAnswersCount = 0;
    const totalQuestionsCount = questions.length;

    const answerRecords: {
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
    }[] = [];
    for (const question of questions) {
      const userAnswer = dto.answers.find(
        (a) => a.questionOrder === question.orderIndex,
      );
      const selectedAnswer = userAnswer ? userAnswer.selectedAnswer : '';
      const isCorrect = userAnswer
        ? userAnswer.selectedAnswer === question.correctAnswer
        : false;

      if (isCorrect) {
        correctAnswersCount++;
      }

      answerRecords.push({
        questionId: question.id,
        selectedAnswer,
        isCorrect,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if module is already completed
      const existingProgress = await tx.userModuleProgress.findUnique({
        where: {
          userId_moduleId: { userId, moduleId },
        },
      });

      const isAlreadyCompleted =
        existingProgress && existingProgress.status === 'COMPLETED';

      // XP calculation: 50% base + 50% performance bonus
      // base = moduleXP * 0.5 (awarded for completion)
      // bonus = moduleXP * 0.5 * (correctAnswers / totalQuestions)
      // If already completed, award 0 XP (anti-farming rule)
      const xpEarned = isAlreadyCompleted
        ? 0
        : Math.round(
            module.xpPoints * 0.5 +
              module.xpPoints * 0.5 * (correctAnswersCount / totalQuestionsCount),
          );

      // 1. Store QuizAttempt
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          moduleId,
          totalQuestions: totalQuestionsCount,
          correctAnswers: correctAnswersCount,
          percentage: (correctAnswersCount / totalQuestionsCount) * 100,
          xpEarned,
        },
      });

      // 2. Store QuizAttemptAnswers
      await tx.quizAttemptAnswer.createMany({
        data: answerRecords.map((rec) => ({
          attemptId: attempt.id,
          questionId: rec.questionId,
          selectedAnswer: rec.selectedAnswer,
          isCorrect: rec.isCorrect,
        })),
      });

      // 3. Update User.xp if there's any reward
      if (xpEarned > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: xpEarned,
            },
          },
        });
      }

      // 4. Update progress and unlock next module if new completion
      let topicCompleted = false;
      let nextTopicUnlocked = false;

      if (!isAlreadyCompleted) {
        await tx.userModuleProgress.upsert({
          where: {
            userId_moduleId: { userId, moduleId },
          },
          create: {
            userId,
            moduleId,
            status: 'COMPLETED',
            score: correctAnswersCount,
            xpEarned,
            completedAt: new Date(),
          },
          update: {
            status: 'COMPLETED',
            score: correctAnswersCount,
            xpEarned,
            completedAt: new Date(),
          },
        });

        // 5. Unlock next module using topic/level/module progression
        const unlockResult = await this.unlockNextModule(tx, userId, module);
        topicCompleted = unlockResult.topicCompleted;
        nextTopicUnlocked = unlockResult.nextTopicUnlocked;
      } else {
        // If already completed, just update the score if needed (keep highest)
        const currentBestScore = existingProgress.score ?? 0;
        const newScore = Math.max(currentBestScore, correctAnswersCount);

        await tx.userModuleProgress.update({
          where: {
            userId_moduleId: { userId, moduleId },
          },
          data: {
            score: newScore,
          },
        });
      }

      return {
        attemptId: attempt.id,
        correctAnswers: correctAnswersCount,
        totalQuestions: totalQuestionsCount,
        percentage: Math.round(
          (correctAnswersCount / totalQuestionsCount) * 100,
        ),
        xpEarned,
        topicCompleted,
        nextTopicUnlocked,
      };
    });
  }

  private async unlockNextModule(
    tx: Prisma.TransactionClient,
    userId: string,
    completedModule: {
      id: string;
      topicId: string | null;
      level: ModuleLevel | null;
      orderIndex: number;
    },
  ): Promise<{ topicCompleted: boolean; nextTopicUnlocked: boolean }> {
    if (!completedModule.topicId || !completedModule.level) {
      return { topicCompleted: false, nextTopicUnlocked: false };
    }

    const currentLevel = completedModule.level;

    // STEP 1: Find next module in same topic + same level
    const nextModuleInLevel = await tx.module.findFirst({
      where: {
        topicId: completedModule.topicId,
        level: currentLevel,
        orderIndex: { gt: completedModule.orderIndex },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (nextModuleInLevel) {
      await this.createOrUpdateUnlock(tx, userId, nextModuleInLevel.id);
      return { topicCompleted: false, nextTopicUnlocked: false };
    }

    // STEP 2: Verify ALL modules in current level are COMPLETED before advancing
    const allModulesInLevel = await tx.module.findMany({
      where: {
        topicId: completedModule.topicId,
        level: currentLevel,
      },
      select: { id: true },
    });

    const allLevelModuleIds = allModulesInLevel.map((m) => m.id);
    const completedLevelCount = await tx.userModuleProgress.count({
      where: {
        userId,
        moduleId: { in: allLevelModuleIds },
        status: 'COMPLETED',
      },
    });

    if (completedLevelCount < allLevelModuleIds.length) {
      return { topicCompleted: false, nextTopicUnlocked: false };
    }

    // STEP 3: Level fully completed — find first module of next level in same topic
    const currentLevelIndex = LEVEL_ORDER[currentLevel];

    for (let i = currentLevelIndex + 1; i < LEVEL_VALUES.length; i++) {
      const nextLevel = LEVEL_VALUES[i];

      const firstModuleOfNextLevel = await tx.module.findFirst({
        where: {
          topicId: completedModule.topicId,
          level: nextLevel,
        },
        orderBy: { orderIndex: 'asc' },
      });

      if (firstModuleOfNextLevel) {
        await this.createOrUpdateUnlock(tx, userId, firstModuleOfNextLevel.id);
        return { topicCompleted: false, nextTopicUnlocked: false };
      }
    }

    // STEP 4: Verify ALL modules in current topic are COMPLETED before advancing
    const allModulesInTopic = await tx.module.findMany({
      where: {
        topicId: completedModule.topicId,
      },
      select: { id: true },
    });

    const allTopicModuleIds = allModulesInTopic.map((m) => m.id);
    const completedTopicCount = await tx.userModuleProgress.count({
      where: {
        userId,
        moduleId: { in: allTopicModuleIds },
        status: 'COMPLETED',
      },
    });

    if (completedTopicCount < allTopicModuleIds.length) {
      return { topicCompleted: false, nextTopicUnlocked: false };
    }

    // STEP 5: Topic fully completed — find next topic
    const currentTopic = await tx.topic.findUnique({
      where: { id: completedModule.topicId },
      select: { orderIndex: true },
    });

    if (!currentTopic) {
      return { topicCompleted: true, nextTopicUnlocked: false };
    }

    const nextTopic = await tx.topic.findFirst({
      where: {
        orderIndex: { gt: currentTopic.orderIndex },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (nextTopic) {
      // Unlock first Beginner module of next topic
      const firstBeginnerModule = await tx.module.findFirst({
        where: {
          topicId: nextTopic.id,
          level: ModuleLevel.BEGINNER,
        },
        orderBy: { orderIndex: 'asc' },
      });

      if (firstBeginnerModule) {
        await this.createOrUpdateUnlock(tx, userId, firstBeginnerModule.id);
      }
    }

    return { topicCompleted: true, nextTopicUnlocked: !!nextTopic };
  }

  private async createOrUpdateUnlock(
    tx: Prisma.TransactionClient,
    userId: string,
    moduleId: string,
  ) {
    const existing = await tx.userModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });

    if (!existing) {
      await tx.userModuleProgress.create({
        data: {
          userId,
          moduleId,
          status: 'UNLOCKED',
        },
      });
    } else if (existing.status === 'LOCKED') {
      await tx.userModuleProgress.update({
        where: { userId_moduleId: { userId, moduleId } },
        data: { status: 'UNLOCKED' },
      });
    }
  }

  async getQuizReview(userId: string, moduleId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, moduleId },
      orderBy: { attemptedAt: 'desc' },
      include: {
        answers: {
          include: { question: true },
          orderBy: { question: { orderIndex: 'asc' } },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('No quiz attempt found for this module');
    }

    return {
      moduleId,
      score: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      xpEarned: attempt.xpEarned,
      completedAt: attempt.attemptedAt.toISOString(),
      answers: attempt.answers.map((a) => ({
        question: a.question.question,
        options: [
          a.question.optionA,
          a.question.optionB,
          a.question.optionC,
          a.question.optionD,
        ],
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.question.correctAnswer,
        isCorrect: a.isCorrect,
        explanation: a.question.explanation,
      })),
    };
  }

  /**
   * Retroactively unlock a new module for learners who have progressed
   * past the level where the module was inserted.
   *
   * Eligibility: learner has
   *   - completed the target level, OR
   *   - unlocked/completed a module in a later level (same topic), OR
   *   - unlocked/completed a module in a later topic
   *
   * @param tx Optional transaction client for read-after-write consistency
   */
  async retroactiveUnlockForNewModule(
    newModuleId: string,
    topicId: string | null,
    level: ModuleLevel | null,
    tx?: any,
  ): Promise<number> {
    if (!topicId || !level) return 0;

    const db = tx || this.prisma;

    // 1. Find all module IDs in the target level
    const levelModules = await db.module.findMany({
      where: { topicId, level },
      select: { id: true },
    });
    const levelModuleIds = levelModules.map((m) => m.id);

    // 2. Find all module IDs in later levels of the same topic
    const laterLevelValues = LEVEL_VALUES.filter(
      (lv) => LEVEL_ORDER[lv] > LEVEL_ORDER[level],
    );
    const laterLevelModules = await db.module.findMany({
      where: { topicId, level: { in: laterLevelValues } },
      select: { id: true },
    });
    const laterLevelModuleIds = laterLevelModules.map((m) => m.id);

    // 3. Find all module IDs in later topics
    const currentTopic = await db.topic.findUnique({
      where: { id: topicId },
      select: { orderIndex: true },
    });
    let laterTopicModuleIds: string[] = [];
    if (currentTopic) {
      const laterTopics = await db.topic.findMany({
        where: { orderIndex: { gt: currentTopic.orderIndex } },
        select: { id: true },
      });
      const laterTopicIds = laterTopics.map((t) => t.id);
      if (laterTopicIds.length > 0) {
        const laterTopicModules = await db.module.findMany({
          where: { topicId: { in: laterTopicIds } },
          select: { id: true },
        });
        laterTopicModuleIds = laterTopicModules.map((m) => m.id);
      }
    }

    // 4. Combine all eligible module IDs
    const eligibleModuleIds = [
      ...levelModuleIds,
      ...laterLevelModuleIds,
      ...laterTopicModuleIds,
    ];

    if (eligibleModuleIds.length === 0) return 0;

    // 5. Find learners who have COMPLETED or UNLOCKED any eligible module
    const eligibleLearners = await db.userModuleProgress.findMany({
      where: {
        moduleId: { in: eligibleModuleIds },
        status: { in: ['COMPLETED', 'UNLOCKED'] },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (eligibleLearners.length === 0) return 0;

    // 6. Create UNLOCKED records for the new module (skip duplicates)
    const result = await db.userModuleProgress.createMany({
      data: eligibleLearners.map((p) => ({
        userId: p.userId,
        moduleId: newModuleId,
        status: 'UNLOCKED' as const,
      })),
      skipDuplicates: true,
    });

    this.logger.log(
      `Retroactive unlock: ${result.count} learners unlocked for new module ${newModuleId}`,
    );

    return result.count;
  }
}
