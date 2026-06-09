'use client';

import React from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { RoadmapScreen } from '@/components/Roadmap/RoadmapScreen';

export default function Home() {
  return (
    <AppLayout>
      <RoadmapScreen />
    </AppLayout>
  );
}
