
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AppState, CallerIdentity, HistoryItem } from './types';
import { 
  getSystemInstruction, 
  POTENTIAL_CALLERS, 
  DOCTOR_ADVENTURES, 
  EARTH_WEIRD_EVENTS, 
  VIP_CALLERS,
  VIP_SCENARIOS,
  MAX_RELATIONSHIP_SCORE,
  SEND_PHOTO_TOOL
} from './constants';
import ParticleVisualizer from './components/ParticleVisualizer';
import { createBlob, decode, decodeAudioData } from './services/audioUtils';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Icons
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const PhoneOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
);
const BrokenHeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 11l6.92-2-4.13 6"/></svg>
);
const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
const SkullIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-4.42 0-8 3.58-8 8a7.7 7.7 0 0 0 2.5 5.5L7 22h10l.5-6.5a7.7 7.7 0 0 0 2.5-5.5c0-4.42-3.58-8-8-8z"/><path d="M9 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/><path d="M15 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/><path d="M9 16h6"/></svg>
);
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);
const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const GhostTardis = () => {
  const [isMaterializing, setIsMaterializing] = useState(false);
  const [position, setPosition] = useState({ top: '20%', left: '80%', scale: 1 });

  useEffect(() => {
    const triggerMaterialization = () => {
      const randomLeft = 10 + Math.random() * 80;
      const randomTop = 20 + Math.random() * 40;
      const randomScale = 0.6 + Math.random() * 0.4;
      
      setPosition({ 
        top: `${randomTop}%`, 
        left: `${randomLeft}%`,
        scale: randomScale 
      });
      setIsMaterializing(true);

      setTimeout(() => {
        setIsMaterializing(false);
      }, 12000);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        triggerMaterialization();
      }
    }, 20000);

    const initialTimeout = setTimeout(triggerMaterialization, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  if (!isMaterializing) return null;

  return (
    <div 
      className="absolute z-5 animate-materialize pointer-events-none opacity-0"
      style={{ 
        top: position.top, 
        left: position.left, 
        transform: `translate(-50%, -50%) scale(${position.scale})` 
      }}
    >
      <svg width="200" height="350" viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
        <rect x="45" y="0" width="10" height="12" fill="#e2f3f5" className="animate-pulse" />
        <rect x="43" y="12" width="14" height="2" fill="#002040" />
        <path d="M10 25 L50 14 L90 25" fill="#003b6f" stroke="#002040" strokeWidth="1" />
        <rect x="15" y="25" width="70" height="5" fill="#003b6f" stroke="#002040" strokeWidth="1" />
        <rect x="10" y="30" width="80" height="10" fill="#00152a" stroke="#000" strokeWidth="1" />
        <text x="50" y="38" fontSize="6" fontFamily="monospace" fill="#fff" textAnchor="middle">POLICE PUBLIC CALL BOX</text>
        <rect x="12" y="40" width="76" height="130" fill="#003b6f" stroke="#002040" strokeWidth="1" />
        <rect x="12" y="40" width="8" height="130" fill="#004b8f" />
        <rect x="80" y="40" width="8" height="130" fill="#004b8f" />
        <rect x="49" y="40" width="2" height="130" fill="#002040" />
        <rect x="25" y="48" width="18" height="20" fill="#00152a" />
        <rect x="57" y="48" width="18" height="20" fill="#00152a" />
        <rect x="29" y="52" width="4" height="12" fill="#e2f3f5" opacity="0.7" />
        <rect x="35" y="52" width="4" height="12" fill="#e2f3f5" opacity="0.7" />
        <rect x="61" y="52" width="4" height="12" fill="#e2f3f5" opacity="0.7" />
        <rect x="67" y="52" width="4" height="12" fill="#e2f3f5" opacity="0.7" />
        <rect x="25" y="75" width="18" height="20" fill="#002a55" stroke="#00152a" />
        <rect x="57" y="75" width="18" height="20" fill="#002a55" stroke="#00152a" />
        <rect x="25" y="100" width="18" height="20" fill="#002a55" stroke="#00152a" />
        <rect x="57" y="100" width="18" height="20" fill="#002a55" stroke="#00152a" />
        <rect x="25" y="125" width="18" height="20" fill="#002a55" stroke="#00152a" />
        <rect x="57" y="125" width="18" height="20" fill="#002a55" stroke="#00152a" />
        <rect x="8" y="170" width="84" height="10" fill="#002040" />
      </svg>
    </div>
  );
};

const AffectionMeter = ({ score, color, max = 10 }: { score: number, color: string, max?: number }) => {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  const isMax = score >= max;
  
  return (
    <div className="flex flex-col items-center gap-1 mb-2 w-20">
      <div className={`w-full h-1.5 bg-gray-900 border ${isMax ? 'border-yellow-200' : 'border-gray-700'} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out ${isMax ? 'animate-pulse' : ''}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-[8px] font-mono ${color.replace('bg-', 'text-')} opacity-90 tracking-widest`}>
        {isMax ? '♥ SOULMATE ♥' : `LVL ${score}`}
      </span>
    </div>
  );
};

const RecipientSelector = ({ onSelect, onCancel }: { onSelect: (callerId: string) => void, onCancel: () => void }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-fade-in">
       <h3 className="text-xl font-['Audiowide'] text-cyan-400 mb-6 tracking-widest">TRANSMIT IMAGE TO:</h3>
       <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
         <button onClick={() => onSelect('doctor')} className="p-4 border border-cyan-500 bg-cyan-900/30 hover:bg-cyan-800/50 rounded flex flex-col items-center">
             <span className="text-cyan-300 font-bold">THE DOCTOR</span>
         </button>
         <button onClick={() => onSelect('master_missy')} className="p-4 border border-green-500 bg-green-900/30 hover:bg-green-800/50 rounded flex flex-col items-center">
             <span className="text-green-300 font-bold">MISSY</span>
         </button>
         <button onClick={() => onSelect('ex_partner')} className="p-4 border border-purple-500 bg-purple-900/30 hover:bg-purple-800/50 rounded flex flex-col items-center">
             <span className="text-purple-300 font-bold">EX (JORDAN)</span>
         </button>
         <button onClick={() => onSelect('friend_sam')} className="p-4 border border-pink-500 bg-pink-900/30 hover:bg-pink-800/50 rounded flex flex-col items-center">
             <span className="text-pink-300 font-bold">BESTIE (SAM)</span>
         </button>
       </div>
       <button onClick={onCancel} className="mt-8 text-red-400 hover:text-red-200 uppercase tracking-widest text-sm">Cancel Transmission</button>
    </div>
  );
};

const ReceivedPhotoOverlay = ({ description, onClose }: { description: string, onClose: () => void }) => {
  // Procedurally generate "Psychic Paper" visuals based on the description
  const generatePsychicVisual = (text: string) => {
    const t = text.toLowerCase();
    
    // Space / Nebula / Sci-Fi
    if (t.includes('space') || t.includes('star') || t.includes('nebula') || t.includes('galaxy') || t.includes('black hole') || t.includes('planet')) {
      return "radial-gradient(circle at 50% 50%, #2b1055 0%, #7597de 25%, #2b1055 50%, #000000 100%)"; 
    }
    // Danger / Fire / Red
    if (t.includes('fire') || t.includes('burn') || t.includes('explosion') || t.includes('danger') || t.includes('dalek') || t.includes('red')) {
      return "conic-gradient(from 180deg at 50% 50%, #ff0000 0deg, #ff8c00 60deg, #370617 120deg, #ff0000 360deg)";
    }
    // Nature / Earth
    if (t.includes('garden') || t.includes('tree') || t.includes('flower') || t.includes('park') || t.includes('green') || t.includes('grass')) {
      return "linear-gradient(135deg, #134e5e 0%, #71b280 100%)";
    }
    // Tech / Cyberman / Silver
    if (t.includes('robot') || t.includes('cyberman') || t.includes('metal') || t.includes('tech') || t.includes('ship')) {
      return "repeating-linear-gradient(45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px)";
    }
    // Water / Ice
    if (t.includes('water') || t.includes('ice') || t.includes('rain') || t.includes('blue') || t.includes('glass')) {
      return "linear-gradient(to top, #accbee 0%, #e7f0fd 100%)";
    }
    // Default TARDIS Psychic Paper Static
    return "repeating-radial-gradient(circle at 0 0, transparent 0, #000 10px), repeating-linear-gradient(#003b6f55, #003b6f)";
  };

  const bgStyle = generatePsychicVisual(description);

  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-sm aspect-square border-4 border-cyan-500 bg-gray-900 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            {/* Procedural Background */}
            <div className="absolute inset-0 opacity-80" style={{ background: bgStyle }}></div>
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Description Text Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 border-t border-cyan-500">
               <p className="text-[10px] text-cyan-500 font-mono uppercase mb-1">VISUAL DATA DECODED:</p>
               <p className="text-white font-mono text-sm leading-tight italic">"{description}"</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-cyan-400 font-mono text-xs animate-pulse bg-black/50 px-2 rounded">PSYCHIC PAPER PROJECTING...</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 animate-[scan-line_3s_linear_infinite]"></div>
        </div>
        <button onClick={onClose} className="mt-6 px-6 py-2 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-900/50 font-['Audiowide']">CLOSE VISUAL LINK</button>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [caller, setCaller] = useState<CallerIdentity>(POTENTIAL_CALLERS[0]);
  const [isGlitching, setIsGlitching] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [permissionError, setPermissionError] = useState<boolean>(false);
  
  // Photo Logic State
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  
  // Track received photo content specifically
  const [receivedPhotoData, setReceivedPhotoData] = useState<{description: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Gemini & Memory Logic Refs
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); 
  const currentHistoryRef = useRef<HistoryItem[]>([]); 
  const currentCallerIdRef = useRef<string>(POTENTIAL_CALLERS[0].id); // Track current caller ID for safe saving
  
  // Track start time to prevent immediate hangup hallucination
  const startTimeRef = useRef<number>(0);

  // Initialize scores
  useEffect(() => {
    const newScores: { [key: string]: number } = {};
    ['ex_partner', 'friend_sam', 'master_missy'].forEach(id => {
       const s = parseInt(localStorage.getItem(`relationship_score_${id}`) || '1');
       newScores[id] = s;
    });
    setScores(newScores);
  }, []);

  // --- INSTABILITY SIMULATION ---
  useEffect(() => {
    if (appState !== AppState.CONNECTED) {
      setIsGlitching(false);
      return;
    }

    const triggerGlitch = () => {
      const duration = 200 + Math.random() * 800; 
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), duration);
    };

    const loop = setInterval(() => {
      if (Math.random() > 0.65) { 
         triggerGlitch();
      }
    }, 4000);

    return () => clearInterval(loop);
  }, [appState]);


  // --- MEMORY SYSTEM ---
  const saveMemory = useCallback((callerId: string) => {
    if (currentHistoryRef.current.length === 0) return;
    
    // Save Context History
    const recentHistory = currentHistoryRef.current.slice(-15);
    const summary = recentHistory.map(h => `${h.role}: ${h.text}`).join('\n');
    localStorage.setItem(`memory_${callerId}`, summary);
    
    // Increment Relationship Score
    // Only increment if there was actual conversation (length > 2)
    if (currentHistoryRef.current.length > 2) {
        const currentScore = parseInt(localStorage.getItem(`relationship_score_${callerId}`) || '0');
        const nextScore = Math.min(currentScore + 1, MAX_RELATIONSHIP_SCORE);
        
        localStorage.setItem(`relationship_score_${callerId}`, nextScore.toString());
        
        // Update state to reflect immediately
        setScores(prev => ({
            ...prev,
            [callerId]: nextScore
        }));
        
        console.log(`Relationship level for ${callerId} increased to ${nextScore}`);
    }

    currentHistoryRef.current = [];
  }, []);

  const loadMemory = useCallback((callerId: string) => {
    const memory = localStorage.getItem(`memory_${callerId}`) || "No previous contact recorded.";
    const score = parseInt(localStorage.getItem(`relationship_score_${callerId}`) || '1');
    return { memory, score };
  }, []);

  // --- RANDOM CALL SYSTEM ---
  const prepareRandomCaller = useCallback(() => {
      const rand = Math.random();
      
      // 40% Chance Missy or Legacy Character (Villain/Legacy)
      if (rand > 0.60) {
         // Combine Villains (Missy) and Legacy (River, Davros, etc.)
         const specialCallers = POTENTIAL_CALLERS.filter(c => c.type === 'VILLAIN' || c.type === 'LEGACY');
         const selected = specialCallers[Math.floor(Math.random() * specialCallers.length)];

         if (selected && selected.scenarios) {
             const randomScenario = selected.scenarios[Math.floor(Math.random() * selected.scenarios.length)];
             setCaller({
                 ...selected,
                 currentScenario: randomScenario
             });
         }
      } 
      // 20% Chance Doctor
      else if (rand > 0.40) {
         const randomAdventure = DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)];
         setCaller({
            ...POTENTIAL_CALLERS[0],
            adventure: randomAdventure
         });
      }
      // 20% Chance Earth Caller
      else if (rand > 0.20) {
         const earthCallers = POTENTIAL_CALLERS.filter(c => c.type === 'EARTH');
         const selected = earthCallers[Math.floor(Math.random() * earthCallers.length)];
         
         const isWeird = Math.random() > 0.6;
         let adventure = undefined;
         let currentScenario = undefined;
         
         if (isWeird) {
             adventure = EARTH_WEIRD_EVENTS[Math.floor(Math.random() * EARTH_WEIRD_EVENTS.length)];
         } else if (selected.scenarios && selected.scenarios.length > 0) {
             // Pick a random scenario from the pool
             currentScenario = selected.scenarios[Math.floor(Math.random() * selected.scenarios.length)];
         }

         setCaller({
             ...selected,
             adventure: adventure,
             currentScenario: currentScenario
         });
      } 
      // 20% Chance VIP (increased for variety)
      else {
         const vip = VIP_CALLERS[Math.floor(Math.random() * VIP_CALLERS.length)];
         // Select a dynamic scenario for the specific VIP ID
         const scenarios = VIP_SCENARIOS[vip.id as keyof typeof VIP_SCENARIOS];
         const randomScenario = scenarios ? scenarios[Math.floor(Math.random() * scenarios.length)] : "Unknown crisis.";
         
         setCaller({
             ...vip,
             currentScenario: randomScenario
         });
      }
  }, []);

  useEffect(() => {
    if (appState === AppState.IDLE) {
      // 30s to 90s delay
      const randomTime = Math.random() * 60000 + 30000; 
      const timeout = setTimeout(() => {
        prepareRandomCaller();
        setAppState(AppState.INCOMING_CALL);
      }, randomTime);
      return () => clearTimeout(timeout);
    }
  }, [appState, prepareRandomCaller]);

  const stopAudio = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { console.debug(e); }
      sessionRef.current = null;
    }
    
    // Save memory for the caller that was just active
    saveMemory(currentCallerIdRef.current);

    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch(e) {}
      sourceRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
      } catch(e) {}
      scriptProcessorRef.current = null;
    }

    if (inputAudioContextRef.current) {
      try { inputAudioContextRef.current.close(); } catch(e) {}
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try { outputAudioContextRef.current.close(); } catch(e) {}
      outputAudioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    nextStartTimeRef.current = 0;
  }, [saveMemory]);

  const handleEndCall = useCallback(() => {
    const duration = Date.now() - startTimeRef.current;
    
    // Safety check: If call ends within 5 seconds, it might be a connection drop.
    // However, if we are here, we must cleanup.
    console.log(`Call ended. Duration: ${duration}ms`);

    stopAudio();
    setAppState(AppState.IDLE);
    setPendingPhoto(null);
    setReceivedPhotoData(null);
    setTimeout(() => {
      setCaller(POTENTIAL_CALLERS[0]);
    }, 1000); 
  }, [stopAudio]);

  const startConversation = async (specificCaller?: CallerIdentity) => {
    try {
      setAppState(AppState.CONNECTING);
      setPermissionError(false);
      startTimeRef.current = Date.now();
      
      const activeCaller = specificCaller || caller;
      setCaller(activeCaller);
      currentCallerIdRef.current = activeCaller.id; // Store ID for safe saving later

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Explicit try/catch for microphone permission
      let stream: MediaStream;
      try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          streamRef.current = stream;
      } catch (err) {
          console.error("Microphone permission denied:", err);
          setPermissionError(true);
          setAppState(AppState.IDLE);
          return;
      }

      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      await inputCtx.resume();
      await outputCtx.resume();

      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;
      
      // LOAD SPECIFIC MEMORY AND SCORE
      const { memory, score } = loadMemory(activeCaller.id);
      console.log(`Loading profile for ${activeCaller.name}: Score ${score}`);

      const systemInstruction = getSystemInstruction(activeCaller, memory, score);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Connection Established");
            setAppState(AppState.CONNECTED);

            // 1. IF USER SENT A PHOTO, SEND IT IMMEDIATELY
            if (activeCaller.initialImage) {
                 const imageBlob = {
                     mimeType: "image/jpeg",
                     data: activeCaller.initialImage
                 };
                 // Send image frame
                 sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: imageBlob });
                 });
                 // Reset after sending
                 setPendingPhoto(null);
            }

            // 2. SEND SILENCE TO WAKE UP MODEL (Force it to speak first)
            // INCREASED DELAY AND BUFFER SIZE TO PREVENT IMMEDIATE DISCONNECT
            setTimeout(() => {
              // 1 second of silence to ensure VAD detects activity
              const silence = new Float32Array(16000); 
              const pcmBlob = createBlob(silence);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(e => console.warn("Failed to send initial silence", e));
            }, 500); // 500ms delay

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              }).catch(e => {
                // Suppress errors during disconnect
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // TOOL HANDLING (RECEIVE PHOTO)
            if (message.toolCall) {
                const calls = message.toolCall.functionCalls;
                if (calls) {
                    calls.forEach(call => {
                        if (call.name === 'sendPhoto') {
                            const description = (call.args as any)?.description || "Unknown visual data";
                            setReceivedPhotoData({ description });
                            sessionPromise.then(s => s.sendToolResponse({
                                functionResponses: {
                                    id: call.id,
                                    name: call.name,
                                    response: { result: "Image received on psychic paper." }
                                }
                            }));
                        }
                    });
                }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               if (!outputCtx) return;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
               const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
               const node = outputCtx.createBufferSource();
               node.buffer = audioBuffer;
               node.connect(outputCtx.destination);
               node.addEventListener('ended', () => {
                 sourcesRef.current.delete(node);
               });
               node.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(node);
            }

            const modelText = message.serverContent?.outputTranscription?.text;
            if (modelText) currentHistoryRef.current.push({ role: 'model', text: modelText });
            
            const userText = message.serverContent?.inputTranscription?.text;
            if (userText) currentHistoryRef.current.push({ role: 'user', text: userText });

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            
            // Check for turn completion - if model ended turn without hanging up, that's good.
            // If the server sends a close signal or similar, onclose will trigger.
          },
          onclose: () => {
             console.log("Connection Closed by Server");
             // Prevent immediate hangup loop:
             // If connection closes too fast (server error), we just handle end call.
             // We can't really force it open.
             handleEndCall();
          },
          onerror: (err) => {
             console.error("Connection Error", err);
          }
        },
        config: {
          tools: [{ functionDeclarations: [SEND_PHOTO_TOOL] }],
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activeCaller.voiceName || 'Puck' } }
          },
          // Correctly wrapped System Instruction for schema validation
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }
      });
      
      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error("Failed to start conversation:", error);
      setAppState(AppState.ERROR);
      stopAudio();
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
  };

  const handleAnswerCall = () => {
    startConversation();
  };

  // --- PHOTO UPLOAD HANDLING ---
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (event.target.files && event.target.files[0]) {
         const file = event.target.files[0];
         const reader = new FileReader();
         reader.onloadend = () => {
             const base64String = reader.result as string;
             // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
             const base64Data = base64String.split(',')[1];
             setPendingPhoto(base64Data);
             setShowRecipientModal(true);
         };
         reader.readAsDataURL(file);
     }
  };

  const handlePhotoRecipientSelect = (callerId: string) => {
      setShowRecipientModal(false);
      
      // Find the caller
      let selectedCaller = POTENTIAL_CALLERS.find(c => c.id === callerId);
      if (!selectedCaller) selectedCaller = POTENTIAL_CALLERS[0]; // Fallback to Doctor

      // If needed, assign a random scenario if not Doctor
      let activeCaller = { ...selectedCaller };
      if (activeCaller.scenarios && activeCaller.scenarios.length > 0) {
          const randScenario = activeCaller.scenarios[Math.floor(Math.random() * activeCaller.scenarios.length)];
          activeCaller = { ...activeCaller, currentScenario: randScenario };
      } else if (activeCaller.type === 'DOCTOR') {
          activeCaller = { ...activeCaller, adventure: DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)] };
      }

      // Attach image
      activeCaller.initialImage = pendingPhoto || undefined;
      
      // Start call
      startConversation(activeCaller);
  };

  const handleRequestPhoto = () => {
      if (sessionRef.current) {
          // Trigger visual cue only; Gemini Live text injection is limited.
          // We rely on user voice or tool use initiated by the user's verbal request.
          // This button acts as a user intent signal if we could inject text, but for now it is visual.
      }
  };
  
  const handleManualCall = () => {
    const doctor = POTENTIAL_CALLERS[0];
    const randomAdventure = DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)];
    const activeDoctor = { ...doctor, adventure: randomAdventure };
    startConversation(activeDoctor);
  };

  const handleCallEx = () => {
    const exPartner = POTENTIAL_CALLERS.find(c => c.id === 'ex_partner');
    if (exPartner && exPartner.scenarios) {
        const randomScenario = exPartner.scenarios[Math.floor(Math.random() * exPartner.scenarios.length)];
        const activeEx = { ...exPartner, currentScenario: randomScenario };
        startConversation(activeEx);
    }
  };

  const handleCallFriend = () => {
    const friend = POTENTIAL_CALLERS.find(c => c.id === 'friend_sam');
    if (friend && friend.scenarios) {
        const randomScenario = friend.scenarios[Math.floor(Math.random() * friend.scenarios.length)];
        const activeFriend = { ...friend, currentScenario: randomScenario };
        startConversation(activeFriend);
    }
  };

  const handleCallMaster = () => {
    const master = POTENTIAL_CALLERS.find(c => c.id === 'master_missy');
    if (master && master.scenarios) {
        const randomScenario = master.scenarios[Math.floor(Math.random() * master.scenarios.length)];
        const activeMaster = { ...master, currentScenario: randomScenario };
        startConversation(activeMaster);
    }
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center text-white transition-all duration-100 ${isGlitching ? 'translate-x-1 grayscale' : ''}`}>
      <div className="absolute inset-0 z-50 crt-overlay h-full w-full pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black"></div>
      <GhostTardis />

      {/* MODALS */}
      {showRecipientModal && (
        <RecipientSelector 
            onSelect={handlePhotoRecipientSelect} 
            onCancel={() => { setShowRecipientModal(false); setPendingPhoto(null); }} 
        />
      )}
      
      {receivedPhotoData && (
         <ReceivedPhotoOverlay 
           description={receivedPhotoData.description} 
           onClose={() => setReceivedPhotoData(null)} 
         />
      )}
      
      {permissionError && (
          <div className="absolute top-10 z-50 bg-red-900 border border-red-500 text-white p-4 rounded shadow-lg max-w-sm text-center">
              <p className="font-bold mb-2">MICROPHONE ACCESS DENIED</p>
              <p className="text-sm">TARDIS communications require audio input. Please allow microphone access in your browser settings and try again.</p>
              <button onClick={() => setPermissionError(false)} className="mt-4 px-4 py-1 bg-red-700 rounded text-xs">DISMISS</button>
          </div>
      )}

      {/* HIDDEN FILE INPUT */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="relative z-20 w-full max-w-4xl h-full flex flex-col items-center justify-between py-12">
        
        {/* Header */}
        <div className="text-center space-y-2 mt-8">
           <h1 className={`text-4xl md:text-6xl font-['Audiowide'] text-cyan-400 tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.5)] ${isGlitching ? 'opacity-50 blur-sm' : ''}`}>
             T.A.R.D.I.S.
           </h1>
           <p className="text-sm font-['Share_Tech_Mono'] text-blue-200 uppercase tracking-[0.2em]">
             Type 40 • Time Travel Capsule • Audio Link
           </p>
           {isGlitching && (
              <p className="text-red-500 font-bold animate-pulse text-xs bg-black/80 inline-block px-2">
                 ⚠ SIGNAL UNSTABLE ⚠
              </p>
           )}
        </div>

        {/* Central Visualization */}
        <div className="relative w-80 h-80 flex items-center justify-center">
           <div className={`absolute w-full h-full border-4 border-cyan-900/30 rounded-full animate-[spin_10s_linear_infinite] ${isGlitching ? 'border-red-900/50' : ''}`}></div>
           <div className="absolute w-3/4 h-3/4 border-2 border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
           
           <ParticleVisualizer 
              analyser={analyserRef.current} 
              isActive={appState === AppState.CONNECTED}
              isGlitching={isGlitching}
           />
           
           <div className="absolute z-20 text-center pointer-events-none">
              {appState === AppState.IDLE && (
                 <span className="text-blue-500/50 text-xs animate-pulse">Awaiting Input...</span>
              )}
              {appState === AppState.CONNECTING && (
                 <span className="text-orange-400 text-lg animate-pulse font-bold">MATERIALIZING...</span>
              )}
              {appState === AppState.INCOMING_CALL && (
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-red-500 rounded-full animate-ping absolute opacity-20"></div>
                    <span className="text-red-500 font-bold text-xl animate-bounce">INCOMING TRANSMISSION</span>
                    <span className="text-sm text-red-300 font-mono border border-red-900 bg-black/50 px-2 py-1 rounded">
                       ORIGIN: {caller.name.toUpperCase()}
                    </span>
                 </div>
              )}
              {appState === AppState.CONNECTED && (
                 <div className="flex flex-col items-center gap-1">
                    <span className={`${isGlitching ? 'text-red-500' : 'text-cyan-300'} font-bold tracking-widest text-xs transition-colors`}>
                       {isGlitching ? 'SIGNAL CRITICAL' : 'LINK ESTABLISHED'}
                    </span>
                    <span className="text-cyan-600 text-[10px]">{caller.name}</span>
                 </div>
              )}
           </div>
        </div>

        {/* Controls Section */}
        <div className="w-full max-w-md p-6 border border-cyan-900/50 bg-black/40 backdrop-blur-sm rounded-xl">
           <div className="flex justify-center items-center gap-6">
              
              {appState === AppState.IDLE && (
                <>
                    {/* DOCTOR */}
                    <div className="flex flex-col items-center justify-end h-full">
                       <button 
                        onClick={handleManualCall}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                        aria-label="Call The Doctor"
                      >
                        <div className="w-16 h-16 rounded-full bg-cyan-900 border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all">
                          <PhoneIcon />
                        </div>
                        <span className="text-cyan-400 font-bold tracking-widest text-[10px] group-hover:text-cyan-200">DOCTOR</span>
                      </button>
                    </div>

                    {/* UPLOAD PHOTO BUTTON */}
                    <div className="flex flex-col items-center justify-end h-full">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                        aria-label="Send Photo"
                      >
                        <div className="w-16 h-16 rounded-full bg-blue-900 border-4 border-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.3)] group-hover:shadow-[0_0_50px_rgba(96,165,250,0.6)] transition-all">
                          <CameraIcon />
                        </div>
                        <span className="text-blue-400 font-bold tracking-widest text-[10px] group-hover:text-blue-200">SEND IMG</span>
                      </button>
                    </div>

                    {/* BESTIE */}
                    <div className="flex flex-col items-center justify-end h-full">
                      <AffectionMeter score={scores['friend_sam'] || 1} color="bg-pink-500" />
                      <button 
                        onClick={handleCallFriend}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                        aria-label="Call Bestie"
                      >
                        <div className="w-16 h-16 rounded-full bg-pink-900 border-4 border-pink-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)] group-hover:shadow-[0_0_50px_rgba(244,114,182,0.6)] transition-all">
                          <StarIcon />
                        </div>
                        <span className="text-pink-400 font-bold tracking-widest text-[10px] group-hover:text-pink-200">BESTIE</span>
                      </button>
                    </div>

                    {/* EX */}
                    <div className="flex flex-col items-center justify-end h-full">
                      <AffectionMeter score={scores['ex_partner'] || 1} color="bg-purple-500" />
                      <button 
                        onClick={handleCallEx}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                        aria-label="Call Ex"
                      >
                        <div className="w-16 h-16 rounded-full bg-purple-900 border-4 border-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(192,132,252,0.3)] group-hover:shadow-[0_0_50px_rgba(192,132,252,0.6)] transition-all">
                          <BrokenHeartIcon />
                        </div>
                        <span className="text-purple-400 font-bold tracking-widest text-[10px] group-hover:text-purple-200">EX</span>
                      </button>
                    </div>

                    {/* MISSY */}
                    <div className="flex flex-col items-center justify-end h-full">
                      <AffectionMeter score={scores['master_missy'] || 1} color="bg-green-500" />
                      <button 
                        onClick={handleCallMaster}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                        aria-label="Call Missy"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-900 border-4 border-green-400 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)] group-hover:shadow-[0_0_50px_rgba(74,222,128,0.6)] transition-all">
                          <SkullIcon />
                        </div>
                        <span className="text-green-400 font-bold tracking-widest text-[10px] group-hover:text-green-200">MISSY</span>
                      </button>
                    </div>
                </>
              )}

              {appState === AppState.INCOMING_CALL && (
                <button 
                  onClick={handleAnswerCall}
                  className="group relative flex flex-col items-center gap-2 animate-bounce"
                >
                  <div className="w-24 h-24 rounded-full bg-orange-600 border-4 border-orange-400 flex items-center justify-center shadow-[0_0_30px_rgba(255,165,0,0.6)]">
                     <PhoneIcon />
                  </div>
                  <span className="text-orange-400 font-bold tracking-widest text-sm">ANSWER</span>
                </button>
              )}

              {(appState === AppState.CONNECTED || appState === AppState.CONNECTING) && (
                <>
                <button 
                  onClick={handleEndCall}
                  className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                >
                  <div className="w-20 h-20 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]">
                     <PhoneOffIcon />
                  </div>
                  <span className="text-red-500 font-bold tracking-widest text-xs">SEVER LINK</span>
                </button>
                
                {/* REQUEST PHOTO BUTTON (VISUAL CUE) */}
                <button 
                  onClick={handleRequestPhoto}
                  className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105"
                  title="Ask for a photo (Speak: 'Send me a photo')"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-900/50 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                     <DownloadIcon />
                  </div>
                  <span className="text-cyan-400 font-bold tracking-widest text-[8px]">REQ IMG</span>
                </button>
                </>
              )}

           </div>

           <div className="mt-6 border-t border-cyan-900/50 pt-4">
              <div className="flex justify-between text-xs text-cyan-600 font-mono">
                <span>FREQ: {isGlitching ? 'DRIFTING...' : (appState === AppState.CONNECTED ? 'LOCKED' : 'SCANNING')}</span>
                <span>CHRONO: {new Date().toLocaleTimeString()}</span>
              </div>
           </div>
        </div>

      </div>
      
      {appState === AppState.ERROR && (
        <div className="absolute bottom-10 bg-red-900/80 border border-red-500 text-white px-6 py-4 rounded animate-pulse z-50">
           CRITICAL ERROR IN PSYCHIC PAPER. PLEASE REFRESH.
        </div>
      )}
    </div>
  );
};

export default App;
