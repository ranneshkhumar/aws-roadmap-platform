'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { QuizReviewData } from '@/store/roadmapStore';
import { cn } from '@/lib/utils';

interface QuizReviewProps {
  review: QuizReviewData | undefined;
  onReturn: () => void;
}

export const QuizReview: React.FC<QuizReviewProps> = ({ review, onReturn }) => {
  if (!review) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 flex flex-col flex-1"
    >
      {/* Score Summary HUD */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-heading">
            Score
          </span>
          <span className="text-lg font-black text-slate-900 leading-none mt-1">
            {review.score} / {review.totalQuestions}
          </span>
        </div>
        <div className="flex flex-col border-x border-slate-200">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-heading">
            Percentage
          </span>
          <span className="text-lg font-black text-emerald-600 leading-none mt-1">
            {review.percentage}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-heading">
            XP Earned
          </span>
          <span className="text-lg font-black text-amber-500 leading-none mt-1">
            +{review.xpEarned} XP
          </span>
        </div>
      </div>

      {/* Detailed Scrollable Questions Review */}
      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Detailed Review
        </h4>
        
        {review.answers.map((answer, index) => {
          const isCorrect = answer.userAnswerIndex === answer.correctAnswerIndex;
          return (
            <div key={index} className={cn(
              "border rounded-2xl p-4 space-y-2 text-xs",
              isCorrect ? "bg-emerald-50/20 border-emerald-200/50" : "bg-rose-50/20 border-rose-200/50"
            )}>
              <p className="font-bold text-slate-900 leading-relaxed">
                {index + 1}. {answer.question}
              </p>
              
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-slate-450">Your Answer:</span>
                  <span className={isCorrect ? "text-emerald-700" : "text-rose-700"}>
                    {answer.options[answer.userAnswerIndex]}
                  </span>
                  {!isCorrect && (
                    <Icons.XCircle className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  {isCorrect && (
                    <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                  )}
                </div>
                
                {!isCorrect && (
                  <div className="flex items-center gap-1.5 font-semibold text-slate-650">
                    <span className="text-slate-450">Correct Answer:</span>
                    <span className="text-emerald-700">
                      {answer.options[answer.correctAnswerIndex]}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500 leading-relaxed font-medium">
                <span className="font-extrabold text-slate-700 block mb-0.5">Rationale:</span>
                {answer.explanation}
              </div>
            </div>
          );
        })}
      </div>

      {/* Return Journey Button */}
      <div className="pt-2 border-t border-slate-100 flex justify-center">
        <button 
          onClick={onReturn}
          className="w-full max-w-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 font-heading"
        >
          <Icons.Map className="w-4 h-4 text-emerald-450 fill-current" />
          Return to Journey Map
        </button>
      </div>
    </motion.div>
  );
};
