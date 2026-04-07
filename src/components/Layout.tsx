import React from 'react';
import { motion } from 'motion/react';
import { Cpu, History, GraduationCap, LayoutDashboard, Settings, Sun, Moon, Languages } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'en' | 'mr';
  setLang: (lang: 'en' | 'mr') => void;
}

export default function Layout({ children, activeTab, setActiveTab, lang, setLang }: LayoutProps) {
  const [isDark, setIsDark] = React.useState(true);

  const tabs = [
    { id: 'vision', icon: Cpu, label: lang === 'en' ? 'Vision' : 'दृष्टी' },
    { id: 'dashboard', icon: LayoutDashboard, label: lang === 'en' ? 'Dashboard' : 'डॅशबोर्ड' },
    { id: 'learning', icon: GraduationCap, label: lang === 'en' ? 'Learning' : 'शिकणे' },
    { id: 'history', icon: History, label: lang === 'en' ? 'History' : 'इतिहास' },
  ];

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      isDark ? "bg-[#0a0a0c] text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <nav className="fixed left-6 top-1/2 -translate-y-1/2 w-20 h-[80vh] flex flex-col items-center justify-between py-8 z-50 glass rounded-3xl border border-white/10">
        <div className="flex flex-col gap-8">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
            <Cpu size={32} />
          </div>
          <div className="flex flex-col gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-300 group relative",
                  activeTab === tab.id ? "bg-white/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={24} />
                <span className="absolute left-24 px-3 py-1 rounded-lg bg-slate-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
            className="p-4 rounded-2xl text-slate-400 hover:text-white transition-colors"
          >
            <Languages size={24} />
          </button>
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-4 rounded-2xl text-slate-400 hover:text-white transition-colors"
          >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-32 p-8">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight mb-2"
            >
              {lang === 'en' ? 'AI Smart Vision' : 'AI स्मार्ट दृष्टी'}
            </motion.h1>
            <p className="text-slate-400">
              {lang === 'en' ? 'Futuristic Electronics Lab Assistant' : 'भविष्यकालीन इलेक्ट्रॉनिक्स लॅब असिस्टंट'}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">System Online</span>
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
