import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Brain, ArrowRight, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const QUESTIONS = [
  {
    bands: ['Brown', 'Black', 'Red', 'Gold'],
    options: ['100 Ω', '1 kΩ', '10 kΩ', '100 kΩ'],
    correct: 1,
  },
  {
    bands: ['Red', 'Red', 'Orange', 'Gold'],
    options: ['2.2 kΩ', '22 kΩ', '220 kΩ', '2.2 MΩ'],
    correct: 1,
  },
  {
    bands: ['Yellow', 'Violet', 'Brown', 'Gold'],
    options: ['47 Ω', '470 Ω', '4.7 kΩ', '47 kΩ'],
    correct: 1,
  },
];

export default function Quiz({ lang }: { lang: 'en' | 'mr' }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    if (idx === QUESTIONS[current].correct) {
      setScore(s => s + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22d3ee', '#a855f7']
      });
    }

    setTimeout(() => {
      if (current < QUESTIONS.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const reset = () => {
    setCurrent(0);
    setScore(0);
    setShowResult(false);
    setSelected(null);
  };

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400"
        >
          <Trophy size={64} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">
            {lang === 'en' ? 'Quiz Completed!' : 'क्विझ पूर्ण झाले!'}
          </h2>
          <p className="text-slate-400">
            {lang === 'en' ? `You scored ${score} out of ${QUESTIONS.length}` : `तुम्ही ${QUESTIONS.length} पैकी ${score} गुण मिळवले`}
          </p>
        </div>
        <button
          onClick={reset}
          className="px-8 py-4 rounded-2xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all flex items-center gap-3"
        >
          <RefreshCcw size={20} />
          {lang === 'en' ? 'Try Again' : 'पुन्हा प्रयत्न करा'}
        </button>
      </div>
    );
  }

  const q = QUESTIONS[current];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Brain className="text-purple-400" />
          <span className="font-bold uppercase tracking-widest text-xs text-slate-500">
            Question {current + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="text-sm font-mono text-cyan-400">Score: {score}</div>
      </div>

      <div className="glass p-12 rounded-[3rem] border border-white/10 space-y-12 text-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">
            {lang === 'en' ? 'What is the value of this resistor?' : 'या रोधकाचे मूल्य काय आहे?'}
          </h3>
          <div className="flex justify-center gap-4 py-8">
            {q.bands.map((color, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-12 h-20 rounded-xl shadow-2xl border border-white/10"
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {q.options.map((option, i) => (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => handleAnswer(i)}
              className={cn(
                "p-6 rounded-3xl border transition-all duration-300 text-lg font-bold",
                selected === null ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/50" :
                i === q.correct ? "bg-green-500/20 border-green-500 text-green-400" :
                selected === i ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/10 opacity-50"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
