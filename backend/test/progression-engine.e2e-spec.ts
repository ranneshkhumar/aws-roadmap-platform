import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModuleLevel, Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Progression Engine — Full Topic/Level Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let learnerToken: string;
  let learnerId: string;

  const testEmail = 'learner-progression-engine@test.com';

  // Topic IDs
  let topic1Id: string;
  let topic2Id: string;

  // Module IDs
  let m1Id: string; // Topic 1 Beginner
  let m2Id: string; // Topic 1 Beginner
  let m3Id: string; // Topic 1 Intermediate
  let m4Id: string; // Topic 1 Advanced
  let m5Id: string; // Topic 2 Beginner

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Clean slate
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Create user
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Progression Engine Test Learner',
        email: testEmail,
        passwordHash,
        role: Role.ENTHUSIAST,
        xp: 0,
      },
    });
    learnerId = user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'Password123!' })
      .expect(201);
    learnerToken = loginRes.body.accessToken;

    // Create topics
    const t1 = await prisma.topic.create({
      data: { slug: 'topic-1-e2e', name: 'Topic 1 E2E', orderIndex: 0 },
    });
    topic1Id = t1.id;

    const t2 = await prisma.topic.create({
      data: { slug: 'topic-2-e2e', name: 'Topic 2 E2E', orderIndex: 1 },
    });
    topic2Id = t2.id;

    // Topic 1 modules
    const modM1 = await prisma.module.create({
      data: {
        name: 'M1 Beginner',
        description: 'First beginner module',
        tier: 'Fundamentals',
        xpPoints: 100,

        orderIndex: 0,
        slug: 'm1-beginner-e2e',
        topicId: topic1Id,
        level: ModuleLevel.BEGINNER,
      },
    });
    m1Id = modM1.id;

    const modM2 = await prisma.module.create({
      data: {
        name: 'M2 Beginner',
        description: 'Second beginner module',
        tier: 'Fundamentals',
        xpPoints: 100,

        orderIndex: 1,
        slug: 'm2-beginner-e2e',
        topicId: topic1Id,
        level: ModuleLevel.BEGINNER,
      },
    });
    m2Id = modM2.id;

    const modM3 = await prisma.module.create({
      data: {
        name: 'M3 Intermediate',
        description: 'Intermediate module',
        tier: 'Associate',
        xpPoints: 150,

        orderIndex: 2,
        slug: 'm3-intermediate-e2e',
        topicId: topic1Id,
        level: ModuleLevel.INTERMEDIATE,
      },
    });
    m3Id = modM3.id;

    const modM4 = await prisma.module.create({
      data: {
        name: 'M4 Advanced',
        description: 'Advanced module',
        tier: 'Professional',
        xpPoints: 200,

        orderIndex: 3,
        slug: 'm4-advanced-e2e',
        topicId: topic1Id,
        level: ModuleLevel.ADVANCED,
      },
    });
    m4Id = modM4.id;

    // Topic 2 module
    const modM5 = await prisma.module.create({
      data: {
        name: 'M5 Topic2 Beginner',
        description: 'First module of topic 2',
        tier: 'Fundamentals',
        xpPoints: 100,

        orderIndex: 0,
        slug: 'm5-topic2-beginner-e2e',
        topicId: topic2Id,
        level: ModuleLevel.BEGINNER,
      },
    });
    m5Id = modM5.id;

    // Create one quiz question per module (correct answer = A)
    for (const moduleId of [m1Id, m2Id, m3Id, m4Id, m5Id]) {
      await prisma.quizQuestion.create({
        data: {
          moduleId,
          question: `Question for ${moduleId}`,
          optionA: 'Correct',
          optionB: 'Wrong B',
          optionC: 'Wrong C',
          optionD: 'Wrong D',
          correctAnswer: 'A',
          explanation: 'A is correct',
          orderIndex: 0,
        },
      });
    }
  }, 30000);

  afterAll(async () => {
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.user.deleteMany({ where: { id: learnerId } });
    await app.close();
  }, 30000);

  // ─── Helpers ────────────────────────────────────────────────

  async function completeModule(moduleId: string) {
    return request(app.getHttpServer())
      .post(`/modules/${moduleId}/quiz/attempt`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ answers: [{ questionOrder: 0, selectedAnswer: 'A' }] })
      .expect(201);
  }

  async function getModuleProgress(moduleId: string) {
    const res = await request(app.getHttpServer())
      .get(`/modules/${moduleId}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(200);
    return res.body.status as string;
  }

  // ─── Tests ──────────────────────────────────────────────────

  describe('Initial state', () => {
    it('M1 is UNLOCKED (first Beginner module of first Topic)', async () => {
      const status = await getModuleProgress(m1Id);
      expect(status).toBe('UNLOCKED');
    });

    it('M2 is LOCKED', async () => {
      const status = await getModuleProgress(m2Id);
      expect(status).toBe('LOCKED');
    });

    it('M3 is LOCKED', async () => {
      const status = await getModuleProgress(m3Id);
      expect(status).toBe('LOCKED');
    });

    it('M4 is LOCKED', async () => {
      const status = await getModuleProgress(m4Id);
      expect(status).toBe('LOCKED');
    });

    it('M5 (Topic 2) is LOCKED', async () => {
      const status = await getModuleProgress(m5Id);
      expect(status).toBe('LOCKED');
    });
  });

  describe('Step 1 — Complete M1 (Beginner) → M2 unlocks', () => {
    it('completes M1 and unlocks M2', async () => {
      const res = await completeModule(m1Id);
      expect(res.body.correctAnswers).toBe(1);
      expect(res.body.totalQuestions).toBe(1);
      expect(res.body.percentage).toBe(100);

      const m1Status = await getModuleProgress(m1Id);
      expect(m1Status).toBe('COMPLETED');

      const m2Status = await getModuleProgress(m2Id);
      expect(m2Status).toBe('UNLOCKED');
    }, 30000);

    it('M3 remains LOCKED', async () => {
      const status = await getModuleProgress(m3Id);
      expect(status).toBe('LOCKED');
    });

    it('M4 remains LOCKED', async () => {
      const status = await getModuleProgress(m4Id);
      expect(status).toBe('LOCKED');
    });

    it('M5 remains LOCKED', async () => {
      const status = await getModuleProgress(m5Id);
      expect(status).toBe('LOCKED');
    });
  });

  describe('Step 2 — Complete M2 (Beginner) → M3 (Intermediate) unlocks', () => {
    it('completes M2 and unlocks M3', async () => {
      const res = await completeModule(m2Id);
      expect(res.body.correctAnswers).toBe(1);
      expect(res.body.percentage).toBe(100);

      const m2Status = await getModuleProgress(m2Id);
      expect(m2Status).toBe('COMPLETED');

      const m3Status = await getModuleProgress(m3Id);
      expect(m3Status).toBe('UNLOCKED');
    }, 30000);

    it('M4 remains LOCKED (Intermediate not yet complete)', async () => {
      const status = await getModuleProgress(m4Id);
      expect(status).toBe('LOCKED');
    });

    it('M5 remains LOCKED', async () => {
      const status = await getModuleProgress(m5Id);
      expect(status).toBe('LOCKED');
    });
  });

  describe('Step 3 — Complete M3 (Intermediate) → M4 (Advanced) unlocks', () => {
    it('completes M3 and unlocks M4', async () => {
      const res = await completeModule(m3Id);
      expect(res.body.correctAnswers).toBe(1);
      expect(res.body.percentage).toBe(100);

      const m3Status = await getModuleProgress(m3Id);
      expect(m3Status).toBe('COMPLETED');

      const m4Status = await getModuleProgress(m4Id);
      expect(m4Status).toBe('UNLOCKED');
    }, 30000);

    it('M5 remains LOCKED (Topic 1 not yet complete)', async () => {
      const status = await getModuleProgress(m5Id);
      expect(status).toBe('LOCKED');
    });
  });

  describe('Step 4 — Complete M4 (Advanced) → Topic 2 M5 unlocks', () => {
    it('completes M4 and unlocks M5 in Topic 2', async () => {
      const res = await completeModule(m4Id);
      expect(res.body.correctAnswers).toBe(1);
      expect(res.body.percentage).toBe(100);

      const m4Status = await getModuleProgress(m4Id);
      expect(m4Status).toBe('COMPLETED');

      const m5Status = await getModuleProgress(m5Id);
      expect(m5Status).toBe('UNLOCKED');
    }, 30000);
  });

  describe('XP accumulation', () => {
    it('user XP reflects all completed modules', async () => {
      const res = await request(app.getHttpServer())
        .get('/progress/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);

      // M1: (100 * 0.5) + (100 * 0.5 * 1/1) = 50 + 50 = 100
      // M2: (100 * 0.5) + (100 * 0.5 * 1/1) = 50 + 50 = 100
      // M3: (150 * 0.5) + (150 * 0.5 * 1/1) = 75 + 75 = 150
      // M4: (200 * 0.5) + (200 * 0.5 * 1/1) = 100 + 100 = 200
      // Total: 550
      expect(res.body.currentXP).toBe(550);
    });
  });

  describe('Anti-farming — retaking a completed module', () => {
    it('awards 0 XP on retake and keeps highest score', async () => {
      const res = await completeModule(m1Id);
      expect(res.body.xpEarned).toBe(0);

      const xpRes = await request(app.getHttpServer())
        .get('/progress/me')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(200);
      expect(xpRes.body.currentXP).toBe(550); // unchanged
    }, 30000);
  });

  describe('Progress records in database', () => {
    it('exactly 4 modules are COMPLETED in the database', async () => {
      const completed = await prisma.userModuleProgress.findMany({
        where: { userId: learnerId, status: 'COMPLETED' },
      });
      expect(completed.length).toBe(4);
    });

    it('M5 has exactly one UNLOCKED record', async () => {
      const m5Progress = await prisma.userModuleProgress.findUnique({
        where: { userId_moduleId: { userId: learnerId, moduleId: m5Id } },
      });
      expect(m5Progress).not.toBeNull();
      expect(m5Progress!.status).toBe('UNLOCKED');
    });

    it('no spurious progress records were created', async () => {
      const allProgress = await prisma.userModuleProgress.findMany({
        where: { userId: learnerId },
      });
      // 4 COMPLETED + 1 UNLOCKED (M5) = 5 total
      expect(allProgress.length).toBe(5);
    });
  });
});
