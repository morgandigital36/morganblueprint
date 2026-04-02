'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, CheckCircle2, ArrowRight, Sparkles, Download, FileText, History, Trash2, Zap, Moon, Sun, Layers, Plus, MessageSquare, Send, X, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';

async function fetchFromOpenRouter(userPrompt: string) {
  const apiKey = localStorage.getItem('openrouter_apikey') || "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";
  const modelName = localStorage.getItem('openrouter_model') || "minimax/minimax-m2.7";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "user", content: userPrompt }
      ]
    })
  });
  
  if (!response.ok) {
     const errorBody = await response.text();
     console.error("Open router API error:", errorBody);
     throw new Error("OpenRouter API error");
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function fetchFromGemini(userPrompt: string) {
  const apiKey = localStorage.getItem('gemini_apikey') || "";
  const modelName = localStorage.getItem('gemini_model') || "gemini-1.5-flash";

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }]
    })
  });
  
  if (!response.ok) {
     const errorBody = await response.text();
     console.error("Gemini API error:", errorBody);
     throw new Error("Gemini API error");
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callAI(userPrompt: string) {
  const provider = localStorage.getItem('api_provider') || 'openrouter';
  if (provider === 'gemini') {
    return fetchFromGemini(userPrompt);
  }
  return fetchFromOpenRouter(userPrompt);
}

interface BlueprintHistory {
  id: string;
  timestamp: number;
  formData: any;
  workflowDoc: string;
  uiUxDoc: string;
  coreFeaturesDoc: string;
  aiInstructionsDoc: string;
}

const QUICK_TEMPLATES = [
  {
    name: 'SaaS Dashboard',
    type: 'SaaS',
    description: 'A comprehensive dashboard for managing business metrics, user subscriptions, and data analytics with a focus on clean UI.',
    frameworks: ['Next.js (App Router)'],
    databases: ['Supabase (PostgreSQL)']
  },
  {
    name: 'E-commerce App',
    type: 'E-commerce',
    description: 'Full-featured online store with product catalog, shopping cart, checkout flow, and order management.',
    frameworks: ['Next.js (App Router)'],
    databases: ['PostgreSQL (Prisma/Drizzle)']
  },
  {
    name: 'Social Network',
    type: 'Social Network',
    description: 'Platform for user interaction, profiles, feeds, real-time messaging, and content sharing.',
    frameworks: ['React (Vite)'],
    databases: ['Firebase (Firestore)']
  }
];

const FRAMEWORKS = [
  "Next.js (App Router)",
  "Next.js (Pages Router)",
  "React (Vite)",
  "Remix",
  "Astro",
  "Nuxt (Vue)",
  "SvelteKit",
  "SolidJS / SolidStart",
  "Qwik City",
  "Hono (Frontend)"
];

const DATABASES = [
  "Supabase (PostgreSQL)",
  "Firebase (Firestore)",
  "Neon (Serverless Postgres)",
  "Turso (SQLite/LibSQL)",
  "PostgreSQL (Prisma/Drizzle)",
  "PlanetScale (MySQL)",
  "MongoDB Atlas",
  "PocketBase",
  "Appwrite",
  "Convex",
  "Upstash (Redis/Kafka)",
  "Tidak pakai"
];


const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      let cleanedChart = chart.trim();
      
      // Auto-fix for common AI hallucinations
      // 1. "sitemap" keyword fix
      if (cleanedChart.startsWith('sitemap')) {
        cleanedChart = cleanedChart.replace(/^sitemap\s*/, 'graph TD\n');
      }
      
      // 2. Remove standalone "---" lines that break lexical parsing
      cleanedChart = cleanedChart.split('\n')
        .filter(line => line.trim() !== '---')
        .join('\n');
      
      // 3. Fix "stateDiagram" hallucinations (like [*] being used in graphs)
      if (!cleanedChart.includes('stateDiagram') && cleanedChart.includes('[*]')) {
         cleanedChart = 'stateDiagram-v2\n' + cleanedChart;
      }

      // 4. Fix labels with special characters inside brackets: A[Text & Info (API)] -> A["Text & Info (API)"]
      // This catches [&, (, ), /, -, _, ,]
      cleanedChart = cleanedChart.replace(/\[([^"\]]*[&()]|[^"\]]* [^"\]]*|[^"\]]*\/|[^"\]]*\\)[^"\]]*\]/g, (match) => {
          const content = match.slice(1, -1);
          if (content.startsWith('"') && content.endsWith('"')) return match;
          return `["${content}"]`;
      });
      
      // 5. Fix edge labels (arrows) with quotes that break parsing
      cleanedChart = cleanedChart.replace(/--\s*"([^"]+)"\s*-->/g, '-- $1 -->');
      
      // 6. Fix nested or stray quotes in text labels
      cleanedChart = cleanedChart.replace(/(\[[^\]]*)"([^\]]*\])/g, '$1 $2');

      // 7. Fix common parentheses and brackets issues in other shapes
      cleanedChart = cleanedChart.replace(/\(([^" \)]*[&()\[\]][^" \)]*)\)/g, '("$1")');
      cleanedChart = cleanedChart.replace(/\{([^" \}]+[&()][^" \}]+)\}/g, '{"$1"}');

      import('mermaid').then((mermaidModule) => {
        const mermaid = mermaidModule.default;
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif'
        });
        
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        mermaid.render(id, cleanedChart)
          .then((result) => {
            if (ref.current) {
              ref.current.innerHTML = result.svg;
            }
          })
          .catch(e => {
            console.error('Mermaid render error:', e);
            if (ref.current) {
              ref.current.innerHTML = `<div class="text-red-500 text-[10px] p-2 border border-red-200 rounded bg-red-50/50 break-all">
                Mermaid Error: ${e.message?.substring(0, 50)}...
              </div>`;
            }
          });
      });
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center my-6 overflow-x-auto bg-white p-6 rounded-xl border border-slate-200" />;
};

interface Feature {
  id: string;
  name: string;
  description: string;
}

interface FeatureCategory {
  category: string;
  features: Feature[];
}

export default function AIBuilder({ projectToLoad, setProjectToLoad }: { projectToLoad?: any, setProjectToLoad?: (p: any) => void } = {}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<BlueprintHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Custom Feature Data
  const [customFeatureName, setCustomFeatureName] = useState('');
  const [customFeatureDesc, setCustomFeatureDesc] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    frameworks: [] as string[],
    databases: [] as string[],
  });

  const [manualFramework, setManualFramework] = useState('');
  const [manualDatabase, setManualDatabase] = useState('');


  // Generated Data
  const [suggestedFeatures, setSuggestedFeatures] = useState<FeatureCategory[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [workflowDoc, setWorkflowDoc] = useState('');
  const [uiUxDoc, setUiUxDoc] = useState('');
  const [coreFeaturesDoc, setCoreFeaturesDoc] = useState('');
  const [aiInstructionsDoc, setAiInstructionsDoc] = useState('');
  
  // Chat / Ask AI State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [pendingRevision, setPendingRevision] = useState<string | null>(null);

  const getChatContext = () => {
    switch(step) {
      case 2: return { name: "Suggested Features", content: JSON.stringify(suggestedFeatures), setter: setSuggestedFeatures, format: 'JSON' };
      case 3: return { name: "Workflow", content: workflowDoc, setter: setWorkflowDoc, format: 'Markdown' };
      case 4: return { name: "UI/UX Design", content: uiUxDoc, setter: setUiUxDoc, format: 'Markdown' };
      case 5: return { name: "Core Features", content: coreFeaturesDoc, setter: setCoreFeaturesDoc, format: 'Markdown' };
      case 6: return { name: "AI Instructions", content: aiInstructionsDoc, setter: setAiInstructionsDoc, format: 'Markdown' };
      default: return null;
    }
  };

  // Load history and dark mode from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('blueprint_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedDarkMode = localStorage.getItem('blueprint_dark_mode');
    if (savedDarkMode === 'true') setDarkMode(true);
  }, []);

  // Save history to LocalStorage
  useEffect(() => {
    localStorage.setItem('blueprint_history', JSON.stringify(history));
  }, [history]);

  // Save dark mode to LocalStorage
  useEffect(() => {
    localStorage.setItem('blueprint_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Reset chat when step changes
  useEffect(() => {
    setChatMessages([]);
    setPendingRevision(null);
    setChatInput('');
  }, [step]);

  const saveToHistory = (overrides?: Partial<BlueprintHistory>) => {
    const newEntry: BlueprintHistory = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      formData: overrides?.formData || formData,
      workflowDoc: overrides?.workflowDoc || workflowDoc,
      uiUxDoc: overrides?.uiUxDoc || uiUxDoc,
      coreFeaturesDoc: overrides?.coreFeaturesDoc || coreFeaturesDoc,
      aiInstructionsDoc: overrides?.aiInstructionsDoc || aiInstructionsDoc
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 10)); // Keep last 10
  };

  const loadFromHistory = (entry: BlueprintHistory) => {
    setFormData(entry.formData);
    setWorkflowDoc(entry.workflowDoc);
    setUiUxDoc(entry.uiUxDoc);
    setCoreFeaturesDoc(entry.coreFeaturesDoc);
    setAiInstructionsDoc(entry.aiInstructionsDoc);
    setStep(6);
    setShowHistory(false);
  };

  useEffect(() => {
    if (projectToLoad) {
      loadFromHistory(projectToLoad);
      if (setProjectToLoad) setProjectToLoad(null);
    }
  }, [projectToLoad]);

  const deleteHistoryEntry = (id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  };

  const handleAddCustomFeature = () => {
    if (!customFeatureName.trim()) return;
    const newFeature = {
      id: `custom-${Math.random().toString(36).substring(2, 9)}`,
      name: customFeatureName,
      description: customFeatureDesc || 'Fitur tambahan manual'
    };
    
    setSuggestedFeatures(prev => {
      const hasCustomCategory = prev.some(c => c.category === 'Custom Features');
      if (hasCustomCategory) {
        return prev.map(c => c.category === 'Custom Features' ? { ...c, features: [...c.features, newFeature] } : c);
      } else {
        return [...prev, { category: 'Custom Features', features: [newFeature] }];
      }
    });
    setSelectedFeatures(prev => [...prev, newFeature.id]);
    setCustomFeatureName('');
    setCustomFeatureDesc('');
  };

  const applyTemplate = (template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      type: template.type,
      description: template.description,
      frameworks: template.frameworks || [],
      databases: template.databases || [],
    });
    setManualFramework('');
    setManualDatabase('');
  };

  const toggleFramework = (framework: string) => {
    setFormData(prev => ({
      ...prev,
      frameworks: prev.frameworks.includes(framework) ? [] : [framework]
    }));
    setManualFramework('');
  };

  const toggleDatabase = (database: string) => {
    setFormData(prev => ({
      ...prev,
      databases: prev.databases.includes(database) ? [] : [database]
    }));
    setManualDatabase('');
  };

  const getFrameworksText = () => {
    const list = [...formData.frameworks];
    if (manualFramework.trim()) list.push(manualFramework.trim());
    return list.join(', ');
  };

  const getDatabasesText = () => {
    const list = [...formData.databases];
    if (manualDatabase.trim()) list.push(manualDatabase.trim());
    return list.join(', ');
  };


  const handleGenerateFeatures = async () => {
    if (!formData.name || !formData.description || (formData.frameworks.length === 0 && !manualFramework) || (formData.databases.length === 0 && !manualDatabase)) return;
    
    setLoading(true);
    try {
      const frameworkText = getFrameworksText();
      const databaseText = getDatabasesText();
      
      const prompt = `Daftarkan 10-15 fitur wajib dan unik untuk aplikasi bernama "${formData.name}" (Jenis: ${formData.type}) dengan deskripsi: "${formData.description}". Framework yang digunakan adalah ${frameworkText} dan Database ${databaseText}.
      
      Bagi menjadi kategori: "User Auth", "Data Management", "UI/UX", dan "Integration".
      
      Berikan response dalam format JSON dengan struktur:
      [
        {
          "category": "Nama Kategori",
          "features": [
            { "id": "unik-id", "name": "Nama Fitur", "description": "Deskripsi singkat fitur" }
          ]
        }
      ]`;

      const responseText = await callAI(prompt + "\n\nCRITICAL MUST FOLLOW: Return ONLY a valid JSON array matching the requested schema. DO NOT wrap the json in code block symbols like ```json. Start and end exactly with [ and ].");
      let rawText = responseText.trim();
      if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json/g, '').replace(/```$/g, '').trim();
      if (rawText.startsWith('```')) rawText = rawText.replace(/^```/g, '').replace(/```$/g, '').trim();
      
      const data = JSON.parse(rawText || '[]');
      setSuggestedFeatures(data);
      
      const allFeatureIds = data.flatMap((cat: FeatureCategory) => cat.features.map(f => f.id));
      setSelectedFeatures(allFeatureIds);
      
      setStep(2);
    } catch (error) {
      console.error('Error generating features:', error);
      alert('Gagal menghubungi AI. Coba periksa koneksi atau ganti API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    if (selectedFeatures.length === 0) return;
    
    setLoading(true);
    try {
      const selectedFeatureDetails = suggestedFeatures
        .flatMap(cat => cat.features)
        .filter(f => selectedFeatures.includes(f.id))
        .map(f => `- ${f.name}: ${f.description}`)
        .join('\n');

      const prompt = `Saya sedang membangun aplikasi bernama "${formData.name}" (Jenis: ${formData.type}) menggunakan ${getFrameworksText()} dan ${getDatabasesText()}.
      Deskripsi: ${formData.description}
      
      Fitur yang akan diimplementasikan:
      ${selectedFeatureDetails}
      
      Buat dokumen "Workflow" yang komprehensif dalam format Markdown. Dokumen ini WAJIB berisi teks penjelasan naratif yang SANGAT PANJANG (minimal 500 kata), MENDETAIL, dan rapi pada setiap bagian:
      1. User Journey Maps.
      2. Logic Flow.
      3. Sitemap / Navigation Structure.
      
      PENTING: Buat penjelasan teks as long as possible! Selain penjelasan teks, Anda WAJIB menyertakan diagram menggunakan sintaks \`\`\`mermaid ... \`\`\` (misalnya "graph TD" untuk sitemap, atau "flowchart TD", "stateDiagram", "sequenceDiagram") sebagai pelengkap visualisasi. 
      
      ATURAN KRITIS: 
      1. JANGAN PERNAH menggunakan kata "sitemap" sebagai keyword pembuka diagram mermaid. Gunakan "graph TD" atau "flowchart TD" sebagai gantinya.
      2. Jangan gunakan tanda kutip di dalam label panah (edge label). Contoh: -- Klik Simpan --> (Benar), -- Klik "Simpan" --> (SALA).
      3. Jika teks di dalam kotak mengandung tanda kurung atau simbol, bungkus dengan tanda kutip dua. Contoh: A["User (Editor) Login"].
      
      Gunakan bahasa yang profesional dan komprehensif.`;

      const responseText = await callAI(prompt);

      setWorkflowDoc(responseText || '');
      setStep(3);
    } catch (error) {
      console.error('Error generating workflow:', error);
      alert('Gagal menghubungi AI. Coba periksa koneksi atau ganti API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUIUX = async () => {
    setLoading(true);
    try {
      const prompt = `Berdasarkan aplikasi "${formData.name}" (${getFrameworksText()}) dengan workflow berikut:
      
      ${workflowDoc}
      
      Buat dokumen "UI/UX Frontend Design" yang komprehensif dalam format Markdown. Dokumen ini WAJIB dipenuhi teks penjelasan spesifik dan SANGAT PANJANG (minimal 500 kata):
      1. Design System (Color palette, Typography, Spacing, dan Vibe/Mood). JELASKAN filosofi setiap elemen warna dan font dengan paragraf yang sangat mendetail.
      2. Component Architecture (Daftar komponen UI yang dapat digunakan kembali). URAIKAN fungsionalitas setiap komponen secara tertulis dalam bentuk deskriptif yang ekstensif.
      3. Wireframe/Layout Structure (Deskripsi tata letak untuk halaman-halaman utama). JABARKAN posisi dan interaksi elemen secara naratif sejelas-jelasnya dengan bahasa yang kaya.
      
      Gunakan referensi "Design Recipes" berikut untuk mood:
      - Jika aplikasi teknis/data: Gunakan Recipe 1 (Technical Dashboard).
      - Jika aplikasi kreatif/editorial: Gunakan Recipe 2 (Editorial Hero).
      - Jika aplikasi hardware/audio: Gunakan Recipe 3 (Hardware Tool).
      - Jika aplikasi luxury/travel: Gunakan Recipe 4 (Dark Luxury).
      - Jika aplikasi modern SaaS: Gunakan Recipe 11 (SaaS Split Layout).
      
      PENTING: Selain penjelasan teks yang panjang lebar dan rapi, TETAP sertakan diagram struktur komponen menggunakan sintaks \`\`\`mermaid ... \`\`\`. Visualisasi wajib digabung dengan narasi berbobot tinggi. Gunakan sintaks Mermaid yang aman (pakai tanda kutip untuk label node yang kompleks, hindari tanda kutip di label panah).
      
      Gunakan bahasa teknis yang rapi dan deskriptif.`;

      const responseText = await callAI(prompt);

      setUiUxDoc(responseText || '');
      setStep(4);
    } catch (error) {
      console.error('Error generating UI/UX:', error);
      alert('Gagal menghubungi AI. Coba periksa koneksi atau ganti API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoreFeatures = async () => {
    setLoading(true);
    try {
      const selectedFeatureDetails = suggestedFeatures
        .flatMap(cat => cat.features)
        .filter(f => selectedFeatures.includes(f.id))
        .map(f => `- ${f.name}`)
        .join('\n');

      const prompt = `Berdasarkan aplikasi "${formData.name}" (${getFrameworksText()} + ${getDatabasesText()}) dengan workflow berikut:
      
      ${workflowDoc}
      
      Fitur utama:
      ${selectedFeatureDetails}
      
      Buat dokumen "Core Features & Stability" yang komprehensif dalam format Markdown. Dokumen ini WAJIB menjabarkan teks mendetail dan SANGAT PANJANG (minimal 500 kata):
      1. Functional Requirements: URAIKAN secara tertulis dalam paragraf yang panjang detail teknis dari operasi setiap fitur (alur input, proses, output).
      2. Database Schema: JELASKAN secara naratif dan ekstensif struktur relasi tabel yang dioptimalkan untuk ${getDatabasesText()}, beserta tipe data dan alasan rincian strukturnya.
      3. Security Protocol: BERIKAN teks deskripsi yang panjang mengenai aturan Auth, Middleware, Encryption, dan konsep RLS/Security Rules.
      4. Error Handling Strategy: JELASKAN strategi fallback dan validasinya secara komprehensif.
      
      PENTING: Selain penjelasan naskah tebal dan rapi, TETAP sertakan diagram Entity-Relationship (ERD) menggunakan sintaks \`\`\`mermaid erDiagram ... \`\`\` sebagai ilustrasi pendukung. Pastikan sintaks erDiagram benar dan hindari karakter spesial yang tidak didukung dalam nama tabel/field.
      
      Gunakan bahasa teknis yang rapi penuh elaborasi.`;

      const responseText = await callAI(prompt);

      setCoreFeaturesDoc(responseText || '');
      setStep(5);
    } catch (error) {
      console.error('Error generating core features:', error);
      alert('Gagal menghubungi AI. Coba periksa koneksi atau ganti API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInstructions = async () => {
    setLoading(true);
    try {
      const prompt = `Anda adalah AI Prompt Engineer. Tugas Anda adalah merangkum dokumen Workflow, UI/UX, dan Core Features menjadi satu instruksi padat "System Prompt" yang dioptimalkan untuk AI Coding Assistant (seperti Trae, Lovable, Cursor, atau GitHub Copilot).
      
      Aplikasi: ${formData.name}
      Tipe: ${formData.type}
      Stack: ${getFrameworksText()} + ${getDatabasesText()}
      
      Workflow Reference:
      ${workflowDoc.substring(0, 1000)}...
      
      UI/UX Reference:
      ${uiUxDoc.substring(0, 1000)}...
      
      Core Features Reference:
      ${coreFeaturesDoc.substring(0, 1000)}...
      
      Buat System Prompt dalam bahasa Inggris dengan format berikut (gunakan Markdown):
      
      # System Prompt for AI Builder
      
      **Act as a Senior Developer.** Build this app using ${getFrameworksText()} and ${getDatabasesText()}.
      
      ## Core Workflow & UI/UX
      [Ringkasan padat dari User Journey, Logic Flow, dan Design System]
      
      ## Database Requirements
      [Skema tabel utama dan relasinya]
      
      ## Features to Implement
      [Daftar fitur utama]
      
      ## Security Rules & Error Handling
      [Aturan keamanan spesifik stack, misal RLS jika Supabase, dan strategi error handling]
      
      ## Constraints & Architecture
      Use clean architecture, modular components, and prioritize mobile responsiveness. [Tambahkan best practice spesifik framework]
      
      ## Task
      Start by setting up the folder structure and database connection.`;

      const responseText = await callAI(prompt);

      if (!responseText || responseText.length < 50) {
        throw new Error("AI returned empty or insufficient content. Please try again or check your API key.");
      }

      console.log('AI Instructions generated successfully. Length:', responseText.length);

      setAiInstructionsDoc(responseText || '');
      setStep(6);
      
      // Save to history with the actual current values to avoid state race condition
      saveToHistory({
        aiInstructionsDoc: responseText || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const context = getChatContext();
    if (!context) return;

    const userMessage = chatInput.trim();
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);
    setPendingRevision(null);

    try {
      const systemPrompt = `You are a professional software architect. Act as an expert advisor.
      Current Document (${context.name}):
      ---
      ${context.content}
      ---
      
      User Request: "${userMessage}"
      
      INSTRUCTION:
      1. Respond conversationally to the user about their request.
      2. If you are suggesting a revision to the document, provide the ENTIRE revised version at the end of your response, wrapped exactly inside <REVISION_DOC_START> and <REVISION_DOC_END> tags.
      3. The revised content must maintain the exact same format (${context.format}).
      4. If it's step 2 (Suggested Features), the revision MUST be valid JSON array.
      5. If it's step 3-6, the revision MUST be Markdown.`;

      const response = await callAI(systemPrompt);
      
      // Parse for revision
      let cleanResponse = response;
      const startTag = '<REVISION_DOC_START>';
      const endTag = '<REVISION_DOC_END>';
      
      if (response.includes(startTag) && response.includes(endTag)) {
        const startIndex = response.indexOf(startTag) + startTag.length;
        const endIndex = response.indexOf(endTag);
        const revision = response.substring(startIndex, endIndex).trim();
        setPendingRevision(revision);
        cleanResponse = response.replace(startTag, '').replace(endTag, '').replace(revision, '').trim();
        if (cleanResponse === '') cleanResponse = "Saya telah menyiapkan revisi dokumen berdasarkan permintaan Anda. Klik tombol 'Terapkan Revisi' di bawah untuk memperbarui dokumen.";
      }

      setChatMessages([...newMessages, { role: 'assistant', content: cleanResponse }]);
    } catch (error) {
       console.error('Chat error:', error);
       setChatMessages([...newMessages, { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi AI. Periksa koneksi Anda.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const applyRevision = () => {
    if (!pendingRevision) return;
    const context = getChatContext();
    if (!context) return;

    try {
      if (context.format === 'JSON') {
        let raw = pendingRevision.trim();
        if (raw.startsWith('```json')) raw = raw.replace(/^```json/g, '').replace(/```$/g, '').trim();
        if (raw.startsWith('```')) raw = raw.replace(/^```/g, '').replace(/```$/g, '').trim();
        context.setter(JSON.parse(raw));
      } else {
        context.setter(pendingRevision);
      }
      setPendingRevision(null);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Revisi telah diterapkan!' }]);
    } catch (e) {
      console.error('Error applying revision:', e);
      alert('Gagal menerapkan revisi. Format data tidak valid.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToDoc = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const htmlContent = element.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${filename}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const exportToPdf = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.padding = '20px';
      clone.style.width = '800px'; 
      clone.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
      clone.style.color = document.documentElement.classList.contains('dark') ? '#f8fafc' : '#000000';
      
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.appendChild(clone);
      
      // Fix for Tailwind CSS v4 "oklch" error in html2canvas
      // We'll add a style tag to the wrapper to force standard colors for the export
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        .markdown-body { background: transparent !important; color: inherit !important; }
        .markdown-body * { border-color: #cbd5e1 !important; }
        /* Override Tailwind v4 oklch colors with safe fallback for html2canvas */
        :root { --background: white; --foreground: black; }
        * { color-scheme: light !important; }
      `;
      wrapper.appendChild(styleTag);
      
      document.body.appendChild(wrapper);

      const opt = {
        margin: 0.5,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          windowWidth: 800,
          // ignoreElements: (el: any) => el.tagName === 'IFRAME'
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      } as any;
      
      await html2pdf().set(opt).from(clone).save();
      
      document.body.removeChild(wrapper);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor dokumen ke PDF.');
    }
  };

  const exportToZip = async () => {
    try {
      const zip = new JSZip();
      const folderName = formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const projectFolder = zip.folder(folderName);
      
      if (!workflowDoc || !uiUxDoc || !coreFeaturesDoc || !aiInstructionsDoc) {
        if (!confirm('Beberapa dokumen masih kosong atau belum ter-generate. Lanjutkan ekspor ZIP?')) {
          return;
        }
      }

      if (projectFolder) {
        projectFolder.file('01-workflow.md', workflowDoc);
        projectFolder.file('02-ui-ux-design.md', uiUxDoc);
        projectFolder.file('03-core-features.md', coreFeaturesDoc);
        projectFolder.file('04-ai-system-prompt.md', aiInstructionsDoc);
        
        const summary = `
Project Name: ${formData.name}
Project Type: ${formData.type}
Framework: ${getFrameworksText()}
Database: ${getDatabasesText()}
Description: ${formData.description}
Generated on: ${new Date().toLocaleString()}
        `.trim();
        projectFolder.file('project-summary.txt', summary);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}_blueprint.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating ZIP:', error);
      alert('Gagal membuat file ZIP.');
    }
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const copyAll = () => {
    const allText = `
# PROJECT: ${formData.name}
# WORKFLOW
${workflowDoc}

# UI/UX DESIGN
${uiUxDoc}

# CORE FEATURES
${coreFeaturesDoc}

# AI SYSTEM PROMPT
${aiInstructionsDoc}
    `.trim();
    copyToClipboard(allText);
  };

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'mermaid') {
        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
      }
      return <code className={className} {...props}>{children}</code>;
    }
  };

  return (
    <div className={`w-full h-full transition-colors duration-300 dark text-slate-50`}>
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-8 glass-dark rounded-3xl pb-16">
        
        {/* Title */}

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">AI Blueprint Generator</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Hasilkan Workflow, UI/UX, Core Features, dan AI System Prompt yang siap di-paste ke AI Builder (Trae, Lovable, Cursor) dalam hitungan menit.
          </p>
        </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
        
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${step >= s ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'bg-[#0a0a15] border-slate-800 text-slate-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'}`}>
            {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Input */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-500/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>1. Project Details & Tech Stack</CardTitle>
                <CardDescription>Ceritakan tentang aplikasi yang ingin Anda bangun atau pilih template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" /> Quick Start Templates
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {QUICK_TEMPLATES.map((t) => (
                      <Button 
                        key={t.name} 
                        variant="outline" 
                        size="sm" 
                        className="justify-start h-auto py-2 px-3 text-left flex-col items-start gap-1 border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 bg-black/20"
                        onClick={() => applyTemplate(t)}
                      >
                        <span className="font-semibold text-xs transition-colors group-hover:text-indigo-300">{t.name}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{t.type}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Aplikasi</label>
                    <Input 
                      placeholder="e.g. TaskMaster Pro" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jenis Aplikasi</label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v || ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web App">Web App</SelectItem>
                        <SelectItem value="APK (Expo)">APK (Expo)</SelectItem>
                        <SelectItem value="APK (Android Studio)">APK (Android Studio)</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Landing Page">Landing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi Bisnis & Fungsional</label>
                  <Textarea 
                    placeholder="Jelaskan masalah yang dipecahkan aplikasi ini dan siapa penggunanya..." 
                    className="min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                       Frontend Framework <span className="text-[10px] text-slate-500 font-normal">(Pilih salah satu)</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                       {FRAMEWORKS.map(f => (
                         <div 
                           key={f} 
                           className={`flex items-center space-x-2 p-2 rounded-lg border transition-all cursor-pointer ${formData.frameworks.includes(f) ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-white/5 bg-black/20 hover:border-white/10'}`}
                           onClick={() => toggleFramework(f)}
                         >
                           <Checkbox 
                             checked={formData.frameworks.includes(f)} 
                             onCheckedChange={() => toggleFramework(f)}
                           />
                           <span className="text-[11px] leading-tight text-slate-300">{f}</span>
                         </div>
                       ))}
                    </div>
                    <div className="pt-2">
                      <Input 
                        placeholder="Manual: Input framework lain..." 
                        value={manualFramework}
                        onChange={(e) => {
                          setManualFramework(e.target.value);
                          setFormData(prev => ({...prev, frameworks: []}));
                        }}
                        onFocus={() => {
                          setFormData(prev => ({...prev, frameworks: []}));
                        }}
                        className="h-8 text-xs bg-black/20 border-white/5 focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                       Database / Backend <span className="text-[10px] text-slate-500 font-normal">(Pilih salah satu)</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                       {DATABASES.map(d => (
                         <div 
                           key={d} 
                           className={`flex items-center space-x-2 p-2 rounded-lg border transition-all cursor-pointer ${formData.databases.includes(d) ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-white/5 bg-black/20 hover:border-white/10'}`}
                           onClick={() => toggleDatabase(d)}
                         >
                           <Checkbox 
                             checked={formData.databases.includes(d)} 
                             onCheckedChange={() => toggleDatabase(d)}
                           />
                           <span className="text-[11px] leading-tight text-slate-300">{d}</span>
                         </div>
                       ))}
                    </div>
                    <div className="pt-2">
                      <Input 
                        placeholder="Manual: Input database lain..." 
                        value={manualDatabase}
                        onChange={(e) => {
                          setManualDatabase(e.target.value);
                          setFormData(prev => ({...prev, databases: []}));
                        }}
                        onFocus={() => {
                          setFormData(prev => ({...prev, databases: []}));
                        }}
                        className="h-8 text-xs bg-black/20 border-white/5 focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleGenerateFeatures} 
                  disabled={loading || !formData.name || !formData.description || (formData.frameworks.length === 0 && !manualFramework) || (formData.databases.length === 0 && !manualDatabase)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Options
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: Feature Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-500/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>2. Interactive Feature Discovery</CardTitle>
                    <CardDescription>AI telah melakukan brainstorming fitur. Pilih yang Anda inginkan.</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsChatOpen(true)}
                    className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Ask AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {suggestedFeatures.map((category, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Badge variant="outline" className="bg-indigo-900/30 text-indigo-300 border-indigo-500/30">{category.category}</Badge>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {category.features.map((feature) => (
                            <div 
                              key={feature.id} 
                              className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300 cursor-pointer ${selectedFeatures.includes(feature.id) ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'border-indigo-500/10 bg-black/20 hover:border-indigo-500/40 hover:bg-black/40'}`}
                              onClick={() => toggleFeature(feature.id)}
                            >
                              <Checkbox 
                                id={feature.id} 
                                checked={selectedFeatures.includes(feature.id)}
                                onCheckedChange={() => toggleFeature(feature.id)}
                                className="mt-1"
                              />
                              <div className="space-y-1">
                                <label htmlFor={feature.id} className={`text-sm font-medium leading-none cursor-pointer ${selectedFeatures.includes(feature.id) ? 'text-white' : 'text-slate-300'}`}>
                                  {feature.name}
                                </label>
                                <p className={`text-xs leading-snug mt-1 ${selectedFeatures.includes(feature.id) ? 'text-indigo-200' : 'text-slate-500'}`}>
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="mt-8 pt-6 border-t border-indigo-500/20">
                      <h4 className="text-sm font-medium text-white mb-3">Tambah Fitur Manual</h4>
                      <div className="flex gap-2 items-start">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                          <Input 
                            placeholder="Nama Fitur" 
                            value={customFeatureName}
                            onChange={e => setCustomFeatureName(e.target.value)}
                            className="bg-black/20 border-indigo-500/20 text-white"
                          />
                          <Input 
                            placeholder="Deskripsi Singkat" 
                            value={customFeatureDesc}
                            onChange={e => setCustomFeatureDesc(e.target.value)}
                            className="bg-black/20 border-indigo-500/20 text-white"
                          />
                        </div>
                        <Button 
                          onClick={handleAddCustomFeature}
                          disabled={!customFeatureName.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  onClick={handleGenerateWorkflow} 
                  disabled={loading || selectedFeatures.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Generate Workflow
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 3: Workflow Review */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-500/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>3. Workflow & User Journey</CardTitle>
                    <CardDescription>Review alur kerja aplikasi yang dihasilkan AI.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsChatOpen(true)}
                      className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Ask AI
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToDoc('workflow-content', 'Workflow')}>
                      <FileText className="h-4 w-4 mr-2" /> DOC
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPdf('workflow-content', 'Workflow')}>
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full">
                  <div id="workflow-content" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                    <ReactMarkdown components={markdownComponents}>{workflowDoc}</ReactMarkdown>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button 
                  onClick={handleGenerateUIUX} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Generate UI/UX Design
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: UI/UX Design Review */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-500/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>4. UI/UX Frontend Design</CardTitle>
                    <CardDescription>Design system dan arsitektur komponen UI.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsChatOpen(true)}
                      className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Ask AI
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToDoc('uiux-content', 'UIUX_Design')}>
                      <FileText className="h-4 w-4 mr-2" /> DOC
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPdf('uiux-content', 'UIUX_Design')}>
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full">
                  <div id="uiux-content" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                    <ReactMarkdown components={markdownComponents}>{uiUxDoc}</ReactMarkdown>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button 
                  onClick={handleGenerateCoreFeatures} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Generate Core Features
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 5: Core Features Review */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-500/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>5. Core Features & Stability Architect</CardTitle>
                    <CardDescription>Spesifikasi teknis, skema database, dan aturan keamanan.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsChatOpen(true)}
                      className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Ask AI
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToDoc('core-content', 'Core_Features')}>
                      <FileText className="h-4 w-4 mr-2" /> DOC
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPdf('core-content', 'Core_Features')}>
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full">
                  <div id="core-content" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                    <ReactMarkdown components={markdownComponents}>{coreFeaturesDoc}</ReactMarkdown>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
                <Button 
                  onClick={handleGenerateInstructions} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate AI Custom Instructions
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 6: Final Output */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-500/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-xl overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex-1 w-full rounded-tl-2xl">
                        <CardTitle className="text-2xl mb-2">Blueprint Ready!</CardTitle>
                        <CardDescription className="text-blue-100">
                        Dokumen Anda siap digunakan. Salin &quot;AI Instructions&quot; dan paste ke AI Builder favorit Anda.
                        </CardDescription>
                    </div>
                    <div className="pr-6 pt-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsChatOpen(true)}
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Ask AI to Revise
                        </Button>
                    </div>
                 </div>
               <CardContent className="p-6">
                <Tabs defaultValue="instructions" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6 bg-black/40 border border-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="instructions" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(99,102,241,0.4)]">AI Instructions</TabsTrigger>
                    <TabsTrigger value="workflow" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(99,102,241,0.4)]">Workflow</TabsTrigger>
                    <TabsTrigger value="uiux" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(99,102,241,0.4)]">UI/UX Design</TabsTrigger>
                    <TabsTrigger value="core" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(99,102,241,0.4)]">Core Features</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="instructions" className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => exportToDoc('instructions-content', 'AI_Instructions')}>
                        <FileText className="h-4 w-4 mr-2" /> DOC
                      </Button>
                      <Button variant="outline" onClick={() => exportToPdf('instructions-content', 'AI_Instructions')}>
                        <Download className="h-4 w-4 mr-2" /> PDF
                      </Button>
                      <Button onClick={() => copyToClipboard(aiInstructionsDoc)} className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                        {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy for AI Builder
                      </Button>
                      <Button onClick={copyAll} variant="outline" className="gap-2">
                        <Layers className="h-4 w-4" /> Copy All Docs
                      </Button>
                    </div>
                    <div className="w-full py-4">
                      <div id="instructions-content" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                        <ReactMarkdown components={markdownComponents}>{aiInstructionsDoc}</ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="workflow" className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => exportToDoc('workflow-content-final', 'Workflow')}>
                        <FileText className="h-4 w-4 mr-2" /> DOC
                      </Button>
                      <Button variant="outline" onClick={() => exportToPdf('workflow-content-final', 'Workflow')}>
                        <Download className="h-4 w-4 mr-2" /> PDF
                      </Button>
                    </div>
                    <div className="w-full py-4">
                      <div id="workflow-content-final" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                        <ReactMarkdown components={markdownComponents}>{workflowDoc}</ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="uiux" className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => exportToDoc('uiux-content-final', 'UIUX_Design')}>
                        <FileText className="h-4 w-4 mr-2" /> DOC
                      </Button>
                      <Button variant="outline" onClick={() => exportToPdf('uiux-content-final', 'UIUX_Design')}>
                        <Download className="h-4 w-4 mr-2" /> PDF
                      </Button>
                    </div>
                    <div className="w-full py-4">
                      <div id="uiux-content-final" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                        <ReactMarkdown components={markdownComponents}>{uiUxDoc}</ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="core" className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => exportToDoc('core-content-final', 'Core_Features')}>
                        <FileText className="h-4 w-4 mr-2" /> DOC
                      </Button>
                      <Button variant="outline" onClick={() => exportToPdf('core-content-final', 'Core_Features')}>
                        <Download className="h-4 w-4 mr-2" /> PDF
                      </Button>
                    </div>
                    <div className="w-full py-4">
                      <div id="core-content-final" className="markdown-body prose prose-slate prose-invert prose-sm max-w-none text-slate-200">
                        <ReactMarkdown components={markdownComponents}>{coreFeaturesDoc}</ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="bg-black/40 p-6 flex justify-between border-t border-indigo-500/10">
                <Button variant="outline" onClick={() => setStep(1)}>Start New Project</Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={exportToZip} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Bulk Export All (ZIP)
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* AI Chat Side Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a1a] border-l border-indigo-500/20 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-600/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Ask AI (Assistant)</h3>
                    <p className="text-[10px] text-indigo-300">Revisi dokumen secara instan</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-slate-400">Ada yang ingin diubah dalam dokumen ini? Silakan curhat dengan AI di sini.</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                         {['Tambahkan fitur...', 'Ubah alur...', 'Lebih profesional...'].map(suggestion => (
                           <button 
                            key={suggestion}
                            onClick={() => setChatInput(suggestion)}
                            className="px-3 py-1 text-[10px] bg-black/40 border border-indigo-500/20 rounded-full text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                           >
                             {suggestion}
                           </button>
                         ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                          : 'bg-black/40 border border-indigo-500/20 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-black/40 border border-indigo-500/20 p-3 rounded-2xl rounded-tl-none">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      </div>
                    </div>
                  )}

                  {pendingRevision && !isChatLoading && (
                    <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl space-y-3 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                      <div className="flex items-start gap-2">
                        <RefreshCw className="w-4 h-4 text-indigo-400 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-white">Revisi Siap Diterapkan</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Klik tombol di bawah untuk memperbarui dokumen secara permanen.</p>
                        </div>
                      </div>
                      <Button onClick={applyRevision} className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                        Terapkan Revisi
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-indigo-500/20 bg-black/40">
                <div className="relative">
                  <Input 
                    placeholder="Ketik instruksi revisi..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    className="pr-10 bg-black/20 border-indigo-500/30 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 focus-visible:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleAskAI}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white hover:bg-indigo-600/20"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-center text-slate-500 mt-3 italic">
                  AI akan memahami konteks dokumen yang sedang Anda buka.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
