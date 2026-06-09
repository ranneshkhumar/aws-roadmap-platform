import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROADMAP_MODULES } from '@/constants/roadmapData';

export interface RoadmapStore {
  moduleStates: { [key: string]: 'completed' | 'current' | 'locked' };
  xp: number;
  streak: number;
  completeModule: (moduleId: string, points: number) => void;
  resetProgress: () => void;
}

// Helper to construct the initial states dynamically based on the 90 modules list
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
      resetProgress: () =>
        set({
          moduleStates: getInitialModuleStates(),
          xp: 1250,
          streak: 7,
        }),
    }),
    {
      name: 'aws-roadmap-platform-store', // persist state in localStorage
    }
  )
);
