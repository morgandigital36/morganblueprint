'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderIcon, TrashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'motion/react';

interface BlueprintHistory {
  id: string;
  timestamp: number;
  formData: any;
  workflowDoc: string;
  uiUxDoc: string;
  coreFeaturesDoc: string;
  aiInstructionsDoc: string;
}

function loadHistory(): BlueprintHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('blueprint_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function MyProjects() {
  const [history, setHistory] = useState<BlueprintHistory[]>(loadHistory);

  const handleDelete = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('blueprint_history', JSON.stringify(newHistory));
  };

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl mx-auto space-y-8 glass-dark rounded-3xl p-6 h-full flex flex-col"
    >
      <div className="flex items-center space-x-3 mb-4 flex-shrink-0">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <FolderIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">My Projects</h1>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-16 space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <FolderIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada proyek blueprint yang disimpan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {history.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)] bg-black/40 backdrop-blur-md group hover:border-indigo-500/50 transition-colors">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-white font-bold">{project.formData?.name || 'Untitled Project'}</CardTitle>
                        <p className="text-sm text-indigo-300 font-mono mt-1">
                          {new Date(project.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {project.formData?.description || 'No description provided.'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4 border-t border-slate-800 pt-4">
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 bg-indigo-950/50 text-indigo-300 text-xs rounded-md border border-indigo-500/30">
                            {project.formData?.framework || 'Unknown framework'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(project.id)}
                              className="text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg shrink-0"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                            {/* Note: The ability to actually OPEN this project again in AIBuilder requires passing state. For now just visual. */}
                            <Button variant="outline" className="text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 hover:text-white gap-2">
                              Load
                              <ArrowRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
