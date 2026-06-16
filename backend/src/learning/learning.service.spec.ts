import { Test, TestingModule } from '@nestjs/testing';
import { LearningService } from './learning.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { ModuleLevel, ProgressStatus } from '../../generated/prisma/client.js';

describe('LearningService — Progression Engine', () => {
  let service: LearningService;
  let prisma: any;
  let progressService: any;

  beforeEach(async () => {
    prisma = {
      topic: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      module: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      userModuleProgress: {
        findMany: jest.fn(),
      },
      learningSlide: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      quizQuestion: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    progressService = {
      getModuleStatusesForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProgressService, useValue: progressService },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
  });

  describe('Default state — first Beginner module of first Topic', () => {
    it('findTopicBySlug shows first Beginner module as UNLOCKED for new learner', async () => {
      prisma.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        slug: 'aws-fundamentals',
        name: 'AWS Fundamentals',
        description: 'desc',
        orderIndex: 0,
      });

      prisma.module.findMany.mockResolvedValue([
        {
          id: 'mod-beginner-1',
          slug: 'mod-beginner-1',
          level: ModuleLevel.BEGINNER,
          orderIndex: 0,
        },
        {
          id: 'mod-beginner-2',
          slug: 'mod-beginner-2',
          level: ModuleLevel.BEGINNER,
          orderIndex: 1,
        },
      ]);

      const mockStatuses = new Map<string, ProgressStatus>([
        ['mod-beginner-1', 'UNLOCKED'],
        ['mod-beginner-2', 'LOCKED'],
      ]);
      progressService.getModuleStatusesForUser.mockResolvedValue(mockStatuses);

      prisma.userModuleProgress.findMany.mockResolvedValue([]);
      prisma.learningSlide.groupBy.mockResolvedValue([]);
      prisma.quizQuestion.groupBy.mockResolvedValue([]);

      const result = await service.findTopicBySlug(
        'aws-fundamentals',
        'user-1',
      );

      const beginner1 = result.modules.find((m) => m.slug === 'mod-beginner-1');
      const beginner2 = result.modules.find((m) => m.slug === 'mod-beginner-2');

      expect(beginner1?.status).toBe('UNLOCKED');
      expect(beginner2?.status).toBe('LOCKED');
    });
  });

  describe('Continue module — respects topic/level/module progression', () => {
    it('returns first Beginner module for new learner', async () => {
      prisma.module.findMany.mockResolvedValue([
        {
          id: 'mod-beginner-1',
          slug: 'mod-a',
          name: 'Mod A',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'Fundamentals',
          topicId: 'topic-1',
          orderIndex: 0,
          topic: { slug: 't1', name: 'T1', orderIndex: 0 },
        },
        {
          id: 'mod-beginner-2',
          slug: 'mod-b',
          name: 'Mod B',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'Fundamentals',
          topicId: 'topic-1',
          orderIndex: 1,
          topic: { slug: 't1', name: 'T1', orderIndex: 0 },
        },
      ]);

      const mockStatuses = new Map<string, ProgressStatus>([
        ['mod-beginner-1', 'UNLOCKED'],
        ['mod-beginner-2', 'LOCKED'],
      ]);
      progressService.getModuleStatusesForUser.mockResolvedValue(mockStatuses);

      prisma.learningSlide.count.mockResolvedValue(0);
      prisma.quizQuestion.count.mockResolvedValue(0);

      const result = await service.findContinueModule('user-1');

      expect(result.module).not.toBeNull();
      expect(result.module!.slug).toBe('mod-a');
    });

    it('returns next UNLOCKED module after some completions', async () => {
      prisma.module.findMany.mockResolvedValue([
        {
          id: 'mod-beginner-1',
          slug: 'mod-a',
          name: 'Mod A',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'Fundamentals',
          topicId: 'topic-1',
          orderIndex: 0,
          topic: { slug: 't1', name: 'T1', orderIndex: 0 },
        },
        {
          id: 'mod-beginner-2',
          slug: 'mod-b',
          name: 'Mod B',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'Fundamentals',
          topicId: 'topic-1',
          orderIndex: 1,
          topic: { slug: 't1', name: 'T1', orderIndex: 0 },
        },
      ]);

      const mockStatuses = new Map<string, ProgressStatus>([
        ['mod-beginner-1', 'COMPLETED'],
        ['mod-beginner-2', 'UNLOCKED'],
      ]);
      progressService.getModuleStatusesForUser.mockResolvedValue(mockStatuses);

      prisma.learningSlide.count.mockResolvedValue(0);
      prisma.quizQuestion.count.mockResolvedValue(0);

      const result = await service.findContinueModule('user-1');

      expect(result.module).not.toBeNull();
      expect(result.module!.slug).toBe('mod-b');
    });

    it('returns null when all curriculum is completed', async () => {
      prisma.module.findMany.mockResolvedValue([
        {
          id: 'mod-beginner-1',
          slug: 'mod-a',
          name: 'Mod A',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'Fundamentals',
          topicId: 'topic-1',
          orderIndex: 0,
          topic: { slug: 't1', name: 'T1', orderIndex: 0 },
        },
      ]);

      const mockStatuses = new Map<string, ProgressStatus>([
        ['mod-beginner-1', 'COMPLETED'],
      ]);
      progressService.getModuleStatusesForUser.mockResolvedValue(mockStatuses);

      const result = await service.findContinueModule('user-1');

      expect(result.module).toBeNull();
    });
  });
});
