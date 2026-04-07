import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Scan, Info, Zap, AlertCircle, GraduationCap, Upload, Wrench, RefreshCw, ExternalLink } from 'lucide-react';
import { calculateResistance } from '../lib/resistorLogic';
import { explainComponent, analyzeImage, suggestReplacement } from '../lib/gemini';
import { db, collection, addDoc } from '../lib/firebase';

interface CameraViewProps {
  lang: 'en' | 'mr';
  voiceCommand?: string;
}

export default function CameraView({ lang, voiceCommand }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<cocoSsd.DetectedObject[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [replacementSuggestion, setReplacementSuggestion] = useState<string | null>(null);
  const [isLoadingReplacement, setIsLoadingReplacement] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const lastAnalysisTime = useRef<number>(0);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'mr-IN';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (voiceCommand) {
      if (voiceCommand.includes('scan') || voiceCommand.includes('स्कॅन')) {
        setIsScanning(true);
        speak(lang === 'en' ? "Starting AI Vision scan" : "AI दृष्टी स्कॅन सुरू करत आहे");
      } else if (voiceCommand.includes('stop') || voiceCommand.includes('थांबवा')) {
        setIsScanning(false);
        speak(lang === 'en' ? "Scanning stopped" : "स्कॅनिंग थांबवले");
      } else if (voiceCommand.includes('what is this') || voiceCommand.includes('हे काय आहे')) {
        if (selectedComponent) {
          speak(lang === 'en' ? `This is a ${selectedComponent.type} with value ${selectedComponent.formatted}` : `हे ${selectedComponent.formatted} मूल्य असलेले ${selectedComponent.type} आहे`);
        } else {
          speak(lang === 'en' ? "No component detected yet" : "अद्याप कोणताही घटक सापडला नाही");
        }
      }
    }
  }, [voiceCommand]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        setModelError(null);
        await tf.ready();
        // Try to use WebGL, fallback to CPU if needed
        try {
          await tf.setBackend('webgl');
        } catch (e) {
          console.warn("WebGL not supported, falling back to CPU");
          await tf.setBackend('cpu');
        }
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Model loading failed:", err);
        setModelError(err instanceof Error ? err.message : String(err));
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    startCamera();
  }, [facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Stop existing tracks
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError(err instanceof Error ? err.message : String(err));
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    speak(lang === 'en' ? "Switching camera" : "कॅमेरा बदलत आहे");
  };

  const detectFrame = async () => {
    if (model && videoRef.current && videoRef.current.readyState === 4) {
      try {
        const predictions = await model.detect(videoRef.current);
        setDetections(predictions);
        
        // Draw on canvas
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Pulse factor based on time
          const time = Date.now();
          const pulse = Math.sin(time / 300) * 0.1 + 1; // Pulses between 0.9 and 1.1
          const opacity = 0.6 + Math.sin(time / 300) * 0.3; // Opacity pulses too

          predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            
            // Dynamic AR Bounding Box
            ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
            ctx.lineWidth = 3 * pulse;
            
            // Draw AR corners instead of full box for a more futuristic look
            const cornerSize = Math.min(width, height) * 0.2;
            ctx.beginPath();
            // Top Left
            ctx.moveTo(x, y + cornerSize); ctx.lineTo(x, y); ctx.lineTo(x + cornerSize, y);
            // Top Right
            ctx.moveTo(x + width - cornerSize, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cornerSize);
            // Bottom Left
            ctx.moveTo(x, y + height - cornerSize); ctx.lineTo(x, y + height); ctx.lineTo(x + cornerSize, y + height);
            // Bottom Right
            ctx.moveTo(x + width - cornerSize, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cornerSize);
            ctx.stroke();

            // Subtle full box
            ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.2})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, width, height);
            
            // Dynamic label size based on component size (distance proxy)
            const fontSize = Math.max(12, Math.min(20, width / 12));
            ctx.font = `bold ${fontSize}px Inter`;
            const label = `${prediction.class.toUpperCase()} ${Math.round(prediction.score * 100)}%`;
            const textWidth = ctx.measureText(label).width;

            // Label Background
            ctx.fillStyle = `rgba(0, 20, 30, ${opacity * 0.8})`;
            const labelY = y > fontSize + 10 ? y - 10 : y + fontSize + 10;
            ctx.roundRect(x, labelY - fontSize, textWidth + 12, fontSize + 6, 4);
            ctx.fill();

            // Label Text
            ctx.fillStyle = '#22d3ee';
            ctx.fillText(label, x + 6, labelY - 2);

            // Live AI Analysis Trigger (every 5 seconds if scanning)
            const now = Date.now();
            if (isScanning && prediction.score > 0.8 && now - lastAnalysisTime.current > 5000) {
              lastAnalysisTime.current = now;
              performLiveAnalysis();
            }
          });
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }
    if (isScanning) {
      requestAnimationFrame(detectFrame);
    }
  };

  const performLiveAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Capture current frame
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = videoRef.current.videoWidth;
    captureCanvas.height = videoRef.current.videoHeight;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = captureCanvas.toDataURL('image/jpeg').split(',')[1];

    const analysis = await analyzeImage(base64, lang);
    if (analysis) {
      setExplanation(analysis);
      // Try to extract value
      const isResistor = analysis.toLowerCase().includes('resistor') || analysis.includes('रोधक');
      if (isResistor) {
        setSelectedComponent({
          type: lang === 'en' ? 'Resistor' : 'रोधक',
          bands: ['Unknown'],
          formatted: lang === 'en' ? 'Live AI Analysis...' : 'थेट AI विश्लेषण...',
          confidence: 0.98,
        });
      }
    }
  };

  useEffect(() => {
    if (isScanning) {
      detectFrame();
    }
  }, [isScanning]);

  const handleScan = async () => {
    setIsScanning(true);
    // Simulate finding a resistor for demo purposes if no real detection
    setTimeout(() => {
      const mockResistor = {
        type: 'Resistor',
        bands: ['Brown', 'Black', 'Red', 'Gold'],
        confidence: 0.94,
      };
      const result = calculateResistance(mockResistor.bands);
      setSelectedComponent({ ...mockResistor, ...result });
      saveToHistory({ ...mockResistor, ...result });
    }, 2000);
  };

  const saveToHistory = async (data: any) => {
    try {
      await addDoc(collection(db, 'scans'), {
        ...data,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error("Error saving scan:", e);
    }
  };

  const getExplanation = async () => {
    if (!selectedComponent) return;
    setIsLoadingExplanation(true);
    const text = await explainComponent(selectedComponent.type, `Resistor with bands ${selectedComponent.bands.join(', ')}. Value: ${selectedComponent.formatted}`, lang);
    setExplanation(text);
    setIsLoadingExplanation(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setExplanation(null);
    setSelectedComponent(null);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      speak(lang === 'en' ? "Analyzing uploaded image" : "अपलोड केलेल्या प्रतिमेचे विश्लेषण करत आहे");
      
      const analysis = await analyzeImage(base64, lang);
      if (analysis) {
        setExplanation(analysis);
        speak(analysis);
        
        // Try to extract component info from analysis text
        const isResistor = analysis.toLowerCase().includes('resistor') || analysis.includes('रोधक');
        if (isResistor) {
          setSelectedComponent({
            type: lang === 'en' ? 'Resistor' : 'रोधक',
            bands: ['Unknown'],
            formatted: lang === 'en' ? 'Analyzed from Image' : 'प्रतिमेवरून विश्लेषण केले',
            confidence: 0.95,
          });
        }
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const getReplacement = async () => {
    if (!selectedComponent) return;
    setIsLoadingReplacement(true);
    const suggestion = await suggestReplacement(
      selectedComponent.type,
      selectedComponent.formatted,
      isDamaged ? "Visible physical damage or burnt marks" : "Unclear value/Low confidence detection",
      lang
    );
    setReplacementSuggestion(suggestion);
    setIsLoadingReplacement(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Camera Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl">
          {isModelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-cyan-400 font-medium animate-pulse">
                {lang === 'en' ? 'Loading AI Vision Model...' : 'AI व्हिजन मॉडेल लोड होत आहे...'}
              </p>
            </div>
          )}

          {modelError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/90 z-20">
              <AlertCircle className="text-red-400 mb-4" size={48} />
              <h3 className="text-xl font-bold mb-2">Model Error</h3>
              <p className="text-slate-400 text-sm mb-4">{modelError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
              >
                Reload App
              </button>
            </div>
          )}

          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/80 backdrop-blur-md z-10">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {lang === 'en' ? 'Camera Access Denied' : 'कॅमेरा प्रवेश नाकारला'}
              </h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs">
                {lang === 'en' 
                  ? 'To use AI Vision, please grant camera permissions. If you are in the AI Studio preview, opening in a new tab is required.' 
                  : 'AI व्हिजन वापरण्यासाठी, कृपया कॅमेरा परवानग्या द्या. जर तुम्ही AI स्टुडिओ पूर्वावलोकनात असाल, तर नवीन टॅबमध्ये उघडणे आवश्यक आहे.'}
              </p>

              <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left w-full max-w-xs border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                  {lang === 'en' ? 'How to fix:' : 'कसे दुरुस्त करावे:'}
                </p>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-cyan-400 font-bold">1.</span>
                    {lang === 'en' ? 'Click "Open in New Tab" below.' : 'खालील "नवीन टॅबमध्ये उघडा" वर क्लिक करा.'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    {lang === 'en' ? 'Click the lock icon (🔒) in the address bar.' : 'ॲड्रेस बारमधील लॉक आयकॉन (🔒) वर क्लिक करा.'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400 font-bold">3.</span>
                    {lang === 'en' ? 'Set "Camera" to "Allow".' : '"कॅमेरा" "परवानगी द्या" वर सेट करा.'}
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <a 
                  href={window.location.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-xl bg-cyan-500 text-black font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  <ExternalLink size={18} />
                  {lang === 'en' ? 'Open in New Tab' : 'नवीन टॅबमध्ये उघडा'}
                </a>
                <button 
                  onClick={startCamera}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
                >
                  {lang === 'en' ? 'Try Again' : 'पुन्हा प्रयत्न करा'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </>
          )}
          
          {/* Overlay UI */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-cyan-500/30 rounded-3xl relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={cn(
                "px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all",
                isScanning ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-cyan-500 text-black hover:bg-cyan-400"
              )}
            >
              {isScanning ? <AlertCircle size={20} /> : <Scan size={20} />}
              {isScanning ? (lang === 'en' ? 'Stop Scan' : 'स्कॅन थांबवा') : (lang === 'en' ? 'Start AI Vision' : 'AI दृष्टी सुरू करा')}
            </button>

            <button
              onClick={toggleCamera}
              className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold flex items-center gap-3 transition-all"
            >
              <RefreshCw size={20} />
              <span className="hidden sm:inline">{lang === 'en' ? 'Switch' : 'कॅमेरा बदला'}</span>
            </button>

            <label className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold flex items-center gap-3 cursor-pointer transition-all">
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={20} />
              )}
              <span className="hidden sm:inline">{lang === 'en' ? 'Upload Image' : 'प्रतिमा अपलोड करा'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-yellow-400" size={20} />
            <h3 className="font-bold">{lang === 'en' ? 'Real-time Telemetry' : 'रिअल-टाइम टेलिमेट्री'}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">FPS</p>
              <p className="text-xl font-mono">24.5</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Latency</p>
              <p className="text-xl font-mono">12ms</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Confidence</p>
              <p className="text-xl font-mono">98.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {selectedComponent ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-3xl border border-white/10 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    {selectedComponent.type}
                  </span>
                  <h2 className="text-3xl font-bold mt-2">{selectedComponent.formatted}</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Info className="text-slate-400" />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-400">{lang === 'en' ? 'Detected Color Bands' : 'सापडलेले रंग पट्टे'}</p>
                <div className="flex gap-2">
                  {selectedComponent.bands.map((color: string, i: number) => (
                    <div 
                      key={i} 
                      className="w-8 h-12 rounded-lg border border-white/10 shadow-lg"
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                <div>
                  <p className="text-xs text-slate-400 mb-1">{lang === 'en' ? 'Tolerance' : 'सहनशीलता'}</p>
                  <p className="font-bold">±{selectedComponent.tolerance}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">{lang === 'en' ? 'Confidence' : 'आत्मविश्वास'}</p>
                  <p className="font-bold text-green-400">{(selectedComponent.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsDamaged(!isDamaged)}
                  className={cn(
                    "w-full py-3 rounded-xl border font-medium transition-all flex items-center justify-center gap-2",
                    isDamaged ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  )}
                >
                  <Wrench size={18} />
                  {isDamaged ? (lang === 'en' ? 'Marked as Damaged' : 'खराब म्हणून चिन्हांकित') : (lang === 'en' ? 'Mark as Damaged' : 'खराब म्हणून चिन्हांकित करा')}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={getExplanation}
                    disabled={isLoadingExplanation}
                    className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold transition-all flex items-center justify-center gap-3"
                  >
                    {isLoadingExplanation ? (
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <GraduationCap size={20} />
                        {lang === 'en' ? 'Explain' : 'स्पष्ट करा'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={getReplacement}
                    disabled={isLoadingReplacement}
                    className="py-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold transition-all flex items-center justify-center gap-3"
                  >
                    {isLoadingReplacement ? (
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Wrench size={20} />
                        {lang === 'en' ? 'Replace' : 'बदला'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-sm leading-relaxed text-slate-300"
                >
                  <p className="font-bold text-cyan-400 mb-2">{lang === 'en' ? 'AI Analysis:' : 'AI विश्लेषण:'}</p>
                  {explanation}
                </motion.div>
              )}

              {replacementSuggestion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-sm leading-relaxed text-slate-300"
                >
                  <p className="font-bold text-orange-400 mb-2">{lang === 'en' ? 'Replacement Suggestion:' : 'बदलण्याची शिफारस:'}</p>
                  {replacementSuggestion}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-12 rounded-3xl border border-white/10 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Camera size={40} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-bold">{lang === 'en' ? 'Ready for Analysis' : 'विश्लेषणासाठी तयार'}</h3>
              <p className="text-slate-400 text-sm">
                {lang === 'en' ? 'Point camera at a component and start scanning to see real-time AI detection.' : 'कॅमेरा घटकाकडे वळवा आणि रिअल-टाइम AI शोध पाहण्यासाठी स्कॅनिंग सुरू करा.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
