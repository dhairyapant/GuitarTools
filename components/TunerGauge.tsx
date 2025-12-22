import React from 'react';
import { TuningStatus } from '../types';
import { IN_TUNE_THRESHOLD_CENTS } from '../constants';

interface TunerGaugeProps {
  status: TuningStatus;
}

export const TunerGauge: React.FC<TunerGaugeProps> = ({ status }) => {
  const { deviation, note, isInTune } = status;

  // Clamp deviation for display (-50 to +50 cents usually enough for display)
  const clampedDeviation = Math.max(-50, Math.min(50, deviation));
  
  // Convert deviation to rotation angle (-45deg to 45deg)
  const rotation = (clampedDeviation / 50) * 45;

  let needleColor = 'bg-red-500';
  let needleShadow = 'shadow-[0_0_8px_rgba(239,68,68,0.4)]';
  let ringColor = 'border-slate-700';
  let glowColor = 'shadow-none';

  if (isInTune) {
    needleColor = 'bg-green-500';
    needleShadow = 'shadow-[0_0_20px_rgba(34,197,94,0.6)]';
    ringColor = 'border-green-500/50';
    glowColor = 'shadow-[0_0_30px_rgba(34,197,94,0.4)]';
  } else if (Math.abs(deviation) < 15) {
      needleColor = 'bg-yellow-400';
      needleShadow = 'shadow-[0_0_12px_rgba(250,204,21,0.5)]';
      ringColor = 'border-yellow-400/30';
  }

  // Formatting note name
  const noteDisplay = note ? `${note.name}${note.octave}` : '--';

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xs aspect-square mx-auto my-8">
      {/* Outer Ring */}
      <div className={`w-64 h-64 rounded-full border-4 ${ringColor} transition-colors duration-300 flex items-center justify-center relative ${glowColor}`}>
        
        {/* Ticks */}
        <div className="absolute inset-0">
           {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((tick) => {
               const tickRot = (tick / 50) * 45;
               const isCenter = tick === 0;
               return (
                   <div 
                    key={tick}
                    className={`absolute top-0 left-1/2 -ml-0.5 h-3 w-1 origin-bottom ${isCenter ? 'bg-white h-4 w-1.5' : 'bg-slate-600'}`}
                    style={{ 
                        transform: `rotate(${tickRot}deg) translateY(10px) translateY(0px)`, 
                        transformOrigin: '50% 128px' // Half of w-64
                    }}
                   />
               );
           })}
        </div>

        {/* Inner Circle Info */}
        <div className="flex flex-col items-center z-10">
          <span className="text-6xl font-bold text-slate-100 tabular-nums">
            {noteDisplay}
          </span>
          <span className={`text-sm mt-2 font-medium ${isInTune ? 'text-green-400' : 'text-slate-400'}`}>
            {status.frequency > 0 ? `${status.frequency.toFixed(1)} Hz` : 'Listening...'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {status.frequency > 0 ? (deviation > 0 ? `+${deviation.toFixed(0)} cents` : `${deviation.toFixed(0)} cents`) : ''}
          </span>
        </div>

        {/* Needle */}
        <div 
            className={`absolute top-4 left-1/2 -ml-1 h-28 w-1.5 rounded-full origin-bottom needle-transition ${needleColor} ${needleShadow}`}
            style={{ 
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 112px' // Adjusted for visual center
            }}
        ></div>
        
        {/* Needle Pivot */}
        <div className="absolute bg-slate-200 w-4 h-4 rounded-full shadow-lg z-20 top-1/2 left-1/2 -ml-2 -mt-2 transform translate-y-[32px]"></div>
      </div>

      <div className="mt-8 flex justify-between w-full px-8 font-semibold text-sm text-slate-400 uppercase tracking-wider">
        <span>Flat</span>
        <span className={isInTune ? "text-green-500 animate-pulse" : "opacity-0"}>In Tune</span>
        <span>Sharp</span>
      </div>
    </div>
  );
};