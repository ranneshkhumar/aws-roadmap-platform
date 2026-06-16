'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import type { TopicData, TopicTheme } from '@/services/api';

interface EditTopicModalProps {
  isOpen: boolean;
  topic: TopicData | null;
  onClose: () => void;
  onSubmit: (id: string, name: string, description: string, theme: TopicTheme) => Promise<void>;
}

export default function EditTopicModal({ isOpen, topic, onClose, onSubmit }: EditTopicModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<TopicTheme>('TECH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (topic) {
      setName(topic.name);
      setDescription(topic.description || '');
      setTheme(topic.theme || 'TECH');
    }
  }, [topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(topic.id, name.trim(), description.trim(), theme);
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !topic) return null;

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
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Icons.X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-black text-slate-900 font-heading tracking-tight mb-1">
          Edit Topic
        </h3>
        <p className="text-[10px] text-slate-550 mb-5 leading-normal">
          Rename this topic, update its description, or configure its island template. Module names will update automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="font-extrabold text-slate-500 block">Topic Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-extrabold text-slate-550 block">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
            />
          </div>


          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#00cba9] hover:bg-[#00bda0] text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
