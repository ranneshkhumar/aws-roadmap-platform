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
      streak: user.streak,
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

      // XP calculation: moduleXP + (correctAnswers / totalQuestions) * moduleXP
      // If already completed, award 0 XP (anti-farming rule)
      const xpEarned = isAlreadyCompleted
        ? 0
        : Math.round(
            module.xpPoints +
              (correctAnswersCount / totalQuestionsCount) * module.xpPoints,
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
        await this.unlockNextModule(tx, userId, module);
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
  ) {
    if (!completedModule.topicId || !completedModule.level) return;

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
      return;
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

    if (completedLevelCount < allLevelModuleIds.length) return;

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
        return;
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

    if (completedTopicCount < allTopicModuleIds.length) return;

    // STEP 5: Topic fully completed — find next topic
    const currentTopic = await tx.topic.findUnique({
      where: { id: completedModule.topicId },
      select: { orderIndex: true },
    });

    if (!currentTopic) return;

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
}
