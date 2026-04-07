import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../lib/firebase';
import { History, TrendingUp, Target, Clock, ExternalLink } from 'lucide-react';

interface ScanRecord {
  id: string;
  type: string;
  formatted: string;
  bands: string[];
  timestamp: any;
  confidence: number;
}

export default function Dashboard({ lang }: { lang: 'en' | 'mr' }) {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'scans'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScanRecord[];
      setHistory(records);
    });
    return () => unsubscribe();
  }, []);

  const stats = [
    { label: lang === 'en' ? 'Total Scans' : 'एकूण स्कॅन', value: history.length, icon: History, color: 'text-cyan-400' },
    { label: lang === 'en' ? 'Accuracy' : 'अचूकता', value: '96.4%', icon: Target, color: 'text-green-400' },
    { label: lang === 'en' ? 'Uptime' : 'अपटाइम', value: '99.9%', icon: Clock, color: 'text-purple-400' },
    { label: lang === 'en' ? 'Growth' : 'वाढ', value: '+12%', icon: TrendingUp, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/10"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">{lang === 'en' ? 'Recent Activity' : 'अलीकडील क्रियाकलाप'}</h3>
            <button className="text-cyan-400 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {history.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {record.bands?.slice(0, 3).map((color, i) => (
                      <div key={i} className="w-2 h-6 rounded-full" style={{ backgroundColor: color.toLowerCase() }} />
                    ))}
                  </div>
                  <div>
                    <p className="font-bold">{record.formatted}</p>
                    <p className="text-xs text-slate-500">{record.type} • {new Date(record.timestamp?.toDate()).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-green-400">{(record.confidence * 100).toFixed(0)}%</span>
                  <ExternalLink size={16} className="text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10">
          <h3 className="text-xl font-bold mb-6">{lang === 'en' ? 'Component Distribution' : 'घटक वितरण'}</h3>
          <div className="space-y-6">
            {[
              { label: 'Resistors', value: 75, color: 'bg-cyan-500' },
              { label: 'Capacitors', value: 15, color: 'bg-purple-500' },
              { label: 'Diodes', value: 10, color: 'bg-yellow-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-bold">{item.value}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    className={cn("h-full rounded-full", item.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
