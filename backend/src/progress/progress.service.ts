import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizAttemptDto } from './dto/quiz-attempt.dto';
import { ModuleLevel, Prisma, ProgressStatus } from '../../generated/prisma/client.js';

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
  private cachedSortedModules: any[] | null = null;

  constructor(private prisma: PrismaService) {}

  invalidateCache() {
    this.cachedSortedModules = null;
  }

  private async getSortedModules() {
    if (this.cachedSortedModules) {
      return this.cachedSortedModules;
    }

    const topics = await this.prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
      select: { id: true, orderIndex: true },
    });

    const topicOrderMap = new Map<string, number>();
    topics.forEach((t) => topicOrderMap.set(t.id, t.orderIndex));

    const modules = await this.prisma.module.findMany({
      select: { id: true, topicId: true, level: true, orderIndex: true },
    });

    const sorted = modules.sort((a, b) => {
      const topicOrderA = a.topicId ? (topicOrderMap.get(a.topicId) ?? 0) : 0;
      const topicOrderB = b.topicId ? (topicOrderMap.get(b.topicId) ?? 0) : 0;
      if (topicOrderA !== topicOrderB) return topicOrderA - topicOrderB;

      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;

      return a.orderIndex - b.orderIndex;
    });

    this.cachedSortedModules = sorted;
    return sorted;
  }

  async getModuleStatusesForUser(userId: string): Promise<Map<string, ProgressStatus>> {
    const sortedModules = await this.getSortedModules();

    const userProgress = await this.prisma.userModuleProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { moduleId: true },
    });

    const completedModuleIds = new Set(userProgress.map((p) => p.moduleId));
    const calculatedMap = new Map<string, ProgressStatus>();

    for (const mod of sortedModules) {
      if (completedModuleIds.has(mod.id)) {
        calculatedMap.set(mod.id, 'COMPLETED');
      }
    }

    for (let i = 0; i < sortedModules.length; i++) {
      const mod = sortedModules[i];
      if (calculatedMap.get(mod.id) === 'COMPLETED') {
        continue;
      }

      if (i === 0) {
        calculatedMap.set(mod.id, 'UNLOCKED');
      } else {
        const predMod = sortedModules[i - 1];
        if (calculatedMap.get(predMod.id) === 'COMPLETED') {
          calculatedMap.set(mod.id, 'UNLOCKED');
        } else {
          calculatedMap.set(mod.id, 'LOCKED');
        }
      }
    }

    return calculatedMap;
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
    const statuses = await this.getModuleStatusesForUser(userId);
    const status = statuses.get(moduleId) || 'LOCKED';
    return { status };
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
    const statuses = await this.getModuleStatusesForUser(userId);
    const status = statuses.get(moduleId) || 'LOCKED';
    if (status === 'LOCKED') {
      throw new ForbiddenException(
        'Module is locked. Complete the previous module first.',
      );
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

        // Calculate topicCompleted dynamically
        if (module.topicId) {
          const allModulesInTopic = await tx.module.findMany({
            where: { topicId: module.topicId },
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
          topicCompleted = completedTopicCount === allTopicModuleIds.length;

          if (topicCompleted) {
            const currentTopic = await tx.topic.findUnique({
              where: { id: module.topicId },
              select: { orderIndex: true },
            });
            if (currentTopic) {
              const nextTopic = await tx.topic.findFirst({
                where: { orderIndex: { gt: currentTopic.orderIndex } },
              });
              nextTopicUnlocked = !!nextTopic;
            }
          }
        }
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

  async retroactiveUnlockForNewModule(
    newModuleId: string,
    topicId: string | null,
    level: ModuleLevel | null,
    tx?: any,
  ): Promise<number> {
    return 0;
  }
}
