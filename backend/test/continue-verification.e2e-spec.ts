import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModuleLevel, Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('GET /learning/continue — Verification', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  const email = 'learner-continue-verify@test.com';

  let t1Id: string, t2Id: string;
  let m1Id: string, m2Id: string, m3Id: string, m4Id: string, m5Id: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Clean
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.user.deleteMany({ where: { email } });

    // User
    const hash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
        data: { name: 'Continue Verify', email, passwordHash: hash, role: Role.ENTHUSIAST, xp: 0 },
    });
    userId = user.id;
    const login = await request(app.getHttpServer())
      .post('/auth/login').send({ email, password: 'Password123!' }).expect(201);
    token = login.body.accessToken;

    // Topics
    const t1 = await prisma.topic.create({ data: { slug: 'cv-topic-1', name: 'CV Topic 1', orderIndex: 0 } });
    t1Id = t1.id;
    const t2 = await prisma.topic.create({ data: { slug: 'cv-topic-2', name: 'CV Topic 2', orderIndex: 1 } });
    t2Id = t2.id;

    // Modules
    const defs = [
      { name: 'CV-M1', slug: 'cv-m1', level: ModuleLevel.BEGINNER, orderIndex: 0, topicId: t1Id },
      { name: 'CV-M2', slug: 'cv-m2', level: ModuleLevel.BEGINNER, orderIndex: 1, topicId: t1Id },
      { name: 'CV-M3', slug: 'cv-m3', level: ModuleLevel.INTERMEDIATE, orderIndex: 2, topicId: t1Id },
      { name: 'CV-M4', slug: 'cv-m4', level: ModuleLevel.ADVANCED, orderIndex: 3, topicId: t1Id },
      { name: 'CV-M5', slug: 'cv-m5', level: ModuleLevel.BEGINNER, orderIndex: 0, topicId: t2Id },
    ];
    const ids: string[] = [];
    for (const d of defs) {
      const m = await prisma.module.create({
        data: { ...d, description: d.name, tier: 'Fundamentals', xpPoints: 100 },
      });
      ids.push(m.id);
      await prisma.quizQuestion.create({
        data: {
          moduleId: m.id, question: 'Q', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
          correctAnswer: 'A', explanation: 'Exp', orderIndex: 0,
        },
      });
    }
    [m1Id, m2Id, m3Id, m4Id, m5Id] = ids;
  }, 30000);

  afterAll(async () => {
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  }, 30000);

  async function complete(moduleId: string) {
    await request(app.getHttpServer())
      .post(`/modules/${moduleId}/quiz/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [{ questionOrder: 0, selectedAnswer: 'A' }] })
      .expect(201);
  }

  async function getContinue() {
    const res = await request(app.getHttpServer())
      .get('/learning/continue')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return res.body;
  }

  it('1. New learner returns M1', async () => {
    const body = await getContinue();
    expect(body.module).not.toBeNull();
    expect(body.module.slug).toBe('cv-m1');
    expect(body.module.name).toBe('CV-M1');
  }, 15000);

  it('2. After M1 completion returns M2', async () => {
    await complete(m1Id);
    const body = await getContinue();
    expect(body.module).not.toBeNull();
    expect(body.module.slug).toBe('cv-m2');
  }, 15000);

  it('3. After M2 completion returns M3', async () => {
    await complete(m2Id);
    const body = await getContinue();
    expect(body.module).not.toBeNull();
    expect(body.module.slug).toBe('cv-m3');
  }, 15000);

  it('4. After M3 completion returns M4', async () => {
    await complete(m3Id);
    const body = await getContinue();
    expect(body.module).not.toBeNull();
    expect(body.module.slug).toBe('cv-m4');
  }, 15000);

  it('5. After M4 completion returns M5 (Topic 2)', async () => {
    await complete(m4Id);
    const body = await getContinue();
    expect(body.module).not.toBeNull();
    expect(body.module.slug).toBe('cv-m5');
    expect(body.module.topicSlug).toBe('cv-topic-2');
  }, 30000);

  it('6. After M5 completion returns null', async () => {
    await complete(m5Id);
    const body = await getContinue();
    expect(body.module).toBeNull();
  }, 30000);
});
