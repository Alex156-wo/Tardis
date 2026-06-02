import React, { useState } from 'react';

interface ContactEditorProps {
  id: string;
  initialName: string;
  initialPersona: string;
  mode?: 'personal' | 'override';
  onSave: (id: string, name: string, persona: string) => void;
  onClose: () => void;
}

const ORDINARY_RELATION_HINTS = [
  'family member who knows my daily routine',
  'close friend who worries about me',
  'classmate or coworker who notices strange events',
  'neighbor who keeps seeing impossible things nearby',
];

export const ContactEditor: React.FC<ContactEditorProps> = ({ id, initialName, initialPersona, mode = 'override', onSave, onClose }) => {
  const [name, setName] = useState(initialName);
  const [persona, setPersona] = useState(initialPersona);
  const isPersonal = mode === 'personal';

  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="relative w-full max-w-lg bg-gray-950 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_35px_rgba(34,211,238,0.32)]">
        <h2 className="text-2xl font-['Audiowide'] text-cyan-300 mb-2 text-center tracking-widest">
          {isPersonal ? 'ORDINARY ANCHOR' : 'DATABASE OVERRIDE'}
        </h2>
        <p className="text-xs text-center text-cyan-700 font-mono mb-5 uppercase leading-relaxed">
          {isPersonal
            ? 'Create one ordinary family/friend contact. They are not a Time Lord, official, alien, spy, or superhuman.'
            : `Modifying Neural Imprint for: ${id.replace('_', ' ')}`}
        </p>

        {isPersonal && (
          <div className="mb-5 rounded-xl border border-pink-500/25 bg-pink-950/15 p-3 text-[11px] text-pink-100/80 leading-relaxed">
            <p className="font-bold text-pink-200 tracking-widest uppercase mb-1">Design rule</p>
            <p>
              This contact should make the user's hidden identity feel special: they may panic about alien events, notice calls from officials, or ask why the user's life keeps becoming impossible — but they remain a normal person.
            </p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-[10px] text-cyan-500 font-mono tracking-wider block mb-2">
              {isPersonal ? 'ORDINARY CONTACT NAME' : 'DISPLAY DESIGNATION (NAME)'}
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-cyan-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 outline-none"
              placeholder={isPersonal ? 'E.g. Mom, A best friend, Roommate, Cousin...' : 'E.g. Sam, Jess, Mom...'}
            />
          </div>

          {isPersonal && (
            <div>
              <label className="text-[10px] text-pink-400 font-mono tracking-wider block mb-2">SAFE ORDINARY RELATION EXAMPLES</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ORDINARY_RELATION_HINTS.map(hint => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setPersona(prev => prev ? `${prev}\n- ${hint}` : `- ${hint}`)}
                    className="text-left rounded-lg border border-pink-500/20 bg-pink-950/10 px-3 py-2 text-[10px] text-pink-100/70 hover:bg-pink-900/25 transition"
                  >
                    + {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-cyan-500 font-mono tracking-wider block mb-2">
              {isPersonal ? 'RELATIONSHIP / SPEAKING STYLE / DAILY CONTEXT' : 'PERSONALITY MATRIX & CONTEXT'}
            </label>
            <textarea 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full h-36 bg-black/60 border border-cyan-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-400 outline-none leading-relaxed"
              placeholder={isPersonal
                ? "Example: My close friend. Funny, a little anxious, speaks casually. They know my job/school life, but they don't know the full TARDIS truth."
                : "Define who this person is, how they talk, and what your current relationship status is."}
            />
            <p className="text-[9px] text-gray-500 mt-1">
              {isPersonal
                ? '* Ordinary-only guardrail: no alien royalty, no secret agent, no government leader, no Time Lord.'
                : '* This text will guide the contact voice and context.'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 py-3 bg-transparent hover:bg-red-900/30 text-red-400 font-['Audiowide'] rounded-xl border border-red-900 tracking-widest">
                CANCEL
            </button>
            <button onClick={() => onSave(id, name, persona)} className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-['Audiowide'] rounded-xl border border-cyan-400 tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                SAVE DATA
            </button>
        </div>
      </div>
    </div>
  );
};
