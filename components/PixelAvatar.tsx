
import React, { useEffect, useRef, useState } from 'react';

export interface AvatarConfig {
  gender: 'male' | 'female';
  skinTone: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  hairStyle: number;
  name?: string; // New field for user name
}

interface PixelAvatarProps {
  config: AvatarConfig;
  scale?: number;
  animate?: boolean;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'female',
  skinTone: '#ffdbac',
  hairColor: '#e74c3c',
  shirtColor: '#3498db',
  pantsColor: '#2c3e50',
  hairStyle: 0,
  name: 'Traveler'
};

export const PixelAvatar: React.FC<PixelAvatarProps> = ({ config, scale = 4, animate = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sprite Grid 20x32
    const w = 20;
    const h = 32;
    const s = scale;
    
    canvas.width = w * s;
    canvas.height = h * s;
    ctx.imageSmoothingEnabled = false;

    // Helper to draw a pixel
    const p = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, s, s);
    };

    // Helper to draw rect
    const r = (x: number, y: number, rw: number, rh: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, rw * s, rh * s);
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bounce animation
    const bounce = animate ? (Math.sin(Date.now() / 200) > 0 ? 1 : 0) : 0;

    // --- BODY ---
    // Legs/Pants
    r(7, 22, 2, 8, config.pantsColor); // Left leg
    r(11, 22, 2, 8, config.pantsColor); // Right leg
    r(7, 20, 6, 2, config.pantsColor); // Waist

    // Torso/Shirt
    r(6, 14 + bounce, 8, 7, config.shirtColor);
    
    // Arms
    r(4, 14 + bounce, 2, 6, config.shirtColor); // Left Arm sleeve
    r(4, 20 + bounce, 2, 2, config.skinTone);   // Left Hand
    r(14, 14 + bounce, 2, 6, config.shirtColor); // Right Arm sleeve
    r(14, 20 + bounce, 2, 2, config.skinTone);   // Right Hand

    // Neck
    r(8, 13 + bounce, 4, 1, config.skinTone);

    // --- HEAD ---
    const hy = 4 + bounce;
    // Face shape
    r(6, hy, 8, 8, config.skinTone); // Center face
    r(5, hy + 1, 1, 6, config.skinTone); // Side L
    r(14, hy + 1, 1, 6, config.skinTone); // Side R
    r(7, hy + 8, 6, 1, config.skinTone); // Chin

    // Eyes (Stardew style: widespread)
    p(7, hy + 4, '#3e2723');
    p(12, hy + 4, '#3e2723');
    
    // Blush
    p(6, hy + 5, '#ffadad55');
    p(13, hy + 5, '#ffadad55');

    // --- HAIR ---
    ctx.fillStyle = config.hairColor;
    const hair = config.hairStyle;

    if (hair === 0) {
      // Bob / Standard
      r(6, hy - 2, 8, 2, config.hairColor); // Top
      r(5, hy - 1, 10, 2, config.hairColor); // Top Wide
      r(4, hy + 1, 2, 6, config.hairColor); // Side L
      r(14, hy + 1, 2, 6, config.hairColor); // Side R
      r(6, hy - 1, 2, 2, config.hairColor); // Bangs
    } else if (hair === 1) {
      // Short / Spiky
      r(6, hy - 3, 8, 3, config.hairColor); // Top
      r(5, hy - 1, 1, 4, config.hairColor); // Side L
      r(14, hy - 1, 1, 4, config.hairColor); // Side R
      p(8, hy, config.skinTone); // Forehead exposed
    } else if (hair === 2) {
      // Long
      r(6, hy - 2, 8, 2, config.hairColor); // Top
      r(5, hy - 1, 10, 2, config.hairColor); // Top Wide
      r(4, hy + 1, 2, 10, config.hairColor); // Side L long
      r(14, hy + 1, 2, 10, config.hairColor); // Side R long
    } else if (hair === 3) {
        // Bun
      r(6, hy - 2, 8, 2, config.hairColor); // Top
      r(8, hy - 4, 4, 2, config.hairColor); // Bun
      r(4, hy + 1, 2, 4, config.hairColor); // Side L
      r(14, hy + 1, 2, 4, config.hairColor); // Side R
    }

  }, [config, scale, animate]);

  return <canvas ref={canvasRef} className="pixel-art" style={{ imageRendering: 'pixelated' }} />;
};

interface AvatarEditorProps {
    config: AvatarConfig;
    onChange: (newConfig: AvatarConfig) => void;
    onClose: () => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ config, onChange, onClose, apiKey, onApiKeyChange }) => {
    
    const update = (key: keyof AvatarConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const skinTones = ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#c68642', '#3e2723'];
    const hairColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#8e44ad', '#2c3e50', '#ecf0f1', '#e67e22'];
    const clothesColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#34495e', '#ffffff', '#000000'];

    return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-fade-in p-4">
            <div className="relative w-full max-w-md bg-gray-900 border-2 border-cyan-500 rounded-xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <h2 className="text-2xl font-['Audiowide'] text-cyan-400 mb-6 text-center tracking-widest">IDENTITY MATRIX</h2>
                
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-6">
                    <div className="flex flex-col items-center gap-4 w-full md:w-1/2">
                        <div className="p-4 bg-cyan-900/30 rounded-lg border border-cyan-700">
                            <PixelAvatar config={config} scale={8} animate={true} />
                        </div>
                        
                        {/* NAME INPUT */}
                        <div className="w-full">
                            <label className="text-[10px] text-cyan-500 font-mono tracking-wider block mb-1">DESIGNATION (NAME)</label>
                            <input 
                                type="text" 
                                value={config.name || ''} 
                                onChange={(e) => update('name', e.target.value)}
                                placeholder="Enter Name..."
                                className="w-full bg-black/50 border border-cyan-700 rounded px-2 py-1 text-cyan-300 font-mono text-sm focus:border-cyan-400 outline-none uppercase"
                            />
                        </div>

                         {/* API KEY INPUT */}
                         <div className="w-full pt-4 border-t border-cyan-900/50 mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-yellow-500 font-mono tracking-wider block">QUANTUM KEY (API KEY)</label>
                                <span className="text-[8px] text-gray-500">🔒 STORED LOCALLY</span>
                            </div>
                            <input 
                                type="password" 
                                value={apiKey} 
                                onChange={(e) => onApiKeyChange(e.target.value)}
                                placeholder="Paste Google API Key..."
                                className="w-full bg-black/50 border border-yellow-700/50 rounded px-2 py-1 text-yellow-300 font-mono text-sm focus:border-yellow-400 outline-none"
                            />
                            <p className="text-[8px] text-gray-500 mt-1">Allows use of your own Gemini quota.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 w-full md:w-1/2">
                        {/* Gender */}
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => update('gender', 'male')} className={`px-4 py-1 rounded border ${config.gender === 'male' ? 'bg-cyan-600 border-cyan-400' : 'border-gray-600 text-gray-400'}`}>MALE</button>
                            <button onClick={() => update('gender', 'female')} className={`px-4 py-1 rounded border ${config.gender === 'female' ? 'bg-pink-600 border-pink-400' : 'border-gray-600 text-gray-400'}`}>FEMALE</button>
                        </div>

                         {/* Hair Style */}
                         <div className="flex items-center justify-between bg-black/50 p-2 rounded">
                            <span className="text-xs text-cyan-300">HAIR STYLE</span>
                            <div className="flex gap-2">
                                <button onClick={() => update('hairStyle', (config.hairStyle + 3) % 4)} className="text-cyan-400 font-bold">&lt;</button>
                                <span className="w-4 text-center">{config.hairStyle + 1}</span>
                                <button onClick={() => update('hairStyle', (config.hairStyle + 1) % 4)} className="text-cyan-400 font-bold">&gt;</button>
                            </div>
                        </div>

                        {/* Colors */}
                        <ColorPicker label="SKIN" colors={skinTones} selected={config.skinTone} onSelect={(c) => update('skinTone', c)} />
                        <ColorPicker label="HAIR" colors={hairColors} selected={config.hairColor} onSelect={(c) => update('hairColor', c)} />
                        <ColorPicker label="SHIRT" colors={clothesColors} selected={config.shirtColor} onSelect={(c) => update('shirtColor', c)} />
                        <ColorPicker label="PANTS" colors={clothesColors} selected={config.pantsColor} onSelect={(c) => update('pantsColor', c)} />
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-['Audiowide'] rounded border border-cyan-400 tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    CONFIRM IDENTITY
                </button>
            </div>
        </div>
    );
};

const ColorPicker = ({ label, colors, selected, onSelect }: { label: string, colors: string[], selected: string, onSelect: (c: string) => void }) => (
    <div className="space-y-1">
        <span className="text-[10px] text-cyan-500 font-mono tracking-wider">{label}</span>
        <div className="flex flex-wrap gap-1">
            {colors.map(c => (
                <button 
                    key={c} 
                    onClick={() => onSelect(c)}
                    className={`w-6 h-6 rounded-sm border ${selected === c ? 'border-white scale-110' : 'border-transparent opacity-70'} transition-all`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    </div>
);
