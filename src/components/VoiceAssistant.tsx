import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceAssistantProps {
  lang: 'en' | 'mr';
  onCommand: (command: string) => void;
}

export default function VoiceAssistant({ lang, onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'mr-IN';
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : 'mr-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setTranscript(command);
      onCommand(command);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="glass px-6 py-3 rounded-2xl border border-white/10 text-sm font-medium flex items-center gap-3"
          >
            <MessageSquare size={16} className="text-cyan-400" />
            <span>{transcript}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        <button
          onClick={startListening}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative",
            isListening ? "bg-red-500 text-white animate-pulse" : "bg-cyan-500 text-black hover:scale-110"
          )}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping" />
          )}
        </button>

        <button
          onClick={() => window.speechSynthesis.cancel()}
          className="w-16 h-16 rounded-full glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          {isSpeaking ? <Volume2 size={28} className="text-cyan-400" /> : <VolumeX size={28} />}
        </button>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
