'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const stats = [
    { label: 'Cloud Architecture Score', value: '94%', icon: Icons.Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Provisioned Services', value: '18 Active', icon: Icons.Box, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Monthly Cost Estimator', value: '$142.80', icon: Icons.DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'VPC Subnets Peered', value: '4 Region Grid', icon: Icons.Network, color: 'text-sky-400', bg: 'bg-sky-500/10' }
  ];

  const recentAlerts = [
    { title: 'S3 security review required', time: '10 mins ago', desc: 'Verify IAM cross-account access rules.', type: 'warning' },
    { title: 'Auto Scaling Triggered', time: '2 hours ago', desc: 'EC2 count expanded horizontally to absorb mock request spikes.', type: 'info' },
    { title: 'KMS Key Rotated Successfully', time: 'Yesterday', desc: 'Primary master key rotated securely.', type: 'success' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, Commander ☁️
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
              Your AWS Cloud architectures are operating within nominal parameters. Review your journey map to advance toward becoming a Solution Architect.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5">
              <Icons.Sliders className="w-3.5 h-3.5" />
              Configure Hub
            </button>
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-1.5">
              <Icons.ShieldCheck className="w-3.5 h-3.5" />
              Security Audit
            </button>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex items-center gap-4"
            >
              <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <StatIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">{stat.label}</span>
                <span className="text-xl font-bold text-white tracking-tight">{stat.value}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Mock Charts */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Cloud API Operations Traffic</h3>
              <p className="text-xs text-slate-500">Real-time network traffic volume across VPC endpoints</p>
            </div>
            <select className="bg-slate-850 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last Month</option>
            </select>
          </div>

          {/* SVG Line Chart */}
          <div className="h-48 w-full relative pt-4 flex items-end">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
              <div className="border-b border-white w-full" />
              <div className="border-b border-white w-full" />
              <div className="border-b border-white w-full" />
              <div className="border-b border-white w-full" />
            </div>

            {/* SVG Plot */}
            <svg className="w-full h-full text-blue-500" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Area path */}
              <path
                d="M0 200 C50 160, 100 170, 150 110 C200 50, 250 80, 300 40 C350 20, 400 90, 450 70 C500 50, 550 120, 600 80 L600 200 Z"
                fill="url(#chart-glow)"
              />
              {/* Line path */}
              <path
                d="M0 200 C50 160, 100 170, 150 110 C200 50, 250 80, 300 40 C350 20, 400 90, 450 70 C500 50, 550 120, 600 80"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Active Nodes */}
              <circle cx="300" cy="40" r="6" fill="#60A5FA" stroke="#0F172A" strokeWidth="2" className="animate-pulse" />
              <circle cx="450" cy="70" r="4" fill="#3B82F6" stroke="#0F172A" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span>04:00 PM</span>
            <span>08:00 PM</span>
            <span>12:00 AM</span>
          </div>
        </div>

        {/* Right Side: Security Center */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Icons.ShieldAlert className="w-4 h-4 text-amber-500" />
            AWS Security Center
          </h3>

          <div className="space-y-3">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex gap-3">
                <div className="mt-0.5">
                  {alert.type === 'warning' && <Icons.AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
                  {alert.type === 'info' && <Icons.Info className="w-4.5 h-4.5 text-sky-400" />}
                  {alert.type === 'success' && <Icons.CheckCircle className="w-4.5 h-4.5 text-emerald-400" />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-200">{alert.title}</span>
                    <span className="text-[9px] text-slate-500">{alert.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5">
            <Icons.Shield className="w-4 h-4" />
            Launch IAM Security Analyzer
          </button>
        </div>
      </div>
    </div>
  );
};
