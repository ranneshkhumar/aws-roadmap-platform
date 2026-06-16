import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  TOPIC as AWS_TOPIC,
  CURRICULUM_MODULES as AWS_MODULES,
} from '../prisma/curriculum/aws-roadmap';
import {
  TOPIC as DEVOPS_TOPIC,
  CURRICULUM_MODULES as DEVOPS_MODULES,
} from '../prisma/curriculum/devops-foundations';

const CURRICULA = [
  { topic: AWS_TOPIC, modules: AWS_MODULES },
  { topic: DEVOPS_TOPIC, modules: DEVOPS_MODULES },
  {
    topic: {
      slug: 'mock-topic-3',
      name: 'Taj Mahal Level',
      description: 'Explore the Taj Mahal Wonder of the World.',
      orderIndex: 3,
      theme: 'CRYSTAL' as const,
    },
    modules: [],
  },
  {
    topic: {
      slug: 'mock-topic-4',
      name: 'Great Wall Level',
      description: 'Explore the Great Wall of China Wonder of the World.',
      orderIndex: 4,
      theme: 'FORGE' as const,
    },
    modules: [],
  },
  {
    topic: {
      slug: 'mock-topic-5',
      name: 'Mayan Temple Level',
      description: 'Explore the Chichen Itza Wonder of the World.',
      orderIndex: 5,
      theme: 'TECH' as const,
    },
    modules: [],
  },
  {
    topic: {
      slug: 'mock-topic-6',
      name: 'Machu Picchu Level',
      description: 'Explore the Machu Picchu Wonder of the World.',
      orderIndex: 6,
      theme: 'HARBOR' as const,
    },
    modules: [],
  },
  {
    topic: {
      slug: 'mock-topic-7',
      name: 'Colossus Statue Level',
      description: 'Explore the Colossus of Rhodes Wonder of the World.',
      orderIndex: 7,
      theme: 'CITADEL' as const,
    },
    modules: [],
  },
];

const PLACEHOLDER_SLUGS = [
  'module-a',
  'module-a-inter',
  'module-a-adv',
  'moduble-b',
  'module-c',
];

describe('Database Seeder', () => {
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('seeds demo data', async () => {
    console.log('Cleaning database...');
    await prisma.userModuleProgress.deleteMany({});
    await prisma.quizAttemptAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.learningSlide.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.topic.deleteMany({});

    console.log('Seeding database...');

    // 1. Seed Demo Users
    const passwordHashCore = await bcrypt.hash('core123', 10);
    const passwordHashCrew = await bcrypt.hash('crew123', 10);
    const passwordHashUser = await bcrypt.hash('user123', 10);

    const demoUsers = [
      {
        email: 'core@cloudclub.com',
        name: 'Core Admin',
        passwordHash: passwordHashCore,
        role: 'CORE' as const,
      },
      {
        email: 'crew@cloudclub.com',
        name: 'Crew Member',
        passwordHash: passwordHashCrew,
        role: 'CREW' as const,
      },
      {
        email: 'enthusiast@cloudclub.com',
        name: 'Cloud Enthusiast',
        passwordHash: passwordHashUser,
        role: 'ENTHUSIAST' as const,
      },
      {
        email: 'user@cloudclub.com',
        name: 'Cloud User',
        passwordHash: passwordHashUser,
        role: 'ENTHUSIAST' as const,
      },
    ];

    for (const u of demoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          role: u.role,
          passwordHash: u.passwordHash,
        },
        create: {
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          xp: 0,
        },
      });
    }
    console.log('Demo users seeded successfully!');

    // 2. Delete placeholder modules (and their dependents)
    const placeholders = await prisma.module.findMany({
      where: { slug: { in: PLACEHOLDER_SLUGS } },
      select: { id: true },
    });
    const placeholderIds = placeholders.map((p) => p.id);

    if (placeholderIds.length > 0) {
      console.log(`Deleting ${placeholderIds.length} placeholder modules...`);

      await prisma.quizAttemptAnswer.deleteMany({
        where: { attempt: { moduleId: { in: placeholderIds } } },
      });
      await prisma.quizAttempt.deleteMany({
        where: { moduleId: { in: placeholderIds } },
      });
      await prisma.userModuleProgress.deleteMany({
        where: { moduleId: { in: placeholderIds } },
      });
      await prisma.learningSlide.deleteMany({
        where: { moduleId: { in: placeholderIds } },
      });
      await prisma.quizQuestion.deleteMany({
        where: { moduleId: { in: placeholderIds } },
      });
      await prisma.module.deleteMany({
        where: { slug: { in: PLACEHOLDER_SLUGS } },
      });

      console.log('Placeholder modules deleted.');
    }

    // 3. Seed Curricula (Topics + Modules + Slides + Questions)
    let slideTotal = 0;
    let questionTotal = 0;
    let moduleTotal = 0;

    for (const curriculum of CURRICULA) {
      const topic = await prisma.topic.upsert({
        where: { slug: curriculum.topic.slug },
        update: {
          name: curriculum.topic.name,
          description: curriculum.topic.description,
          orderIndex: curriculum.topic.orderIndex,
          theme: curriculum.topic.theme,
        },
        create: curriculum.topic,
      });
      console.log(`Topic "${topic.name}" (${topic.slug}) ready, id=${topic.id}`);

      // Clean up modules no longer in this curriculum
      const currentSlugs = new Set(curriculum.modules.map((m) => m.slug));
      const existingModules = await prisma.module.findMany({
        where: { topicId: topic.id },
        select: { id: true, slug: true },
      });
      for (const existing of existingModules) {
        if (!currentSlugs.has(existing.slug)) {
          await prisma.quizAttemptAnswer.deleteMany({ where: { attempt: { moduleId: existing.id } } });
          await prisma.quizAttempt.deleteMany({ where: { moduleId: existing.id } });
          await prisma.userModuleProgress.deleteMany({ where: { moduleId: existing.id } });
          await prisma.learningSlide.deleteMany({ where: { moduleId: existing.id } });
          await prisma.quizQuestion.deleteMany({ where: { moduleId: existing.id } });
          await prisma.module.delete({ where: { id: existing.id } });
        }
      }

      for (const m of curriculum.modules) {
        const dbModule = await prisma.module.upsert({
          where: { slug: m.slug },
          update: {
            name: m.name,
            description: m.description,
            tier: m.tier,
            xpPoints: m.xpPoints,
            orderIndex: m.orderIndex,
            topicId: topic.id,
            level: m.level,
          },
          create: {
            slug: m.slug,
            name: m.name,
            description: m.description,
            tier: m.tier,
            xpPoints: m.xpPoints,
            orderIndex: m.orderIndex,
            topicId: topic.id,
            level: m.level,
          },
        });

        // Delete existing slides and questions for idempotent re-seed
        await prisma.learningSlide.deleteMany({ where: { moduleId: dbModule.id } });
        await prisma.quizQuestion.deleteMany({ where: { moduleId: dbModule.id } });

        // Create slides
        if (m.slides.length > 0) {
          await prisma.learningSlide.createMany({
            data: m.slides.map((s, i) => ({
              moduleId: dbModule.id,
              title: s.title,
              layoutType: s.layoutType,
              imageUrl: s.imageUrl,
              bullets: s.bullets,
              orderIndex: i,
            })),
          });
          slideTotal += m.slides.length;
        }

        // Create quiz questions
        if (m.quiz.length > 0) {
          await prisma.quizQuestion.createMany({
            data: m.quiz.map((q, i) => ({
              moduleId: dbModule.id,
              question: q.question,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              orderIndex: i,
            })),
          });
          questionTotal += m.quiz.length;
        }
      }

      moduleTotal += curriculum.modules.length;
    }

    console.log(`Seeded ${CURRICULA.length} topics, ${moduleTotal} modules, ${slideTotal} slides, ${questionTotal} questions!`);
  }, 120000);
});
