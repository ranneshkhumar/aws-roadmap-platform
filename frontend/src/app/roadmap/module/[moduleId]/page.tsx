'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ROADMAP_MODULES } from '@/constants/roadmapData';
import { useRoadmapStore } from '@/store/roadmapStore';
import { cn } from '@/lib/utils';

interface Confetti {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const router = useRouter();
  
  // Unwrap Next.js dynamic params
  const { moduleId } = use(params);
  
  // Zustand global states
  const { moduleStates, completeModule } = useRoadmapStore();
  
  // Find module details
  const moduleData = ROADMAP_MODULES.find((m) => m.id === moduleId);
  
  // Page states
  const [step, setStep] = useState<'reading' | 'quiz' | 'success'>('reading');
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'checking' | 'correct' | 'incorrect'>('idle');
  const [shake, setShake] = useState(false);

  // Confetti Canvas variables
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const particles = useRef<Confetti[]>([]);

  useEffect(() => {
    // Redirect if module not found
    if (!moduleData) {
      router.push('/');
    }
  }, [moduleData, router]);

  // Canvas Confetti Loop
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
    const list: Confetti[] = [];
    for (let i = 0; i < 120; i++) {
      list.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 80,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 18 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }
    particles.current = list;

    let frameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.36;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.008;

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
          ctx.restore();
        }
      });

      if (active) {
        frameId = requestAnimationFrame(render);
      } else {
        setShowConfetti(false);
      }
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [showConfetti]);

  if (!moduleData) return null;

  const handleNextSlide = () => {
    if (slideIndex + 1 < moduleData.learningContent.length) {
      setSlideIndex(prev => prev + 1);
    } else {
      // Mark as read, unlocks the Quiz
      setStep('quiz');
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
    }
  };

  const handleVerifyAnswer = () => {
    if (selectedOption === null) return;

    setQuizState('checking');
    setTimeout(() => {
      if (selectedOption === moduleData.quiz.answerIndex) {
        setQuizState('correct');
        setShowConfetti(true);
        completeModule(moduleData.id, moduleData.points);
        setStep('success');
      } else {
        setQuizState('incorrect');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#FFF8E7] via-[#E6F7ED] to-[#E2FBF9] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background visual clouds */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Confetti canvas overlay */}
      {showConfetti && (
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />
      )}

      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-lg border border-white/60 rounded-[32px] shadow-xl p-6 md:p-8 flex flex-col min-h-[500px] relative z-10">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 mb-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 hover:bg-slate-200/50 rounded-full text-slate-700 transition-colors flex items-center justify-center"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-405 tracking-wider">
                {moduleData.level} Path
              </span>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {moduleData.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Icons.Zap className="w-3.5 h-3.5 fill-current" />
              +{moduleData.points} XP
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Icons.Clock className="w-3.5 h-3.5" />
              {moduleData.estimatedTime}
            </span>
          </div>
        </div>

        {/* INTERACTIVE FLOW CONTENT VIEWPORTS */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: READING CONTENT SLIDES */}
            {step === 'reading' && (
              <motion.div
                key="reading-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex flex-col flex-1"
              >
                {/* Slide content plate */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-950 tracking-tight">
                      {moduleData.learningContent[slideIndex].title}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Page {slideIndex + 1} of {moduleData.learningContent.length}
                    </span>
                  </div>

                  <div className="bg-white/80 border border-slate-150 rounded-2xl p-5 space-y-4 min-h-[180px] shadow-sm flex flex-col justify-center">
                    {moduleData.learningContent[slideIndex].content.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-3.5">
                        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Icons.CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Indicators (Pips) */}
                <div className="flex justify-center gap-1.5 py-2">
                  {moduleData.learningContent.map((_, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === slideIndex ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
                      )}
                    />
                  ))}
                </div>

                {/* Slide Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <button
                    disabled={slideIndex === 0}
                    onClick={handlePrevSlide}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
                  >
                    Previous Page
                  </button>
                  
                  <button
                    onClick={handleNextSlide}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/15 transition-all active:scale-[0.98]"
                  >
                    {slideIndex + 1 === moduleData.learningContent.length ? 'Mark As Read' : 'Next Page'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: QUIZ COMPONENT */}
            {step === 'quiz' && (
              <motion.div
                key="quiz-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn("space-y-5 flex flex-col flex-1", shake && "animate-[shake_0.5s_ease-in-out]")}
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Icons.ShieldQuestion className="w-4 h-4 text-blue-500" />
                      Architecture Validation
                    </h3>
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      Quiz Unlocked
                    </span>
                  </div>

                  <div className="bg-white/80 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-sm">
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">
                      {moduleData.quiz.question}
                    </p>

                    <div className="space-y-2.5">
                      {moduleData.quiz.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const showFeedback = quizState === 'correct' || quizState === 'incorrect';
                        const isCorrect = idx === moduleData.quiz.answerIndex;
                        
                        let cardStyle = "border-slate-250 bg-slate-50 hover:bg-slate-100 hover:border-slate-350";
                        if (isSelected) {
                          cardStyle = "border-blue-500 bg-blue-500/5 text-blue-900 ring-1 ring-blue-500/25";
                        }
                        if (showFeedback && isSelected) {
                          if (isCorrect) {
                            cardStyle = "border-emerald-500 bg-emerald-500/5 text-emerald-900 ring-1 ring-emerald-500/25";
                          } else {
                            cardStyle = "border-rose-500 bg-rose-500/5 text-rose-900 ring-1 ring-rose-500/25";
                          }
                        } else if (showFeedback && isCorrect && quizState === 'incorrect') {
                          cardStyle = "border-emerald-500/40 bg-emerald-500/2";
                        }

                        return (
                          <button
                            key={idx}
                            disabled={quizState === 'checking'}
                            onClick={() => {
                              setSelectedOption(idx);
                              setQuizState('idle');
                            }}
                            className={cn(
                              "w-full text-left p-3.5 rounded-xl border text-xs font-semibold leading-snug transition-all flex items-start gap-3",
                              cardStyle,
                              quizState !== 'checking' && "cursor-pointer active:scale-[0.99]"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-black",
                              isSelected 
                                ? (showFeedback ? (isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "bg-rose-500 border-rose-400 text-white") : "bg-blue-600 border-blue-500 text-white")
                                : "border-slate-300 bg-white text-slate-500"
                            )}>
                              {showFeedback && isSelected ? (
                                isCorrect ? <Icons.Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icons.X className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                String.fromCharCode(65 + idx)
                              )}
                            </div>
                            <span className="text-slate-700">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quiz Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setStep('reading')}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-2.5 px-5 rounded-xl text-xs transition-all active:scale-[0.98]"
                  >
                    Back to Reading
                  </button>

                  <button
                    onClick={handleVerifyAnswer}
                    disabled={selectedOption === null || quizState === 'checking'}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-blue-600/15 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {quizState === 'checking' ? (
                      <>
                        <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Verify Solution'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS BLOCK */}
            {step === 'success' && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center py-6 flex flex-col items-center justify-center flex-1"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 pointer-events-none animate-pulse" />
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center relative z-10">
                    <Icons.Award className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 p-1 rounded-full shadow-md z-20">
                    <Icons.Check className="w-4 h-4 text-emerald-500 stroke-[3.5]" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Mission Complete Explorer!
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    You have successfully analyzed the parameters of the architecture. **+{moduleData.points} XP** has been credited to your explorer rank.
                  </p>
                </div>

                {/* Explanation review box */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 text-xs font-semibold rounded-2xl p-4 text-left leading-relaxed w-full">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 mb-1">
                    <Icons.ShieldAlert className="w-3.5 h-3.5" />
                    Rationale approved
                  </div>
                  {moduleData.quiz.explanation}
                </div>

                <Link 
                  href="/"
                  className="w-full max-w-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                  <Icons.MapPin className="w-4 h-4" />
                  Back to Journey Map
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
