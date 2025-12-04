
import React, { useState, useEffect } from 'react';

interface ContactEditorProps {
  id: string;
  initialName: string;
  initialPersona: string;
  onSave: (id: string, name: string, persona: string) => void;
  onClose: () => void;
}

export const ContactEditor: React.FC<ContactEditorProps> = ({ id, initialName, initialPersona, onSave, onClose }) => {
  const [name, setName] = useState(initialName);
  const [persona, setPersona] = useState(initialPersona);

  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="relative w-full max-w-md bg-gray-900 border-2 border-cyan-500 rounded-xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
        <h2 className="text-2xl font-['Audiowide'] text-cyan-400 mb-2 text-center tracking-widest">DATABASE OVERRIDE</h2>
        <p className="text-xs text-center text-cyan-600 font-mono mb-6 uppercase">Modifying Neural Imprint for: {id.replace('_', ' ')}</p>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] text-cyan-500 font-mono tracking-wider block mb-2">DISPLAY DESIGNATION (NAME)</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-cyan-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 outline-none uppercase"
              placeholder="E.G. SAM, JESS, MOM..."
            />
          </div>

          <div>
            <label className="text-[10px] text-cyan-500 font-mono tracking-wider block mb-2">PERSONALITY MATRIX & CONTEXT</label>
            <textarea 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full h-32 bg-black/50 border border-cyan-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 outline-none"
              placeholder="Define who this person is, how they talk, and what your current relationship status is. (e.g., 'My best friend who is obsessed with cats and hates my job.')"
            />
            <p className="text-[9px] text-gray-500 mt-1">* This text will replace the random scenarios for this contact.</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 py-3 bg-transparent hover:bg-red-900/30 text-red-400 font-['Audiowide'] rounded border border-red-900 tracking-widest">
                CANCEL
            </button>
            <button onClick={() => onSave(id, name, persona)} className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-['Audiowide'] rounded border border-cyan-400 tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                SAVE DATA
            </button>
        </div>
      </div>
    </div>
  );
};
