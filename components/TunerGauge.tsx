import React from 'react';
import { TuningStatus } from '../types';

interface TunerGaugeProps {
  status: TuningStatus;
}

export const TunerGauge: React.FC<TunerGaugeProps> = ({ status }) => {
  const { deviation, note, isInTune } = status;

  // Clamp deviation for display (-50 to +50 cents)
  const clampedDeviation = Math.max(-50, Math.min(50, deviation));

  // Convert deviation to rotation angle (-60deg to 60deg for wider arc)
  const rotation = (clampedDeviation / 50) * 60;

  const needleColor = isInTune ? 'bg-cyan-400' : 'bg-cyan-500';
  const needleGlow = isInTune
    ? 'shadow-[0_0_20px_rgba(34,211,238,0.8)]'
    : 'shadow-[0_0_12px_rgba(6,182,212,0.5)]';

  // Formatting note name
  const noteDisplay = note ? note.name : '--';
  const octaveDisplay = note ? note.octave : '';

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-sm aspect-square mx-auto my-4 overflow-hidden">

      {/* Main Container */}
      <div className="w-72 h-72 rounded-full flex items-center justify-center relative">

        {/* Gauge Arc Background */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
          <path
            d="M 20 50 A 30 30 0 0 1 80 50"
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-50"
          />
        </svg>

        {/* Labels: String Status & Actions */}
        <div className="absolute top-10 left-4 text-[8px] font-black text-red-500/40 tracking-widest uppercase w-20 leading-tight">
          String is<br />Loose
        </div>

        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-cyan-400 tracking-widest uppercase transition-all duration-300">
          {isInTune ? 'Perfect' : (deviation < 0 ? 'Tighten' : 'Loosen')}
        </div>

        <div className="absolute top-10 right-4 text-[8px] font-black text-red-500/40 tracking-widest uppercase text-right w-20 leading-tight">
          String is<br />Tight
        </div>

        {/* Center Ticking / Perfect Marker */}
        <div className={`absolute top-10 left-1/2 -ml-[1px] h-4 w-[2px] rounded-full transition-all duration-300 ${isInTune ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`}></div>

        {/* Digital Info Display */}
        <div className="flex flex-col items-center z-10 -mt-8">
          <div className="flex items-baseline gap-1">
            <span className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              {noteDisplay}
            </span>
            <span className="text-2xl font-bold text-cyan-500/50 mb-2">
              {octaveDisplay}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className={`text-3xl font-mono font-black tabular-nums transition-colors duration-300 ${isInTune ? 'text-cyan-400' : 'text-white'}`}>
              {status.frequency > 0 ? (deviation > 0 ? `+${deviation.toFixed(1)}` : deviation.toFixed(1)) : '0.0'}
            </span>
            <span className={`text-xs font-black uppercase tracking-[0.3em] ${isInTune ? 'text-cyan-400' : (Math.abs(deviation) < 1.5 ? 'text-yellow-400' : 'text-slate-500')}`}>
              {status.frequency > 0 ? (isInTune ? 'Perfect' : (deviation < 0 ? 'Flat' : 'Sharp')) : 'Waiting'}
            </span>
          </div>
        </div>

        {/* Needle Container (Rotated) */}
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out z-20"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Needle */}
          <div className={`absolute top-10 left-1/2 -ml-[1px] h-24 w-[2px] rounded-full ${needleColor} ${needleGlow} transition-colors duration-300`}></div>

          {/* Bottom Needle Glow (Focus) */}
          <div className={`absolute top-10 left-1/2 -ml-1.5 w-3 h-3 rounded-full blur-md opacity-50 ${isInTune ? 'bg-cyan-300' : 'bg-cyan-500'}`}></div>
        </div>

        {/* Pivot Point */}
        <div className="absolute bottom-[84px] left-1/2 -ml-1.5 w-3 h-3 rounded-full bg-slate-800 border-2 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] z-30"></div>
      </div>

      {/* Hertz Readout */}
      <div className="mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        {status.frequency > 0 ? `${status.frequency.toFixed(2)} Hz` : '--- Hz'}
      </div>
    </div>
  );
};