'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  entityName: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  entityName,
  message,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // Error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          disabled={submitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <Icons.X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
            <Icons.Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 font-heading tracking-tight">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">{entityName}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs font-semibold text-slate-600 space-y-1.5">
          <p className="text-rose-600 font-bold">This action cannot be undone.</p>
          {message && <p>{message}</p>}
        </div>

        <p className="text-xs font-bold text-slate-700 mb-5">
          Are you sure you want to continue?
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black px-5 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
