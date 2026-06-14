export interface CurriculumSlide {
  title: string;
  layoutType: string;
  imageUrl: string | null;
  bullets: string[];
}

export interface CurriculumQuiz {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

export interface CurriculumModule {
  slug: string;
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tier: 'Fundamentals' | 'Associate' | 'Professional';
  xpPoints: number;
  orderIndex: number;
  slides: CurriculumSlide[];
  quiz: CurriculumQuiz[];
}

export const TOPIC = {
  name: 'AWS',
  slug: 'aws-core',
  description: 'Master the core AWS services and cloud architecture patterns.',
  orderIndex: 0,
};

const LETTERS = ['A', 'B', 'C', 'D'] as const;

function q(
  question: string,
  options: string[],
  answerIndex: number,
  explanation: string,
): CurriculumQuiz {
  return {
    question,
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    correctAnswer: LETTERS[answerIndex],
    explanation,
  };
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  // ── BEGINNER (orderIndex 0-1) ──────────────────────────────────
  {
    slug: 'fundamentals',
    name: 'AWS Fundamentals',
    description: 'Learn the core global infrastructure, cloud concepts, Regions, Availability Zones, and basic AWS services.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    orderIndex: 0,
    slides: [
      {
        title: 'AWS Global Infrastructure Overview',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS cloud infrastructure is built around Regions and Availability Zones.',
          'A Region is a physical location in the world where AWS has multiple Availability Zones.',
          'Availability Zones consist of one or more discrete data centers, each with redundant power, networking, and connectivity.',
        ],
      },
    ],
    quiz: [
      q(
        'Which of the following consists of one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region?',
        ['Edge Location', 'Availability Zone', 'Direct Connect Endpoint', 'VPC Subnet'],
        1,
        'An Availability Zone (AZ) is one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region.',
      ),
    ],
  },
  {
    slug: 'ec2',
    name: 'Amazon EC2',
    description: 'Provision and configure virtual servers (compute instances) in the cloud with custom operating systems.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    orderIndex: 1,
    slides: [
      {
        title: 'Introduction to EC2',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Elastic Compute Cloud (EC2) provides secure, resizable compute capacity in the cloud.',
          'It enables you to boot virtual machines, called "instances", running various operating systems (Linux, Windows).',
          'You can select from multiple instance types optimized for compute, memory, storage, or graphics.',
        ],
      },
    ],
    quiz: [
      q(
        'Which firewall mechanism is stateful and operates at the Amazon EC2 instance level to control traffic?',
        ['Network ACL (NACL)', 'Security Group', 'Route Table', 'Internet Gateway'],
        1,
        'Security groups are stateful firewalls that control inbound and outbound traffic at the instance level. Network ACLs are stateless and operate at the subnet level.',
      ),
    ],
  },

  // ── INTERMEDIATE (orderIndex 2-4) ─────────────────────────────
  {
    slug: 's3',
    name: 'Amazon S3',
    description: 'Store objects (files) securely at massive scale with low latency and high availability.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    orderIndex: 2,
    slides: [
      {
        title: 'Object Storage vs Block Storage',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Simple Storage Service (S3) is an object storage service, perfect for flat files (images, logs, videos).',
          'Unlike block storage (like EC2 hard drives), objects are accessed via unique HTTP keys (URLs).',
          'S3 offers 11 nines of durability (99.999999999%), meaning files are replicated across multiple physical facilities.',
        ],
      },
    ],
    quiz: [
      q(
        'You want to automatically transition raw logs to a colder storage class after 30 days and delete them after 90 days. Which S3 feature should you use?',
        ['S3 Bucket Policies', 'S3 Lifecycle Rules', 'S3 Cross-Region Replication', 'S3 Object Locking'],
        1,
        'S3 Lifecycle Rules allow you to define transitions of objects between different storage classes (e.g. Standard to Glacier) and set deletion schedules.',
      ),
    ],
  },
  {
    slug: 'iam',
    name: 'AWS IAM',
    description: 'Manage identities, permissions, and roles to secure access to your AWS environment.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    orderIndex: 3,
    slides: [
      {
        title: 'Introduction to IAM',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS Identity and Access Management (IAM) controls WHO can access WHAT resources in your AWS account.',
          'IAM is a global service; it does not operate in individual AWS regions.',
          'Key entities include: Root Account, Users, Groups, Policies, and Roles.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the best security practice for allowing applications running on EC2 to read from an S3 bucket?',
        ['Store static AWS Access Keys inside the code repository.', 'Attach an IAM Role with appropriate S3 read permissions to the EC2 instance.', 'Set the S3 bucket access policy to public read-write for anonymous clients.', 'Use the root account credentials to execute the application code.'],
        1,
        'Attaching an IAM Role to an EC2 instance dynamically provisions temporary credentials, eliminating the risk of hardcoded keys leaking.',
      ),
    ],
  },
  {
    slug: 'lambda',
    name: 'Lambda',
    description: 'Execute serverless backend code in response to events (S3 changes, API Gateway calls, DynamoDB streams) without managing servers.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    orderIndex: 4,
    slides: [
      {
        title: 'Introduction to Serverless Compute',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS Lambda lets you execute application code without provisioning virtual instances.',
          'You only write the code functions; AWS manages the underlying operating system layers.',
          'Lambda scales automatically: from zero to thousands of parallel executions instantly.',
        ],
      },
    ],
    quiz: [
      q(
        'Which of the following is a key characteristic of AWS Lambda compute structures?',
        ['You pay a flat monthly rate regardless of function executions.', 'Functions can execute continuously for up to 24 hours per invocation.', 'It is serverless, and charges are based on the number of requests and execution duration (per millisecond).', 'You must configure the underlying Linux OS packages manually.'],
        2,
        'AWS Lambda is a serverless compute service. You only pay for requests and duration of execution in milliseconds, with no idle server costs.',
      ),
    ],
  },

  // ── ADVANCED (orderIndex 5) ────────────────────────────────────
  {
    slug: 'cloudformation',
    name: 'CloudFormation',
    description: 'Define and deploy full AWS cloud infrastructure stacks in a single, safe, repeatable template using JSON or YAML.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    orderIndex: 5,
    slides: [
      {
        title: 'CloudFormation Basics',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS CloudFormation is the native IaC solution for AWS, deploying groups of resources as a "Stack".',
        ],
      },
    ],
    quiz: [
      q(
        'In AWS CloudFormation, what component resolves resource configuration mismatches by identifying changes made to stack resources outside of CloudFormation management?',
        ['Stack Policy blocks', 'Drift Detection', 'Rollback Triggers', 'Change Sets'],
        1,
        'Drift Detection allows you to identify stack resources that have been modified or deleted outside of CloudFormation management, ensuring configuration parity.',
      ),
    ],
  },
];
