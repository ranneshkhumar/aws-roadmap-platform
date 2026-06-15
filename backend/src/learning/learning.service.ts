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

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) { }

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

    // Check topic unlock status
    if (topic.orderIndex > 0) {
      const previousTopic = await this.prisma.topic.findFirst({
        where: { orderIndex: topic.orderIndex - 1 },
        select: { id: true },
      });

      if (previousTopic) {
        const previousModules = await this.prisma.module.findMany({
          where: { topicId: previousTopic.id },
          select: { id: true },
        });

        const previousModuleIds = previousModules.map((m) => m.id);
        const previousProgress = await this.prisma.userModuleProgress.findMany({
          where: { userId, moduleId: { in: previousModuleIds } },
          select: { moduleId: true, status: true },
        });

        const previousProgressMap = new Map<string, ProgressStatus>();
        for (const p of previousProgress) {
          previousProgressMap.set(p.moduleId, p.status);
        }

        const previousResult = this.computeTopicProgress(
          0, // orderIndex doesn't matter for status computation
          previousModuleIds,
          previousProgressMap,
        );

        if (previousResult.status !== 'COMPLETED') {
          throw new ForbiddenException(
            'Topic is locked. Complete the previous topic first.',
          );
        }
      }
    }

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

    // Determine the first Beginner module of the first Topic for fallback unlock
    const firstBeginnerModule =
      await this.findFirstBeginnerModuleOfFirstTopic();

    const sortedModules = [...modules].sort((a, b) => {
      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;
      return a.orderIndex - b.orderIndex;
    });

    const moduleSummaries: ModuleSummaryDto[] = sortedModules.map((mod) => {
      const progress = progressMap.get(mod.id);
      let status: ProgressStatus;
      if (progress) {
        status = progress.status;
      } else if (firstBeginnerModule?.id === mod.id) {
        status = 'UNLOCKED';
      } else {
        status = 'LOCKED';
      }
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
    for (const [id, data] of progressMap) {
      statusOnlyMap.set(id, data.status);
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
    const [topics, allProgress] = await Promise.all([
      this.prisma.topic.findMany({
        orderBy: { orderIndex: 'asc' },
        select: { id: true, slug: true, name: true, orderIndex: true },
      }),
      this.prisma.userModuleProgress.findMany({
        where: { userId },
        select: { moduleId: true, status: true },
      }),
    ]);

    const progressMap = new Map<string, string>();
    for (const p of allProgress) {
      progressMap.set(p.moduleId, p.status);
    }

    const topicMap = new Map<
      string,
      { slug: string; name: string; orderIndex: number }
    >();
    for (const t of topics) {
      topicMap.set(t.id, {
        slug: t.slug,
        name: t.name,
        orderIndex: t.orderIndex,
      });
    }

    const topicIds = topics.map((t) => t.id);

    const allModules = await this.prisma.module.findMany({
      where: { topicId: { in: topicIds } },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        level: true,
        tier: true,
        topicId: true,
        orderIndex: true,
      },
    });

    const sortedModules = [...allModules].sort((a, b) => {
      const topicA = topicMap.get(a.topicId || '');
      const topicB = topicMap.get(b.topicId || '');

      const topicOrderA = topicA?.orderIndex ?? 0;
      const topicOrderB = topicB?.orderIndex ?? 0;

      if (topicOrderA !== topicOrderB) {
        return topicOrderA - topicOrderB;
      }

      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;
      return a.orderIndex - b.orderIndex;
    });

    // Find the first UNLOCKED module that is not COMPLETED
    const nextModule = sortedModules.find((mod) => {
      const status = progressMap.get(mod.id);
      if (status === 'COMPLETED') return false;
      if (status === 'UNLOCKED') return true;
      return false;
    });

    if (!nextModule) {
      // Fallback: first Beginner module of first Topic (for new learners with no progress)
      const firstBeginnerModule =
        await this.findFirstBeginnerModuleOfFirstTopic();
      if (!firstBeginnerModule) {
        return { module: null };
      }

      const fallbackStatus = progressMap.get(firstBeginnerModule.id);
      if (fallbackStatus === 'COMPLETED') {
        return { module: null };
      }

      const fallbackMod = allModules.find(
        (m) => m.id === firstBeginnerModule.id,
      );
      if (!fallbackMod) {
        return { module: null };
      }

      const topic = topicMap.get(fallbackMod.topicId || '');
      const [slideCount, questionCount] = await Promise.all([
        this.prisma.learningSlide.count({
          where: { moduleId: fallbackMod.id },
        }),
        this.prisma.quizQuestion.count({ where: { moduleId: fallbackMod.id } }),
      ]);

      return {
        module: {
          slug: fallbackMod.slug,
          name: fallbackMod.name,
          description: fallbackMod.description,
          level: fallbackMod.level ?? ModuleLevel.BEGINNER,
          tier: fallbackMod.tier,
          topicSlug: topic?.slug || '',
          topicName: topic?.name || '',
          slideCount,
          questionCount,
        },
      };
    }

    const topic = topicMap.get(nextModule.topicId || '');

    const [slideCount, questionCount] = await Promise.all([
      this.prisma.learningSlide.count({ where: { moduleId: nextModule.id } }),
      this.prisma.quizQuestion.count({ where: { moduleId: nextModule.id } }),
    ]);

    const continueModule: ContinueModuleDto = {
      slug: nextModule.slug,
      name: nextModule.name,
      description: nextModule.description,
      level: nextModule.level ?? ModuleLevel.BEGINNER,
      tier: nextModule.tier,
      topicSlug: topic?.slug || '',
      topicName: topic?.name || '',
      slideCount,
      questionCount,
    };

    return { module: continueModule };
  }
}
