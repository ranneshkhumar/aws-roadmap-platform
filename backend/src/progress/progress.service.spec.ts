import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleLevel } from '../../generated/prisma/client.js';

describe('ProgressService — Progression Engine', () => {
  let service: ProgressService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      topic: { findFirst: jest.fn(), findUnique: jest.fn() },
      module: { findFirst: jest.fn(), findUnique: jest.fn() },
      userModuleProgress: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      quizQuestion: { findMany: jest.fn() },
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
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });

      const result = await service.getModuleProgress('user-1', 'mod-a');
      expect(result.status).toBe('UNLOCKED');
    });

    it('getModuleProgress returns LOCKED for non-first module', async () => {
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });

      const result = await service.getModuleProgress('user-1', 'mod-b');
      expect(result.status).toBe('LOCKED');
    });

    it('getModuleProgress returns LOCKED when no topics exist', async () => {
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue(null);

      const result = await service.getModuleProgress('user-1', 'mod-a');
      expect(result.status).toBe('LOCKED');
    });
  });

  describe('Authorization guard — quiz attempt for non-first module without progress', () => {
    it('rejects quiz attempt for module with no progress and not first Beginner module', async () => {
      prisma.module.findUnique.mockResolvedValue({ id: 'mod-b' });
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });

      await expect(
        service.submitQuizAttempt('user-1', 'mod-b', { answers: [] }),
      ).rejects.toThrow('locked');
    });

    it('allows quiz attempt for first Beginner module of first Topic', async () => {
      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-a',
        xpPoints: 100,
      });
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([]);

      await expect(
        service.submitQuizAttempt('user-1', 'mod-a', { answers: [] }),
      ).rejects.toThrow('no quiz questions');
    });
  });

  describe('Module unlock — same topic, same level', () => {
    it('unlocks next module in same topic + same level', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue({ id: 'mod-b-next' }),
        },
        topic: { findUnique: jest.fn() },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-a',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 0,
      });
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-a', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      expect(mockTx.userModuleProgress.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', moduleId: 'mod-b-next', status: 'UNLOCKED' },
      });
    });
  });

  describe('Level unlock — all modules in level completed', () => {
    it('unlocks first module of next level when all modules in current level are completed', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest.fn().mockResolvedValue(2), // Both beginner modules completed
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // STEP 1: No next module in same level
            .mockResolvedValueOnce({ id: 'mod-intermediate-1' }), // STEP 3: First module of next level
          findMany: jest
            .fn()
            .mockResolvedValueOnce([
              // STEP 2: All modules in level
              { id: 'mod-beginner-1' },
              { id: 'mod-beginner-2' },
            ]),
        },
        topic: { findUnique: jest.fn() },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-last-beginner',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 5,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-last-beginner', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      expect(mockTx.userModuleProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          moduleId: 'mod-intermediate-1',
          status: 'UNLOCKED',
        },
      });
    });
  });

  describe('Topic unlock — all modules in topic completed', () => {
    it('unlocks first Beginner module of next topic when all modules in topic are completed', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest.fn()
            .mockResolvedValueOnce(1) // STEP 2: All advanced modules completed (count matches total)
            .mockResolvedValueOnce(3), // STEP 4: All topic modules completed (count matches total)
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // STEP 1: No next module in same level
            .mockResolvedValueOnce({ id: 'mod-topic2-beginner' }), // STEP 5: First Beginner of next topic
          findMany: jest
            .fn()
            .mockResolvedValueOnce([{ id: 'mod-adv-1' }]) // STEP 2: All advanced modules
            .mockResolvedValueOnce([
              // STEP 4: All topic modules
              { id: 'mod-beginner-1' },
              { id: 'mod-beginner-2' },
              { id: 'mod-adv-1' },
            ]),
        },
        topic: {
          findUnique: jest.fn().mockResolvedValue({ orderIndex: 0 }),
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'topic-2', orderIndex: 1 }),
        },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-last-advanced',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.ADVANCED,
        orderIndex: 10,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-last-advanced', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      expect(mockTx.userModuleProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          moduleId: 'mod-topic2-beginner',
          status: 'UNLOCKED',
        },
      });
    });
  });

  describe('BLOCK — partial level completion does NOT unlock next level', () => {
    it('does not unlock Intermediate when only 1 of 2 Beginner modules is completed', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // STEP 1: No next beginner module
            ,
          findMany: jest.fn().mockResolvedValueOnce([
            { id: 'mod-beginner-1' },
            { id: 'mod-beginner-2' },
          ]),
        },
        topic: { findUnique: jest.fn() },
      };

      // STEP 2 verification: only 1 of 2 modules completed → count(1) < total(2) → blocks
      mockTx.userModuleProgress.count = jest.fn().mockResolvedValueOnce(1);

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-beginner-2',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 1,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-beginner-2', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      // CRITICAL: Intermediate module must NOT be unlocked
      expect(mockTx.module.findFirst).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: ModuleLevel.INTERMEDIATE }),
        }),
      );
      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
    });
  });

  describe('BLOCK — partial topic completion does NOT unlock next topic', () => {
    it('does not unlock next topic when Beginner modules are still incomplete', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue(null), // STEP 1: No next in level
          findMany: jest
            .fn()
            .mockResolvedValueOnce([{ id: 'mod-adv-1' }]) // STEP 2: All advanced modules
            .mockResolvedValueOnce([
              // STEP 4: All topic modules
              { id: 'mod-beginner-1' },
              { id: 'mod-beginner-2' },
              { id: 'mod-adv-1' },
            ]),
        },
        topic: { findUnique: jest.fn() },
      };

      // STEP 2: All advanced modules completed (count 1 = total 1)
      // STEP 4: Only 1 of 3 topic modules completed → count(1) < total(3) → blocks
      mockTx.userModuleProgress.count = jest
        .fn()
        .mockResolvedValueOnce(1) // All advanced completed
        .mockResolvedValueOnce(1); // Only 1 of 3 topic modules completed

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-last-advanced',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.ADVANCED,
        orderIndex: 10,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-last-advanced', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      // CRITICAL: Next topic must NOT be unlocked
      expect(mockTx.topic.findUnique).not.toHaveBeenCalled();
      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
    });
  });

  describe('BLOCK — module with no progress record does NOT allow level advancement', () => {
    it('does not unlock Intermediate when a Beginner module has no progress record at all', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // STEP 1: No next beginner module in same level
            ,
          findMany: jest.fn().mockResolvedValueOnce([
            // STEP 2: 3 beginner modules exist in the level
            { id: 'mod-beginner-1' },
            { id: 'mod-beginner-2' },
            { id: 'mod-beginner-3' },
          ]),
        },
        topic: { findUnique: jest.fn() },
      };

      // STEP 2: Only 2 of 3 modules completed — mod-beginner-2 has NO progress record
      // count returns 2 (only the ones with COMPLETED records), but total is 3
      mockTx.userModuleProgress.count = jest.fn().mockResolvedValueOnce(2);

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-beginner-3',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 2,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-beginner-3', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      // CRITICAL: Intermediate module must NOT be unlocked
      expect(mockTx.module.findFirst).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: ModuleLevel.INTERMEDIATE }),
        }),
      );
      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
    });
  });

  describe('BLOCK — module with no progress record does NOT allow topic advancement', () => {
    it('does not unlock next topic when a module in the topic has no progress record', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue(null), // STEP 1: No next in level
          findMany: jest
            .fn()
            .mockResolvedValueOnce([{ id: 'mod-adv-1' }]) // STEP 2: Advanced modules
            .mockResolvedValueOnce([
              // STEP 4: 3 topic modules exist
              { id: 'mod-beginner-1' },
              { id: 'mod-adv-1' },
              { id: 'mod-orphan' },
            ]),
        },
        topic: {
          findUnique: jest.fn().mockResolvedValue({ orderIndex: 0 }),
          findFirst: jest.fn().mockResolvedValue(null), // No next topic exists
        },
      };

      // STEP 2: All advanced modules completed (count 1 = total 1) → pass
      // STEP 4: Only 2 of 3 topic modules completed — mod-orphan has NO progress record
      mockTx.userModuleProgress.count = jest
        .fn()
        .mockResolvedValueOnce(1) // All advanced completed
        .mockResolvedValueOnce(2); // Only 2 of 3 topic modules completed

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-adv-1',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.ADVANCED,
        orderIndex: 2,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-beginner-1' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-adv-1', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      // CRITICAL: Next topic must NOT be unlocked
      expect(mockTx.topic.findUnique).not.toHaveBeenCalled();
      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
    });
  });

  describe('Full progression path — end to end', () => {
    it('completes Topic 1 Beginner → Intermediate → Advanced → unlocks Topic 2', async () => {
      let txCounter = 0;
      const txMocks: any[] = [];

      // === TX 1: Complete mod-b1 (Beginner 1) → unlocks mod-b2 ===
      txMocks.push({
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue({ id: 'mod-b2' }),
        },
        topic: { findUnique: jest.fn() },
      });

      // === TX 2: Complete mod-b2 (Beginner 2) → unlocks mod-i1 ===
      txMocks.push({
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest.fn().mockResolvedValue(2), // Both beginner modules completed
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-2' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // No more Beginner
            .mockResolvedValueOnce({ id: 'mod-i1' }), // First Intermediate
          findMany: jest.fn().mockResolvedValueOnce([
            { id: 'mod-b1' },
            { id: 'mod-b2' },
          ]),
        },
        topic: { findUnique: jest.fn() },
      });

      // === TX 3: Complete mod-i1 (Intermediate 1) → unlocks mod-a1 ===
      txMocks.push({
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest.fn().mockResolvedValue(1), // Only 1 intermediate module completed
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-3' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // No more Intermediate
            .mockResolvedValueOnce({ id: 'mod-a1' }), // First Advanced
          findMany: jest.fn().mockResolvedValueOnce([{ id: 'mod-i1' }]),
        },
        topic: { findUnique: jest.fn() },
      });

      // === TX 4: Complete mod-a1 (Advanced 1) → unlocks Topic 2 mod-t2b1 ===
      txMocks.push({
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest
            .fn()
            .mockResolvedValueOnce(1) // STEP 2: All advanced completed (1 of 1)
            .mockResolvedValueOnce(4), // STEP 4: All topic modules completed (4 of 4)
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-4' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null) // No more Advanced
            .mockResolvedValueOnce({ id: 'mod-t2b1' }), // First Beginner of Topic 2
          findMany: jest
            .fn()
            .mockResolvedValueOnce([{ id: 'mod-a1' }]) // All advanced
            .mockResolvedValueOnce([
              // All topic modules
              { id: 'mod-b1' },
              { id: 'mod-b2' },
              { id: 'mod-i1' },
              { id: 'mod-a1' },
            ]),
        },
        topic: {
          findUnique: jest.fn().mockResolvedValue({ orderIndex: 0 }),
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'topic-2', orderIndex: 1 }),
        },
      });

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(txMocks[txCounter++]);
      });

      const modules = [
        { id: 'mod-b1', level: ModuleLevel.BEGINNER, orderIndex: 0 },
        { id: 'mod-b2', level: ModuleLevel.BEGINNER, orderIndex: 1 },
        { id: 'mod-i1', level: ModuleLevel.INTERMEDIATE, orderIndex: 2 },
        { id: 'mod-a1', level: ModuleLevel.ADVANCED, orderIndex: 3 },
      ];

      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];

        prisma.module.findUnique.mockResolvedValue({
          id: mod.id,
          xpPoints: 100,
          topicId: 'topic-1',
          level: mod.level,
          orderIndex: mod.orderIndex,
        });

        // Auth guard: module is UNLOCKED (one call per iteration to prisma mock)
        prisma.userModuleProgress.findUnique
          .mockResolvedValueOnce({ status: 'UNLOCKED' });

        prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
        prisma.module.findFirst.mockResolvedValue({ id: 'mod-b1' });
        prisma.quizQuestion.findMany.mockResolvedValue([
          { id: `q-${i}`, orderIndex: 0, correctAnswer: 'A' },
        ]);

        await service.submitQuizAttempt('user-1', mod.id, {
          answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
        });
      }

      // Final assertion: Topic 2 first Beginner module should be unlocked
      const lastTx = txMocks[3];
      expect(lastTx.userModuleProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          moduleId: 'mod-t2b1',
          status: 'UNLOCKED',
        },
      });
    });
  });

  describe('Curriculum completion — no next topic', () => {
    it('does not unlock anything when curriculum is complete', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue(null),
          count: jest.fn().mockResolvedValue(1), // Only module in level completed
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([{ id: 'mod-final' }]),
        },
        topic: {
          findUnique: jest.fn().mockResolvedValue({ orderIndex: 1 }),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-final',
        xpPoints: 100,
        topicId: 'topic-last',
        level: ModuleLevel.ADVANCED,
        orderIndex: 99,
      });

      prisma.userModuleProgress.findUnique
        .mockResolvedValueOnce({ status: 'UNLOCKED' }) // auth guard
        .mockResolvedValueOnce(null); // inside tx

      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-final', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
    });
  });

  describe('Unlock does not overwrite existing status', () => {
    it('does not create or update next module if already UNLOCKED', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue({ status: 'UNLOCKED' }),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue({ id: 'mod-b' }),
        },
        topic: { findUnique: jest.fn() },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-a',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 0,
      });
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-a', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
      expect(mockTx.userModuleProgress.update).not.toHaveBeenCalled();
    });

    it('does not unlock next module if already COMPLETED', async () => {
      const mockTx = {
        userModuleProgress: {
          findUnique: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        quizAttempt: {
          create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
        },
        quizAttemptAnswer: { createMany: jest.fn() },
        user: { update: jest.fn() },
        module: {
          findFirst: jest.fn().mockResolvedValue({ id: 'mod-b' }),
        },
        topic: { findUnique: jest.fn() },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      prisma.module.findUnique.mockResolvedValue({
        id: 'mod-a',
        xpPoints: 100,
        topicId: 'topic-1',
        level: ModuleLevel.BEGINNER,
        orderIndex: 0,
      });
      prisma.userModuleProgress.findUnique.mockResolvedValue(null);
      prisma.topic.findFirst.mockResolvedValue({ id: 'topic-1' });
      prisma.module.findFirst.mockResolvedValue({ id: 'mod-a' });
      prisma.quizQuestion.findMany.mockResolvedValue([
        { id: 'q1', orderIndex: 0, correctAnswer: 'A' },
      ]);

      await service.submitQuizAttempt('user-1', 'mod-a', {
        answers: [{ questionOrder: 0, selectedAnswer: 'A' }],
      });

      expect(mockTx.userModuleProgress.create).not.toHaveBeenCalled();
      expect(mockTx.userModuleProgress.update).toHaveBeenCalledWith({
        where: { userId_moduleId: { userId: 'user-1', moduleId: 'mod-a' } },
        data: { score: 1 },
      });
    });
  });
});
