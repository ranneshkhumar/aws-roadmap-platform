import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role, ModuleLevel } from '../../generated/prisma/client.js';

const LEVEL_ORDER: Record<ModuleLevel, number> = {
  [ModuleLevel.BEGINNER]: 0,
  [ModuleLevel.INTERMEDIATE]: 1,
  [ModuleLevel.ADVANCED]: 2,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        role: Role.ENTHUSIAST,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAllLearners() {
    const [users, totalModulesCount, totalTopicsCount] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: [Role.CREW, Role.ENTHUSIAST] } },
        orderBy: { xp: 'desc' },
        include: {
          progress: {
            where: { status: { in: ['COMPLETED', 'UNLOCKED'] } },
            select: {
              status: true,
              module: {
                select: {
                  name: true,
                  level: true,
                  orderIndex: true,
                  topic: { select: { name: true, orderIndex: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.module.count(),
      this.prisma.topic.count(),
    ]);

    return users.map((u) => {
      const completedModulesCount = u.progress.filter(
        (p) => p.status === 'COMPLETED',
      ).length;

      const activeRow = u.progress
        .filter((p) => p.status === 'UNLOCKED')
        .sort((a, b) => {
          const topicDiff =
            (a.module.topic?.orderIndex ?? 0) -
            (b.module.topic?.orderIndex ?? 0);
          if (topicDiff !== 0) return topicDiff;

          const levelDiff =
            LEVEL_ORDER[a.module.level!] - LEVEL_ORDER[b.module.level!];
          if (levelDiff !== 0) return levelDiff;

          return a.module.orderIndex - b.module.orderIndex;
        })[0];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        xp: u.xp,
        currentTopic: activeRow?.module.topic?.name ?? null,
        currentLevel: activeRow?.module.level ?? null,
        currentModuleName: activeRow?.module.name ?? null,
        currentModuleOrder: activeRow?.module.orderIndex ?? null,
        completedModulesCount,
        totalModulesCount,
        totalTopicsCount,
        isPlatformComplete: completedModulesCount === totalModulesCount,
      };
    });
  }

  async findLearnerDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        progress: {
          where: { status: 'COMPLETED' },
          include: {
            module: {
              select: { name: true },
            },
          },
          orderBy: { completedAt: 'desc' },
        },
        attempts: {
          include: {
            module: {
              select: { name: true },
            },
          },
          orderBy: { attemptedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    const completedModules = user.progress.map((p) => ({
      id: p.moduleId,
      name: p.module.name,
      completedAt: p.completedAt
        ? p.completedAt.toISOString()
        : p.updatedAt.toISOString(),
    }));

    // Group attempts by moduleId
    const moduleAttemptMap = new Map<
      string,
      {
        moduleId: string;
        moduleName: string;
        score: number;
        totalQuestions: number;
        percentage: number;
        attempts: number;
        date: string;
      }
    >();

    for (const attempt of user.attempts) {
      const existing = moduleAttemptMap.get(attempt.moduleId);
      if (!existing) {
        moduleAttemptMap.set(attempt.moduleId, {
          moduleId: attempt.moduleId,
          moduleName: attempt.module.name,
          score: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          percentage: Math.round(attempt.percentage),
          attempts: 1,
          date: attempt.attemptedAt.toISOString(),
        });
      } else {
        existing.attempts += 1;
        const currentPercentage = Math.round(attempt.percentage);
        if (currentPercentage > existing.percentage) {
          existing.score = attempt.correctAnswers;
          existing.totalQuestions = attempt.totalQuestions;
          existing.percentage = currentPercentage;
        }
        if (attempt.attemptedAt.toISOString() > existing.date) {
          existing.date = attempt.attemptedAt.toISOString();
        }
      }
    }

    const quizHistory = Array.from(moduleAttemptMap.values());

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: calculateLearnerLevel(user.xp),
      completedModules,
      quizHistory,
    };
  }
}

export function calculateLearnerLevel(
  xp: number,
): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (xp < 1000) return 'Beginner';
  if (xp < 2500) return 'Intermediate';
  return 'Advanced';
}
