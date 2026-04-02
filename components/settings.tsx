'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Cog6ToothIcon, CheckCircleIcon, XCircleIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export function Settings() {
  const [apiProvider, setApiProvider] = useState<'openrouter' | 'gemini'>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [isSaved, setIsSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const savedProvider = localStorage.getItem('api_provider') as any || 'openrouter';
    const savedKey = localStorage.getItem('openrouter_apikey') || '';
    const savedModel = localStorage.getItem('openrouter_model') || 'minimax/minimax-m2.7';
    const savedGeminiKey = localStorage.getItem('gemini_apikey') || '';
    const savedGeminiModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';

    setApiProvider(savedProvider);
    setApiKey(savedKey);
    setModel(savedModel);
    setGeminiKey(savedGeminiKey);
    setGeminiModel(savedGeminiModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem('api_provider', apiProvider);
    localStorage.setItem('openrouter_apikey', apiKey);
    localStorage.setItem('openrouter_model', model);
    localStorage.setItem('gemini_apikey', geminiKey);
    localStorage.setItem('gemini_model', geminiModel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestMessage('');
    
    try {
      if (apiProvider === 'openrouter') {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Say 'OK' if you receive this." }]
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.choices?.[0]?.message) {
          setTestResult('success');
          setTestMessage('OpenRouter Connection Success!');
        } else {
          setTestResult('error');
          setTestMessage(data.error?.message || 'Failed to connect to OpenRouter.');
        }
      } else {
        // Test Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Say 'OK' if you receive this." }] }]
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          setTestResult('success');
          setTestMessage('Gemini Connection Success!');
        } else {
          setTestResult('error');
          setTestMessage(data.error?.message || 'Failed to connect to Gemini.');
        }
      }
    } catch (err: any) {
      setTestResult('error');
      setTestMessage(err.message || 'Network error.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl mx-auto space-y-8 glass-dark rounded-3xl p-6"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <Cog6ToothIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
      </div>

      <Card className="border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.15)] bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">API Configuration</CardTitle>
          <CardDescription className="text-slate-400">
            Atur kunci API dan Provider Model yang digunakan untuk menjalankan Blueprint Generator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex p-1 bg-black/50 rounded-xl border border-slate-800 mb-6 sticky top-0 z-10 backdrop-blur-md">
             <button 
               onClick={() => setApiProvider('openrouter')}
               className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${apiProvider === 'openrouter' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
             >
               OpenRouter
             </button>
             <button 
               onClick={() => setApiProvider('gemini')}
               className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${apiProvider === 'gemini' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
             >
               Google Gemini (Free)
             </button>
          </div>

          <AnimatePresence mode="wait">
            {apiProvider === 'openrouter' ? (
              <motion.div 
                key="openrouter"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">OpenRouter API Key</label>
                  <Input 
                    type="password"
                    placeholder="sk-or-v1-..." 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-black/30 border-slate-700 text-white focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">OpenRouter Model</label>
                  <Input 
                    type="text"
                    placeholder="e.g. minimax/minimax-m2.7" 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-black/30 border-slate-700 text-white focus-visible:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500">Suggested: minimax/minimax-m2.7, google/gemini-2.0-flash-exp:free (if supported by OpenRouter)</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="gemini"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Gemini API Key</label>
                  <Input 
                    type="password"
                    placeholder="Enter your Gemini API key" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="bg-black/30 border-slate-700 text-white focus-visible:ring-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.1)]"
                  />
                  <p className="text-[10px] text-slate-500">Get it from Google AI Studio (Free Tier available)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Gemini Model</label>
                  <Input 
                    type="text"
                    placeholder="e.g. gemini-1.5-flash" 
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="bg-black/30 border-slate-700 text-white focus-visible:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500">Free Tier (15 RPM) models: gemini-1.5-flash, gemini-2.0-flash-exp.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {testResult === 'success' && (
            <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/50 flex items-start space-x-3 text-green-400">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{testMessage}</span>
            </div>
          )}

          {testResult === 'error' && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/50 flex items-start space-x-3 text-red-400">
              <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{testMessage}</span>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
          <Button 
            variant="outline" 
            onClick={testConnection}
            disabled={testing || (apiProvider === 'openrouter' ? (!apiKey || !model) : (!geminiKey || !geminiModel))}
            className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
          >
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BeakerIcon className="w-4 h-4 mr-2" />}
            Test Connection
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all"
          >
            {isSaved ? 'Saved!' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
