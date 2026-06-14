import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModuleLevel, Role } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

describe('Curriculum V2 — Multi-Topic Validation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  const email = 'multi-topic-validation@test.com';

  // Topic IDs
  let awsTopicId: string;
  let devopsTopicId: string;

  // AWS module IDs (orderIndex 0-5)
  const awsModuleSlugs = [
    'fundamentals', 'ec2', 's3', 'iam', 'lambda', 'cloudformation',
  ];
  let awsModuleIds: string[] = [];

  // DevOps module IDs (orderIndex 0-5)
  const devopsModuleSlugs = [
    'linux_basics', 'git_fundamentals',
    'docker_fundamentals', 'kubernetes_basics',
    'terraform_advanced', 'devsecops',
  ];
  let devopsModuleIds: string[] = [];

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Clean test user
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.user.deleteMany({ where: { email } });

    // Create test user
    const hash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: { name: 'Multi-Topic Validator', email, passwordHash: hash, role: Role.ENTHUSIAST, xp: 0 },
    });
    userId = user.id;
    const login = await request(app.getHttpServer())
      .post('/auth/login').send({ email, password: 'Password123!' }).expect(201);
    token = login.body.accessToken;

    // Resolve topic IDs
    const awsTopic = await prisma.topic.findUnique({ where: { slug: 'aws-core' }, select: { id: true } });
    const devopsTopic = await prisma.topic.findUnique({ where: { slug: 'devops-foundations' }, select: { id: true } });
    awsTopicId = awsTopic!.id;
    devopsTopicId = devopsTopic!.id;

    // Resolve AWS module IDs
    for (const slug of awsModuleSlugs) {
      const m = await prisma.module.findUnique({ where: { slug }, select: { id: true } });
      awsModuleIds.push(m!.id);
    }

    // Resolve DevOps module IDs
    for (const slug of devopsModuleSlugs) {
      const m = await prisma.module.findUnique({ where: { slug }, select: { id: true } });
      devopsModuleIds.push(m!.id);
    }
  }, 30000);

  afterAll(async () => {
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  }, 30000);

  async function completeModule(moduleId: string) {
    const questions = await prisma.quizQuestion.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
      select: { orderIndex: true },
    });
    const answers = questions.map((q) => ({ questionOrder: q.orderIndex, selectedAnswer: 'A' as const }));
    await request(app.getHttpServer())
      .post(`/modules/${moduleId}/quiz/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers })
      .expect(201);
  }

  // ─── STEP 1: Fresh learner — GET /learning/topics ────────────
  it('1. Fresh learner sees both topics, DevOps locked', async () => {
    const res = await request(app.getHttpServer())
      .get('/learning/topics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.topics).toHaveLength(2);

    const aws = res.body.topics.find((t: any) => t.slug === 'aws-core');
    const devops = res.body.topics.find((t: any) => t.slug === 'devops-foundations');

    expect(aws).toBeDefined();
    expect(aws.unlocked).toBe(true);
    expect(aws.status).toBe('NOT_STARTED');
    expect(aws.orderIndex).toBe(0);
    expect(aws.totalModules).toBe(6);
    expect(aws.completedModules).toBe(0);

    expect(devops).toBeDefined();
    expect(devops.unlocked).toBe(false);
    expect(devops.status).toBe('NOT_STARTED');
    expect(devops.orderIndex).toBe(1);
    expect(devops.totalModules).toBe(6);
    expect(devops.completedModules).toBe(0);
  });

  // ─── STEP 2: Verify /learn/devops-foundations is locked ──────
  it('2. DevOps topic detail is locked for fresh learner', async () => {
    await request(app.getHttpServer())
      .get('/learning/topics/devops-foundations')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  // ─── STEP 3: Verify /learn/devops-foundations roadmap ────────
  it('3. AWS topic detail returns all 18 modules', async () => {
    const res = await request(app.getHttpServer())
      .get('/learning/topics/aws-core')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.modules).toHaveLength(6);
    expect(res.body.name).toBe('AWS');

    // First Beginner module should be UNLOCKED
    const first = res.body.modules.find((m: any) => m.slug === 'fundamentals');
    expect(first).toBeDefined();
    expect(first.status).toBe('UNLOCKED');
  });

  // ─── STEP 4: Complete all 18 AWS modules ────────────────────
  it('4. Complete all 6 AWS modules', async () => {
    for (const moduleId of awsModuleIds) {
      await completeModule(moduleId);
    }

    // Verify all are COMPLETED
    const res = await request(app.getHttpServer())
      .get('/learning/topics/aws-core')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const allCompleted = res.body.modules.every((m: any) => m.status === 'COMPLETED');
    expect(allCompleted).toBe(true);
    expect(res.body.progress.status).toBe('COMPLETED');
  }, 60000);

  // ─── STEP 5: DevOps Foundations should now be unlocked ───────
  it('5. DevOps Foundations unlocked after AWS completion', async () => {
    const res = await request(app.getHttpServer())
      .get('/learning/topics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const devops = res.body.topics.find((t: any) => t.slug === 'devops-foundations');
    expect(devops).toBeDefined();
    expect(devops.unlocked).toBe(true);
    expect(devops.status).toBe('NOT_STARTED');
    expect(devops.completedModules).toBe(0);
  });

  // ─── STEP 6: DevOps topic detail returns 6 modules ──────────
  it('6. DevOps topic detail returns 6 modules with first UNLOCKED', async () => {
    const res = await request(app.getHttpServer())
      .get('/learning/topics/devops-foundations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.modules).toHaveLength(6);
    expect(res.body.name).toBe('DevOps Foundations');

    // First Beginner module (linux_basics) should be UNLOCKED
    const first = res.body.modules.find((m: any) => m.slug === 'linux_basics');
    expect(first).toBeDefined();
    expect(first.status).toBe('UNLOCKED');

    // Second module (git_fundamentals) should be LOCKED
    const second = res.body.modules.find((m: any) => m.slug === 'git_fundamentals');
    expect(second).toBeDefined();
    expect(second.status).toBe('LOCKED');
  });

  // ─── STEP 7: Complete DevOps modules — progression works ────
  it('7. Complete first 2 DevOps modules — progression unlocks within topic', async () => {
    await completeModule(devopsModuleIds[0]); // linux_basics
    await completeModule(devopsModuleIds[1]); // git_fundamentals

    const res = await request(app.getHttpServer())
      .get('/learning/topics/devops-foundations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const linux = res.body.modules.find((m: any) => m.slug === 'linux_basics');
    const git = res.body.modules.find((m: any) => m.slug === 'git_fundamentals');
    const docker = res.body.modules.find((m: any) => m.slug === 'docker_fundamentals');

    expect(linux.status).toBe('COMPLETED');
    expect(git.status).toBe('COMPLETED');
    expect(docker.status).toBe('UNLOCKED'); // Next level unlocked
  }, 30000);

  // ─── STEP 8: Continue endpoint respects multi-topic ──────────
  it('8. GET /learning/continue returns next DevOps module', async () => {
    const res = await request(app.getHttpServer())
      .get('/learning/continue')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Should be docker_fundamentals (next unlocked)
    expect(res.body.module).not.toBeNull();
    expect(res.body.module.slug).toBe('docker_fundamentals');
    expect(res.body.module.topicSlug).toBe('devops-foundations');
  }, 15000);

  // ─── STEP 9: Complete all DevOps — full curriculum done ─────
  it('9. Complete remaining DevOps modules — both topics COMPLETED', async () => {
    for (const moduleId of devopsModuleIds) {
      await completeModule(moduleId);
    }

    const res = await request(app.getHttpServer())
      .get('/learning/topics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const aws = res.body.topics.find((t: any) => t.slug === 'aws-core');
    const devops = res.body.topics.find((t: any) => t.slug === 'devops-foundations');

    expect(aws.status).toBe('COMPLETED');
    expect(aws.completedModules).toBe(6);
    expect(devops.status).toBe('COMPLETED');
    expect(devops.completedModules).toBe(6);
  }, 60000);

  // ─── STEP 10: Continue returns null when all done ───────────
  it('10. GET /learning/continue returns null when all topics complete', async () => {
    const res = await request(app.getHttpServer())
      .get('/learning/continue')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.module).toBeNull();
  });
});
