
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage } from '@google/genai';
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
import { PixelAvatar, AvatarEditor, AvatarConfig, DEFAULT_AVATAR } from './components/PixelAvatar';
import { ContactEditor } from './components/ContactEditor';
import { FishGame } from './components/FishGame';
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
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);
const GamepadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
);

// --- LONG PRESS BUTTON COMPONENT ---
interface LongPressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onLongPress: () => void;
}

const LongPressButton: React.FC<LongPressButtonProps> = ({ onClick, onLongPress, children, ...props }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<any>(null);

  const startPress = useCallback(() => {
    setIsPressing(true);
    setIsLongPress(false);
    timerRef.current = window.setTimeout(() => {
      setIsLongPress(true);
      onLongPress();
    }, 800); 
  }, [onLongPress]);

  const endPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Only trigger regular click if it wasn't a long press
    if (!isLongPress && onClick) {
      onClick(e as any);
    }
  }, [isLongPress, onClick]);

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      {...props}
    >
      {children}
    </button>
  );
};

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
         <button onClick={() => onSelect('doctor')} className="p-4 border border-cyan-500 bg-cyan-900/30 hover:bg-cyan-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-cyan-300 font-bold">THE DOCTOR</span>
         </button>
         <button onClick={() => onSelect('master_missy')} className="p-4 border border-green-500 bg-green-900/30 hover:bg-green-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-green-300 font-bold">MISSY</span>
         </button>
         <button onClick={() => onSelect('ex_partner')} className="p-4 border border-purple-500 bg-purple-900/30 hover:bg-purple-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-purple-300 font-bold">EX</span>
         </button>
         <button onClick={() => onSelect('friend_sam')} className="p-4 border border-pink-500 bg-pink-900/30 hover:bg-pink-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-pink-300 font-bold">BESTIE</span>
         </button>
         <button onClick={() => onSelect('river_song')} className="p-4 border border-yellow-500 bg-yellow-900/30 hover:bg-yellow-800/50 rounded flex flex-col items-center hover:scale-105 transition-all col-span-2">
             <span className="text-yellow-300 font-bold">RIVER SONG</span>
         </button>
       </div>
       <button onClick={onCancel} className="mt-8 text-red-400 hover:text-red-200 uppercase tracking-widest text-sm hover:underline">Cancel Transmission</button>
    </div>
  );
};

const GamePartnerSelector = ({ onSelect, onCancel }: { onSelect: (callerId: string) => void, onCancel: () => void }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-fade-in">
       <h3 className="text-xl font-['Audiowide'] text-cyan-400 mb-6 tracking-widest">SELECT GAME PARTNER:</h3>
       <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
         <button onClick={() => onSelect('doctor')} className="p-4 border border-cyan-500 bg-cyan-900/30 hover:bg-cyan-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-cyan-300 font-bold">THE DOCTOR</span>
         </button>
         <button onClick={() => onSelect('master_missy')} className="p-4 border border-green-500 bg-green-900/30 hover:bg-green-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-green-300 font-bold">MISSY</span>
         </button>
         <button onClick={() => onSelect('friend_sam')} className="p-4 border border-pink-500 bg-pink-900/30 hover:bg-pink-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-pink-300 font-bold">BESTIE</span>
         </button>
         <button onClick={() => onSelect('river_song')} className="p-4 border border-yellow-500 bg-yellow-900/30 hover:bg-yellow-800/50 rounded flex flex-col items-center hover:scale-105 transition-all">
             <span className="text-yellow-300 font-bold">RIVER</span>
         </button>
         <button onClick={() => onSelect('ex_partner')} className="p-4 border border-purple-500 bg-purple-900/30 hover:bg-purple-800/50 rounded flex flex-col items-center hover:scale-105 transition-all col-span-2">
             <span className="text-purple-300 font-bold">EX</span>
         </button>
       </div>
       <button onClick={onCancel} className="mt-8 text-red-400 hover:text-red-200 uppercase tracking-widest text-sm hover:underline">Cancel Game</button>
    </div>
  );
};

const ReceivedPhotoOverlay = ({ description, onClose, caller }: { description: string, onClose: () => void, caller: CallerIdentity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const text = description.toLowerCase();
  const isSelfie = text.includes('me') || text.includes('selfie') || text.includes('my face') || text.includes('wearing') || text.includes('standing') || text.includes(caller.name.toLowerCase()) || text.includes('i am');

  const getCharacterPreset = (id: string): AvatarConfig => {
    switch(id) {
        case 'master_missy': 
            return { gender: 'female', hairColor: '#000000', skinTone: '#f1c27d', shirtColor: '#8e44ad', pantsColor: '#2c3e50', hairStyle: 3, name: 'Missy' }; 
        case 'doctor':
        case 'eleventh_doctor':
            return { gender: 'male', hairColor: '#8d5524', skinTone: '#ffdbac', shirtColor: '#8e44ad', pantsColor: '#2c3e50', hairStyle: 1, name: 'Doctor' }; 
        case 'ex_partner':
            return { gender: 'male', hairColor: '#f1c40f', skinTone: '#e0ac69', shirtColor: '#34495e', pantsColor: '#000000', hairStyle: 1, name: 'Ex' };
        case 'friend_sam':
            return { gender: 'female', hairColor: '#e74c3c', skinTone: '#c68642', shirtColor: '#2ecc71', pantsColor: '#ecf0f1', hairStyle: 2, name: 'Sam' }; 
        case 'river_song':
            return { gender: 'female', hairColor: '#e0ac69', skinTone: '#ffdbac', shirtColor: '#ecf0f1', pantsColor: '#2c3e50', hairStyle: 2, name: 'River' }; 
        default:
            return DEFAULT_AVATAR;
    }
  };

  const characterConfig = isSelfie ? getCharacterPreset(caller.id) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 64;
    const h = 64;
    canvas.width = w;
    canvas.height = h;

    const t = description.toLowerCase();
    
    let bgColor = "#000";
    if (t.includes('garden') || t.includes('park') || t.includes('tree')) bgColor = "#4d8061";
    else if (t.includes('space') || t.includes('nebula') || t.includes('star')) bgColor = "#1a1025";
    else if (t.includes('fire') || t.includes('danger') || t.includes('red')) bgColor = "#3a1313";
    else if (t.includes('water') || t.includes('ice') || t.includes('rain')) bgColor = "#2b506e";
    else if (t.includes('lab') || t.includes('tech') || t.includes('ship')) bgColor = "#353d42";
    else if (isSelfie) bgColor = "#57606f"; 
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const randInt = (max: number) => Math.floor(Math.random() * max);
    
    if (t.includes('space') || t.includes('star')) {
        for(let i=0; i<30; i++) {
            ctx.fillStyle = Math.random() > 0.8 ? "#fff" : "#ffffff44";
            ctx.fillRect(randInt(w), randInt(h), 1, 1);
        }
        ctx.fillStyle = "#a29bfe";
        const px = randInt(w-10), py = randInt(h-10);
        ctx.fillRect(px, py, 12, 12);
        ctx.fillStyle = "#8076eb";
        ctx.fillRect(px, py+8, 12, 4);
    } 
    else if (t.includes('garden') || t.includes('grass')) {
        ctx.fillStyle = "#2e5a3e";
        for(let i=0; i<40; i++) { ctx.fillRect(randInt(w), randInt(h), 1, 2); }
    }
    else if (!isSelfie) {
        ctx.fillStyle = "#ffffff22";
        for(let i=0; i<h; i+=4) { ctx.fillRect(0, i, w, 1); }
    }

    const gradient = ctx.createRadialGradient(w/2, h/2, w/3, w/2, h/2, w);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, "#00000088");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

  }, [description, isSelfie]);

  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-sm aspect-square border-4 border-cyan-500 bg-gray-900 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full absolute inset-0"
                style={{ imageRendering: 'pixelated' }}
            />
            {characterConfig && (
                <div className="absolute inset-0 flex items-center justify-center z-10 top-4">
                    <PixelAvatar config={characterConfig} scale={8} animate={true} />
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 border-t border-cyan-500 z-20">
               <p className="text-[10px] text-cyan-500 font-mono uppercase mb-1">VISUAL DATA DECODED ({isSelfie ? 'BIOMETRIC SCAN' : 'ENVIRONMENT SCAN'}):</p>
               <p className="text-white font-mono text-sm leading-tight italic">"{description}"</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 animate-[scan-line_3s_linear_infinite] z-20"></div>
        </div>
        <button onClick={onClose} className="mt-6 px-6 py-2 border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-900/50 font-['Audiowide'] hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">CLOSE VISUAL LINK</button>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [caller, setCaller] = useState<CallerIdentity>(POTENTIAL_CALLERS[0]);
  const [isGlitching, setIsGlitching] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [permissionError, setPermissionError] = useState<boolean>(false);
  
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [receivedPhotoData, setReceivedPhotoData] = useState<{description: string} | null>(null);

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const [customContacts, setCustomContacts] = useState<{ [key: string]: { name: string, persona: string } }>({});
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); 
  const currentHistoryRef = useRef<HistoryItem[]>([]); 
  const currentCallerIdRef = useRef<string>(POTENTIAL_CALLERS[0].id); 
  const startTimeRef = useRef<number>(0);
  const cleanupInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    const newScores: { [key: string]: number } = {};
    ['ex_partner', 'friend_sam', 'master_missy', 'river_song'].forEach(id => {
       const s = parseInt(localStorage.getItem(`relationship_score_${id}`) || '1');
       newScores[id] = s;
    });
    setScores(newScores);
    
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
        try { setAvatarConfig(JSON.parse(savedAvatar)); } catch(e) {}
    }

    const savedContacts = localStorage.getItem('custom_contacts');
    if (savedContacts) {
      try { setCustomContacts(JSON.parse(savedContacts)); } catch(e) {}
    }
  }, []);

  const saveAvatar = (config: AvatarConfig) => {
      setAvatarConfig(config);
      localStorage.setItem('user_avatar', JSON.stringify(config));
  };

  const handleSaveContact = (id: string, name: string, persona: string) => {
    const updated = { ...customContacts, [id]: { name, persona } };
    setCustomContacts(updated);
    localStorage.setItem('custom_contacts', JSON.stringify(updated));
    setEditingContactId(null);
  };

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
      if (Math.random() > 0.65) triggerGlitch();
    }, 4000);
    return () => clearInterval(loop);
  }, [appState]);

  const saveMemory = useCallback((callerId: string) => {
    if (currentHistoryRef.current.length === 0) return;
    const recentHistory = currentHistoryRef.current.slice(-15);
    const summary = recentHistory.map(h => `${h.role}: ${h.text}`).join('\n');
    localStorage.setItem(`memory_${callerId}`, summary);
    
    if (currentHistoryRef.current.length > 2) {
        const currentScore = parseInt(localStorage.getItem(`relationship_score_${callerId}`) || '0');
        const nextScore = Math.min(currentScore + 1, MAX_RELATIONSHIP_SCORE);
        localStorage.setItem(`relationship_score_${callerId}`, nextScore.toString());
        setScores(prev => ({ ...prev, [callerId]: nextScore }));
    }
    currentHistoryRef.current = [];
  }, []);

  const loadMemory = useCallback((callerId: string) => {
    const memory = localStorage.getItem(`memory_${callerId}`) || "No previous contact recorded.";
    const score = parseInt(localStorage.getItem(`relationship_score_${callerId}`) || '1');
    return { memory, score };
  }, []);

  const prepareRandomCaller = useCallback(() => {
      const rand = Math.random();
      if (rand > 0.60) {
         const specialCallers = POTENTIAL_CALLERS.filter(c => c.type === 'VILLAIN' || c.type === 'LEGACY');
         const selected = specialCallers[Math.floor(Math.random() * specialCallers.length)];
         if (selected && selected.scenarios) {
             const randomScenario = selected.scenarios[Math.floor(Math.random() * selected.scenarios.length)];
             setCaller({ ...selected, currentScenario: randomScenario });
         }
      } 
      else if (rand > 0.40) {
         const randomAdventure = DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)];
         setCaller({ ...POTENTIAL_CALLERS[0], adventure: randomAdventure });
      }
      else if (rand > 0.20) {
         const earthCallers = POTENTIAL_CALLERS.filter(c => c.type === 'EARTH');
         const selected = earthCallers[Math.floor(Math.random() * earthCallers.length)];
         
         let activeCaller = { ...selected };
         const customData = customContacts[selected.id];
         if (customData) {
            activeCaller.name = customData.name;
            activeCaller.customPersona = customData.persona;
         }

         const isWeird = Math.random() > 0.6;
         let adventure = undefined;
         let currentScenario = undefined;
         if (isWeird) {
             adventure = EARTH_WEIRD_EVENTS[Math.floor(Math.random() * EARTH_WEIRD_EVENTS.length)];
         } else if (activeCaller.scenarios && activeCaller.scenarios.length > 0) {
             currentScenario = activeCaller.scenarios[Math.floor(Math.random() * activeCaller.scenarios.length)];
         }
         
         setCaller({ ...activeCaller, adventure: adventure, currentScenario: currentScenario });
      } 
      else {
         const vip = VIP_CALLERS[Math.floor(Math.random() * VIP_CALLERS.length)];
         const scenarios = VIP_SCENARIOS[vip.id as keyof typeof VIP_SCENARIOS];
         const randomScenario = scenarios ? scenarios[Math.floor(Math.random() * scenarios.length)] : "Unknown crisis.";
         setCaller({ ...vip, currentScenario: randomScenario });
      }
  }, [customContacts]);

  useEffect(() => {
    if (appState === AppState.IDLE) {
      const randomTime = Math.random() * 60000 + 30000; 
      const timeout = setTimeout(() => {
        prepareRandomCaller();
        setAppState(AppState.INCOMING_CALL);
      }, randomTime);
      return () => clearTimeout(timeout);
    }
  }, [appState, prepareRandomCaller]);

  const stopAudio = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { console.debug(e); }
      sessionRef.current = null;
    }
    
    saveMemory(currentCallerIdRef.current);

    sourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
    sourcesRef.current.clear();

    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch(e) {} sourceRef.current = null; }
    if (scriptProcessorRef.current) { try { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current.onaudioprocess = null; } catch(e) {} scriptProcessorRef.current = null; }
    if (inputAudioContextRef.current) { try { inputAudioContextRef.current.close(); } catch(e) {} inputAudioContextRef.current = null; }
    if (outputAudioContextRef.current) { try { outputAudioContextRef.current.close(); } catch(e) {} outputAudioContextRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }

    analyserRef.current = null;
    nextStartTimeRef.current = 0;
    cleanupInProgressRef.current = false;
  }, [saveMemory]);

  const handleEndCall = useCallback(() => {
    // Check if the call was incredibly short (likely a connection drop/glitch)
    // If so, we log it but proceed to reset. To be safer, we could auto-retry or just warn.
    const duration = Date.now() - startTimeRef.current;
    if (duration < 1000) {
       console.warn("Call ended too quickly (likely connection drop). Resetting UI.");
    }

    console.log(`Call ending. Duration: ${duration}ms`);
    stopAudio();
    setAppState(AppState.IDLE);
    setPendingPhoto(null);
    setReceivedPhotoData(null);
    setIsGameActive(false); 
    setTimeout(() => { setCaller(POTENTIAL_CALLERS[0]); }, 1000); 
  }, [stopAudio]);

  const startConversation = async (specificCaller?: CallerIdentity, isGameMode: boolean = false) => {
    try {
      setAppState(AppState.CONNECTING);
      setPermissionError(false);
      startTimeRef.current = Date.now();
      
      let activeCaller = specificCaller || caller;
      
      const customData = customContacts[activeCaller.id];
      if (customData) {
        activeCaller = { ...activeCaller, name: customData.name, customPersona: customData.persona };
      }

      setCaller(activeCaller);
      currentCallerIdRef.current = activeCaller.id; 

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let stream: MediaStream;
      try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
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
      
      const { memory, score } = loadMemory(activeCaller.id);
      const userName = avatarConfig.name || "Traveler";
      const systemInstructionText = getSystemInstruction(activeCaller, memory, score, userName, isGameMode);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Connection Established");
            setAppState(AppState.CONNECTED);
            if (isGameMode) setIsGameActive(true);

            if (activeCaller.initialImage) {
                 sessionPromise.then(session => session.sendRealtimeInput({ media: { mimeType: "image/jpeg", data: activeCaller.initialImage } }));
                 setPendingPhoto(null);
            }

            setTimeout(() => {
               sessionPromise.then(session => {
                   // A. Send Silence to wake up VAD
                   const silence = new Float32Array(16000);
                   session.sendRealtimeInput({ media: createBlob(silence) });

                   // B. Send Text Trigger to force model turn
                   session.sendRealtimeInput({
                       clientContent: {
                           turns: [{ role: 'user', parts: [{ text: isGameMode ? "The user is starting the game NOW. Start commentating!" : "The user has picked up the phone. Speak immediately." }] }],
                           turnComplete: true
                       }
                   });
               });
            }, 200);

            scriptProcessor.onaudioprocess = (e) => {
              if (cleanupInProgressRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: createBlob(inputData) });
              }).catch(() => {});
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
                const calls = message.toolCall.functionCalls;
                if (calls) {
                    calls.forEach(call => {
                        if (call.name === 'sendPhoto') {
                            const description = (call.args as any)?.description || "Unknown visual data";
                            setReceivedPhotoData({ description });
                            sessionPromise.then(s => s.sendToolResponse({
                                functionResponses: { id: call.id, name: call.name, response: { result: "Image received." } }
                            }));
                        }
                    });
                }
            }
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
               if (!outputCtx) return;
               const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
               const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
               const node = outputCtx.createBufferSource();
               node.buffer = audioBuffer;
               node.connect(outputCtx.destination);
               node.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
            }
            if (message.serverContent?.outputTranscription?.text) currentHistoryRef.current.push({ role: 'model', text: message.serverContent.outputTranscription.text });
            if (message.serverContent?.inputTranscription?.text) currentHistoryRef.current.push({ role: 'user', text: message.serverContent.inputTranscription.text });
            if (message.serverContent?.interrupted) nextStartTimeRef.current = 0;
          },
          onclose: () => {
             console.log("Connection Closed by Server");
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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: activeCaller.voiceName || 'Puck' } } },
          // Unwrapped system instruction for better stability
          systemInstruction: systemInstructionText,
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

  const handleAnswerCall = () => { startConversation(); };
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (event.target.files && event.target.files[0]) {
         const reader = new FileReader();
         reader.onloadend = () => { setPendingPhoto((reader.result as string).split(',')[1]); setShowRecipientModal(true); };
         reader.readAsDataURL(event.target.files[0]);
     }
  };
  const handlePhotoRecipientSelect = (callerId: string) => {
      setShowRecipientModal(false);
      let selectedCaller = POTENTIAL_CALLERS.find(c => c.id === callerId) || POTENTIAL_CALLERS[0];
      let activeCaller = { ...selectedCaller };
      if (activeCaller.scenarios && activeCaller.scenarios.length > 0) {
          activeCaller = { ...activeCaller, currentScenario: activeCaller.scenarios[Math.floor(Math.random() * activeCaller.scenarios.length)] };
      } else if (activeCaller.type === 'DOCTOR') {
          activeCaller = { ...activeCaller, adventure: DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)] };
      }
      activeCaller.initialImage = pendingPhoto || undefined;
      startConversation(activeCaller);
  };

  const handleGamePartnerSelect = (callerId: string) => {
      setShowGameSelector(false);
      let selectedCaller = POTENTIAL_CALLERS.find(c => c.id === callerId) || POTENTIAL_CALLERS[0];
      startConversation(selectedCaller, true); 
  };

  const handleGameEvent = (eventText: string) => {
      if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
              clientContent: {
                  turns: [{ role: 'user', parts: [{ text: `[GAME EVENT]: ${eventText}` }] }],
                  turnComplete: true
              }
          });
      }

      if (eventText.includes("leveled up")) {
          const id = currentCallerIdRef.current;
          if (['ex_partner', 'friend_sam', 'master_missy', 'river_song'].includes(id)) {
             const currentScore = scores[id] || 1;
             if (currentScore < MAX_RELATIONSHIP_SCORE) {
                 const newScore = currentScore + 1;
                 setScores(prev => ({ ...prev, [id]: newScore }));
                 localStorage.setItem(`relationship_score_${id}`, newScore.toString());
             }
          }
      }
  };

  const handleManualCall = () => {
    const doctor = POTENTIAL_CALLERS[0];
    const activeDoctor = { ...doctor, adventure: DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)] };
    startConversation(activeDoctor);
  };

  const handleCallEx = () => {
    const ex = POTENTIAL_CALLERS.find(c => c.id === 'ex_partner');
    if (ex) {
        let caller = { ...ex };
        if (ex.scenarios) caller.currentScenario = ex.scenarios[Math.floor(Math.random() * ex.scenarios.length)];
        startConversation(caller);
    }
  };
  const handleCallFriend = () => {
    const friend = POTENTIAL_CALLERS.find(c => c.id === 'friend_sam');
    if (friend) {
        let caller = { ...friend };
        if (friend.scenarios) caller.currentScenario = friend.scenarios[Math.floor(Math.random() * friend.scenarios.length)];
        startConversation(caller);
    }
  };
  const handleCallMaster = () => {
    const master = POTENTIAL_CALLERS.find(c => c.id === 'master_missy');
    if (master && master.scenarios) startConversation({ ...master, currentScenario: master.scenarios[Math.floor(Math.random() * master.scenarios.length)] });
  };
  const handleCallRiver = () => {
    const river = POTENTIAL_CALLERS.find(c => c.id === 'river_song');
    if (river && river.scenarios) startConversation({ ...river, currentScenario: river.scenarios[Math.floor(Math.random() * river.scenarios.length)] });
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center text-white transition-all duration-100 ${isGlitching ? 'translate-x-1 grayscale' : ''}`}>
      <div className="absolute inset-0 z-50 crt-overlay h-full w-full pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black"></div>
      <GhostTardis />
      
      {showAvatarEditor && (
        <AvatarEditor 
            config={avatarConfig} 
            onChange={setAvatarConfig} 
            onClose={() => { saveAvatar(avatarConfig); setShowAvatarEditor(false); }} 
        />
      )}

      {showGameSelector && <GamePartnerSelector onSelect={handleGamePartnerSelect} onCancel={() => setShowGameSelector(false)} />}
      {isGameActive && (
          <FishGame 
             onGameEvent={handleGameEvent} 
             onClose={() => { setIsGameActive(false); handleEndCall(); }}
          />
      )}

      {editingContactId && (
        <ContactEditor 
          id={editingContactId}
          initialName={customContacts[editingContactId]?.name || POTENTIAL_CALLERS.find(c => c.id === editingContactId)?.name || ""}
          initialPersona={customContacts[editingContactId]?.persona || ""}
          onSave={handleSaveContact}
          onClose={() => setEditingContactId(null)}
        />
      )}

      {showRecipientModal && ( <RecipientSelector onSelect={handlePhotoRecipientSelect} onCancel={() => { setShowRecipientModal(false); setPendingPhoto(null); }} /> )}
      {receivedPhotoData && ( <ReceivedPhotoOverlay description={receivedPhotoData.description} onClose={() => setReceivedPhotoData(null)} caller={caller} /> )}
      
      {permissionError && (
          <div className="absolute top-10 z-50 bg-red-900 border border-red-500 text-white p-4 rounded shadow-lg max-w-sm text-center">
              <p className="font-bold mb-2">MICROPHONE ACCESS DENIED</p>
              <p className="text-sm">TARDIS communications require audio input. Please allow microphone access in your browser settings and try again.</p>
              <button onClick={() => setPermissionError(false)} className="mt-4 px-4 py-1 bg-red-700 rounded text-xs">DISMISS</button>
          </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      <div className="relative z-20 w-full max-w-4xl h-full flex flex-col items-center justify-between py-12">
        <div className="text-center space-y-2 mt-8">
           <h1 className={`text-4xl md:text-6xl font-['Audiowide'] text-cyan-400 tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.5)] ${isGlitching ? 'opacity-50 blur-sm' : ''}`}>T.A.R.D.I.S.</h1>
           <p className="text-sm font-['Share_Tech_Mono'] text-blue-200 uppercase tracking-[0.2em]">Type 40 • Time Travel Capsule • Audio Link</p>
           {isGlitching && ( <p className="text-red-500 font-bold animate-pulse text-xs bg-black/80 inline-block px-2">⚠ SIGNAL UNSTABLE ⚠</p> )}
        </div>
        
        <div className="relative w-80 h-80 flex items-center justify-center group/rotor">
           <div className={`absolute w-full h-full border-4 border-cyan-900/30 rounded-full animate-[spin_10s_linear_infinite] ${isGlitching ? 'border-red-900/50' : ''} group-hover/rotor:border-cyan-500/40 group-hover/rotor:shadow-[0_0_40px_rgba(34,211,238,0.2)] transition-all duration-500`}></div>
           <div className="absolute w-3/4 h-3/4 border-2 border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse] group-hover/rotor:border-cyan-400/40 transition-all duration-500"></div>
           
           <ParticleVisualizer analyser={analyserRef.current} isActive={appState === AppState.CONNECTED} isGlitching={isGlitching} />
           
           {appState === AppState.IDLE && (
               <div className="absolute z-15 animate-pulse cursor-pointer transition-transform hover:scale-110" onClick={() => setShowAvatarEditor(true)} title="Edit Hologram Identity">
                   <div className="relative flex flex-col items-center">
                       <PixelAvatar config={avatarConfig} scale={3} animate={true} />
                       <span className="text-[8px] text-cyan-600 mt-2 tracking-widest bg-black/50 px-1 rounded border border-cyan-900">PILOT ID</span>
                       <span className="text-[10px] text-white font-mono mt-1 uppercase">{avatarConfig.name || "TRAVELER"}</span>
                   </div>
               </div>
           )}

           <div className="absolute z-20 text-center pointer-events-none">
              {appState === AppState.IDLE && ( <span className="text-blue-500/50 text-xs animate-pulse mt-24 block">Awaiting Input...</span> )}
              {appState === AppState.CONNECTING && ( <span className="text-orange-400 text-lg animate-pulse font-bold">MATERIALIZING...</span> )}
              {appState === AppState.INCOMING_CALL && (
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-red-500 rounded-full animate-ping absolute opacity-20"></div>
                    <span className="text-red-500 font-bold text-xl animate-bounce">INCOMING TRANSMISSION</span>
                    <span className="text-sm text-red-300 font-mono border border-red-900 bg-black/50 px-2 py-1 rounded">ORIGIN: {caller.name.toUpperCase()}</span>
                 </div>
              )}
              {appState === AppState.CONNECTED && (
                 <div className="flex flex-col items-center gap-1">
                    <span className={`${isGlitching ? 'text-red-500' : 'text-cyan-300'} font-bold tracking-widest text-xs transition-colors`}>{isGlitching ? 'SIGNAL CRITICAL' : 'LINK ESTABLISHED'}</span>
                    <span className="text-cyan-600 text-[10px]">{caller.name}</span>
                 </div>
              )}
           </div>
        </div>

        <div className="w-full max-w-md p-6 border border-cyan-900/50 bg-black/40 backdrop-blur-sm rounded-xl">
           <div className="flex justify-center items-center gap-6">
              {appState === AppState.IDLE && (
                <>
                    <div className="flex flex-col items-center justify-end h-full">
                       <button onClick={handleManualCall} className="group relative flex flex-col items-center gap-2 transition-all hover:scale-110 duration-300" aria-label="Call The Doctor">
                        <div className="w-16 h-16 rounded-full bg-cyan-900 border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:shadow-[0_0_50px_rgba(34,211,238,0.8)] group-hover:border-cyan-200 group-hover:bg-cyan-800 transition-all duration-300"><PhoneIcon /></div>
                        <span className="text-cyan-400 font-bold tracking-widest text-[10px] group-hover:text-cyan-100 group-hover:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">DOCTOR</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-col items-center justify-end h-full gap-4">
                      {/* GAME BUTTON */}
                      <button onClick={() => setShowGameSelector(true)} className="group relative flex flex-col items-center gap-2 transition-all hover:scale-110 duration-300" aria-label="Play Game">
                        <div className="w-16 h-16 rounded-full bg-green-900 border-4 border-green-400 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)] group-hover:shadow-[0_0_50px_rgba(74,222,128,0.8)] group-hover:border-green-200 group-hover:bg-green-800 transition-all duration-300"><GamepadIcon /></div>
                        <span className="text-green-400 font-bold tracking-widest text-[10px] group-hover:text-green-100 group-hover:drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]">GAME</span>
                      </button>

                      {/* SEND IMG BUTTON */}
                      <button onClick={() => fileInputRef.current?.click()} className="group relative flex flex-col items-center gap-2 transition-all hover:scale-110 duration-300" aria-label="Send Photo">
                        <div className="w-16 h-16 rounded-full bg-blue-900 border-4 border-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.3)] group-hover:shadow-[0_0_50px_rgba(96,165,250,0.8)] group-hover:border-blue-200 group-hover:bg-blue-800 transition-all duration-300"><CameraIcon /></div>
                        <span className="text-blue-400 font-bold tracking-widest text-[10px] group-hover:text-blue-100 group-hover:drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">SEND IMG</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-col items-center justify-end h-full">
                      <button onClick={handleCallRiver} className="group relative flex flex-col items-center gap-1 transition-all hover:scale-110 duration-300 mb-2" aria-label="Call River Song">
                        <div className="w-12 h-12 rounded-full bg-yellow-900 border-4 border-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] group-hover:shadow-[0_0_50px_rgba(250,204,21,0.8)] group-hover:border-yellow-200 group-hover:bg-yellow-800 transition-all duration-300"><BookIcon /></div>
                        <span className="text-yellow-400 font-bold tracking-widest text-[8px] group-hover:text-yellow-100">RIVER</span>
                      </button>

                      <AffectionMeter score={scores['friend_sam'] || 1} color="bg-pink-500" />
                      <LongPressButton 
                        onClick={handleCallFriend} 
                        onLongPress={() => setEditingContactId('friend_sam')}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-110 duration-300" 
                        aria-label="Call Bestie"
                      >
                        <div className="w-16 h-16 rounded-full bg-pink-900 border-4 border-pink-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)] group-hover:shadow-[0_0_50px_rgba(244,114,182,0.8)] group-hover:border-pink-200 group-hover:bg-pink-800 transition-all duration-300"><StarIcon /></div>
                        <span className="text-pink-400 font-bold tracking-widest text-[10px] group-hover:text-pink-100 group-hover:drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]">
                           {customContacts['friend_sam']?.name || 'BESTIE'}
                        </span>
                      </LongPressButton>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full">
                      <AffectionMeter score={scores['ex_partner'] || 1} color="bg-purple-500" />
                      <LongPressButton 
                        onClick={handleCallEx} 
                        onLongPress={() => setEditingContactId('ex_partner')}
                        className="group relative flex flex-col items-center gap-2 transition-all hover:scale-110 duration-300" 
                        aria-label="Call Ex"
                      >
                        <div className="w-16 h-16 rounded-full bg-purple-900 border-4 border-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(192,132,252,0.3)] group-hover:shadow-[0_0_50px_rgba(192,132,252,0.8)] group-hover:border-purple-200 group-hover:bg-purple-800 transition-all duration-300"><BrokenHeartIcon /></div>
                        <span className="text-purple-400 font-bold tracking-widest text-[10px] group-hover:text-purple-100 group-hover:drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]">
                           {customContacts['ex_partner']?.name || 'EX'}
                        </span>
                      </LongPressButton>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full">
                      <AffectionMeter score={scores['master_missy'] || 1} color="bg-green-500" />
                      <button onClick={handleCallMaster} className="group relative flex flex-col items-center gap-2 transition-all hover:scale-110 duration-300" aria-label="Call Missy">
                        <div className="w-16 h-16 rounded-full bg-green-900 border-4 border-green-400 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)] group-hover:shadow-[0_0_50px_rgba(74,222,128,0.8)] group-hover:border-green-200 group-hover:bg-green-800 transition-all duration-300"><SkullIcon /></div>
                        <span className="text-green-400 font-bold tracking-widest text-[10px] group-hover:text-green-100 group-hover:drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]">MISSY</span>
                      </button>
                    </div>
                </>
              )}
              {appState === AppState.INCOMING_CALL && (
                <button onClick={handleAnswerCall} className="group relative flex flex-col items-center gap-2 animate-bounce">
                  <div className="w-24 h-24 rounded-full bg-orange-600 border-4 border-orange-400 flex items-center justify-center shadow-[0_0_30px_rgba(255,165,0,0.6)] group-hover:shadow-[0_0_60px_rgba(255,165,0,0.9)] group-hover:scale-110 transition-all"><PhoneIcon /></div>
                  <span className="text-orange-400 font-bold tracking-widest text-sm group-hover:text-orange-200">ANSWER</span>
                </button>
              )}
              {(appState === AppState.CONNECTED || appState === AppState.CONNECTING) && (
                <>
                <button onClick={handleEndCall} className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105 duration-300">
                  <div className="w-20 h-20 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] group-hover:border-red-300 group-hover:bg-red-800 transition-all"><PhoneOffIcon /></div>
                  <span className="text-red-500 font-bold tracking-widest text-xs group-hover:text-red-200">SEVER LINK</span>
                </button>
                <button onClick={() => {}} className="group relative flex flex-col items-center gap-2 transition-all hover:scale-105 duration-300" title="Ask for a photo">
                  <div className="w-16 h-16 rounded-full bg-cyan-900/50 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] group-hover:border-cyan-200 group-hover:bg-cyan-800/80 transition-all"><DownloadIcon /></div>
                  <span className="text-cyan-400 font-bold tracking-widest text-[8px] group-hover:text-cyan-200">REQ IMG</span>
                </button>
                </>
              )}
           </div>
           <div className="mt-6 border-t border-cyan-900/50 pt-4">
              <div className="flex justify-between text-xs text-cyan-600 font-mono">
                <span>FREQ: {isGlitching ? 'DRIFTING...' : (appState === AppState.CONNECTED ? 'LOCKED' : 'SCANNING')}</span>
                <span className="text-[10px] text-gray-500">HOLD BTN TO EDIT CONTACTS</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
export default App;
