import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModuleLevel, Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Retroactive Unlock — Post-Implementation Learner Validation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let coreToken: string;
  let learnerToken: string;
  let learnerId: string;

  const coreEmail = 'core-retro-unlock@test.com';
  const learnerEmail = 'learner-retro-unlock@test.com';

  let topic1Id: string;
  let topic2Id: string;

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

    await prisma.userModuleProgress.deleteMany({
      where: { user: { email: { in: [coreEmail, learnerEmail] } } },
    });
    await prisma.module.deleteMany({
      where: { topic: { slug: { startsWith: 'retro-unlock-' } } },
    });
    await prisma.topic.deleteMany({
      where: { slug: { startsWith: 'retro-unlock-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [coreEmail, learnerEmail] } },
    });

    const coreHash = await bcrypt.hash('Password123!', 10);
    await prisma.user.create({
      data: {
        name: 'Core Retro Unlock Tester',
        email: coreEmail,
        passwordHash: coreHash,
        role: Role.CORE,
        xp: 0,
      },
    });

    const coreLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: coreEmail, password: 'Password123!' })
      .expect(201);
    coreToken = coreLogin.body.accessToken;

    const learnerHash = await bcrypt.hash('Password123!', 10);
    const learner = await prisma.user.create({
      data: {
        name: 'Learner Retro Unlock Tester',
        email: learnerEmail,
        passwordHash: learnerHash,
        role: Role.ENTHUSIAST,
        xp: 0,
      },
    });
    learnerId = learner.id;

    const learnerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: learnerEmail, password: 'Password123!' })
      .expect(201);
    learnerToken = learnerLogin.body.accessToken;

    const t1 = await prisma.topic.create({
      data: { slug: 'retro-unlock-topic-1', name: 'Retro Unlock Topic 1', orderIndex: 0 },
    });
    topic1Id = t1.id;

    const t2 = await prisma.topic.create({
      data: { slug: 'retro-unlock-topic-2', name: 'Retro Unlock Topic 2', orderIndex: 1 },
    });
    topic2Id = t2.id;
  }, 30000);

  afterAll(async () => {
    await prisma.userModuleProgress.deleteMany({
      where: { user: { email: { in: [coreEmail, learnerEmail] } } },
    });
    await prisma.module.deleteMany({
      where: { topic: { slug: { startsWith: 'retro-unlock-' } } },
    });
    await prisma.topic.deleteMany({
      where: { slug: { startsWith: 'retro-unlock-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [coreEmail, learnerEmail] } },
    });
    await app.close();
  }, 30000);

  // ─── Helpers ────────────────────────────────────────────────

  async function createModule(
    name: string,
    topicId: string,
    level: ModuleLevel,
    orderIndex?: number,
  ) {
    const res = await request(app.getHttpServer())
      .post('/modules')
      .set('Authorization', `Bearer ${coreToken}`)
      .send({
        name,
        description: `${name} description`,
        tier: 'Fundamentals',
        xpPoints: 100,

        topicId,
        level,
        ...(orderIndex !== undefined ? { orderIndex } : {}),
      })
      .expect(201);
    return res.body;
  }

  async function completeModuleForLearner(moduleId: string) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { moduleId, orderIndex: 0 },
    });
    if (!existing) {
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

    return request(app.getHttpServer())
      .post(`/modules/${moduleId}/quiz/attempt`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({ answers: [{ questionOrder: 0, selectedAnswer: 'A' }] })
      .expect(201);
  }

  async function getProgress(moduleId: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .get(`/modules/${moduleId}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(200);
    return res.body.status;
  }

  async function cleanupTopic(topicId: string) {
    const modules = await prisma.module.findMany({
      where: { topicId },
      select: { id: true },
    });
    for (const mod of modules) {
      await prisma.userModuleProgress.deleteMany({ where: { moduleId: mod.id } });
    }
    await prisma.module.deleteMany({ where: { topicId } });
  }

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 1: Learner completed AWS. CORE adds Beginner module.
  // ═══════════════════════════════════════════════════════════════
  describe('Scenario 1 — Completed topic, new Beginner module added', () => {
    let m1: any;
    let m2: any;
    let newMod: any;

    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      m1 = await createModule('S1 M1 Beginner', topic1Id, ModuleLevel.BEGINNER, 0);
      m2 = await createModule('S1 M2 Beginner', topic1Id, ModuleLevel.BEGINNER, 1);

      await completeModuleForLearner(m1.id);
      await completeModuleForLearner(m2.id);

      expect(await getProgress(m1.id)).toBe('COMPLETED');
      expect(await getProgress(m2.id)).toBe('COMPLETED');

      newMod = await createModule('S1 M3 New Beginner', topic1Id, ModuleLevel.BEGINNER);
    }, 30000);

    it('new Beginner module is UNLOCKED', async () => {
      const status = await getProgress(newMod.id);
      expect(status).toBe('UNLOCKED');
    });

    it('existing modules remain COMPLETED (no regression)', async () => {
      expect(await getProgress(m1.id)).toBe('COMPLETED');
      expect(await getProgress(m2.id)).toBe('COMPLETED');
    });

    it('topic never re-locks', async () => {
      const allModules = await prisma.module.findMany({
        where: { topicId: topic1Id },
        select: { id: true },
      });
      for (const mod of allModules) {
        const status = await getProgress(mod.id);
        expect(status).not.toBe('LOCKED');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 2: Learner completed Beginner → Intermediate unlocked.
  // CORE adds Beginner module.
  // ═══════════════════════════════════════════════════════════════
  describe('Scenario 2 — Completed Beginner, Intermediate unlocked, new Beginner added', () => {
    let beginner1: any;
    let beginner2: any;
    let intermediate1: any;
    let newMod: any;

    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      beginner1 = await createModule('S2 B1', topic1Id, ModuleLevel.BEGINNER, 0);
      beginner2 = await createModule('S2 B2', topic1Id, ModuleLevel.BEGINNER, 1);
      intermediate1 = await createModule('S2 I1', topic1Id, ModuleLevel.INTERMEDIATE, 2);

      await completeModuleForLearner(beginner1.id);
      await completeModuleForLearner(beginner2.id);

      expect(await getProgress(beginner1.id)).toBe('COMPLETED');
      expect(await getProgress(beginner2.id)).toBe('COMPLETED');
      expect(await getProgress(intermediate1.id)).toBe('UNLOCKED');

      newMod = await createModule('S2 New Beginner', topic1Id, ModuleLevel.BEGINNER);
    }, 30000);

    it('new Beginner module is UNLOCKED', async () => {
      expect(await getProgress(newMod.id)).toBe('UNLOCKED');
    });

    it('Intermediate remains UNLOCKED (no regression)', async () => {
      expect(await getProgress(intermediate1.id)).toBe('UNLOCKED');
    });

    it('Beginner modules remain COMPLETED', async () => {
      expect(await getProgress(beginner1.id)).toBe('COMPLETED');
      expect(await getProgress(beginner2.id)).toBe('COMPLETED');
    });

    it('no topic re-locks', async () => {
      const allModules = await prisma.module.findMany({
        where: { topicId: topic1Id },
        select: { id: true },
      });
      for (const mod of allModules) {
        const status = await getProgress(mod.id);
        expect(status).not.toBe('LOCKED');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 3: Learner midway through Beginner. CORE adds Beginner module.
  // ═══════════════════════════════════════════════════════════════
  describe('Scenario 3 — Midway through Beginner, new Beginner added', () => {
    let beginner1: any;
    let beginner2: any;
    let intermediate1: any;
    let newMod: any;

    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      beginner1 = await createModule('S3 B1', topic1Id, ModuleLevel.BEGINNER, 0);
      beginner2 = await createModule('S3 B2', topic1Id, ModuleLevel.BEGINNER, 1);
      intermediate1 = await createModule('S3 I1', topic1Id, ModuleLevel.INTERMEDIATE, 2);

      await completeModuleForLearner(beginner1.id);

      expect(await getProgress(beginner1.id)).toBe('COMPLETED');
      expect(await getProgress(beginner2.id)).toBe('UNLOCKED');
      expect(await getProgress(intermediate1.id)).toBe('LOCKED');

      newMod = await createModule('S3 New Beginner', topic1Id, ModuleLevel.BEGINNER);
    }, 30000);

    it('new Beginner module is UNLOCKED (learner has progress in level)', async () => {
      expect(await getProgress(newMod.id)).toBe('UNLOCKED');
    });

    it('Intermediate remains LOCKED (no regression)', async () => {
      expect(await getProgress(intermediate1.id)).toBe('LOCKED');
    });

    it('existing Beginner modules unchanged', async () => {
      expect(await getProgress(beginner1.id)).toBe('COMPLETED');
      expect(await getProgress(beginner2.id)).toBe('UNLOCKED');
    });

    it('completion percentage recalculates', async () => {
      const allBeginner = await prisma.module.findMany({
        where: { topicId: topic1Id, level: ModuleLevel.BEGINNER },
      });
      const completedCount = (
        await Promise.all(allBeginner.map((m) => getProgress(m.id)))
      ).filter((s) => s === 'COMPLETED').length;
      const percentage = Math.round((completedCount / allBeginner.length) * 100);
      expect(percentage).toBeLessThan(100);
      expect(percentage).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 4: Learner completed AWS. CORE adds 3 modules consecutively.
  // ═══════════════════════════════════════════════════════════════
  describe('Scenario 4 — Completed topic, 3 new modules added consecutively', () => {
    let m1: any;
    let new1: any;
    let new2: any;
    let new3: any;

    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      m1 = await createModule('S4 M1 Beginner', topic1Id, ModuleLevel.BEGINNER, 0);
      await completeModuleForLearner(m1.id);
      expect(await getProgress(m1.id)).toBe('COMPLETED');

      new1 = await createModule('S4 New1', topic1Id, ModuleLevel.BEGINNER);
      new2 = await createModule('S4 New2', topic1Id, ModuleLevel.BEGINNER);
      new3 = await createModule('S4 New3', topic1Id, ModuleLevel.BEGINNER);
    }, 30000);

    it('all 3 new modules are UNLOCKED', async () => {
      expect(await getProgress(new1.id)).toBe('UNLOCKED');
      expect(await getProgress(new2.id)).toBe('UNLOCKED');
      expect(await getProgress(new3.id)).toBe('UNLOCKED');
    });

    it('original module remains COMPLETED', async () => {
      expect(await getProgress(m1.id)).toBe('COMPLETED');
    });

    it('no re-locks in the topic', async () => {
      const allModules = await prisma.module.findMany({
        where: { topicId: topic1Id },
        select: { id: true },
      });
      for (const mod of allModules) {
        const status = await getProgress(mod.id);
        expect(status).not.toBe('LOCKED');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 5: Learner completed Beginner + Intermediate.
  // CORE adds Beginner module → should be UNLOCKED.
  // ═══════════════════════════════════════════════════════════════
  describe('Scenario 5 — Completed Beginner + Intermediate, new Beginner added', () => {
    let beginner1: any;
    let beginner2: any;
    let intermediate1: any;
    let advanced1: any;
    let newMod: any;

    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      beginner1 = await createModule('S5 B1', topic1Id, ModuleLevel.BEGINNER, 0);
      beginner2 = await createModule('S5 B2', topic1Id, ModuleLevel.BEGINNER, 1);
      intermediate1 = await createModule('S5 I1', topic1Id, ModuleLevel.INTERMEDIATE, 2);
      advanced1 = await createModule('S5 A1', topic1Id, ModuleLevel.ADVANCED, 3);

      await completeModuleForLearner(beginner1.id);
      await completeModuleForLearner(beginner2.id);
      await completeModuleForLearner(intermediate1.id);

      expect(await getProgress(beginner1.id)).toBe('COMPLETED');
      expect(await getProgress(beginner2.id)).toBe('COMPLETED');
      expect(await getProgress(intermediate1.id)).toBe('COMPLETED');
      expect(await getProgress(advanced1.id)).toBe('UNLOCKED');

      newMod = await createModule('S5 New Beginner', topic1Id, ModuleLevel.BEGINNER);
    }, 60000);

    it('new Beginner module is UNLOCKED (learner completed target level)', async () => {
      expect(await getProgress(newMod.id)).toBe('UNLOCKED');
    });

    it('Advanced remains UNLOCKED (no regression)', async () => {
      expect(await getProgress(advanced1.id)).toBe('UNLOCKED');
    });

    it('all existing modules unchanged', async () => {
      expect(await getProgress(beginner1.id)).toBe('COMPLETED');
      expect(await getProgress(beginner2.id)).toBe('COMPLETED');
      expect(await getProgress(intermediate1.id)).toBe('COMPLETED');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 6: Learner completed Topic 1. CORE adds Beginner to
  // Topic 2 → should be UNLOCKED (later topic progress).
  // ═══════════════════════════════════════════════════════════════
  describe('Scenario 6 — Completed Topic 1, new Beginner in Topic 2 added', () => {
    let topic1B1: any;
    let topic2B1: any;
    let newMod: any;

    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      topic1B1 = await createModule('S6 T1 B1', topic1Id, ModuleLevel.BEGINNER, 0);
      topic2B1 = await createModule('S6 T2 B1', topic2Id, ModuleLevel.BEGINNER, 0);

      await completeModuleForLearner(topic1B1.id);
      await completeModuleForLearner(topic2B1.id);

      expect(await getProgress(topic1B1.id)).toBe('COMPLETED');
      expect(await getProgress(topic2B1.id)).toBe('COMPLETED');

      newMod = await createModule('S6 T2 New Beginner', topic2Id, ModuleLevel.BEGINNER);
    }, 30000);

    it('new Beginner in Topic 2 is UNLOCKED', async () => {
      expect(await getProgress(newMod.id)).toBe('UNLOCKED');
    });

    it('Topic 1 module remains COMPLETED', async () => {
      expect(await getProgress(topic1B1.id)).toBe('COMPLETED');
    });

    it('Topic 2 existing module remains COMPLETED', async () => {
      expect(await getProgress(topic2B1.id)).toBe('COMPLETED');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CROSS-CUTTING: Roadmap display / numbering / duplication
  // ═══════════════════════════════════════════════════════════════
  describe('Cross-cutting — Roadmap display and numbering', () => {
    beforeAll(async () => {
      await cleanupTopic(topic1Id);
      await cleanupTopic(topic2Id);

      await createModule('CC B1', topic1Id, ModuleLevel.BEGINNER, 0);
      await createModule('CC B2', topic1Id, ModuleLevel.BEGINNER, 1);
      await createModule('CC I1', topic1Id, ModuleLevel.INTERMEDIATE, 2);
      await createModule('CC A1', topic1Id, ModuleLevel.ADVANCED, 3);
    }, 30000);

    it('GET /modules?topicId returns modules sorted by orderIndex', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules?topicId=${topic1Id}`)
        .expect(200);

      const modules = res.body;
      expect(modules.length).toBe(4);

      for (let i = 1; i < modules.length; i++) {
        expect(modules[i].orderIndex).toBeGreaterThanOrEqual(
          modules[i - 1].orderIndex,
        );
      }

      expect(modules[0].level).toBe('BEGINNER');
      expect(modules[1].level).toBe('BEGINNER');
      expect(modules[2].level).toBe('INTERMEDIATE');
      expect(modules[3].level).toBe('ADVANCED');
    });

    it('module numbering is sequential (0, 1, 2, 3) within topic', async () => {
      const res = await request(app.getHttpServer())
        .get(`/modules?topicId=${topic1Id}`)
        .expect(200);

      res.body.forEach((mod: any, idx: number) => {
        expect(mod.orderIndex).toBe(idx);
      });
    });


  });
});
