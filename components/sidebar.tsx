"use client";

import React from 'react';
import {
  SparklesIcon,
  FolderIcon,
  Cog6ToothIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'New Blueprint', icon: SparklesIcon, id: 'new-blueprint' },
  { name: 'My Projects', icon: FolderIcon, id: 'projects' },
];

const bottomItems = [
  { name: 'Settings', icon: Cog6ToothIcon, id: 'settings' },
];

interface SidebarProps {
  className?: string;
  activeId?: string;
  onNavigate?: (id: string) => void;
}

export function Sidebar({ className, activeId = 'new-blueprint', onNavigate }: SidebarProps) {


  return (
    <aside className={cn("w-64 h-full flex flex-col bg-[#050510] border-r border-white/5", className)}>
      {/* Brand */}
      <div className="p-6 flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.8)]">
          <CubeTransparentIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-wide">Blueprint AI</span>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "relative group flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300",
                isActive 
                  ? "bg-indigo-950/40 text-blue-100" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>

              {/* Glassmorphism / Glow for active state */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] bg-gradient-to-r from-indigo-500/20 to-transparent pointer-events-none" />
              )}
              {/* Subtle line indicator for active state */}
              {isActive && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)]" />
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="px-4 pb-6 space-y-2">
        <div className="h-px bg-white/5 w-full mb-4"></div>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300",
                activeId === item.id ? "bg-indigo-950/40 text-blue-100" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
