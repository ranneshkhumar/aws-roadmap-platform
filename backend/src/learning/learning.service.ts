import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleLevel, ProgressStatus } from '../../generated/prisma/client.js';
import { TopicListResponseDto, TopicSummaryDto } from './dto/topic-summary.dto';
import {
  TopicDetailDto,
  ModuleSummaryDto,
  TopicProgressDto,
} from './dto/topic-detail.dto';
import {
  ContinueResponseDto,
  ContinueModuleDto,
} from './dto/continue-response.dto';

const LEVEL_ORDER: Record<ModuleLevel, number> = {
  [ModuleLevel.BEGINNER]: 0,
  [ModuleLevel.INTERMEDIATE]: 1,
  [ModuleLevel.ADVANCED]: 2,
};

import { ProgressService } from '../progress/progress.service';

@Injectable()
export class LearningService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
  ) { }

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

  private computeTopicProgress(
    topicOrderIndex: number,
    moduleIds: string[],
    progressMap: Map<string, ProgressStatus>,
    previousTopicStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
  ): {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    unlocked: boolean;
    totalModules: number;
    completedModules: number;
  } {
    const totalModules = moduleIds.length;
    const completedModules = moduleIds.filter(
      (id) => progressMap.get(id) === 'COMPLETED',
    ).length;

    let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
    if (completedModules === totalModules && totalModules > 0) {
      status = 'COMPLETED';
    } else if (completedModules > 0) {
      status = 'IN_PROGRESS';
    }

    const unlocked = previousTopicStatus === undefined || previousTopicStatus === 'COMPLETED';

    return { status, unlocked, totalModules, completedModules };
  }

  async findTopics(userId: string): Promise<TopicListResponseDto> {
    const [topics, allProgress] = await Promise.all([
      this.prisma.topic.findMany({
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          orderIndex: true,
          theme: true,
        },
      }),
      this.prisma.userModuleProgress.findMany({
        where: { userId },
        select: { moduleId: true, status: true },
      }),
    ]);

    if (topics.length === 0) {
      return { topics: [] };
    }

    const topicIds = topics.map((t) => t.id);

    const allModules = await this.prisma.module.findMany({
      where: { topicId: { in: topicIds } },
      select: { id: true, topicId: true },
    });

    const allModuleIds = new Set(allModules.map((m) => m.id));

    const progressMap = new Map<string, ProgressStatus>();
    for (const p of allProgress) {
      if (allModuleIds.has(p.moduleId)) {
        progressMap.set(p.moduleId, p.status);
      }
    }

    const topicModuleIds = new Map<string, string[]>();
    for (const mod of allModules) {
      if (mod.topicId) {
        const ids = topicModuleIds.get(mod.topicId) || [];
        ids.push(mod.id);
        topicModuleIds.set(mod.topicId, ids);
      }
    }

    const topicSummaries: TopicSummaryDto[] = [];
    let previousStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | undefined;

    for (const topic of topics) {
      const moduleIds = topicModuleIds.get(topic.id) || [];
      const result = this.computeTopicProgress(
        topic.orderIndex,
        moduleIds,
        progressMap,
        previousStatus,
      );

      topicSummaries.push({
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        orderIndex: topic.orderIndex,
        totalModules: result.totalModules,
        completedModules: result.completedModules,
        status: result.status,
        unlocked: result.unlocked,
        theme: topic.theme,
      });

      previousStatus = result.status;
    }

    return { topics: topicSummaries };
  }

  async findTopicBySlug(slug: string, userId: string): Promise<TopicDetailDto> {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        orderIndex: true,
        theme: true,
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with slug "${slug}" not found`);
    }

    const statuses = await this.progressService.getModuleStatusesForUser(userId);

    const modules = await this.prisma.module.findMany({
      where: { topicId: topic.id },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        level: true,
        tier: true,
        xpPoints: true,
        orderIndex: true,
      },
    });

    const sortedModules = [...modules].sort((a, b) => {
      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;
      return a.orderIndex - b.orderIndex;
    });

    // Check topic unlock status: Topic is locked if its first module is locked
    const firstModuleOfTopic = sortedModules[0];
    if (firstModuleOfTopic) {
      const firstStatus = statuses.get(firstModuleOfTopic.id) || 'LOCKED';
      if (firstStatus === 'LOCKED') {
        throw new ForbiddenException(
          'Topic is locked. Complete the previous topic first.',
        );
      }
    }

    const moduleIds = modules.map((m) => m.id);

    const [progressRecords, slideCounts, questionCounts] = await Promise.all([
      this.prisma.userModuleProgress.findMany({
        where: { userId, moduleId: { in: moduleIds } },
        select: { moduleId: true, status: true, score: true },
      }),
      this.prisma.learningSlide.groupBy({
        by: ['moduleId'],
        _count: { id: true },
        where: { moduleId: { in: moduleIds } },
      }),
      this.prisma.quizQuestion.groupBy({
        by: ['moduleId'],
        _count: { id: true },
        where: { moduleId: { in: moduleIds } },
      }),
    ]);

    const progressMap = new Map<
      string,
      { status: ProgressStatus; score: number | null }
    >();
    for (const p of progressRecords) {
      progressMap.set(p.moduleId, { status: p.status, score: p.score });
    }

    const slideCountMap = new Map<string, number>();
    for (const sc of slideCounts) {
      slideCountMap.set(sc.moduleId, sc._count.id);
    }

    const questionCountMap = new Map<string, number>();
    for (const qc of questionCounts) {
      questionCountMap.set(qc.moduleId, qc._count.id);
    }

    const moduleSummaries: ModuleSummaryDto[] = sortedModules.map((mod) => {
      const progress = progressMap.get(mod.id);
      const status = statuses.get(mod.id) || 'LOCKED';
      return {
        slug: mod.slug,
        name: mod.name,
        description: mod.description,
        level: mod.level ?? ModuleLevel.BEGINNER,
        tier: mod.tier,
        xpPoints: mod.xpPoints,
        orderIndex: mod.orderIndex,
        status,
        score: progress?.score ?? null,
        slideCount: slideCountMap.get(mod.id) || 0,
        questionCount: questionCountMap.get(mod.id) || 0,
      };
    });

    const statusOnlyMap = new Map<string, ProgressStatus>();
    for (const mod of sortedModules) {
      const status = statuses.get(mod.id) || 'LOCKED';
      statusOnlyMap.set(mod.id, status);
    }
    const topicProgressResult = this.computeTopicProgress(
      topic.orderIndex,
      moduleIds,
      statusOnlyMap,
    );

    const progress: TopicProgressDto = {
      totalModules: topicProgressResult.totalModules,
      completedModules: topicProgressResult.completedModules,
      status: topicProgressResult.status,
    };

    return {
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      orderIndex: topic.orderIndex,
      modules: moduleSummaries,
      progress,
      theme: topic.theme,
    };
  }

  async findContinueModule(userId: string): Promise<ContinueResponseDto> {
    const sortedModules = await this.prisma.module.findMany({
      include: {
        topic: { select: { slug: true, name: true, orderIndex: true } },
      },
    });

    if (sortedModules.length === 0) {
      return { module: null };
    }

    // Sort sortedModules canonically
    sortedModules.sort((a, b) => {
      const topicOrderA = a.topic?.orderIndex ?? 0;
      const topicOrderB = b.topic?.orderIndex ?? 0;
      if (topicOrderA !== topicOrderB) return topicOrderA - topicOrderB;

      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;

      return a.orderIndex - b.orderIndex;
    });

    const statuses = await this.progressService.getModuleStatusesForUser(userId);

    // Find the first module with status 'UNLOCKED'
    const nextModule = sortedModules.find((mod) => statuses.get(mod.id) === 'UNLOCKED');

    if (!nextModule) {
      // Check if all are completed (platform complete)
      const allCompleted = sortedModules.every((mod) => statuses.get(mod.id) === 'COMPLETED');
      if (allCompleted) {
        return { module: null };
      }

      // Fallback: first Beginner module of first Topic
      const firstMod = sortedModules[0];
      if (firstMod) {
        const [slideCount, questionCount] = await Promise.all([
          this.prisma.learningSlide.count({ where: { moduleId: firstMod.id } }),
          this.prisma.quizQuestion.count({ where: { moduleId: firstMod.id } }),
        ]);

        return {
          module: {
            slug: firstMod.slug,
            name: firstMod.name,
            description: firstMod.description,
            level: firstMod.level ?? ModuleLevel.BEGINNER,
            tier: firstMod.tier,
            topicSlug: firstMod.topic?.slug || '',
            topicName: firstMod.topic?.name || '',
            slideCount,
            questionCount,
          },
        };
      }

      return { module: null };
    }

    const [slideCount, questionCount] = await Promise.all([
      this.prisma.learningSlide.count({ where: { moduleId: nextModule.id } }),
      this.prisma.quizQuestion.count({ where: { moduleId: nextModule.id } }),
    ]);

    return {
      module: {
        slug: nextModule.slug,
        name: nextModule.name,
        description: nextModule.description,
        level: nextModule.level ?? ModuleLevel.BEGINNER,
        tier: nextModule.tier,
        topicSlug: nextModule.topic?.slug || '',
        topicName: nextModule.topic?.name || '',
        slideCount,
        questionCount,
      },
    };
  }
}
