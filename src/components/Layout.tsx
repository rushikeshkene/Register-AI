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

      {/* Sidebar / Bottom Bar */}
      <nav className={cn(
        "fixed z-50 glass border border-white/10 transition-all duration-300",
        "lg:left-6 lg:top-1/2 lg:-translate-y-1/2 lg:w-20 lg:h-[80vh] lg:flex-col lg:rounded-3xl lg:py-8 lg:px-0",
        "bottom-0 left-0 right-0 h-20 flex-row rounded-t-3xl py-0 px-6 flex items-center justify-between lg:justify-between"
      )}>
        <div className="flex lg:flex-col items-center gap-4 lg:gap-8 w-full lg:w-auto justify-around lg:justify-start">
          <div className="hidden lg:block p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
            <Cpu size={32} />
          </div>
          <div className="flex lg:flex-col gap-2 lg:gap-4 w-full lg:w-auto justify-around lg:justify-start">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "p-3 lg:p-4 rounded-2xl transition-all duration-300 group relative flex flex-col items-center gap-1",
                  activeTab === tab.id ? "bg-white/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={24} />
                <span className="text-[10px] lg:hidden font-medium">{tab.label}</span>
                <span className="hidden lg:block absolute left-24 px-3 py-1 rounded-lg bg-slate-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-4">
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
      <main className="lg:ml-32 p-4 lg:p-8 pb-24 lg:pb-8">
        <header className="mb-8 lg:mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="lg:hidden p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Cpu size={24} />
              </div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl lg:text-4xl font-bold tracking-tight"
              >
                {lang === 'en' ? 'AI Smart Vision' : 'AI स्मार्ट दृष्टी'}
              </motion.h1>
            </div>
            <p className="text-slate-400 text-sm lg:text-base">
              {lang === 'en' ? 'Futuristic Electronics Lab Assistant' : 'भविष्यकालीन इलेक्ट्रॉनिक्स लॅब असिस्टंट'}
            </p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <button 
              onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
              className="lg:hidden glass flex-1 py-3 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Languages size={18} />
              {lang === 'en' ? 'मराठी' : 'English'}
            </button>
            <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3 flex-1 lg:flex-none justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Online</span>
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
