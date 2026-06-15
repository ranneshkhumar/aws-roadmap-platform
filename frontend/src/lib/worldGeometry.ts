import type { TopicSummary, TopicTheme } from '@/services/api';

export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface WorldNode {
  id: string;
  slug: string;
  name: string;
  theme: TopicTheme;
  unlocked: boolean;
  status: TopicStatus;
  completedModules: number;
  totalModules: number;
  xPercent: number;
  y: number;
}

export interface PixelWorldNode extends Omit<WorldNode, 'xPercent'> {
  x: number;
  y: number;
}

export const calculateWorldGeometry = (
  topics: TopicSummary[],
  isMobile: boolean
): WorldNode[] => {
  const WAVE_X = [30, 70, 50];
  return topics.map((topic, index) => {
    const xPercent = isMobile ? 50 : WAVE_X[index % WAVE_X.length];
    const y = isMobile ? index * 580 + 150 : index * 720 + 200;
    return {
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      theme: topic.theme,
      unlocked: topic.unlocked,
      status: topic.status,
      completedModules: topic.completedModules,
      totalModules: topic.totalModules,
      xPercent,
      y,
    };
  });
};

export const getPixelCoordinates = (
  nodes: WorldNode[],
  boardWidth: number
): PixelWorldNode[] => {
  return nodes.map((node) => {
    const { xPercent, ...rest } = node;
    return {
      ...rest,
      x: (xPercent / 100) * boardWidth,
      y: node.y,
    };
  });
};
