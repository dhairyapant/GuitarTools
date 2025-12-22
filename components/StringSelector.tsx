import React from 'react';
import { STANDARD_TUNING } from '../constants';
import { StringName } from '../types';

interface StringSelectorProps {
  selected: StringName;
  onSelect: (s: StringName) => void;
}

export const StringSelector: React.FC<StringSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-7 gap-2 w-full max-w-md mx-auto px-4 mb-6">
      <button
        onClick={() => onSelect(StringName.AUTO)}
        className={`
            flex flex-col items-center justify-center p-3 rounded-xl transition-all
            ${selected === StringName.AUTO 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50 scale-105' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
        `}
      >
        <span className="text-xs font-bold">AUTO</span>
      </button>

      {STANDARD_TUNING.map((str) => (
        <button
          key={str.name}
          onClick={() => onSelect(str.name)}
          className={`
            flex flex-col items-center justify-center p-2 rounded-xl transition-all relative overflow-hidden
            ${selected === str.name 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50 scale-105' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
          `}
        >
          <span className="text-lg font-bold">{str.label}</span>
          <span className="text-[10px] opacity-70">{str.frequency.toFixed(0)}</span>
          
          {/* String visual representation (thicker for low E) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/30">
             <div className="bg-current opacity-30 h-full mx-auto" style={{ width: `${(STANDARD_TUNING.indexOf(str) + 1) * 15}%`}}></div>
          </div>
        </button>
      ))}
    </div>
  );
};
