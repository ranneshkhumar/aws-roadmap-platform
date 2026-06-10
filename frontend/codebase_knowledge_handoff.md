# AWS Roadmap Platform - Frontend Handoff Document

This document provides a comprehensive overview of the current frontend architecture of the **AWS Roadmap Platform**. It has been designed specifically for backend developers, architects, and AI assistants (such as ChatGPT) to understand the codebase structure, state management flow, database requirements, and integration extension points.

---

## SECTION 1: PROJECT OVERVIEW

### Project Purpose
The **AWS Roadmap Platform** is an interactive, gamified learning path dashboard designed to guide students from foundational cloud concepts to advanced cloud architectures (specifically targeting AWS services). The platform features:
1. **Interactive Path Map**: A Duolingo-style vertical winding path map (represented by floating 3D cloud islands) where students complete lessons and quizzes sequentially.
2. **CMS Workspace (Core Staff View)**: An administrative control panel allowing instructors and staff to create, update, reorder, duplicate, and delete learning modules, edit individual slides, manage question pools, view student directories, and examine metrics logs.

### User Roles
The application supports three distinct tiers of users:
1. **Core Users (AWS Cloud Club Staff / Instructors)**:
   - **Access**: Admin panel namespaces under `/core` (Roadmap Builder, Learners Directory, Slide Content Editor, Quiz Editor).
   - **Privileges**: Full CRUD access to modules, slide content, and quiz question pools. They can upload syllabus PDF files, bulk import questions via JSON/CSV, view class telemetry data, read security audit alert logs, and inspect student explorer profiles.
2. **Crew Users (Volunteers / Facilitators)**:
   - **Access**: Co-management structures (usually operating under staff permissions in the CMS).
   - **Privileges**: Act as content moderators, reviewing quiz answer keys, adjusting path ordering templates, and managing curriculum assets under the guidance of Core administrators.
3. **Cloud Enthusiasts (Students / Explorers)**:
   - **Access**: Gamified landing page map (`/`) and dynamic learning viewports (`/roadmap/module/[id]`).
   - **Privileges**: View interactive paths, click active islands, read slide decks, submit quizzes, view scorecards, maintain daily streaks, earn XP points, unlock milestone summits, and rank up.

### Core Workflows
1. **Curriculum Navigation**: Students land on `/` and see the roadmap. Only unlocked modules are interactive; others are locked behind cloud cover overlays.
2. **Slide Reading & Progress Logging**: Students click an active island to slide open a drawer detailing objectives and launch the reader (`/roadmap/module/[id]`). They click through layout-customized pages. Upon completion of the final page, they click "Mark As Read" (firing a progress timestamp).
3. **Assessment Validation**: Clicking "Take Quiz" launches a randomized, shuffled MCQ sequence. Upon completion, answers are checked, score percentage and earned XP are calculated, and a detailed review is stored.
4. **Sequential Path Unlocking**: Scoring a passing grade automatically unlocks the next chronological module on the path (advancing it from `locked` to `current` state in the store).
5. **CMS Curating**: Core administrators go to `/core/roadmaps` to draft modules. Selecting a module opens forms to update properties, move islands up/down, edit content pages (uploading base64 concept diagrams), or edit quizzes (uploading PDFs or pasting JSON grids).

---

## SECTION 2: FOLDER STRUCTURE

The project is structured as a modern **Next.js 16 App Router** application written in **TypeScript** using **TailwindCSS** and **Framer Motion** for premium animations.

```
frontend/
├── public/                 # Static public assets
└── src/
    ├── app/                # Next.js App Router Page Controllers
    │   ├── core/           # Admin/CMS Namespace Pages
    │   │   ├── dashboard/  # Admin Telemetry Dashboard Page
    │   │   ├── learners/   # Students Gradebook / Directory Page
    │   │   ├── module/
    │   │   │   └── [id]/
    │   │   │       ├── content/ # Slide Editor Page
    │   │   │       └── quiz/    # Quiz Editor Page
    │   │   ├── roadmaps/   # CMS Roadmap Canvas Builder Page
    │   │   ├── layout.tsx  # Core (Admin) Layout with Permanent Sidebar
    │   │   └── page.tsx    # Redirect Controller to /core/roadmaps
    │   ├── roadmap/
    │   │   └── module/
    │   │       └── [moduleId]/  # Interactive Student Reader & Quiz Viewport
    │   ├── favicon.ico     # App Icon
    │   ├── globals.css     # Global Styles, keyframes, gradients
    │   ├── layout.tsx      # App Root Layout (Providers wrapper)
    │   └── page.tsx        # Main Student view landing page controller
    ├── components/         # Reusable Component Modules
    │   ├── Dashboard/
    │   │   └── DashboardScreen.tsx # Admin telemetry stats and charts
    │   ├── Layout/
    │   │   └── AppLayout.tsx       # Student Shell wrapper
    │   ├── Roadmap/
    │   │   ├── AdvancedCloudsOverlay.tsx       # Cloud overlay blocking Advanced region
    │   │   ├── CloudIslandNode.tsx             # 3D floating Cloud SVG Island
    │   │   ├── GamificationSidebar.tsx         # XP stats, streaks, achievements, quests
    │   │   ├── IntermediateCloudsOverlay.tsx   # Cloud overlay blocking Intermediate region
    │   │   ├── LearningContentRenderer.tsx     # Adaptive slide text/image layout renderer
    │   │   ├── MilestoneLandmark.tsx           # Beginner, Intermediate, and Advanced Summits
    │   │   ├── MissionDetailsDrawer.tsx        # Sliding sidebar drawer detailing module ETA/XP
    │   │   ├── ModuleCompletionBanner.tsx      # Unlock banner transition slide to quiz
    │   │   ├── QuizEntry.tsx                   # Interactive quiz MCQ question component
    │   │   ├── QuizReview.tsx                  # Post-quiz scorecard and rationales review
    │   │   ├── RoadmapPath.tsx                 # Winding SVG bezier path line connection
    │   │   ├── RoadmapProgressUpdater.tsx      # Progress gauge and reset manager
    │   │   └── SkyBackground.tsx               # Starry scrolling background with clouds
    │   └── ui/
    │       └── button.tsx                      # Styling primitive
    ├── constants/
    │   └── roadmapData.ts  # Default static 18 core modules and mock achievements
    ├── hooks/              # Future custom hooks layer
    ├── layouts/            # Future layout templates
    ├── lib/
    │   ├── quizHelpers.ts     # MCQ random shufflers and template generators
    │   ├── roadmapGeometry.ts # Calculations for node X% and Ypx coordinate wave placements
    │   └── utils.ts           # Tailwind class merger (cn)
    ├── providers/
    │   ├── QueryProvider.tsx  # React Query Client Wrapper
    │   └── ThemeProvider.tsx  # Next-Themes provider wrapper
    ├── services/
    │   └── apiClient.ts    # Axios base setup pointing to env servers
    ├── store/
    │   └── roadmapStore.ts # Zustand global store (persisted in localStorage)
    └── types/              # Type definitions folder
```

### Purpose of Major Directories
* **`src/app/`**: Handles application routing, layouts, and data fetch boundaries. Includes page endpoints for both student and administrative spaces.
* **`src/components/`**: House visual UI components. Divided logically into `Dashboard` screens, layout frames, and gamified `Roadmap` assets.
* **`src/constants/`**: Holds seed mock datasets for standard AWS modules and badges that populate the app when first loaded.
* **`src/lib/`**: Contains core mathematical and helper algorithms, such as calculating curved coordinate offsets and shuffling question arrays.
* **`src/providers/`**: Bootstraps essential contexts such as `@tanstack/react-query` and `next-themes`.
* **`src/services/`**: Setup for external HTTP networking frameworks (Axios).
* **`src/store/`**: Core state orchestrator (Zustand) managing local caches, student progress, quiz rationales, and level-unlock sequences.

---

## SECTION 3: ROUTING MAP

Below is a detailed map of all current routes defined in the Next.js application:

| Route Path | Component Rendered | Purpose | Target User Type |
| :--- | :--- | :--- | :--- |
| `/` | `Home` ([src/app/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/page.tsx)) renders `RoadmapScreen` | Interactive visual roadmap path where students launch learning journeys. | Cloud Enthusiast (Student) |
| `/core` | `CorePage` ([src/app/core/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/page.tsx)) | Redirects immediately to `/core/roadmaps`. | Core Users (Admins) |
| `/core/dashboard` | `DashboardPage` ([src/app/core/dashboard/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/dashboard/page.tsx)) | Displays line graphs of portal API traffic and security alert logs. | Core Users (Admins) |
| `/core/learners` | `LearnersDirectoryPage` ([src/app/core/learners/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/learners/page.tsx)) | Student gradebook. Shows user XP, streaks, level filters, and quiz histories. | Core Users (Admins) |
| `/core/roadmaps` | `RoadmapsBuilderPage` ([src/app/core/roadmaps/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/roadmaps/page.tsx)) | CMS workspace. Admins create, duplicate, order, and delete cloud islands. | Core Users (Admins) |
| `/core/module/[id]/content` | `ContentEditorPage` ([src/app/core/module/[id]/content/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/module/%5Bid%5D/content/page.tsx)) | Slide editor interface. Configures slide layouts, copy, and concept uploads. | Core Users (Admins) |
| `/core/module/[id]/quiz` | `QuizEditorPage` ([src/app/core/module/[id]/quiz/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/module/%5Bid%5D/quiz/page.tsx)) | Quiz editor interface. Configures question pools, imports files, uploads PDFs. | Core Users (Admins) |
| `/roadmap/module/[moduleId]` | `ModulePage` ([src/app/roadmap/module/[moduleId]/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/roadmap/module/%5BmoduleId%5D/page.tsx)) | Student portal for learning slides, completing quizzes, and viewing scorecards. | Cloud Enthusiast (Student) |

---

## SECTION 4: COMPONENT INVENTORY

This section lists the key interactive components that drive the application layout and design system.

### 1. `RoadmapScreen`
* **File Location**: [RoadmapScreen.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/RoadmapScreen.tsx)
* **Purpose**: The central layout container for the student view. It coordinates scrolling to the active module, renders background glows, draws connecting curves, absolute-positions cloud islands/summits, and mounts overlays.
* **Props**: None (Root route component).
* **Dependencies**: `calculateRoadmapGeometry`, `useRoadmapStore`, `SkyBackground`, `RoadmapPath`, `CloudIslandNode`, `MissionDetailsDrawer`, `BeginnerSummitLandmark`, `IntermediateSummitLandmark`, `CloudArchitectSummitLandmark`, `IntermediateCloudsOverlay`, `AdvancedCloudsOverlay`, `RoadmapProgressUpdater`.

### 2. `CloudIslandNode`
* **File Location**: [CloudIslandNode.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/CloudIslandNode.tsx)
* **Purpose**: Renders a floating 3D SVG island representing a learning module. Highly responsive styling based on completion status:
  - `completed`: Glows green, shows a checkmark badge, and floats green micro-sparks upwards.
  - `current`: Displays a rotating dashed cyan circle, pulses glowing border effects, bounces a "CURRENT" tag, and scales by 1.2x.
  - `locked`: Renders a grey silhouette mask with a central lock icon.
* **Props**:
  - `id`: `string`
  - `name`: `string`
  - `points`: `number`
  - `status`: `'completed' | 'current' | 'locked'`
  - `iconName`: `string`
  - `x`: `number` (Percentage X coordinate on the canvas)
  - `y`: `number` (Pixel Y coordinate on the canvas)
  - `onClick`: `() => void`
  - `index`: `number` (Index offset used to stagger CSS float animation delays)
* **Dependencies**: `framer-motion`, `lucide-react`, standard Tailwind utilities.

### 3. `RoadmapPath`
* **File Location**: [RoadmapPath.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/RoadmapPath.tsx)
* **Purpose**: Draws smooth cubic bezier curved paths connecting consecutive islands to look like a winding vertical river. Status-based styling:
  - `completed`: Cyan-emerald gradient dashed stroke (`strokeWidth="4"`) with a blurred drop-glow.
  - `active`: Glowing cyan stroke (`strokeWidth="4"`) animate-flowing downwards via infinite dash offsets.
  - `locked`: Faint grey dashed stroke with low opacity.
* **Props**:
  - `nodes`: `PathNode[]` (An array of elements containing `id`, `x`, `y`, `status`)
  - `width`: `number` (Width of the parent board used to translate percentage coordinates to pixel locations)
* **Dependencies**: None. Pure SVG element rendering.

### 4. `MissionDetailsDrawer`
* **File Location**: [MissionDetailsDrawer.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/MissionDetailsDrawer.tsx)
* **Purpose**: A sliding sidebar drawer that displays the parameters of a selected island (completion status, estimated time, count of pages and questions, XP rewards) and prompts users to "Start Learning" or view past quiz results.
* **Props**:
  - `module`: `ModuleData | null`
  - `isOpen`: `boolean`
  - `onClose`: `() => void`
  - `status`: `'completed' | 'current' | 'locked'`
* **Dependencies**: `useRoadmapStore`, `framer-motion`, `lucide-react`.

### 5. `MilestoneLandmark` (`BeginnerSummitLandmark`, `IntermediateSummitLandmark`, `CloudArchitectSummitLandmark`)
* **File Location**: [MilestoneLandmark.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/MilestoneLandmark.tsx)
* **Purpose**: Renders the larger endpoint milestones at the boundary of each level. Contains highly detailed SVGs (snowy peaks with gold trophy, secondary peaks with lightning badge, and a floating neon castle representing the Cloud Architect Summit).
* **Props**:
  - `x`: `number`
  - `y`: `number`
  - `locked`: `boolean`
* **Dependencies**: `framer-motion`, `lucide-react`.

### 6. `IntermediateCloudsOverlay` & `AdvancedCloudsOverlay`
* **File Location**: [IntermediateCloudsOverlay.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/IntermediateCloudsOverlay.tsx) & [AdvancedCloudsOverlay.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/AdvancedCloudsOverlay.tsx)
* **Purpose**: Blocks access to upper levels. Renders a dark atmospheric mist overlay, 5 drifting grey cloud shape SVGs, and a central lock description box. Once unlocked, the clouds animate off-screen and disperse.
* **Props**:
  - `locked`: `boolean`
  - `top`: `number`
  - `height`: `number`
* **Dependencies**: `framer-motion`, `lucide-react`.

### 7. `LearningContentRenderer`
* **File Location**: [LearningContentRenderer.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/LearningContentRenderer.tsx)
* **Purpose**: Adapts layout formatting to render study slides. Supports `'text-only'`, `'text-image'`, or `'image-only'`. If `imageUrl` is defined, it renders an `<img>` tag; otherwise, it matches `iconName` to render dynamic inline SVGs representing databases, security firewalls, or general cloud networks.
* **Props**:
  - `title`: `string`
  - `bullets`: `string[]`
  - `layout`: `'text-only' | 'text-image' | 'image-only'`
  - `iconName`: `string`
  - `imageUrl`: `string` (Optional base64 String)
* **Dependencies**: `lucide-react`.

### 8. `QuizEntry`
* **File Location**: [QuizEntry.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/QuizEntry.tsx)
* **Purpose**: Renders an individual multiple-choice question. Features option cards labeled A-D, a top progression status tracker, and handles navigation. Triggers a shake animation if a student tries to skip without selecting an answer.
* **Props**:
  - `question`: `QuizQuestion`
  - `currentIndex`: `number`
  - `totalQuestions`: `number`
  - `selectedOption`: `number | undefined`
  - `onSelectOption`: `(idx: number) => void`
  - `onNext`: `() => void`
  - `onPrev`: `() => void`
  - `isLast`: `boolean`
  - `shake`: `boolean`
  - `onSubmit`: `() => void`
* **Dependencies**: `framer-motion`, `lucide-react`.

### 9. `QuizReview`
* **File Location**: [QuizReview.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/QuizReview.tsx)
* **Purpose**: Displays the score assessment results, including correct answers, explanations, check/cross flags, and a button to return to the roadmap.
* **Props**:
  - `review`: `QuizReviewData | undefined`
  - `onReturn`: `() => void`
* **Dependencies**: `framer-motion`, `lucide-react`.

### 10. `DashboardScreen`
* **File Location**: [DashboardScreen.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Dashboard/DashboardScreen.tsx)
* **Purpose**: Admin workspace homepage displaying four statistics cards (peered VPC grid count, monthly AWS cost estimations, etc.), an SVG Bezier line chart representing API portal requests traffic, and security alerts logs.
* **Props**: None.
* **Dependencies**: `framer-motion`, `lucide-react`.

---

## SECTION 5: STATE MANAGEMENT

The application manages global state using **Zustand** with local storage persistence.

* **File Location**: [roadmapStore.ts](file:///d:/AWS%20ROADMAP/frontend/src/store/roadmapStore.ts)
* **Store Name**: `useRoadmapStore`
* **Storage Key**: `'aws-roadmap-platform-store'`

### TypeScript Interfaces

```typescript
export interface UserResourceProgress {
  userId: string;
  moduleId: string;
  completed: boolean;
  completedAt: string;
}

export interface QuizQuestionReview {
  question: string;
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizReviewData {
  moduleId: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  percentage: number;
  answers: QuizQuestionReview[];
  completedAt: string;
}

export interface RoadmapStore {
  modules: ModuleData[];
  moduleStates: { [moduleId: string]: 'completed' | 'current' | 'locked' };
  xp: number;
  streak: number;
  userResourceProgress: { [moduleId: string]: UserResourceProgress };
  quizReviews: { [moduleId: string]: QuizReviewData };
  addModule: (
    name: string,
    description: string,
    level: 'Beginner' | 'Intermediate' | 'Advanced',
    estimatedTime: string,
    points: number
  ) => void;
  updateModule: (moduleId: string, updatedFields: Partial<ModuleData>) => void;
  deleteModule: (moduleId: string) => void;
  duplicateModule: (moduleId: string) => void;
  reorderModule: (moduleId: string, direction: 'up' | 'down') => void;
  completeModule: (moduleId: string, points: number) => void;
  markAsRead: (moduleId: string) => void;
  submitQuizScore: (
    moduleId: string,
    score: number,
    answers: QuizQuestionReview[],
    xpEarned: number
  ) => void;
  resetProgress: () => void;
}
```

### Store Actions Logic
1. **`addModule`**: Formulates a unique URL-friendly ID slug from the provided name. Automatically appends default slides, a single default quiz question, and maps the module state as `'locked'`.
2. **`updateModule`**: Modifies the matching object inside the module array. Used primarily by the CMS editor forms.
3. **`deleteModule`**: Removes the module and deletes its corresponding key inside `moduleStates`.
4. **`duplicateModule`**: Clones slide decks and quiz arrays, suffixing `_copy` to the module ID.
5. **`reorderModule`**: Rearranges module list indices within its level category (Beginner/Intermediate/Advanced) using array swaps.
6. **`completeModule`**: Sets the module's state to `'completed'`, parses the list sequence, and unlocks the next module in order (switching it from `'locked'` to `'current'`). Adds points to the student's XP balance.
7. **`markAsRead`**: Instantiates a timestamp log inside the `userResourceProgress` object for tracking.
8. **`submitQuizScore`**: Computes score card statistics and saves a review report. Unlocks the next sequence module and credits XP.
9. **`resetProgress`**: Purges local storage progress caches, re-initializes modules to defaults, and resets streaks.

---

## SECTION 6: DATA MODELS

### 1. `ModuleData`
* **Type Definition**:
  ```typescript
  export interface ModuleData {
    id: string;
    name: string;
    points: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    description: string;
    iconName: string;
    estimatedTime: string;
    learningPagesCount: number;
    quizQuestionsCount: number;
    tasks: string[];
    quiz: QuizQuestion;
    learningContent: LearningSlide[];
    quizQuestions?: QuizQuestion[];
  }
  ```
* **Relationships**:
  - Contains one or more `LearningSlide` records in `learningContent`.
  - Has a legacy single `quiz` object (fallback).
  - Contains a collection of `QuizQuestion` elements inside `quizQuestions`.
* **Usage Locations**: Main roadmap screens, CMS managers, slide editors, constants.

### 2. `LearningSlide`
* **Type Definition**:
  ```typescript
  export interface LearningSlide {
    title: string;
    content: string[];
    layoutType?: 'text-only' | 'text-image' | 'image-only';
    imageUrl?: string;
  }
  ```
* **Relationships**: Embedded inside `ModuleData`.
* **Usage Locations**: [roadmapStore.ts](file:///d:/AWS%20ROADMAP/frontend/src/store/roadmapStore.ts), [LearningContentRenderer.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/LearningContentRenderer.tsx), [page.tsx (Content Editor)](file:///d:/AWS%20ROADMAP/frontend/src/app/core/module/%5Bid%5D/content/page.tsx).

### 3. `QuizQuestion`
* **Type Definition**:
  ```typescript
  export interface QuizQuestion {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }
  ```
* **Relationships**: Embedded inside `ModuleData`.
* **Usage Locations**: [quizHelpers.ts](file:///d:/AWS%20ROADMAP/frontend/src/lib/quizHelpers.ts), [QuizEntry.tsx](file:///d:/AWS%20ROADMAP/frontend/src/components/Roadmap/QuizEntry.tsx), [page.tsx (Quiz Editor)](file:///d:/AWS%20ROADMAP/frontend/src/app/core/module/%5Bid%5D/quiz/page.tsx).

---

## SECTION 7: ROADMAP SYSTEM

### Roadmap Geometry
The roadmap positions nodes along a vertical serpentine curve. The path geometry is calculated by `calculateRoadmapGeometry` ([roadmapGeometry.ts](file:///d:/AWS%20ROADMAP/frontend/src/lib/roadmapGeometry.ts)) based on the active modules list:
1. **X coordinates**: Placed on a repeating horizontal wave: `WAVE_X_PATTERN = [30, 55, 75, 60, 35, 24]` (percentage width).
2. **Y coordinates**: Placed sequentially down the screen:
   - **Beginner Level**: Starts at `Y = 200px` and increases by `220px` per module.
   - **Beginner Summit**: Placed at `X = 50%` directly following the last Beginner module.
   - **Intermediate Level**: Starts `300px` below the Beginner Summit.
   - **Intermediate Summit**: Placed at `X = 50%` directly following the last Intermediate module.
   - **Advanced Level**: Starts `300px` below the Intermediate Summit.
   - **Advanced Castle Summit**: Placed at `X = 50%` following the last Advanced module.

*(Note: The CMS preview canvas uses a compact scale version with Y increments of 135px and offsets of 180px, defined in [roadmaps/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/roadmaps/page.tsx)).*

### Path Generation
Paths are generated by `RoadmapPath.tsx` by converting percentages to coordinates based on container width. Smooth curves are created using SVG Cubic Bezier instructions:
```svg
<path d="M x1 y1 C cp1x cp1y, cp2x cp2y, x2 y2" />
```
The control points (`cp1`, `cp2`) use vertical offsets equal to `50%` of the vertical distance (`dy * 0.5`) to keep the path aligned vertically.

### Progress Tracking
The progression sequence relies on array indexes:
1. When a user submits their quiz score, the store sets `moduleStates[moduleId] = 'completed'`.
2. It looks up the next sequential index in the `modules` array.
3. If the next module was `'locked'`, it is upgraded to `'current'`.
4. Dispersing cloud overlays are tied directly to completing all modules in the preceding tier.

---

## SECTION 8: CONTENT SYSTEM

### Slide Structure
Slides are stored in the `learningContent` array inside each module using the `LearningSlide` structure.

### Image Handling & Uploads
* **Client Uploads**: Admins upload image files in [content/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/module/%5Bid%5D/content/page.tsx) via `<input type="file" accept="image/*">`.
* **Base64 Storage**: The file is read using a standard `FileReader` and converted to a Base64 data URL:
  ```typescript
  const reader = new FileReader();
  reader.onloadend = () => {
    updateActiveSlide({ imageUrl: reader.result as string });
  };
  reader.readAsDataURL(file);
  ```
* **Inline SVGs fallback**: If `imageUrl` is empty, `LearningContentRenderer` renders dynamic inline SVGs mapping to keywords:
  - Security Illustration: triggers for `shield`, `lock`, `key`, or `iam`.
  - Database Illustration: triggers for `database`, `server`, `rds`, or `dynamo`.
  - Architecture Illustration: fallback default.

---

## SECTION 9: QUIZ SYSTEM

### Question Schema & Shuffling
Quizzes contain up to 15 questions.
When a student launches a module, the questions are randomized dynamically on the client side:
1. The question pool is cloned.
2. For each question, options are shuffled. The correct `answerIndex` is recalculated to match the new option index.
3. The questions array is shuffled and sliced to a maximum of 15 questions.

### Scoring Logic
* **Passing Score**: A passing score requires $\ge 70\%$ correct answers.
* **Submission Event**: Submitting a quiz calls `submitQuizScore`, which writes the scorecard to `quizReviews` in local storage and unlocks the next module.

---

## SECTION 10: ANALYTICS SYSTEM

### Data Sources
1. Student explorer scorecards, streaks, and completed modules count in `useRoadmapStore`.
2. Static database arrays tracking student mock histories (`INITIAL_STUDENTS` in [learners/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/learners/page.tsx)).
3. Telemetry datasets showing API traffic, cost estimators, and alerts.

### Calculations & Visualizations
* **API Portal Traffic**: Displayed using an SVG line chart with a smooth Bezier spline overlay.
* **Gradebook Filters**: The learners directory calculates filters (by level or completion thresholds) on the client side.

---

## SECTION 11: CURRENT MOCK DATA

| File Location | Data Schema | Purpose |
| :--- | :--- | :--- |
| [roadmapData.ts](file:///d:/AWS%20ROADMAP/frontend/src/constants/roadmapData.ts) | `ROADMAP_MODULES` (18 modules, each with 4 slides, tasks lists, and default questions), `MOCK_ACHIEVEMENTS` (4 badges). | Default database populating initial cloud paths and badge rewards. |
| [quizHelpers.ts](file:///d:/AWS%20ROADMAP/frontend/src/lib/quizHelpers.ts) | 15 templates with generic questions, options, and explanations. | Generates quiz questions dynamically if none are defined. |
| [learners/page.tsx](file:///d:/AWS%20ROADMAP/frontend/src/app/core/learners/page.tsx) | `INITIAL_STUDENTS` (Sarah Connor, Marcus Wright, John Connor, Kyle Reese, Dr. Peter Silberman). | Mock students profiles showing email logs, streaks, and scorecards. |

---

## SECTION 12: BACKEND INTEGRATION GUIDE

To migrate the platform to a server-side architecture, map the following frontend components to backend APIs and databases:

### 1. Modules & Slides
* **Current State**: Static array in `constants` with edits saved to local storage.
* **Future Endpoint**: `GET /api/modules` (all tracks), `POST /api/modules` (create), `PUT /api/modules/:id` (edit slides).
* **Database Tables**:
  - `modules`: `id` (PK), `name`, `level`, `points`, `estimated_time`, `description`, `icon_name`, `order_index`.
  - `slides`: `id` (PK), `module_id` (FK), `title`, `content` (text array), `layout_type`, `image_url`, `order_index`.
* **Storage Requirements**: AWS S3 bucket for slide images, migrating away from storing Base64 strings in the database.

### 2. Quizzes & PDF Syllabus References
* **Current State**: Shuffled on client. Client-only PDF file selector.
* **Future Endpoint**: `GET /api/modules/:id/quiz`, `POST /api/modules/:id/quiz/import` (bulk import), `POST /api/modules/:id/pdf-extract` (upload and parse syllabus).
* **Database Tables**:
  - `quiz_questions`: `id` (PK), `module_id` (FK), `question_text`, `options` (text array), `correct_option_index`, `explanation`.
* **Storage Requirements**: AWS S3 bucket for PDF reference materials.

### 3. Student Progress & Gamification
* **Current State**: Persisted locally.
* **Future Endpoint**: `GET /api/progress/:userId`, `POST /api/progress/complete` (marks completed, credits XP, updates streaks).
* **Database Tables**:
  - `users`: `id` (PK), `name`, `email`, `xp`, `streak`, `last_active_date`.
  - `user_progress`: `id` (PK), `user_id` (FK), `module_id` (FK), `completed` (bool), `completed_at` (timestamp).
  - `quiz_attempts`: `id` (PK), `user_id` (FK), `module_id` (FK), `score`, `total_questions`, `percentage`, `completed_at` (timestamp).

### 4. Admin Telemetry & Audit Logs
* **Current State**: Inline mock items in the dashboard component.
* **Future Endpoint**: `GET /api/admin/metrics`, `GET /api/admin/alerts`.
* **Database Tables**:
  - `security_alerts`: `id`, `title`, `description`, `type` (warning/info), `created_at`.
  - `api_metrics`: `timestamp`, `endpoint`, `request_count`.

---

## SECTION 13: FILES SAFE TO MODIFY

The following files are primary integration points for backend development:

1. **[apiClient.ts](file:///d:/AWS%20ROADMAP/frontend/src/services/apiClient.ts)**: Configure the base URL for the backend API and set up auth headers (JWT tokens).
2. **[roadmapStore.ts](file:///d:/AWS%20ROADMAP/frontend/src/store/roadmapStore.ts)**:
   - Replace local storage persistence with API calls.
   - Refactor actions (e.g., `addModule`, `submitQuizScore`) to send API requests and refresh the state.
3. **[page.tsx (Module page)](file:///d:/AWS%20ROADMAP/frontend/src/app/roadmap/module/%5BmoduleId%5D/page.tsx)**: Fetch module details, slides, and quizzes dynamically using React Query (`QueryProvider`).
4. **[page.tsx (Learners directory)](file:///d:/AWS%20ROADMAP/frontend/src/app/core/learners/page.tsx)**: Replace the `INITIAL_STUDENTS` mock data with an API call to load real student records.

---

## SECTION 14: RISKS

### 1. Hardcoded Unlock Sequencing
* **Risk**: The logic for unlocking the next module (`completeModule` and `submitQuizScore`) assumes a simple linear sequence based on the modules array.
* **Impact**: If admins reorder modules or if students follow custom tracks, this linear unlocking will break.
* **Refactoring Need**: The backend should evaluate progression rules dynamically and return the next unlocked module ID.

### 2. Large Base64 String Payloads
* **Risk**: Slide images are saved directly in the module JSON as Base64 strings.
* **Impact**: Storing large images in JSON objects slows down database queries and increases network payload sizes.
* **Refactoring Need**: The CMS should upload images as binary files to a storage service (like Amazon S3) and store only the public URL in the slide data.

### 3. Client-Side Quiz Shuffling
* **Risk**: Questions and options are shuffled in the client page on mount.
* **Impact**: This can cause discrepancies in state if a user refreshes the page mid-quiz, and makes it difficult to audit quiz attempts accurately.
* **Refactoring Need**: The backend should handle question selection and options shuffling, returning a stable quiz session ID.

### 4. Hydration & LocalStorage Mismatches
* **Risk**: Initial server builds render default static data, while clients load local storage data on mount.
* **Impact**: Can cause UI flicker or React hydration errors.
* **Refactoring Need**: Wrap client elements in `mounted` state guards or fetch initial data server-side.
