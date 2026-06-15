import { TopicTheme } from '../../../generated/prisma/client.js';

export class TopicSummaryDto {
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

export class TopicListResponseDto {
  topics: TopicSummaryDto[];
}
