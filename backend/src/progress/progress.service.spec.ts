import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleLevel } from '../../generated/prisma/client.js';

describe('ProgressService — Progression Engine', () => {
  let service: ProgressService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      topic: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      module: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      userModuleProgress: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      quizQuestion: {
        findMany: jest.fn(),
      },
      quizAttempt: {
        create: jest.fn(),
      },
      quizAttemptAnswer: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  describe('Default state rule — first Beginner module of first Topic is UNLOCKED', () => {
    it('getModuleProgress returns UNLOCKED for first Beginner module of first Topic', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', orderIndex: 0 },
      ]);
      prisma.module.findMany.mockResolvedValue([
        { id: 'mod-a', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 0 },
        { id: 'mod-b', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 1 },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([]);

      const result = await service.getModuleProgress('user-1', 'mod-a');
      expect(result.status).toBe('UNLOCKED');
    });

    it('getModuleProgress returns LOCKED for non-first module', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', orderIndex: 0 },
      ]);
      prisma.module.findMany.mockResolvedValue([
        { id: 'mod-a', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 0 },
        { id: 'mod-b', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 1 },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([]);

      const result = await service.getModuleProgress('user-1', 'mod-b');
      expect(result.status).toBe('LOCKED');
    });
  });

  describe('Prerequisite chains', () => {
    it('unlocks next module when previous is completed', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', orderIndex: 0 },
      ]);
      prisma.module.findMany.mockResolvedValue([
        { id: 'mod-a', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 0 },
        { id: 'mod-b', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 1 },
        { id: 'mod-c', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 2 },
      ]);
      prisma.userModuleProgress.findMany.mockResolvedValue([
        { moduleId: 'mod-a', status: 'COMPLETED' },
      ]);

      const statuses = await service.getModuleStatusesForUser('user-1');
      expect(statuses.get('mod-a')).toBe('COMPLETED');
      expect(statuses.get('mod-b')).toBe('UNLOCKED');
      expect(statuses.get('mod-c')).toBe('LOCKED');
    });
  });

  describe('Authorization guard — quiz attempt', () => {
    it('rejects quiz attempt for locked module', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', orderIndex: 0 },
      ]);
      prisma.module.findMany.mockResolvedValue([
        { id: 'mod-a', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 0 },
        { id: 'mod-b', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 1 },
      ]);
      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-b',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 1,
      });
      prisma.userModuleProgress.findMany.mockResolvedValue([]);

      await expect(
        service.submitQuizAttempt('user-1', 'mod-b', { answers: [] }),
      ).rejects.toThrow('Module is locked. Complete the previous module first.');
    });

    it('allows quiz attempt for unlocked module', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-1', orderIndex: 0 },
      ]);
      prisma.module.findMany.mockResolvedValue([
        { id: 'mod-a', topicId: 'topic-1', level: ModuleLevel.BEGINNER, orderIndex: 0 },
      ]);
      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-a',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 0,
      });
      prisma.userModuleProgress.findMany.mockResolvedValue([]);
      prisma.quizQuestion.findMany.mockResolvedValue([]);

      await expect(
        service.submitQuizAttempt('user-1', 'mod-a', { answers: [] }),
      ).rejects.toThrow('Module has no quiz questions configured');
    });
  });
});
