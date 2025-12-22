import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useTuner } from './hooks/useTuner';
import { TunerGauge } from './components/TunerGauge';
import { StringSelector } from './components/StringSelector';
import { GeminiAssistant } from './components/GeminiAssistant';

function App() {
  const { 
    isListening, 
    startListening, 
    stopListening, 
    tuningStatus, 
    selectedString, 
    setSelectedString,
    permissionError
  } = useTuner();

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-tuner-bg flex flex-col items-center relative overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none"></div>

      {/* Header */}
      <header className="w-full p-6 flex flex-col items-center z-10">
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">
          G-Tune Pro
        </h1>
        <p className="text-slate-500 text-xs tracking-wider mt-1">Standard Tuning (EADGBE)</p>
      </header>

      {/* Main Tuner Area */}
      <main className="flex-1 w-full max-w-lg flex flex-col items-center justify-center px-4 z-10">
        
        {permissionError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{permissionError}</p>
          </div>
        )}

        {/* Start Button Overlay (if not listening) */}
        {!isListening && !permissionError && (
            <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                <button
                    onClick={handleToggle}
                    className="group relative flex flex-col items-center justify-center"
                >
                    <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse-fast"></div>
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform">
                        <Mic className="w-10 h-10 text-white" />
                    </div>
                    <span className="mt-4 text-cyan-400 font-bold tracking-wider text-sm uppercase">Tap to Tune</span>
                </button>
            </div>
        )}

        <div className={`w-full transition-opacity duration-500 ${isListening ? 'opacity-100' : 'opacity-30 blur-sm'}`}>
            <TunerGauge status={tuningStatus} />
            <StringSelector selected={selectedString} onSelect={setSelectedString} />
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="w-full p-6 flex justify-center z-10 bg-gradient-to-t from-slate-900 to-transparent">
        {isListening && (
            <button 
                onClick={stopListening}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 text-slate-400 border border-slate-700 rounded-full transition-all text-sm font-medium"
            >
                <MicOff className="w-4 h-4" />
                <span>Stop Listening</span>
            </button>
        )}
      </footer>

      {/* AI Assistant */}
      <GeminiAssistant />

    </div>
  );
}

export default App;
