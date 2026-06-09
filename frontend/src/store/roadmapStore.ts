import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROADMAP_MODULES } from '@/constants/roadmapData';

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
  moduleStates: { [key: string]: 'completed' | 'current' | 'locked' };
  xp: number;
  streak: number;
  userResourceProgress: { [moduleId: string]: UserResourceProgress };
  quizReviews: { [moduleId: string]: QuizReviewData };
  completeModule: (moduleId: string, points: number) => void;
  markAsRead: (moduleId: string) => void;
  submitQuizScore: (moduleId: string, score: number, answers: QuizQuestionReview[], xpEarned: number) => void;
  resetProgress: () => void;
}

// Helper to construct the initial states dynamically based on the 18 flagship modules list
const getInitialModuleStates = () => {
  const states: { [key: string]: 'completed' | 'current' | 'locked' } = {};
  ROADMAP_MODULES.forEach((mod, idx) => {
    if (idx < 3) {
      states[mod.id] = 'completed'; // First 3 completed (Fundamentals, EC2, S3)
    } else if (idx === 3) {
      states[mod.id] = 'current'; // 4th current (IAM)
    } else {
      states[mod.id] = 'locked'; // Rest locked
    }
  });
  return states;
};

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      moduleStates: getInitialModuleStates(),
      xp: 1250,
      streak: 7,
      userResourceProgress: {},
      quizReviews: {},
      completeModule: (moduleId, points) =>
        set((state) => {
          const nextStates = { ...state.moduleStates };
          nextStates[moduleId] = 'completed';

          // Identify the next module in the sequence and unlock it
          const seq = ROADMAP_MODULES.map((m) => m.id);
          const currentIdx = seq.indexOf(moduleId);
          
          if (currentIdx !== -1 && currentIdx + 1 < seq.length) {
            const nextModuleId = seq[currentIdx + 1];
            // Only unlock if it was previously locked
            if (nextStates[nextModuleId] === 'locked') {
              nextStates[nextModuleId] = 'current';
            }
          }

          return {
            moduleStates: nextStates,
            xp: state.xp + points,
          };
        }),
      markAsRead: (moduleId) =>
        set((state) => {
          const progress = { ...state.userResourceProgress };
          progress[moduleId] = {
            userId: 'explorer-1',
            moduleId,
            completed: true,
            completedAt: new Date().toISOString()
          };
          return { userResourceProgress: progress };
        }),
      submitQuizScore: (moduleId, score, answers, xpEarned) =>
        set((state) => {
          const reviews = { ...state.quizReviews };
          const percentage = Math.round((score / answers.length) * 100);
          reviews[moduleId] = {
            moduleId,
            score,
            totalQuestions: answers.length,
            xpEarned,
            percentage,
            answers,
            completedAt: new Date().toISOString()
          };

          // Unlock next module and mark this as completed
          const nextStates = { ...state.moduleStates };
          nextStates[moduleId] = 'completed';

          const seq = ROADMAP_MODULES.map((m) => m.id);
          const currentIdx = seq.indexOf(moduleId);
          
          if (currentIdx !== -1 && currentIdx + 1 < seq.length) {
            const nextModuleId = seq[currentIdx + 1];
            if (nextStates[nextModuleId] === 'locked') {
              nextStates[nextModuleId] = 'current';
            }
          }

          return {
            quizReviews: reviews,
            moduleStates: nextStates,
            xp: state.xp + xpEarned
          };
        }),
      resetProgress: () =>
        set({
          moduleStates: getInitialModuleStates(),
          xp: 1250,
          streak: 7,
          userResourceProgress: {},
          quizReviews: {}
        }),
    }),
    {
      name: 'aws-roadmap-platform-store', // persist state in localStorage
    }
  )
);
