import React, { useState } from 'react';
import Layout from './components/Layout';
import CameraView from './components/CameraView';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import VoiceAssistant from './components/VoiceAssistant';

export default function App() {
  const [activeTab, setActiveTab] = useState('vision');
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>('');

  const handleVoiceCommand = (command: string) => {
    console.log("Voice Command:", command);
    setLastVoiceCommand(command);
    
    if (command.includes('scan') || command.includes('स्कॅन')) {
      setActiveTab('vision');
    } else if (command.includes('dashboard') || command.includes('डॅशबोर्ड')) {
      setActiveTab('dashboard');
    } else if (command.includes('learning') || command.includes('शिकणे') || command.includes('quiz')) {
      setActiveTab('learning');
    } else if (command.includes('history') || command.includes('इतिहास')) {
      setActiveTab('history');
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      lang={lang} 
      setLang={setLang}
    >
      {activeTab === 'vision' && <CameraView lang={lang} voiceCommand={lastVoiceCommand} />}
      {activeTab === 'dashboard' && <Dashboard lang={lang} />}
      {activeTab === 'learning' && <Quiz lang={lang} />}
      {activeTab === 'history' && <Dashboard lang={lang} />}
      
      <VoiceAssistant lang={lang} onCommand={handleVoiceCommand} />
    </Layout>
  );
}
