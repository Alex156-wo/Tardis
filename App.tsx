
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


const CONTACT_UNLOCK_THRESHOLD = 3;
const CORE_CONTACT_IDS = ['doctor', 'river_song', 'master_missy'];
const PERSONAL_ANCHOR_SLOTS = [
  { id: 'personal_anchor_1', label: 'ANCHOR 01', hint: 'Family / close friend' },
  { id: 'personal_anchor_2', label: 'ANCHOR 02', hint: 'Friend / classmate / coworker' },
  { id: 'personal_anchor_3', label: 'ANCHOR 03', hint: 'Neighbor / trusted ordinary person' },
];
const PERSONAL_ANCHOR_SCENARIOS = [
  "You are an ordinary person close to the user. You just saw an impossible blue box appear near the user and you are calling in panic.",
  "You noticed the user receiving a call from an important official and you are trying to sound calm while asking what is going on.",
  "You accidentally overheard the words 'alien incident' and the user's name in the same sentence. You are worried, confused, and trying not to overreact.",
  "A strange local event happened near you: time skipped, lights flickered, or a statue moved. You are calling the user because somehow they always know weird things.",
  "You are calling about a normal daily issue, but you slowly realize the user is dealing with something much bigger and more impossible.",
  "You saw the user vanish for a second in a shimmer of blue light. You are calling to ask whether they are okay and why this keeps happening."
];


// --- LONG PRESS BUTTON COMPONENT ---
interface LongPressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onLongPress: () => void;
}

const LongPressButton: React.FC<LongPressButtonProps> = ({ onClick, onLongPress, children, ...props }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<any>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didMoveRef = useRef(false);

  const clearPressTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPress = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    setIsPressing(true);
    setIsLongPress(false);
    didMoveRef.current = false;
    if (e && 'touches' in e && e.touches[0]) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      touchStartRef.current = null;
    }
    timerRef.current = window.setTimeout(() => {
      if (!didMoveRef.current) {
        setIsLongPress(true);
        onLongPress();
      }
    }, 800);
  }, [onLongPress]);

  const movePress = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !e.touches[0]) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (dx > 10 || dy > 10) {
      didMoveRef.current = true;
      clearPressTimer();
    }
  }, [clearPressTimer]);

  const endPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsPressing(false);
    clearPressTimer();
    touchStartRef.current = null;
    
    // Only trigger regular click if it wasn't a long press and the finger did not scroll.
    if (!isLongPress && !didMoveRef.current && onClick) {
      onClick(e as any);
    }
  }, [isLongPress, onClick, clearPressTimer]);

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchMove={movePress}
      onTouchCancel={endPress}
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
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [receivedPhotoData, setReceivedPhotoData] = useState<{description: string} | null>(null);

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string>('');

  const [customContacts, setCustomContacts] = useState<{ [key: string]: { name: string, persona: string } }>({});
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [incomingCounts, setIncomingCounts] = useState<{ [key: string]: number }>({});
  const [mobileTime, setMobileTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [mobileTab, setMobileTab] = useState<'contacts' | 'events' | 'memory' | 'settings'>('contacts');
  const [contactSearch, setContactSearch] = useState('');
  const [favoriteContacts, setFavoriteContacts] = useState<string[]>([]);
  const [captionMode, setCaptionMode] = useState<'original' | 'translation' | 'bilingual'>('original');
  const [liveTranscript, setLiveTranscript] = useState<HistoryItem[]>([]);

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
  const swipeStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => setMobileTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorite_contacts');
    if (savedFavorites) {
      try { setFavoriteContacts(JSON.parse(savedFavorites)); } catch(e) {}
    }
  }, []);

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

    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setUserApiKey(storedKey);

    const savedIncomingCounts = localStorage.getItem('incoming_call_counts');
    if (savedIncomingCounts) {
      try { setIncomingCounts(JSON.parse(savedIncomingCounts)); } catch(e) {}
    }
  }, []);

  const handleApiKeyChange = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setApiKeyError(false);
  };

  const saveAvatar = (config: AvatarConfig) => {
      setAvatarConfig(config);
      localStorage.setItem('user_avatar', JSON.stringify(config));
  };

  const handleSaveContact = (id: string, name: string, persona: string) => {
    const trimmedName = name.trim();
    const trimmedPersona = persona.trim();
    if (PERSONAL_ANCHOR_SLOTS.some(slot => slot.id === id) && !trimmedName) return;
    const updated = { ...customContacts, [id]: { name: trimmedName, persona: trimmedPersona } };
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

  const getAllKnownCallers = useCallback((): CallerIdentity[] => {
    const base = [...POTENTIAL_CALLERS, ...VIP_CALLERS];
    const customAnchors: CallerIdentity[] = PERSONAL_ANCHOR_SLOTS
      .filter(slot => customContacts[slot.id]?.name)
      .map(slot => ({
        id: slot.id,
        name: customContacts[slot.id].name,
        type: 'EARTH' as const,
        voiceName: 'Zephyr',
        scenarios: PERSONAL_ANCHOR_SCENARIOS,
        customPersona: customContacts[slot.id].persona,
      }));
    return [...base, ...customAnchors];
  }, [customContacts]);

  const getCallerById = useCallback((callerId: string): CallerIdentity | undefined => {
    return getAllKnownCallers().find(c => c.id === callerId);
  }, [getAllKnownCallers]);

  const hydrateCallerForConversation = useCallback((baseCaller: CallerIdentity): CallerIdentity => {
    let activeCaller = { ...baseCaller };
    const customData = customContacts[activeCaller.id];
    if (customData) {
      activeCaller.name = customData.name;
      activeCaller.customPersona = customData.persona;
    }
    if (activeCaller.scenarios && activeCaller.scenarios.length > 0 && !activeCaller.currentScenario) {
      activeCaller.currentScenario = activeCaller.scenarios[Math.floor(Math.random() * activeCaller.scenarios.length)];
    } else if (activeCaller.type === 'DOCTOR' && !activeCaller.adventure) {
      activeCaller.adventure = DOCTOR_ADVENTURES[Math.floor(Math.random() * DOCTOR_ADVENTURES.length)];
    }
    return activeCaller;
  }, [customContacts]);

  const recordIncomingContact = useCallback((callerId: string) => {
    if (CORE_CONTACT_IDS.includes(callerId) || PERSONAL_ANCHOR_SLOTS.some(slot => slot.id === callerId)) return;
    const nextCounts = { ...incomingCounts, [callerId]: (incomingCounts[callerId] || 0) + 1 };
    setIncomingCounts(nextCounts);
    localStorage.setItem('incoming_call_counts', JSON.stringify(nextCounts));
  }, [incomingCounts]);
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
    const apiKey = userApiKey.trim();
    
    if (!apiKey) {
      setApiKeyError(true);
      setShowAvatarEditor(true); // Open editor to let user input key
      // alert("TARDIS SYSTEM ERROR: No Power Source (API KEY). Please enter a valid Gemini API Key in the Identity Matrix.");
      return;
    }

    try {
      setAppState(AppState.CONNECTING);
      setPermissionError(false);
      setLiveTranscript([]);
      startTimeRef.current = Date.now();
      
      let activeCaller = specificCaller || caller;
      
      const customData = customContacts[activeCaller.id];
      if (customData) {
        activeCaller = { ...activeCaller, name: customData.name, customPersona: customData.persona };
      }

      const wasIncomingRandomCall = !specificCaller && appState === AppState.INCOMING_CALL;
      if (wasIncomingRandomCall) recordIncomingContact(activeCaller.id);

      setCaller(activeCaller);
      currentCallerIdRef.current = activeCaller.id; 

      const ai = new GoogleGenAI({ apiKey });
      
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
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
            if (message.serverContent?.outputTranscription?.text) {
              const item = { role: 'model' as const, text: message.serverContent.outputTranscription.text };
              currentHistoryRef.current.push(item);
              setLiveTranscript(prev => [...prev.slice(-8), item]);
            }
            if (message.serverContent?.inputTranscription?.text) {
              const item = { role: 'user' as const, text: message.serverContent.inputTranscription.text };
              currentHistoryRef.current.push(item);
              setLiveTranscript(prev => [...prev.slice(-8), item]);
            }
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
          // Removing explicit transcription config to improve stability in some regions/browsers
          // inputAudioTranscription: {}, 
          // outputAudioTranscription: {}, 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: activeCaller.voiceName || 'Puck' } } },
          // Unwrapped system instruction to plain string for better compatibility in Connect method
          systemInstruction: { parts: [{ text: systemInstructionText }] },
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

  const callContact = (callerId: string, isGameMode: boolean = false) => {
    const selected = getCallerById(callerId);
    if (!selected) return;
    startConversation(hydrateCallerForConversation(selected), isGameMode);
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
      const selectedCaller = getCallerById(callerId) || POTENTIAL_CALLERS[0];
      const activeCaller = { ...hydrateCallerForConversation(selectedCaller), initialImage: pendingPhoto || undefined };
      startConversation(activeCaller);
  };

  const handleGamePartnerSelect = (callerId: string) => {
      setShowGameSelector(false);
      callContact(callerId, true); 
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

  const handleManualCall = () => callContact('doctor');
  const handleCallMaster = () => callContact('master_missy');
  const handleCallRiver = () => callContact('river_song');

  const coreContacts = CORE_CONTACT_IDS
    .map(id => getCallerById(id))
    .filter(Boolean) as CallerIdentity[];
  const unlockedContacts = getAllKnownCallers()
    .filter(c => !CORE_CONTACT_IDS.includes(c.id))
    .filter(c => !PERSONAL_ANCHOR_SLOTS.some(slot => slot.id === c.id))
    .filter(c => (incomingCounts[c.id] || 0) >= CONTACT_UNLOCK_THRESHOLD);
  const recentSignalLog = getAllKnownCallers()
    .filter(c => !CORE_CONTACT_IDS.includes(c.id))
    .filter(c => !PERSONAL_ANCHOR_SLOTS.some(slot => slot.id === c.id))
    .filter(c => (incomingCounts[c.id] || 0) > 0 && (incomingCounts[c.id] || 0) < CONTACT_UNLOCK_THRESHOLD)
    .sort((a, b) => (incomingCounts[b.id] || 0) - (incomingCounts[a.id] || 0))
    .slice(0, 4);

  const contactTone = (id: string) => {
    if (id === 'doctor') return 'border-cyan-400/70 bg-cyan-950/40 text-cyan-200';
    if (id === 'river_song') return 'border-yellow-400/70 bg-yellow-950/30 text-yellow-200';
    if (id === 'master_missy') return 'border-green-400/70 bg-green-950/30 text-green-200';
    if (id.startsWith('personal_anchor')) return 'border-pink-400/60 bg-pink-950/25 text-pink-100';
    return 'border-blue-400/50 bg-blue-950/25 text-blue-100';
  };

  const relationshipLabel = (id: string) => {
    const score = scores[id] || parseInt(localStorage.getItem(`relationship_score_${id}`) || '1');
    if (score >= 8) return 'Trusted Signal';
    if (score >= 5) return 'Known Contact';
    if (score >= 2) return 'Familiar Voice';
    return 'First Trace';
  };

  const callerStatus = (active: CallerIdentity = caller) => {
    if (active.id === 'doctor') return 'Doctor: Repairing TARDIS';
    if (active.id === 'river_song') return 'River: Spoilers pending';
    if (active.id === 'master_missy') return 'Missy: Definitely not behaving';
    if (active.id.startsWith('personal_anchor')) return `${active.name}: Ordinary life disrupted`;
    if (active.type === 'EARTH') return `${active.name}: Earth signal unstable`;
    if (active.type === 'VILLAIN') return `${active.name}: Threat detected`;
    return `${active.name}: Signal drifting`;
  };

  const currentCrisis = caller.currentScenario || caller.adventure || (appState === AppState.CONNECTED ? 'Temporal Rift Detected' : 'Awaiting anomaly');

  const toggleFavorite = (id: string) => {
    const next = favoriteContacts.includes(id)
      ? favoriteContacts.filter(item => item !== id)
      : [...favoriteContacts, id];
    setFavoriteContacts(next);
    localStorage.setItem('favorite_contacts', JSON.stringify(next));
  };

  const personalContacts = PERSONAL_ANCHOR_SLOTS
    .map(slot => getCallerById(slot.id))
    .filter(Boolean) as CallerIdentity[];
  const allDirectoryContacts = [...coreContacts, ...personalContacts, ...unlockedContacts];
  const filteredDirectoryContacts = allDirectoryContacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    relationshipLabel(contact.id).toLowerCase().includes(contactSearch.toLowerCase())
  );

  const handleSwipeStart = (e: React.TouchEvent<HTMLDivElement>) => {
    swipeStartXRef.current = e.touches[0].clientX;
  };

  const handleSwipeEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartXRef.current;
    swipeStartXRef.current = null;
    if (dx > 80 && appState === AppState.INCOMING_CALL) handleAnswerCall();
    if (dx < -80 && appState === AppState.INCOMING_CALL) setAppState(AppState.IDLE);
  };

  const renderMobileContactCard = (contact: CallerIdentity) => (
    <LongPressButton
      key={contact.id}
      onClick={() => callContact(contact.id)}
      onLongPress={() => toggleFavorite(contact.id)}
      className={`mobile-contact-card ${favoriteContacts.includes(contact.id) ? 'is-favorite' : ''}`}
      title="Tap to call. Long press to favorite."
    >
      <span className="mobile-contact-fav">{favoriteContacts.includes(contact.id) ? '★' : '☆'}</span>
      <span className="mobile-contact-name">{contact.name}</span>
      <span className="mobile-contact-level">{relationshipLabel(contact.id)}</span>
    </LongPressButton>
  );

  return (
    <div className={`tardis-app-shell relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center text-white transition-all duration-100 ${isGlitching ? 'translate-x-1 grayscale' : ''}`}>
      <div className="absolute inset-0 z-50 crt-overlay h-full w-full pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black"></div>
      <GhostTardis />
      
      {showAvatarEditor && (
        <AvatarEditor 
            config={avatarConfig} 
            onChange={setAvatarConfig} 
            onClose={() => { saveAvatar(avatarConfig); setShowAvatarEditor(false); }} 
            apiKey={userApiKey}
            onApiKeyChange={handleApiKeyChange}
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
          initialName={customContacts[editingContactId]?.name || getCallerById(editingContactId)?.name || ""}
          initialPersona={customContacts[editingContactId]?.persona || ""}
          mode={PERSONAL_ANCHOR_SLOTS.some(slot => slot.id === editingContactId) ? 'personal' : 'override'}
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

      {apiKeyError && (
          <div className="absolute top-32 z-50 bg-yellow-900/90 border border-yellow-500 text-white p-4 rounded shadow-lg max-w-sm text-center">
              <p className="font-bold mb-2">API KEY REQUIRED</p>
              <p className="text-sm">Please click the hologram avatar in the center to enter your Gemini API Key.</p>
              <button onClick={() => setApiKeyError(false)} className="mt-4 px-4 py-1 bg-yellow-700 rounded text-xs">OK</button>
          </div>
      )}
      
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      <div className="mobile-status-bar">
        <span>{mobileTime}</span>
        <span>{appState === AppState.CONNECTED ? 'TARDIS: LINKED' : appState === AppState.INCOMING_CALL ? 'TARDIS: RINGING' : 'TARDIS: SCANNING'}</span>
        <span>{callerStatus()}</span>
      </div>

      {appState === AppState.INCOMING_CALL && (
        <div className="mobile-incoming-screen" onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}>
          <div className="mobile-incoming-pulse"></div>
          <p className="mobile-eyebrow">Incoming Transmission</p>
          <div className="mobile-call-avatar mobile-call-avatar-red">{caller.name.slice(0, 1)}</div>
          <h2>{caller.name}</h2>
          <p className="mobile-identity-line">{caller.type || 'UNKNOWN'} · encrypted voice link</p>
          <div className="mobile-current-location">
            <span>Current Location</span>
            <strong>{caller.type === 'EARTH' ? 'Earth / unstable local coordinates' : 'Unknown Star System'}</strong>
          </div>
          <p className="mobile-crisis-copy">{currentCrisis}</p>
          <div className="mobile-answer-slider">Swipe right to answer · left to decline</div>
          <div className="mobile-call-actions">
            <button className="mobile-decline" onClick={() => setAppState(AppState.IDLE)}>Decline</button>
            <button className="mobile-answer" onClick={handleAnswerCall}>Answer</button>
          </div>
        </div>
      )}

      {(appState === AppState.CONNECTED || appState === AppState.CONNECTING) && (
        <div className="mobile-active-call-screen">
          <p className="mobile-eyebrow">{appState === AppState.CONNECTING ? 'Materializing Audio Channel' : 'Voice Link Established'}</p>
          <div className="mobile-call-avatar">{caller.name.slice(0, 1)}</div>
          <h2>{caller.name}</h2>
          <p className="mobile-identity-line">{callerStatus()}</p>
          <div className="mobile-waveform"><span></span><span></span><span></span><span></span><span></span></div>
          <div className="mobile-crisis-panel">
            <span>Current Crisis</span>
            <strong>{currentCrisis}</strong>
            <small>Current Language: French B2 / English Practice</small>
          </div>
          <div className="mobile-caption-toolbar">
            {(['original', 'translation', 'bilingual'] as const).map(mode => (
              <button key={mode} onClick={() => setCaptionMode(mode)} className={captionMode === mode ? 'active' : ''}>{mode}</button>
            ))}
          </div>
          <div className="mobile-captions">
            {liveTranscript.length === 0 ? (
              <p className="mobile-caption-placeholder">Subtitles will appear when Gemini returns transcription data. Keep speaking naturally.</p>
            ) : liveTranscript.slice(-5).map((item, index) => (
              <p key={`${item.role}-${index}`} className={item.role === 'model' ? 'from-character' : 'from-user'}>
                <span>{item.role === 'model' ? caller.name : 'You'}:</span> {item.text}
                {captionMode !== 'original' && <em>{captionMode === 'translation' ? 'Translation channel standby.' : ' / Translation channel standby.'}</em>}
              </p>
            ))}
          </div>
          <div className="mobile-call-control-dock">
            <button>🎤<span>Mute</span></button>
            <button onClick={() => setCaptionMode(captionMode === 'original' ? 'bilingual' : 'original')}>📝<span>Caption</span></button>
            <button onClick={() => fileInputRef.current?.click()}>📷<span>Image</span></button>
            <button className="hangup" onClick={handleEndCall}>📞<span>End</span></button>
          </div>
        </div>
      )}

      <div className="tardis-main-frame relative z-20 w-full max-w-4xl h-full flex flex-col items-center justify-between py-12">
        <div className="desktop-title text-center space-y-2 mt-8">
           <h1 className={`text-4xl md:text-6xl font-['Audiowide'] text-cyan-400 tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.5)] ${isGlitching ? 'opacity-50 blur-sm' : ''}`}>T.A.R.D.I.S.</h1>
           <p className="text-sm font-['Share_Tech_Mono'] text-blue-200 uppercase tracking-[0.2em]">Type 40 • Time Travel Capsule • Audio Link</p>
           {isGlitching && ( <p className="text-red-500 font-bold animate-pulse text-xs bg-black/80 inline-block px-2">⚠ SIGNAL UNSTABLE ⚠</p> )}
        </div>
        
        <div className="tardis-rotor relative w-80 h-80 flex items-center justify-center group/rotor">
           <div className={`absolute w-full h-full border-4 border-cyan-900/30 rounded-full animate-[spin_10s_linear_infinite] ${isGlitching ? 'border-red-900/50' : ''} group-hover/rotor:border-cyan-500/40 group-hover/rotor:shadow-[0_0_40px_rgba(34,211,238,0.2)] transition-all duration-500`}></div>
           <div className="absolute w-3/4 h-3/4 border-2 border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse] group-hover/rotor:border-cyan-400/40 transition-all duration-500"></div>
           
           <ParticleVisualizer analyser={analyserRef.current} isActive={appState === AppState.CONNECTED} isGlitching={isGlitching} />
           
           {appState === AppState.IDLE && (
               <div className="absolute z-15 flex flex-col items-center animate-pulse cursor-pointer transition-transform hover:scale-110" onClick={() => setShowAvatarEditor(true)} title="Edit Hologram Identity">
                   <div className="relative flex flex-col items-center">
                       <PixelAvatar config={avatarConfig} scale={3} animate={true} />
                       <span className="text-[8px] text-cyan-600 mt-2 tracking-widest bg-black/50 px-1 rounded border border-cyan-900">PILOT ID</span>
                       <span className="text-[10px] text-white font-mono mt-1 uppercase mb-1">{avatarConfig.name || "TRAVELER"}</span>
                       
                       {/* API KEY STATUS INDICATOR BUTTON */}
                       <button 
                         className={`text-[8px] font-bold px-2 py-0.5 rounded border ${userApiKey ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-yellow-900/50 border-yellow-500 text-yellow-300 animate-pulse'}`}
                       >
                         {userApiKey ? "KEY ACTIVE" : "INSERT KEY"}
                       </button>
                   </div>
               </div>
           )}

           <div className="absolute z-20 text-center pointer-events-none">
              {appState === AppState.IDLE && ( <span className="text-blue-500/50 text-xs animate-pulse mt-28 block">Awaiting Input...</span> )}
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

        {appState === AppState.IDLE && (
          <div className="mobile-contact-rail">
            {coreContacts.map(renderMobileContactCard)}
            {personalContacts.map(renderMobileContactCard)}
            {unlockedContacts.map(renderMobileContactCard)}
            {personalContacts.length === 0 && (
              <button className="mobile-contact-card mobile-add-card" onClick={() => setEditingContactId(PERSONAL_ANCHOR_SLOTS[0].id)}>
                <span className="mobile-contact-name">+ Ordinary Anchor</span>
                <span className="mobile-contact-level">Mom · Friend · Classmate</span>
              </button>
            )}
          </div>
        )}

        <div className="mobile-tab-panel">
          {mobileTab === 'contacts' && (
            <div>
              <h2>━━ Core Contacts ━━</h2>
              <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search directory..." />
              <div className="mobile-directory-list">
                {filteredDirectoryContacts.map(contact => (
                  <LongPressButton key={contact.id} onClick={() => callContact(contact.id)} onLongPress={() => toggleFavorite(contact.id)} className="mobile-directory-row">
                    <div><strong>{favoriteContacts.includes(contact.id) ? '★ ' : ''}{contact.name}</strong><span>{relationshipLabel(contact.id)}</span></div>
                    <small>{CORE_CONTACT_IDS.includes(contact.id) ? 'Core Contacts' : contact.id.startsWith('personal_anchor') ? 'Ordinary Anchors' : 'Unlocked Contacts'}</small>
                  </LongPressButton>
                ))}
              </div>
              <h2>━━ Ordinary Anchors ━━</h2>
              <div className="mobile-anchor-grid">
                {PERSONAL_ANCHOR_SLOTS.map(slot => (
                  <button key={slot.id} onClick={() => setEditingContactId(slot.id)}>
                    <strong>{customContacts[slot.id]?.name || slot.label}</strong>
                    <span>{customContacts[slot.id]?.persona ? 'Edit ordinary contact' : 'Add family / friend / classmate'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {mobileTab === 'events' && (
            <div>
              <h2>━━ Event Signals ━━</h2>
              <p className="mobile-panel-copy">Random callers become active contacts after 3 answered transmissions. Current trace: {recentSignalLog.length || 0} partial signals.</p>
              {recentSignalLog.map(contact => <p key={contact.id} className="mobile-event-row">{contact.name}<span>{incomingCounts[contact.id] || 0}/{CONTACT_UNLOCK_THRESHOLD}</span></p>)}
            </div>
          )}
          {mobileTab === 'memory' && (
            <div>
              <h2>━━ Memory Core ━━</h2>
              <p className="mobile-panel-copy">Relationship memory is stored locally in this browser. It keeps the characters familiar without uploading your personal history to this site.</p>
              {allDirectoryContacts.slice(0, 8).map(contact => <p key={contact.id} className="mobile-event-row">{contact.name}<span>{relationshipLabel(contact.id)}</span></p>)}
            </div>
          )}
          {mobileTab === 'settings' && (
            <div>
              <h2>━━ Settings ━━</h2>
              <button className="mobile-settings-button" onClick={() => setShowAvatarEditor(true)}>{userApiKey ? 'API Key Ready / Edit Identity' : 'Set Gemini API Key'}</button>
              <button className="mobile-settings-button" onClick={() => fileInputRef.current?.click()}>Send Image to a Contact</button>
              <button className="mobile-settings-button" onClick={() => setShowGameSelector(true)}>Start Mini Game</button>
            </div>
          )}
        </div>

        <div className="mobile-scroll-spacer" aria-hidden="true" />

        <div className="desktop-panels w-full max-w-5xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr] gap-4">
            <section className="border border-cyan-800/70 bg-black/50 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_30px_rgba(0,180,255,0.12)]">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-900/70 pb-3 mb-3">
                <div>
                  <h2 className="font-['Audiowide'] text-cyan-300 tracking-[0.18em] text-sm md:text-base">TARDIS DIRECTORY</h2>
                  <p className="text-[10px] text-cyan-700 uppercase tracking-widest">Call trusted contacts · ordinary anchors · unlocked transmissions</p>
                </div>
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className={`px-3 py-2 rounded-lg border text-[10px] font-bold tracking-widest ${userApiKey ? 'border-cyan-500/60 text-cyan-200 bg-cyan-950/40' : 'border-yellow-500/70 text-yellow-200 bg-yellow-950/50 animate-pulse'}`}
                >
                  {userApiKey ? 'KEY READY' : 'SET API KEY'}
                </button>
              </div>

              {appState === AppState.IDLE && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {coreContacts.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => callContact(contact.id)}
                        className={`group min-h-[92px] rounded-xl border p-3 text-left transition-all hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] ${contactTone(contact.id)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] opacity-60">Core Contact</p>
                            <p className="font-['Audiowide'] text-sm leading-tight mt-1">{contact.name.replace('Unknown (', '').replace(')', '')}</p>
                          </div>
                          <span className="text-[10px] border border-current/30 rounded-full px-2 py-0.5 opacity-70">LV {scores[contact.id] || 1}</span>
                        </div>
                        <p className="text-[10px] mt-3 opacity-70 leading-snug">Voice link ready. Tap to call.</p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-pink-500/20 bg-pink-950/10 p-3 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-['Audiowide'] text-pink-200 text-xs tracking-[0.18em]">ORDINARY ANCHORS</p>
                        <p className="text-[10px] text-pink-300/50 uppercase tracking-widest">Max 3. Family/friends only. They highlight your hidden life.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PERSONAL_ANCHOR_SLOTS.map(slot => {
                        const data = customContacts[slot.id];
                        const ready = Boolean(data?.name);
                        return (
                          <div key={slot.id} className={`rounded-xl border p-3 ${ready ? contactTone(slot.id) : 'border-gray-700/70 bg-gray-950/50 text-gray-400'}`}>
                            <p className="text-[9px] uppercase tracking-[0.22em] opacity-60">{slot.label}</p>
                            <p className="font-bold text-sm mt-1 truncate">{ready ? data.name : 'Empty Slot'}</p>
                            <p className="text-[10px] opacity-60 mt-1 h-8 leading-snug">{ready ? (data.persona || 'Ordinary person who knows your daily life.') : slot.hint}</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => ready ? callContact(slot.id) : setEditingContactId(slot.id)}
                                className="flex-1 rounded-lg border border-current/40 px-2 py-1.5 text-[10px] font-bold hover:bg-white/10 transition"
                              >
                                {ready ? 'CALL' : 'ADD'}
                              </button>
                              <button
                                onClick={() => setEditingContactId(slot.id)}
                                className="rounded-lg border border-current/20 px-2 py-1.5 text-[10px] hover:bg-white/10 transition"
                              >
                                EDIT
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setShowGameSelector(true)} className="rounded-xl border border-green-400/50 bg-green-950/25 p-3 text-green-200 hover:bg-green-900/40 hover:-translate-y-0.5 transition">
                      <div className="flex justify-center mb-1"><GamepadIcon /></div>
                      <p className="text-[10px] font-bold tracking-widest">MINI GAME</p>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-blue-400/50 bg-blue-950/25 p-3 text-blue-200 hover:bg-blue-900/40 hover:-translate-y-0.5 transition">
                      <div className="flex justify-center mb-1"><CameraIcon /></div>
                      <p className="text-[10px] font-bold tracking-widest">SEND IMAGE</p>
                    </button>
                    <button onClick={() => setShowAvatarEditor(true)} className="rounded-xl border border-cyan-400/50 bg-cyan-950/25 p-3 text-cyan-200 hover:bg-cyan-900/40 hover:-translate-y-0.5 transition">
                      <div className="flex justify-center mb-1"><UserIcon /></div>
                      <p className="text-[10px] font-bold tracking-widest">IDENTITY</p>
                    </button>
                  </div>
                </>
              )}

              {appState === AppState.INCOMING_CALL && (
                <div className="rounded-2xl border border-red-500/70 bg-red-950/30 p-5 text-center shadow-[0_0_45px_rgba(239,68,68,0.18)]">
                  <p className="font-['Audiowide'] text-red-300 tracking-[0.25em] animate-pulse">INCOMING TRANSMISSION</p>
                  <p className="text-2xl text-white mt-2">{caller.name}</p>
                  <p className="text-xs text-red-200/70 mt-2 line-clamp-2">{caller.currentScenario || caller.adventure || 'Signal content encrypted.'}</p>
                  <div className="flex justify-center gap-4 mt-5">
                    <button onClick={handleAnswerCall} className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-['Audiowide'] tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.35)]">ANSWER</button>
                    <button onClick={() => setAppState(AppState.IDLE)} className="px-6 py-3 rounded-xl border border-red-500/60 text-red-200 hover:bg-red-900/40 font-['Audiowide'] tracking-widest">DECLINE</button>
                  </div>
                </div>
              )}

              {(appState === AppState.CONNECTED || appState === AppState.CONNECTING) && (
                <div className="rounded-2xl border border-cyan-500/60 bg-cyan-950/20 p-5 text-center">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-500">Active Link</p>
                  <p className="text-xl text-cyan-100 mt-1">{caller.name}</p>
                  <p className="text-[10px] text-cyan-600 mt-1">{appState === AppState.CONNECTING ? 'Materializing audio channel...' : 'Signal locked. Speak naturally.'}</p>
                  <div className="flex justify-center gap-4 mt-5">
                    <button onClick={handleEndCall} className="px-6 py-3 rounded-xl bg-red-900/80 border border-red-400 text-red-100 hover:bg-red-800 font-['Audiowide'] tracking-widest">SEVER LINK</button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-3 rounded-xl border border-cyan-400/60 text-cyan-100 hover:bg-cyan-900/40 font-['Audiowide'] tracking-widest text-xs">SEND IMAGE</button>
                  </div>
                </div>
              )}
            </section>

            <aside className="border border-blue-800/60 bg-black/45 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_30px_rgba(59,130,246,0.1)] max-h-[44vh] overflow-y-auto">
              <h2 className="font-['Audiowide'] text-blue-200 tracking-[0.18em] text-sm">SIGNAL LOG</h2>
              <p className="text-[10px] text-blue-400/60 uppercase tracking-widest mt-1">Random callers join your directory after 3 answered calls.</p>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] text-cyan-400 uppercase tracking-[0.22em] mb-2">Unlocked Contacts</p>
                  {unlockedContacts.length === 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-[11px] text-gray-500 leading-relaxed">
                      No random caller has reached 3 answered calls yet. Let the universe interrupt you a few more times.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unlockedContacts.map(contact => (
                        <button key={contact.id} onClick={() => callContact(contact.id)} className="w-full rounded-xl border border-blue-500/40 bg-blue-950/20 p-3 text-left hover:bg-blue-900/40 transition">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-blue-100 truncate">{contact.name}</span>
                            <span className="text-[9px] text-blue-400">{incomingCounts[contact.id] || 0} CALLS</span>
                          </div>
                          <p className="text-[10px] text-blue-300/50 mt-1 uppercase tracking-widest">Saved to directory</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-orange-300 uppercase tracking-[0.22em] mb-2">Almost Traceable</p>
                  {recentSignalLog.length === 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3 text-[11px] text-gray-500">No partial traces yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {recentSignalLog.map(contact => {
                        const count = incomingCounts[contact.id] || 0;
                        return (
                          <div key={contact.id} className="rounded-xl border border-orange-500/25 bg-orange-950/10 p-3">
                            <div className="flex justify-between gap-2 text-xs">
                              <span className="text-orange-100 truncate">{contact.name}</span>
                              <span className="text-orange-300">{count}/{CONTACT_UNLOCK_THRESHOLD}</span>
                            </div>
                            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden mt-2 border border-orange-900/40">
                              <div className="h-full bg-orange-400 transition-all" style={{ width: `${Math.min(100, (count / CONTACT_UNLOCK_THRESHOLD) * 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px] text-cyan-700 font-mono uppercase tracking-widest">
            <span>FREQ: {isGlitching ? 'DRIFTING...' : (appState === AppState.CONNECTED ? 'LOCKED' : 'SCANNING')}</span>
            <span>Hidden identity protocol: ordinary contacts remain ordinary.</span>
          </div>
        </div>
      </div>

      <nav className="mobile-bottom-dock">
        <button className={mobileTab === 'contacts' ? 'active' : ''} onClick={() => setMobileTab('contacts')}>📞<span>通讯录</span></button>
        <button className={mobileTab === 'events' ? 'active' : ''} onClick={() => setMobileTab('events')}>🌌<span>事件</span></button>
        <button className={mobileTab === 'memory' ? 'active' : ''} onClick={() => setMobileTab('memory')}>🧠<span>记忆</span></button>
        <button className={mobileTab === 'settings' ? 'active' : ''} onClick={() => setMobileTab('settings')}>⚙<span>设置</span></button>
      </nav>
    </div>
  );
};
export default App;
