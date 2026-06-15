'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { modulesService } from '@/services/api';
import { ApiError } from '@/services/apiClient';
import { authService } from '@/services/auth.service';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmDeleteModal from '@/components/Core/ConfirmDeleteModal';
import { showToast } from '@/components/Core/Toast';

import { SkyBackground } from '@/components/Roadmap/SkyBackground';
import { RoadmapPath } from '@/components/Roadmap/RoadmapPath';
import { CloudIslandNode } from '@/components/Roadmap/CloudIslandNode';
import { BeginnerSummitLandmark, IntermediateSummitLandmark, CloudArchitectSummitLandmark } from '@/components/Roadmap/MilestoneLandmark';
import { IntermediateCloudsOverlay } from '@/components/Roadmap/IntermediateCloudsOverlay';
import { AdvancedCloudsOverlay } from '@/components/Roadmap/AdvancedCloudsOverlay';

const CANVAS_WIDTH = 900;

const levelToTier = (level: 'Beginner' | 'Intermediate' | 'Advanced'): string => {
  const map = { Beginner: 'Fundamentals', Intermediate: 'Associate', Advanced: 'Professional' };
  return map[level];
};

const tierToLevel = (tier: string): 'Beginner' | 'Intermediate' | 'Advanced' => {
  const map: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
    Fundamentals: 'Beginner', Associate: 'Intermediate', Professional: 'Advanced',
  };
  return map[tier] || 'Beginner';
};

const getIconForSlug = (slug: string): string => {
  const map: Record<string, string> = {
    fundamentals: 'Globe', ec2: 'Cpu', s3: 'Database', iam: 'Shield', vpc: 'Network',
    rds: 'Server', route53: 'Compass', elasticloadbalancing: 'Shuffle', autoscaling: 'ArrowUpCircle',
    lambda: 'Zap', dynamodb: 'HardDrive', cloudwatch: 'Eye', sns_sqs: 'Mail',
    cloudtrail: 'FileText', cloudfront: 'Tv', ecs_eks: 'Box', iam_advanced: 'Lock',
    transit_gateway: 'GitMerge',
  };
  return map[slug] || 'Boxes';
};

const calculateCompactRoadmapGeometry = (modulesList: any[]) => {
  const coordinates: { [key: string]: { x: number; y: number } } = {};
  const beginnerList = modulesList.filter((m) => m.level === 'Beginner');
  const intermediateList = modulesList.filter((m) => m.level === 'Intermediate');
  const advancedList = modulesList.filter((m) => m.level === 'Advanced');
  const WAVE_X_PATTERN = [32, 58, 76, 62, 38, 25];

  let currentY = 100;
  beginnerList.forEach((mod, idx) => {
    coordinates[mod.id] = { x: WAVE_X_PATTERN[idx % WAVE_X_PATTERN.length], y: currentY };
    currentY += 135;
  });
  coordinates['summit_beginner'] = { x: 50, y: currentY };

  currentY += 180;
  const startIntermediateY = currentY;
  intermediateList.forEach((mod, idx) => {
    coordinates[mod.id] = { x: WAVE_X_PATTERN[(idx + 1) % WAVE_X_PATTERN.length], y: currentY };
    currentY += 135;
  });
  coordinates['summit_intermediate'] = { x: 50, y: currentY };

  currentY += 180;
  const startAdvancedY = currentY;
  advancedList.forEach((mod, idx) => {
    coordinates[mod.id] = { x: WAVE_X_PATTERN[(idx + 2) % WAVE_X_PATTERN.length], y: currentY };
    currentY += 135;
  });
  coordinates['summit_advanced'] = { x: 50, y: currentY };

  return {
    coordinates,
    totalHeight: currentY + 120,
    intermediateStartY: startIntermediateY - 90,
    intermediateHeight: startAdvancedY - startIntermediateY + 60,
    advancedStartY: startAdvancedY - 90,
    advancedHeight: currentY - startAdvancedY + 60,
  };
};

interface RoadmapBuilderProps {
  topicId: string;
  topicName?: string;
}

export default function RoadmapBuilder({ topicId, topicName }: RoadmapBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [points, setPoints] = useState(50);

  const centerRef = useRef<HTMLDivElement>(null);
  const [centerSize, setCenterSize] = useState({ w: 700, h: 500 });

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPoints, setEditPoints] = useState(50);
  const [editLevel, setEditLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  const isDirtyRef = useRef(false);
  const editStateRef = useRef({ name: '', description: '', points: 50, level: 'Beginner' as const });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentModuleDbIdRef = useRef<string | null>(null);
  const saveVersionRef = useRef(0);

  const handleApiError = (err: any) => {
    const apiError = err as ApiError;
    if (apiError.status === 401) {
      authService.logout();
      router.push('/login');
    } else if (apiError.status === 403) {
      alert('Permission Denied: You do not have the required core privileges to make curriculum changes.');
    } else {
      alert(apiError.message || 'An unexpected error occurred.');
    }
  };

  const loadModules = async () => {
    try {
      setLoading(true);
      const dbModules = await modulesService.getModules(topicId);

      const requiredFields = ['id', 'slug', 'name', 'description', 'tier', 'xpPoints', 'orderIndex'];
      for (const mod of dbModules) {
        const missing = [];
        for (const field of requiredFields) {
          if (mod[field as keyof typeof mod] === undefined || mod[field as keyof typeof mod] === null) {
            missing.push(field);
          }
        }
        if (missing.length > 0) {
          throw new Error(`API Contract Mismatch: Module [slug: ${mod.slug || 'unknown'}] is missing required fields: ${missing.join(', ')}`);
        }
      }

      const mapped = dbModules.map((m) => ({
        id: m.slug,
        name: m.name,
        points: m.xpPoints,
        level: tierToLevel(m.tier),
        description: m.description,
        iconName: getIconForSlug(m.slug),
        learningPagesCount: 4,
        quizQuestionsCount: 3,
        tasks: [],
        quiz: { question: '', options: [], answerIndex: 0, explanation: '' },
        learningContent: [],
        dbId: m.id,
        orderIndex: m.orderIndex,
      }));

      mapped.sort((a, b) => {
        const modA = dbModules.find((m) => m.slug === a.id);
        const modB = dbModules.find((m) => m.slug === b.id);
        return (modA?.orderIndex ?? 0) - (modB?.orderIndex ?? 0);
      });

      setModules(mapped);
      setError(null);

      // Restore selection from URL ?selected= param, then existing state, then first module
      const urlSelected = searchParams.get('selected');
      if (urlSelected && mapped.some(m => m.id === urlSelected)) {
        setSelectedModuleId(urlSelected);
      } else if (!selectedModuleId || !mapped.some(m => m.id === selectedModuleId)) {
        setSelectedModuleId(mapped.length > 0 ? mapped[0].id : null);
      }
    } catch (err: any) {
      console.error('Failed to load modules:', err);
      setError(err?.message || 'An error occurred loading modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, [topicId]);

  const flushChanges = async (): Promise<void> => {
    if (!isDirtyRef.current || !currentModuleDbIdRef.current) return Promise.resolve();

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    const version = ++saveVersionRef.current;
    isDirtyRef.current = false;
    setSaveStatus('saving');

    try {
      const { name: currentName, description: currentDesc, points: currentPoints, level: currentLvl } = editStateRef.current;
      const dto = {
        name: currentName,
        description: currentDesc,
        xpPoints: currentPoints,
        tier: levelToTier(currentLvl),
      };

      await modulesService.updateModule(currentModuleDbIdRef.current, dto);

      if (version === saveVersionRef.current) {
        setSaveStatus('saved');
      }

      const dbModules = await modulesService.getModules(topicId);
      const mapped = dbModules.map((m) => ({
        id: m.slug,
        name: m.name,
        points: m.xpPoints,
        level: tierToLevel(m.tier),
        description: m.description,
        iconName: getIconForSlug(m.slug),
        learningPagesCount: 4,
        quizQuestionsCount: 3,
        tasks: [],
        quiz: { question: '', options: [], answerIndex: 0, explanation: '' },
        learningContent: [],
        dbId: m.id,
      }));
      mapped.sort((a, b) => {
        const modA = dbModules.find((m) => m.slug === a.id);
        const modB = dbModules.find((m) => m.slug === b.id);
        return (modA?.orderIndex ?? 0) - (modB?.orderIndex ?? 0);
      });
      setModules(mapped);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      if (version === saveVersionRef.current) {
        setSaveStatus('failed');
      }
      isDirtyRef.current = true;
      handleApiError(err);
      throw err;
    }
  };

  const selectModule = async (moduleId: string) => {
    if (moduleId === selectedModuleId) return;
    if (isDirtyRef.current) {
      await flushChanges().catch(console.error);
    }
    setSelectedModuleId(moduleId);
    // Persist selection in URL for restore on return from editors
    const params = new URLSearchParams(searchParams.toString());
    params.set('selected', moduleId);
    router.replace(`/core/topics/${topicId}/roadmap?${params.toString()}`, { scroll: false });
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!selectedModule) return;

    if (field === 'name') setEditName(value);
    if (field === 'description') setEditDescription(value);
    if (field === 'points') setEditPoints(value);
    if (field === 'level') setEditLevel(value);

    editStateRef.current = { ...editStateRef.current, [field]: value };
    isDirtyRef.current = true;
    setSaveStatus('idle');

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      flushChanges().catch(console.error);
    }, 1000);
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;

  useEffect(() => {
    if (selectedModule) {
      currentModuleDbIdRef.current = selectedModule.dbId;
      setEditName(selectedModule.name);
      setEditDescription(selectedModule.description);
      setEditPoints(selectedModule.points);
      setEditLevel(selectedModule.level);
      editStateRef.current = {
        name: selectedModule.name,
        description: selectedModule.description,
        points: selectedModule.points,
        level: selectedModule.level,
      };
      isDirtyRef.current = false;
      setSaveStatus('idle');
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    } else {
      currentModuleDbIdRef.current = null;
    }
  }, [selectedModuleId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in module settings. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current && currentModuleDbIdRef.current) {
        const { name: currentName, description: currentDesc, points: currentPoints, level: currentLvl } = editStateRef.current;
        const dto = {
          name: currentName,
          description: currentDesc,
          xpPoints: currentPoints,
          tier: levelToTier(currentLvl),
        };
        modulesService.updateModule(currentModuleDbIdRef.current, dto).catch(console.error);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCenterSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const beginnerList = modules.filter((m) => m.level === 'Beginner');
  const intermediateList = modules.filter((m) => m.level === 'Intermediate');
  const advancedList = modules.filter((m) => m.level === 'Advanced');

  const { coordinates, totalHeight, intermediateStartY, intermediateHeight, advancedStartY, advancedHeight } = calculateCompactRoadmapGeometry(modules);

  const canvasHeight = totalHeight + 100;
  const scaleX = centerSize.w / CANVAS_WIDTH;
  const fitScale = Math.min(scaleX, 0.95);

  // Scroll to the selected module when it changes or when modules load
  useEffect(() => {
    if (!centerRef.current || !selectedModuleId || modules.length === 0) return;
    const coord = coordinates[selectedModuleId];
    if (!coord) return;
    // Coordinates are in unscaled canvas space; container renders at fitScale
    const scaledY = coord.y * fitScale;
    const containerHeight = centerRef.current.clientHeight;
    const scrollPos = scaledY - containerHeight / 2 + 60;
    centerRef.current.scrollTo({ top: Math.max(0, scrollPos), behavior: 'smooth' });
  }, [selectedModuleId, modules, coordinates, fitScale]);

  const visualNodesList = [
    ...beginnerList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_beginner', name: 'Beginner Summit', level: 'Beginner' as const, type: 'summit' as const },
    ...intermediateList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_intermediate', name: 'Intermediate Summit', level: 'Intermediate' as const, type: 'summit' as const },
    ...advancedList.map((m) => ({ ...m, type: 'module' as const })),
    { id: 'summit_advanced', name: 'Cloud Architect Summit', level: 'Advanced' as const, type: 'summit' as const }
  ];

  const pathNodes = visualNodesList.map((node) => {
    const coord = coordinates[node.id] || { x: 50, y: 150 };
    return { id: node.id, x: coord.x, y: coord.y, status: 'completed' as const };
  });

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const tier = levelToTier(level);
      const dto = {
        name,
        description,
        tier,
        xpPoints: points,
        topicId,
        level: level.toUpperCase(),
      };

      const newModule = await modulesService.createModule(dto);
      setName('');
      setDescription('');
      setLevel('Beginner');
      setPoints(50);
      setIsCreateModalOpen(false);
      await loadModules();
      setSelectedModuleId(newModule.slug);
      showToast('Module created successfully');
    } catch (err: any) {
      console.error('Failed to create module:', err);
      handleApiError(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!selectedModule) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteModule = async () => {
    if (!selectedModule) return;
    try {
      if (isDirtyRef.current) { await flushChanges(); }
      const remaining = modules.filter((m) => m.id !== selectedModule.id);
      await modulesService.deleteModule(selectedModule.dbId);
      await loadModules();
      setSelectedModuleId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err: any) {
      console.error('Failed to delete module:', err);
      handleApiError(err);
    }
  };

  const handleReorder = async (direction: 'up' | 'down') => {
    if (!selectedModule) return;
    if (isDirtyRef.current) { await flushChanges(); }

    const modulesCopy = [...modules];
    const index = modulesCopy.findIndex((m) => m.id === selectedModule.id);
    if (index === -1) return;

    const levelVal = modulesCopy[index].level;
    const sameLevelIndices = modulesCopy
      .map((m, idx) => (m.level === levelVal ? idx : -1))
      .filter((idx) => idx !== -1);
    const positionInLevel = sameLevelIndices.indexOf(index);
    let targetIndex = -1;

    if (direction === 'up' && positionInLevel > 0) {
      targetIndex = sameLevelIndices[positionInLevel - 1];
    } else if (direction === 'down' && positionInLevel < sameLevelIndices.length - 1) {
      targetIndex = sameLevelIndices[positionInLevel + 1];
    }
    if (targetIndex === -1) return;

    const temp = modulesCopy[index];
    modulesCopy[index] = modulesCopy[targetIndex];
    modulesCopy[targetIndex] = temp;
    setModules(modulesCopy);

    try {
      const ids = modulesCopy.map((m) => m.dbId);
      await modulesService.reorderModules(ids);
      await loadModules();
    } catch (err: any) {
      console.error('Failed to reorder modules:', err);
      handleApiError(err);
      await loadModules();
    }
  };

  const currentTierModules = selectedModule ? modules.filter((m) => m.level === selectedModule.level) : [];
  const tierIndex = selectedModule ? currentTierModules.findIndex((m) => m.id === selectedModule.id) : -1;
  const isFirstInTier = tierIndex === 0;
  const isLastInTier = tierIndex === currentTierModules.length - 1;

  const backgroundGradient = 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 20%, #ffffff 40%, #e0f2fe 100%)';

  if (error) {
    return (
      <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-xl w-full bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-bounce">
            <Icons.AlertTriangle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white font-heading">CMS Runtime Contract Mismatch</h2>
            <p className="text-xs text-rose-450 leading-relaxed max-w-md mx-auto">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="bg-rose-600 hover:bg-rose-550 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all font-heading">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading && modules.length === 0) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">Loading Builder Canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">

      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 select-none">
        <div className="flex items-center gap-4 h-full text-xs font-bold">
          <Link href="/core/topics" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors">
            <Icons.ArrowLeft className="w-4 h-4" />
            Back to Topics
          </Link>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-[#00cba9] hover:bg-[#00bda0] text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 font-heading">
            <Icons.Plus className="w-4 h-4 stroke-[3]" />
            Create Module
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden p-6 gap-6">

        <div className="w-[72%] bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xs h-full flex flex-col">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <span className="text-[9px] font-black tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-lg font-heading">LIVE PREVIEW CANVAS</span>
            <span className="text-[10px] text-slate-400 font-bold">{modules.length} Modules Registered</span>
          </div>

          <div ref={centerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50 rounded-b-[32px]">
            <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${fitScale})`, width: CANVAS_WIDTH, height: canvasHeight, background: backgroundGradient }}>
              <SkyBackground />
              <div className="relative w-full z-10" style={{ height: totalHeight }}>
                <RoadmapPath nodes={pathNodes} width={CANVAS_WIDTH} />

                <div className="absolute left-[30px] top-[40px] z-20 pointer-events-none">
                  <div className="w-[220px] border rounded-[22px] bg-white/95 border-slate-200 shadow-sm text-slate-800 p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-heading">LEVEL 1</span>
                    <h3 className="text-xs font-black tracking-tight mt-0.5 font-heading text-slate-900">Beginner Track</h3>
                    <p className="text-[9px] font-bold text-slate-455 mt-0.5">{beginnerList.length} Modules Registered</p>
                    <p className="text-[10px] leading-snug mt-1.5 font-medium text-slate-500">Foundations of cloud computing and initial AWS core services.</p>
                  </div>
                </div>

                {coordinates[beginnerList[0]?.id] && (
                  <div className="absolute z-30 flex flex-col items-center pointer-events-none" style={{ left: `calc(${coordinates[beginnerList[0].id].x}% - 60px)`, top: `${coordinates[beginnerList[0].id].y - 80}px` }}>
                    <div className="bg-[#0dce88] text-slate-955 font-black text-[9px] px-3 py-1 rounded-full border border-white tracking-widest shadow-md flex items-center gap-1 font-heading">START HERE</div>
                    <div className="w-0.5 h-8 bg-rose-500 relative">
                      <div className="absolute top-0 right-0 w-2.5 h-2 bg-rose-500 rounded-sm" />
                    </div>
                  </div>
                )}

                <div className="absolute left-[30px] z-20 pointer-events-none" style={{ top: `${intermediateStartY - 110}px` }}>
                  <div className="w-[220px] border rounded-[22px] bg-white/95 border-slate-200 shadow-sm text-slate-800 p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-heading">LEVEL 2</span>
                    <h3 className="text-xs font-black tracking-tight mt-0.5 font-heading text-slate-900">Intermediate Track</h3>
                    <p className="text-[9px] font-bold text-slate-455 mt-0.5">{intermediateList.length} Modules Registered</p>
                    <p className="text-[10px] leading-snug mt-1.5 font-medium text-slate-500">Complex databases, auto-scaling clusters, and core IAM security schemas.</p>
                  </div>
                </div>

                <div className="absolute left-[30px] z-20 pointer-events-none" style={{ top: `${advancedStartY - 120}px` }}>
                  <div className="w-[220px] border rounded-[22px] bg-white/95 border-slate-200 shadow-sm text-slate-800 p-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-heading">LEVEL 3</span>
                    <h3 className="text-xs font-black tracking-tight mt-0.5 font-heading text-slate-900">Advanced Track</h3>
                    <p className="text-[9px] font-bold text-slate-455 mt-0.5">{advancedList.length} Modules Registered</p>
                    <p className="text-[10px] leading-snug mt-1.5 font-medium text-slate-500">Distributed architectures, ECS container clusters, and analytics engines.</p>
                  </div>
                </div>

                {coordinates['summit_beginner'] && <BeginnerSummitLandmark x={coordinates['summit_beginner'].x} y={coordinates['summit_beginner'].y} locked={false} />}
                {coordinates['summit_intermediate'] && <IntermediateSummitLandmark x={coordinates['summit_intermediate'].x} y={coordinates['summit_intermediate'].y} locked={false} />}
                {coordinates['summit_advanced'] && <CloudArchitectSummitLandmark x={coordinates['summit_advanced'].x} y={coordinates['summit_advanced'].y} locked={false} />}

                <IntermediateCloudsOverlay locked={false} top={intermediateStartY} height={intermediateHeight} />
                <AdvancedCloudsOverlay locked={false} top={advancedStartY} height={advancedHeight} />

                {modules.map((module, idx) => {
                  const coord = coordinates[module.id];
                  if (!coord) return null;
                  return (
                    <CloudIslandNode
                      key={module.id}
                      id={module.id}
                      name={module.name}
                      points={module.points}
                      status={selectedModuleId === module.id ? 'current' : 'completed'}
                      iconName={module.iconName || 'Boxes'}
                      x={coord.x}
                      y={coord.y}
                      index={idx}
                      level={module.level}
                      levelIndex={idx}
                      onClick={() => selectModule(module.id)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-[28%] bg-white border border-slate-200 rounded-[32px] shadow-xs h-full flex flex-col overflow-hidden">
          {selectedModule ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between flex-shrink-0 bg-slate-50/50">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <Icons.Settings className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <h3 className="text-xs font-black text-slate-800 tracking-tight font-heading uppercase flex-shrink-0">Module Settings</h3>
                    {saveStatus === 'saving' && <span className="text-[10px] text-indigo-500 font-bold animate-pulse font-heading lowercase tracking-normal flex-shrink-0">(saving...)</span>}
                    {saveStatus === 'saved' && <span className="text-[10px] text-emerald-600 font-bold font-heading lowercase tracking-normal flex-shrink-0">(saved)</span>}
                    {saveStatus === 'failed' && <span className="text-[10px] text-rose-500 font-bold font-heading lowercase tracking-normal flex-shrink-0">(failed to save)</span>}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 font-heading uppercase tracking-wider mt-0.5">{selectedModule.level}</span>
                </div>
                <span className="text-lg font-black text-slate-800 font-heading flex-shrink-0">{selectedModule.orderIndex != null ? String(selectedModule.orderIndex + 1).padStart(2, '0') : '--'}</span>
                <span className="text-[9px] font-black font-heading text-slate-555 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex-shrink-0 self-center">{selectedModule.id.slice(0, 5).toUpperCase()}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold text-slate-655">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-550 text-[10px] uppercase tracking-wider">Module Name</label>
                  <input type="text" value={editName} onChange={(e) => handleFieldChange('name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-550 text-[10px] uppercase tracking-wider">Description</label>
                  <textarea rows={3} value={editDescription} onChange={(e) => handleFieldChange('description', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed" />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-550 text-[10px] uppercase tracking-wider">XP Points</label>
                    <input type="number" min={10} max={500} value={editPoints} onChange={(e) => handleFieldChange('points', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div className="flex items-end">
                    <Link href={`/core/module/${selectedModule.id}/content?topicId=${topicId}`} className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-black text-slate-700 py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-xs">
                      <Icons.FileEdit className="w-3.5 h-3.5 text-cyan-600" /> Edit Content
                    </Link>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-555 text-[10px] uppercase tracking-wider">Curriculum Tier</label>
                  <div className="relative">
                    <select value={editLevel} onChange={(e) => handleFieldChange('level', e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none font-bold">
                      <option value="Beginner">Beginner Level</option>
                      <option value="Intermediate">Intermediate Level</option>
                      <option value="Advanced">Advanced Level</option>
                    </select>
                    <Icons.ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <label className="font-extrabold text-slate-555 text-[10px] uppercase tracking-wider block">Path Order Control</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleReorder('up')} disabled={isFirstInTier} className={cn("py-2 rounded-xl border font-bold flex items-center justify-center gap-1 transition-all text-[11px]", isFirstInTier ? "bg-slate-50 border-slate-200/50 text-slate-400 cursor-not-allowed" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-xs")}>
                      <Icons.ArrowUp className="w-3.5 h-3.5" /> Move Up
                    </button>
                    <button onClick={() => handleReorder('down')} disabled={isLastInTier} className={cn("py-2 rounded-xl border font-bold flex items-center justify-center gap-1 transition-all text-[11px]", isLastInTier ? "bg-slate-50 border-slate-200/50 text-slate-400 cursor-not-allowed" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 shadow-xs")}>
                      <Icons.ArrowDown className="w-3.5 h-3.5" /> Move Down
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleDeleteModule} className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-[11px] font-black text-rose-600 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs">
                      <Icons.Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <Icons.Map className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">No Module Selected</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">Select a module from the canvas preview to configure settings.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-slate-800">
              <button onClick={() => !isCreating && setIsCreateModalOpen(false)} disabled={isCreating} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50">
                <Icons.X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-black text-slate-900 font-heading tracking-tight mb-1">Create Module</h3>
              <p className="text-[10px] text-slate-550 mb-5 leading-normal">Create a new module for this topic. A roadmap island will be generated automatically.</p>
              <form onSubmit={handleCreateModule} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 block">Module Name</label>
                  <input type="text" required placeholder="e.g. Amazon CloudFront CDN" value={name} onChange={(e) => setName(e.target.value)} disabled={isCreating} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50" />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-550 block">Description</label>
                  <textarea required rows={2} placeholder="Provide module objectives overview..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isCreating} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed disabled:opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-550 block">Curriculum Level</label>
                    <div className="relative">
                      <select value={level} onChange={(e: any) => setLevel(e.target.value)} disabled={isCreating} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none font-bold disabled:opacity-50">
                        <option value="Beginner">Beginner Level</option>
                        <option value="Intermediate">Intermediate Level</option>
                        <option value="Advanced">Advanced Level</option>
                      </select>
                      <Icons.ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-550 block">XP Reward Points</label>
                  <input type="number" required min={10} max={500} value={points} onChange={(e) => setPoints(Number(e.target.value))} disabled={isCreating} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50" />
                </div>
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 mt-5">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating} className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isCreating} className="bg-[#00cba9] hover:bg-[#00bda0] text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                    {isCreating ? (
                      <>
                        <Icons.Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Module'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Module"
        entityName={selectedModule?.name || ''}
        message="All slides and quiz questions inside this module will also be deleted."
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteModule}
      />
    </div>
  );
}
