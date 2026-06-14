import { Test, TestingModule } from '@nestjs/testing';
import { LearningService } from './learning.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleLevel } from '../../generated/prisma/client.js';

describe('LearningService — Progression Engine', () => {
  let service: LearningService;
  let prisma: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        { provide: PrismaService, useValue: prisma },
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
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
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
        {
          id: 'mod-intermediate-1',
          slug: 'mod-intermediate-1',
          level: ModuleLevel.INTERMEDIATE,
          orderIndex: 2,
        },
      ]);
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
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', slug: 't1', name: 'T1', orderIndex: 0 },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([]);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
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
        },
      ]);
      prisma.learningSlide.count.mockResolvedValue(0);
      prisma.quizQuestion.count.mockResolvedValue(0);

      const result = await service.findContinueModule('user-1');

      expect(result.module).not.toBeNull();
      expect(result.module!.slug).toBe('mod-a');
    });

    it('returns next UNLOCKED module after some completions', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', slug: 't1', name: 'T1', orderIndex: 0 },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([
        { moduleId: 'mod-beginner-1', status: 'COMPLETED' },
        { moduleId: 'mod-beginner-2', status: 'UNLOCKED' },
      ]);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
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
        },
      ]);
      prisma.learningSlide.count.mockResolvedValue(0);
      prisma.quizQuestion.count.mockResolvedValue(0);

      const result = await service.findContinueModule('user-1');

      expect(result.module).not.toBeNull();
      expect(result.module!.slug).toBe('mod-b');
    });

    it('returns null when all curriculum is completed', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', slug: 't1', name: 'T1', orderIndex: 0 },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([
        { moduleId: 'mod-beginner-1', status: 'COMPLETED' },
      ]);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
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
        },
      ]);

      const result = await service.findContinueModule('user-1');

      expect(result.module).toBeNull();
    });
  });

  describe('Module status in topic detail', () => {
    it('marks non-first Beginner modules as LOCKED for new learner', async () => {
      prisma.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        slug: 't1',
        name: 'T1',
        description: 'd',
        orderIndex: 0,
      });
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
      prisma.module.findMany.mockResolvedValue([
        {
          id: 'mod-beginner-1',
          slug: 'a',
          name: 'A',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'F',
          xpPoints: 10,
          orderIndex: 0,
        },
        {
          id: 'mod-intermediate-1',
          slug: 'b',
          name: 'B',
          description: 'd',
          level: ModuleLevel.INTERMEDIATE,
          tier: 'F',
          xpPoints: 10,
          orderIndex: 1,
        },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([]);
      prisma.learningSlide.groupBy.mockResolvedValue([]);
      prisma.quizQuestion.groupBy.mockResolvedValue([]);

      const result = await service.findTopicBySlug('t1', 'user-1');

      const beginnerMod = result.modules.find(
        (m) => m.level === ModuleLevel.BEGINNER,
      );
      const intermediateMod = result.modules.find(
        (m) => m.level === ModuleLevel.INTERMEDIATE,
      );

      expect(beginnerMod?.status).toBe('UNLOCKED');
      expect(intermediateMod?.status).toBe('LOCKED');
    });

    it('preserves progress records when they exist', async () => {
      prisma.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        slug: 't1',
        name: 'T1',
        description: 'd',
        orderIndex: 0,
      });
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
      prisma.module.findMany.mockResolvedValue([
        {
          id: 'mod-beginner-1',
          slug: 'a',
          name: 'A',
          description: 'd',
          level: ModuleLevel.BEGINNER,
          tier: 'F',
          xpPoints: 10,
          orderIndex: 0,
        },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([
        { moduleId: 'mod-beginner-1', status: 'COMPLETED', score: 2 },
      ]);
      prisma.learningSlide.groupBy.mockResolvedValue([]);
      prisma.quizQuestion.groupBy.mockResolvedValue([]);

      const result = await service.findTopicBySlug('t1', 'user-1');

      expect(result.modules[0].status).toBe('COMPLETED');
      expect(result.modules[0].score).toBe(2);
    });
  });
});
