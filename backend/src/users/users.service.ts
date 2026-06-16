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
    const [users, topics, modules, totalModulesCount, totalTopicsCount] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: [Role.CREW, Role.ENTHUSIAST] } },
        orderBy: { xp: 'desc' },
        include: {
          progress: {
            where: { status: 'COMPLETED' },
            select: {
              moduleId: true,
            },
          },
        },
      }),
      this.prisma.topic.findMany({
        orderBy: { orderIndex: 'asc' },
        select: { id: true, name: true, orderIndex: true },
      }),
      this.prisma.module.findMany({
        select: {
          id: true,
          name: true,
          level: true,
          orderIndex: true,
          topicId: true,
        },
      }),
      this.prisma.module.count(),
      this.prisma.topic.count(),
    ]);

    const topicOrderMap = new Map<string, number>();
    const topicMap = new Map<string, { name: string; orderIndex: number }>();
    topics.forEach((t) => {
      topicOrderMap.set(t.id, t.orderIndex);
      topicMap.set(t.id, { name: t.name, orderIndex: t.orderIndex });
    });

    const sortedModules = modules.sort((a, b) => {
      const topicOrderA = a.topicId ? (topicOrderMap.get(a.topicId) ?? 0) : 0;
      const topicOrderB = b.topicId ? (topicOrderMap.get(b.topicId) ?? 0) : 0;
      if (topicOrderA !== topicOrderB) return topicOrderA - topicOrderB;

      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;

      return a.orderIndex - b.orderIndex;
    });

    return users.map((u) => {
      const completedModulesCount = u.progress.length;
      const completedSet = new Set(u.progress.map((p) => p.moduleId));

      const firstUncompleted = sortedModules.find((m) => !completedSet.has(m.id));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        xp: u.xp,
        currentTopic: firstUncompleted && firstUncompleted.topicId ? (topicMap.get(firstUncompleted.topicId)?.name ?? null) : null,
        currentLevel: firstUncompleted ? firstUncompleted.level : null,
        currentModuleName: firstUncompleted ? firstUncompleted.name : null,
        currentModuleOrder: firstUncompleted ? firstUncompleted.orderIndex : null,
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
