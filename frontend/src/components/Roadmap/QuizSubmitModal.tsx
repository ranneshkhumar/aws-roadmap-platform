'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface QuizSubmitModalProps {
  isOpen: boolean;
  answeredCount: number;
  totalQuestions: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function QuizSubmitModal({
  isOpen,
  answeredCount,
  totalQuestions,
  isSubmitting,
  onClose,
  onSubmit,
}: QuizSubmitModalProps) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-slate-800"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <Icons.X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <Icons.Send className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 font-heading tracking-tight">
              Submit Quiz
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">Review your answers before submitting</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs font-semibold text-slate-600 space-y-2">
          <div className="flex items-center justify-between">
            <span>Answered</span>
            <span className="text-blue-600 font-bold">{answeredCount} / {totalQuestions}</span>
          </div>
          {unansweredCount > 0 && (
            <div className="flex items-center justify-between">
              <span>Unanswered</span>
              <span className="text-amber-600 font-bold">{unansweredCount}</span>
            </div>
          )}
        </div>

        <p className="text-xs font-bold text-slate-500 mb-5">
          Your score will be calculated immediately after submission.
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            Review Answers
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-5 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
