import React from 'react';
import { StringName, GuitarString } from '../types';

interface StringSelectorProps {
  selected: StringName;
  onSelect: (s: StringName) => void;
  activeStrings: GuitarString[];
  detectedString?: StringName; // The string auto-detection thinks is playing
}

export const StringSelector: React.FC<StringSelectorProps> = ({ selected, onSelect, activeStrings, detectedString }) => {
  return (
    <div className="flex justify-center gap-3 w-full max-w-md mx-auto px-4 mb-8">
      {activeStrings.map((str) => {
        const isSelected = selected === str.name;
        const isDetected = detectedString === str.name;

        return (
          <div key={str.name} className="flex flex-col items-center gap-1">
            <button
              onClick={() => onSelect(str.name)}
              className={`
                w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 border-2
                ${isSelected
                  ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110'
                  : isDetected
                    ? 'bg-cyan-500/5 border-cyan-600/60 text-cyan-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'
                }
              `}
            >
              <span className={`text-base font-black uppercase ${isSelected || isDetected ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}`}>
                {str.label}
              </span>
            </button>

            {/* Pointer triangle for auto-detected string */}
            <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent transition-all duration-300
              ${isDetected
                ? 'border-b-cyan-400 opacity-100 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]'
                : 'border-b-transparent opacity-0'
              }
            `} style={{ transform: 'rotate(180deg)' }}></div>
          </div>
        );
      })}
    </div>
  );
};
