import apiClient from './apiClient';
import type { QuizReviewData } from '@/components/Roadmap/QuizReview';

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================

export type UserRole = 'CORE' | 'CREW' | 'ENTHUSIAST';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  xp: number;
  streak: number;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface LearningSlide {
  title: string;
  layoutType: 'TEXT_ONLY' | 'TEXT_IMAGE' | 'IMAGE_ONLY';
  imageUrl: string | null;
  bullets: string[];
  orderIndex: number;
}

export interface QuizQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string; // Stride out for learner GET endpoints
  explanation: string;
  orderIndex: number;
}

export interface ModuleData {
  id: string;
  name: string;
  description: string;
  tier: string;
  xpPoints: number;
  orderIndex: number;
  slug: string;
  topicId: string | null;
  level: string;
}

export interface ModuleDetail extends ModuleData {
  slides: LearningSlide[];
  questions: QuizQuestion[];
}

export interface CreateModuleDto {
  name: string;
  description: string;
  tier: string;
  xpPoints: number;
  orderIndex?: number;
  topicId?: string;
  level?: string;
}

export interface UpdateModuleDto {
  name?: string;
  description?: string;
  tier?: string;
  xpPoints?: number;
  orderIndex?: number;
  topicId?: string;
  level?: string;
}

export interface UserProgress {
  currentXP: number;
}

export interface ModuleProgress {
  status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
}

export interface QuizAttemptAnswer {
  questionOrder: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface QuizAttemptDto {
  answers: QuizAttemptAnswer[];
}

export interface QuizAttemptResult {
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  topicCompleted: boolean;
  nextTopicUnlocked: boolean;
}

// ============================================================================
// 2. ADAPTER LAYER
// ============================================================================

export const mapLayoutTypeToFrontend = (type: string): 'text-only' | 'text-image' | 'image-only' => {
  const map: Record<string, 'text-only' | 'text-image' | 'image-only'> = {
    TEXT_ONLY: 'text-only',
    TEXT_IMAGE: 'text-image',
    IMAGE_ONLY: 'image-only',
  };
  return map[type] || 'text-only';
};

export const mapLayoutTypeToBackend = (type: 'text-only' | 'text-image' | 'image-only'): 'TEXT_ONLY' | 'TEXT_IMAGE' | 'IMAGE_ONLY' => {
  const map: Record<'text-only' | 'text-image' | 'image-only', 'TEXT_ONLY' | 'TEXT_IMAGE' | 'IMAGE_ONLY'> = {
    'text-only': 'TEXT_ONLY',
    'text-image': 'TEXT_IMAGE',
    'image-only': 'IMAGE_ONLY',
  };
  return map[type] || 'TEXT_ONLY';
};

export const mapIndexToLetter = (idx: number): 'A' | 'B' | 'C' | 'D' => {
  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  return letters[idx] || 'A';
};

export const mapLetterToIndex = (letter?: string): number => {
  if (!letter) return 0;
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter] ?? 0;
};

export const mapBackendQuestionToFrontend = (q: QuizQuestion): any => {
  return {
    question: q.question,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    answerIndex: mapLetterToIndex(q.correctAnswer),
    explanation: q.explanation,
    orderIndex: q.orderIndex,
  };
};

export const mapFrontendQuestionToBackend = (q: any): QuizQuestion => {
  return {
    question: q.question,
    optionA: q.options[0] || '',
    optionB: q.options[1] || '',
    optionC: q.options[2] || '',
    optionD: q.options[3] || '',
    correctAnswer: mapIndexToLetter(q.answerIndex),
    explanation: q.explanation,
    orderIndex: q.orderIndex || 0,
  };
};

// ============================================================================
// 3. SERVICE METHODS
// ============================================================================

export const modulesService = {
  getModules: async (topicId?: string): Promise<ModuleData[]> => {
    const params = topicId ? { topicId } : {};
    const res = await apiClient.get<ModuleData[]>('/modules', { params });
    return res.data;
  },

  getModule: async (id: string): Promise<ModuleDetail> => {
    const res = await apiClient.get<ModuleDetail>(`/modules/${id}`);
    return res.data;
  },

  getModuleBySlug: async (slug: string): Promise<ModuleDetail> => {
    const res = await apiClient.get<ModuleDetail>(`/modules/slug/${slug}`);
    return res.data;
  },

  createModule: async (dto: CreateModuleDto): Promise<ModuleData> => {
    const res = await apiClient.post<ModuleData>('/modules', dto);
    return res.data;
  },

  updateModule: async (id: string, dto: UpdateModuleDto): Promise<ModuleData> => {
    const res = await apiClient.patch<ModuleData>(`/modules/${id}`, dto);
    return res.data;
  },

  deleteModule: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/modules/${id}`);
    return res.data;
  },

  reorderModules: async (ids: string[]): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>('/modules/reorder', { ids });
    return res.data;
  },
};

export const slidesService = {
  getSlides: async (moduleId: string): Promise<LearningSlide[]> => {
    const res = await apiClient.get<LearningSlide[]>(`/modules/${moduleId}/slides`);
    return res.data;
  },

  syncSlides: async (moduleId: string, slides: LearningSlide[]): Promise<LearningSlide[]> => {
    const res = await apiClient.put<LearningSlide[]>(`/modules/${moduleId}/slides`, { slides });
    return res.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ url: string }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const questionsService = {
  getQuestions: async (moduleId: string): Promise<QuizQuestion[]> => {
    const res = await apiClient.get<QuizQuestion[]>(`/modules/${moduleId}/questions`);
    return res.data;
  },

  syncQuestions: async (moduleId: string, questions: QuizQuestion[]): Promise<QuizQuestion[]> => {
    const res = await apiClient.put<QuizQuestion[]>(`/modules/${moduleId}/questions`, { questions });
    return res.data;
  },
};

export const progressService = {
  getMyProgress: async (): Promise<UserProgress> => {
    const res = await apiClient.get<UserProgress>('/progress/me');
    return res.data;
  },

  getModuleProgress: async (moduleId: string): Promise<ModuleProgress> => {
    const res = await apiClient.get<ModuleProgress>(`/modules/${moduleId}/progress`);
    return res.data;
  },

  submitQuizAttempt: async (moduleId: string, dto: QuizAttemptDto): Promise<QuizAttemptResult> => {
    const res = await apiClient.post<QuizAttemptResult>(`/modules/${moduleId}/quiz/attempt`, dto);
    return res.data;
  },

  getQuizReview: async (moduleId: string): Promise<QuizReviewData> => {
    const res = await apiClient.get<QuizReviewData>(`/modules/${moduleId}/quiz/review`);
    return res.data;
  },
};

// ============================================================================
// 4. LEARNING API (Topic-based learner endpoints)
// ============================================================================

export interface LearningModuleSummary {
  slug: string;
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tier: string;
  xpPoints: number;
  orderIndex: number;
  status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
  score: number | null;
  slideCount: number;
  questionCount: number;
}

export interface LearningTopicProgress {
  totalModules: number;
  completedModules: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export type TopicTheme = 'TECH' | 'FORGE' | 'CITADEL' | 'HARBOR' | 'CRYSTAL';

export interface LearningTopicDetail {
  slug: string;
  name: string;
  description: string;
  orderIndex: number;
  modules: LearningModuleSummary[];
  progress: LearningTopicProgress;
  theme: TopicTheme;
}

export interface TopicSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  orderIndex: number;
  totalModules: number;
  completedModules: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  unlocked: boolean;
  theme: TopicTheme;
}

export const learningService = {
  getTopicList: async (): Promise<TopicSummary[]> => {
    const res = await apiClient.get<{ topics: TopicSummary[] }>('/learning/topics');
    return res.data.topics;
  },

  getTopicDetail: async (slug: string): Promise<LearningTopicDetail> => {
    const res = await apiClient.get<LearningTopicDetail>(`/learning/topics/${slug}`);
    return res.data;
  },

  getContinueModule: async (): Promise<{ module: LearningModuleSummary & { topicSlug: string; topicName: string } | null }> => {
    const res = await apiClient.get<{ module: (LearningModuleSummary & { topicSlug: string; topicName: string }) | null }>('/learning/continue');
    return res.data;
  },
};

// ============================================================================
// 5. CMS TOPICS API
// ============================================================================

export interface TopicData {
  id: string;
  slug: string;
  name: string;
  description: string;
  orderIndex: number;
  modules: ModuleData[];
  theme: TopicTheme;
}

export interface CreateTopicDto {
  name: string;
  description?: string;
  theme?: TopicTheme;
}

export interface UpdateTopicDto {
  name?: string;
  description?: string;
  theme?: TopicTheme;
}

export const topicsService = {
  getTopics: async (): Promise<TopicData[]> => {
    const res = await apiClient.get<TopicData[]>('/topics');
    return res.data;
  },

  getTopic: async (id: string): Promise<TopicData> => {
    const res = await apiClient.get<TopicData>(`/topics/${id}`);
    return res.data;
  },

  createTopic: async (dto: CreateTopicDto): Promise<TopicData> => {
    const res = await apiClient.post<TopicData>('/topics', dto);
    return res.data;
  },

  updateTopic: async (id: string, dto: UpdateTopicDto): Promise<TopicData> => {
    const res = await apiClient.patch<TopicData>(`/topics/${id}`, dto);
    return res.data;
  },

  deleteTopic: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/topics/${id}`);
    return res.data;
  },

  reorderTopics: async (ids: string[]): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>('/topics/reorder', { ids });
    return res.data;
  },
};

// ============================================================================
// LEARNERS SERVICE
// ============================================================================

export interface LearnerSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  currentTopic: string | null;
  currentLevel: string | null;
  currentModuleName: string | null;
  currentModuleOrder: number | null;
  completedModulesCount: number;
  totalModulesCount: number;
  totalTopicsCount: number;
  isPlatformComplete: boolean;
}

export const learnersService = {
  getLearners: async (): Promise<LearnerSummary[]> => {
    const res = await apiClient.get<LearnerSummary[]>('/learners');
    return res.data;
  },
};
