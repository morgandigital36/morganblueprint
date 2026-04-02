'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import AIBuilder from '@/components/ai-builder';
import { Settings } from '@/components/settings';
import { MyProjects } from '@/components/my-projects';
import { AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('new-blueprint');
  const [projectToLoad, setProjectToLoad] = useState<any>(null);

  return (
    <div className="flex h-screen w-full bg-[#050510] text-slate-200 overflow-hidden font-sans">
      <Sidebar activeId={activeTab} onNavigate={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative w-full h-full p-6 lg:p-8 overflow-y-auto">
        
        {/* Subtle Cyber Gradient Background inside the main panel */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050510] to-[#050510] pointer-events-none" />

        {/* Existing Application Feature */}
        <div className="relative z-10 w-full h-full">
           <AnimatePresence mode="wait">
             {activeTab === 'new-blueprint' && <AIBuilder key="builder" projectToLoad={projectToLoad} setProjectToLoad={setProjectToLoad} />}
             {activeTab === 'projects' && <MyProjects key="projects" onSelectProject={(project) => { setProjectToLoad(project); setActiveTab('new-blueprint'); }} />}
             {activeTab === 'settings' && <Settings key="settings" />}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
