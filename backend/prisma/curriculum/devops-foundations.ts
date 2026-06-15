import type {
  CurriculumSlide,
  CurriculumQuiz,
  CurriculumModule,
} from './aws-roadmap';

export type { CurriculumSlide, CurriculumQuiz, CurriculumModule };

export const TOPIC = {
  name: 'DevOps Foundations',
  slug: 'devops-foundations',
  description:
    'Master modern DevOps practices, containerization, CI/CD pipelines, and cloud-native infrastructure automation.',
  orderIndex: 1,
  theme: 'FORGE' as const,
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
  // ── BEGINNER (orderIndex 0-1) ─────────────────────────────────
  {
    slug: 'linux_basics',
    name: 'Linux Basics',
    description:
      'Navigate the Linux filesystem, manage files and directories, and understand permissions and processes.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    orderIndex: 0,
    slides: [
      {
        title: 'Linux Filesystem Hierarchy',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Linux uses a single hierarchical directory tree starting from root (/).',
          'Key directories: /home (user data), /etc (config), /var (logs), /usr (applications).',
          'Everything in Linux is treated as a file, including devices and processes.',
        ],
      },
    ],
    quiz: [
      q(
        'Which directory contains system configuration files in a standard Linux filesystem?',
        ['/home', '/var', '/etc', '/usr'],
        2,
        'The /etc directory stores system-wide configuration files such as network configs, user accounts, and service settings.',
      ),
    ],
  },
  {
    slug: 'git_fundamentals',
    name: 'Git Fundamentals',
    description:
      'Learn version control with Git: branching, merging, staging, and commit workflows.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    orderIndex: 1,
    slides: [
      {
        title: 'Git Version Control Basics',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Git tracks changes to files over time, allowing you to recall specific versions later.',
          'The three main areas: Working Directory, Staging Area (Index), and Repository.',
          'Commits are snapshots of your project at a specific point in time, identified by a SHA hash.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the correct order of the Git workflow before committing code?',
        [
          'Commit → Stage → Modify',
          'Stage → Modify → Commit',
          'Modify → Stage → Commit',
          'Modify → Commit → Stage',
        ],
        2,
        'The standard Git workflow is: modify files in the working directory, stage changes with git add, then commit with git commit.',
      ),
    ],
  },

  // ── INTERMEDIATE (orderIndex 2-3) ─────────────────────────────
  {
    slug: 'docker_fundamentals',
    name: 'Docker Fundamentals',
    description:
      'Build, run, and manage containerized applications using Docker images and containers.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    orderIndex: 2,
    slides: [
      {
        title: 'Containerization with Docker',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Docker containers package applications with their dependencies into isolated, portable units.',
          'Images are read-only templates used to create containers; Dockerfiles define image build steps.',
          'Containers share the host OS kernel, making them lighter and faster than virtual machines.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the primary difference between a Docker image and a Docker container?',
        [
          'They are the same thing',
          'An image is a running instance; a container is a template',
          'An image is a read-only template; a container is a running instance of an image',
          'A container is stored in the registry; an image runs on the host',
        ],
        2,
        'A Docker image is a read-only template containing application code and dependencies. A container is a runnable instance created from that image.',
      ),
    ],
  },
  {
    slug: 'kubernetes_basics',
    name: 'Kubernetes Basics',
    description:
      'Understand container orchestration: Pods, Services, Deployments, and cluster architecture.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    orderIndex: 3,
    slides: [
      {
        title: 'Kubernetes Container Orchestration',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Kubernetes (K8s) automates deployment, scaling, and management of containerized applications.',
          'A Pod is the smallest deployable unit, wrapping one or more containers sharing network and storage.',
          'Deployments manage replica sets, ensuring the desired number of Pods are running at all times.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the smallest deployable unit in Kubernetes?',
        ['Node', 'Cluster', 'Pod', 'Service'],
        2,
        'A Pod is the smallest and simplest Kubernetes object. It wraps one or more containers with shared network and storage resources.',
      ),
    ],
  },

  // ── ADVANCED (orderIndex 4-5) ─────────────────────────────────
  {
    slug: 'terraform_advanced',
    name: 'Terraform Advanced',
    description:
      'Master advanced Terraform patterns: modules, state management, workspaces, and multi-cloud provisioning.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    orderIndex: 4,
    slides: [
      {
        title: 'Advanced Terraform Patterns',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Terraform modules encapsulate reusable infrastructure components with defined inputs and outputs.',
          'Remote state backends (S3 + DynamoDB) enable team collaboration with state locking.',
          'Workspaces manage multiple environments (dev, staging, prod) from the same configuration.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the recommended approach for managing Terraform state in a team environment?',
        [
          'Store state locally on each developer machine',
          'Use the default local backend',
          'Use a remote backend like S3 with DynamoDB state locking',
          'Commit state files to Git',
        ],
        2,
        'Remote backends like S3 with DynamoDB locking provide state sharing, versioning, and conflict prevention for team collaboration.',
      ),
    ],
  },
  {
    slug: 'devsecops',
    name: 'DevSecOps',
    description:
      'Integrate security into every phase of the DevOps pipeline with automated scanning, policy enforcement, and compliance.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    orderIndex: 5,
    slides: [
      {
        title: 'Security in the DevOps Pipeline',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'DevSecOps shifts security left, embedding it into CI/CD rather than treating it as a final gate.',
          'Automated SAST/DAST scanning catches vulnerabilities before code reaches production.',
          'Policy-as-code tools like OPA and Sentinel enforce compliance standards automatically.',
        ],
      },
    ],
    quiz: [
      q(
        'What does "shifting left" mean in DevSecOps?',
        [
          'Moving security testing to production',
          'Reducing the number of security checks',
          'Integrating security earlier in the development lifecycle',
          'Delegating security to a separate team',
        ],
        2,
        '"Shifting left" means integrating security practices earlier in the software development lifecycle, catching vulnerabilities during development rather than after deployment.',
      ),
    ],
  },
];
