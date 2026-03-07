import React, { useState } from 'react';
import { MicOff, Sun, Moon, Check, ChevronDown, Plus, Minus } from 'lucide-react';
import { useTuner } from './hooks/useTuner';
import { TunerGauge } from './components/TunerGauge';
import { StringSelector } from './components/StringSelector';
import { MicAccessOverlay } from './components/MicAccessOverlay';
import { TUNINGS, PITCH_OFFSETS, ALL_NOTES } from './constants';
import { useWakeLock } from './hooks/useWakeLock';
import { StringName } from './types';

// Helper: shift a note name by N semitones
function shiftNoteName(noteName: string, semitones: number): string {
  const idx = ALL_NOTES.indexOf(noteName.toUpperCase());
  if (idx === -1) return noteName;
  const shifted = ((idx + semitones) % 12 + 12) % 12;
  return ALL_NOTES[shifted];
}

function App() {
  const {
    isListening,
    startListening,
    stopListening,
    tuningStatus,
    selectedString,
    setSelectedString,
    tuningId,
    setTuningId,
    pitchOffset,
    setPitchOffset,
    permissionError,
    activeStrings
  } = useTuner();

  const { isAwake, toggleWakeLock } = useWakeLock();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const currentTuning = TUNINGS.find(t => t.id === tuningId) || TUNINGS[0];


  // The root key display: first string's label after offset
  const rootKey = pitchOffset === 0
    ? currentTuning.strings[0].label.toUpperCase()
    : shiftNoteName(currentTuning.strings[0].label, pitchOffset);

  // Build the tuning summary string (e.g., "E A D G B e" or "D# G# C# F# A# d#")
  const tuningSummary = currentTuning.strings.map(s => {
    if (pitchOffset === 0) return s.label;
    return shiftNoteName(s.label, pitchOffset);
  }).join(' ');

  // Determine which string is being detected (for the pointer indicator)
  let detectedString: StringName | undefined;
  if (selectedString !== StringName.AUTO) {
    detectedString = selectedString;
  } else if (tuningStatus.frequency > 0) {
    // In AUTO mode, find the closest string based on frequency (in cents)
    let closestString = activeStrings[0];
    let closestDiff = Infinity;
    for (const s of activeStrings) {
      const diff = Math.abs(1200 * Math.log(tuningStatus.frequency / s.frequency) / Math.log(2));
      if (diff < closestDiff) {
        closestDiff = diff;
        closestString = s;
      }
    }
    detectedString = closestString.name;
  }

  const handlePitchUp = () => {
    const maxOffset = PITCH_OFFSETS[0].value;
    if (pitchOffset < maxOffset) setPitchOffset(pitchOffset + 1);
  };

  const handlePitchDown = () => {
    const minOffset = PITCH_OFFSETS[PITCH_OFFSETS.length - 1].value;
    if (pitchOffset > minOffset) setPitchOffset(pitchOffset - 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center relative overflow-hidden font-sans">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-950/30 to-transparent pointer-events-none"></div>

      {/* Header */}
      <header className="w-full pt-[env(safe-area-inset-top,48px)] pb-4 px-6 flex items-center justify-between z-10">
        <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
          Guitar Tools
        </h1>

        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-cyan-400 animate-pulse-fast shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`}></div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isListening ? 'text-cyan-400' : 'text-slate-500'}`}>
            {isListening ? 'Mic Live' : 'Mic Idle'}
          </span>
        </div>
      </header>

      {/* Main Tuner Area */}
      <main className="flex-1 w-full max-w-lg flex flex-col items-center px-4 z-10">

        {/* Controls: Dropdown + Pitch Offset + Auto Select */}
        <div className={`w-full flex flex-col items-center gap-4 mt-4 transition-all duration-700 ${isListening ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Tuning Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-slate-900/80 px-5 py-2.5 rounded-2xl border border-slate-800/50 min-w-[200px] justify-between"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Tuning</span>
                <span className="text-sm font-black text-white uppercase tracking-tight">{currentTuning.name}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl z-50">
                {TUNINGS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTuningId(t.id); setShowDropdown(false); }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between
                        ${t.id === tuningId ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'}
                      `}
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {t.strings.map(s => s.label).join(' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pitch Offset Controls (+/- half step) */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePitchDown}
              disabled={pitchOffset <= PITCH_OFFSETS[PITCH_OFFSETS.length - 1].value}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex flex-col items-center min-w-[140px] bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Key</span>
              <span className="text-base font-black text-white tracking-tight">{rootKey}</span>
              <span className="text-[9px] font-mono text-cyan-500/60 tracking-wide mt-0.5">{tuningSummary}</span>
              {pitchOffset !== 0 && (
                <span className="text-[9px] font-bold text-amber-400/80 mt-0.5">
                  {pitchOffset > 0 ? `+${pitchOffset / 2}` : `${pitchOffset / 2}`} step{Math.abs(pitchOffset) !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <button
              onClick={handlePitchUp}
              disabled={pitchOffset >= PITCH_OFFSETS[0].value}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Auto Select String */}
          <button
            onClick={() => setSelectedString(selectedString === StringName.AUTO ? StringName.STRING_6 : StringName.AUTO)}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all
              ${selectedString === StringName.AUTO
                ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
              }
            `}
          >
            {selectedString === StringName.AUTO && <Check className="w-4 h-4" />}
            <span>Auto Select String</span>
          </button>
        </div>

        {/* Start Button Overlay (if not listening) */}
        {!isListening && (
          <MicAccessOverlay onStart={handleToggle} error={permissionError} />
        )}

        <div className={`w-full transition-all duration-500 mt-8 ${isListening ? 'opacity-100 scale-100' : 'opacity-30 blur-sm scale-95 pointer-events-none'}`}>
          <StringSelector selected={selectedString} onSelect={setSelectedString} activeStrings={activeStrings} detectedString={detectedString} />
          <TunerGauge status={tuningStatus} />
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="w-full p-8 flex flex-col items-center gap-6 z-10 bg-gradient-to-t from-slate-950 to-transparent">

        <div className="flex items-center gap-4">
          {isListening && (
            <button
              onClick={stopListening}
              className="group flex flex-col items-center gap-2 p-2"
            >
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                <MicOff className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stop</span>
            </button>
          )}

          <button
            onClick={toggleWakeLock}
            className="group flex flex-col items-center gap-2 p-2"
          >
            <div className={`p-3 rounded-full border transition-all ${isAwake ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
              {isAwake ? <Sun className="w-5 h-5 text-amber-400 animate-pulse-fast" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isAwake ? 'Awake' : 'Sleep'}
            </span>
          </button>
        </div>

        <div className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.4em]">
          Engine 2.0.4
        </div>
      </footer>

      {/* Click-away overlay for dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}

    </div>
  );
}

export default App;
