import React, { useState } from 'react';
import { MicOff, Sun, Moon, Check, ChevronDown, Plus, Minus, Menu, X, Info, HelpCircle } from 'lucide-react';
import { useTuner } from './hooks/useTuner';
import { TunerGauge } from './components/TunerGauge';
import { StringSelector } from './components/StringSelector';
import { MicAccessOverlay } from './components/MicAccessOverlay';
import { TUNINGS, PITCH_OFFSETS, ALL_NOTES } from './constants';
import { useWakeLock } from './hooks/useWakeLock';
import { StringName } from './types';
import logoUrl from './guitar_tool_logo.png';

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
  const [showMenu, setShowMenu] = useState(false);

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
      <header className="w-full pt-[env(safe-area-inset-top,24px)] pb-2 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="Guitar Tool Logo" className="w-8 h-8 object-contain rounded-xl border border-slate-800" />
          <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
            Guitar Tool
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-800">
            <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-cyan-400 animate-pulse-fast shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isListening ? 'text-cyan-400' : 'text-slate-500'}`}>
              {isListening ? 'Live' : 'Idle'}
            </span>
          </div>

          <button
            onClick={() => setShowMenu(true)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Tuner Area */}
      <main className="flex-1 w-full max-w-lg flex flex-col items-center px-4 z-10">

        {/* Controls: Dropdown + Pitch Offset + Auto Select */}
        <div className={`w-full flex flex-col items-center gap-2.5 mt-2 transition-all duration-700 ${isListening ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* Tuning Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-slate-900/80 px-5 py-2 rounded-xl border border-slate-800/50 min-w-[200px] justify-between"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Tuning</span>
                <span className="text-base font-black text-white uppercase tracking-tight">{currentTuning.name}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-50">
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
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex flex-col items-center min-w-[130px] bg-slate-900/60 px-4 py-1.5 rounded-lg border border-slate-800/40">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Key</span>
              <span className="text-xl font-black text-white tracking-tight">{rootKey}</span>
              <span className="text-[10px] font-mono text-cyan-500/60 tracking-wide mt-0.5">{tuningSummary}</span>
              {pitchOffset !== 0 && (
                <span className="text-[9px] font-bold text-amber-400/80 mt-0.5">
                  {pitchOffset > 0 ? `+${pitchOffset / 2}` : `${pitchOffset / 2}`} step{Math.abs(pitchOffset) !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <button
              onClick={handlePitchUp}
              disabled={pitchOffset >= PITCH_OFFSETS[0].value}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Auto Select String */}
          <button
            onClick={() => setSelectedString(selectedString === StringName.AUTO ? StringName.STRING_6 : StringName.AUTO)}
            className={`
              flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all
              ${selectedString === StringName.AUTO
                ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
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

        <div className={`w-full transition-all duration-500 mt-4 ${isListening ? 'opacity-100 scale-100' : 'opacity-30 blur-sm scale-95 pointer-events-none'}`}>
          <StringSelector selected={selectedString} onSelect={setSelectedString} activeStrings={activeStrings} detectedString={detectedString} />
          <TunerGauge status={tuningStatus} />
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="w-full pt-2 pb-[env(safe-area-inset-bottom,12px)] px-6 flex flex-col items-center gap-3 z-10 bg-gradient-to-t from-slate-950 to-transparent">

        <div className="flex items-center gap-4">
          {isListening && (
            <button
              onClick={stopListening}
              className="group flex flex-col items-center gap-1.5 p-2"
            >
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all">
                <MicOff className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stop</span>
            </button>
          )}

          <button
            onClick={toggleWakeLock}
            className="group flex flex-col items-center gap-1.5 p-2"
          >
            <div className={`p-3 rounded-full border transition-all ${isAwake ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
              {isAwake ? <Sun className="w-5 h-5 text-amber-400 animate-pulse-fast" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isAwake ? 'Awake' : 'Sleep'}
            </span>
          </button>
        </div>

        <div className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.3em]">
          Engine 2.0.4
        </div>
      </footer>

      {/* Click-away overlay for dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}

      {/* Drawer Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Drawer content */}
          <div className="relative w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Guitar Tool Logo" className="w-8 h-8 object-contain rounded-lg border border-slate-800" />
                <span className="text-lg font-black tracking-tight text-white uppercase italic">Guitar Tool</span>
              </div>
              <button 
                onClick={() => setShowMenu(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* About Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Info className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-wider">About</h2>
                </div>
                
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-bold">Version</span>
                    <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2.5 py-0.5 rounded-full font-black">v1.0.0</span>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Our Mission</span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Guitar Tool is built with a single goal: to be <strong>100% ad-free</strong> and help guitar players tune to absolute perfection. No ads, no tracking, just high-precision utility.
                    </p>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 space-y-2">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Key Features</span>
                    <ul className="text-slate-300 text-[11px] space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>High-precision autocorrelation pitch detection.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>Popular tunings (Standard, Drop D, DADGAD, Open tuning).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>Adjustable reference pitch & half-step offsets.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>Smart Auto Select String mode.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>Screen wake lock to prevent sleep mode.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Help Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <HelpCircle className="w-4 h-4" />
                  <h2 className="text-xs font-black uppercase tracking-wider">How To Use</h2>
                </div>
                
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 space-y-4 text-xs leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-cyan-400 font-black text-[10px] block uppercase">1. Grant Microphone Access</span>
                    <p className="text-slate-300">Allow microphone permission when starting so the app can hear your guitar strings.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-cyan-400 font-black text-[10px] block uppercase">2. Select Tuning Preset</span>
                    <p className="text-slate-300">Choose a tuning preset (e.g. Standard E or Drop D) from the tuning dropdown at the top.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-cyan-400 font-black text-[10px] block uppercase">3. Choose String Mode</span>
                    <p className="text-slate-300">Toggle <strong>Auto Select String</strong> to let the tuner automatically detect which string is played, or tap specific note buttons to lock to one string.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-cyan-400 font-black text-[10px] block uppercase">4. Tune to Center</span>
                    <p className="text-slate-300">Pluck a string. If the gauge needle is on the left, it is Flat. If it is on the right, it is Sharp. Adjust your peg until the needle lands in the green success zone.</p>
                  </div>

                  {/* Button Guide */}
                  <div className="border-t border-slate-800/60 pt-3 space-y-2">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Controls Description</span>
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <p>• <strong className="text-white">Auto Select String</strong>: Toggle automatic note detection vs manual override.</p>
                      <p>• <strong className="text-white">Key Offset (+/-)</strong>: Transpose tuning up/down in semitones (e.g., half-step down).</p>
                      <p>• <strong className="text-white">Wake Lock (Awake/Sleep)</strong>: Keeps the phone display active while tuning.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-800/60 bg-slate-950/20 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Guitar Tool • v1.0.0
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
