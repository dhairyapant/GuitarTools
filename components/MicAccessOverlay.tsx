import React from 'react';
import { Mic, Music, Timer, Settings, Activity } from 'lucide-react';
import logoUrl from '../guitar_tool_logo.png';

interface MicAccessOverlayProps {
    onStart: () => void;
    error?: string | null;
}

export const MicAccessOverlay: React.FC<MicAccessOverlayProps> = ({ onStart, error }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-500">

            {/* Background Decorative Icons */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                <Music className="absolute top-10 left-10 w-32 h-32 rotate-12" />
                <Timer className="absolute top-1/4 right-[-20px] w-48 h-48 -rotate-12" />
                <Settings className="absolute bottom-1/4 left-[-40px] w-64 h-64 rotate-45" />
                <Mic className="absolute bottom-10 right-10 w-40 h-40 -rotate-12" />
            </div>

            <div className="w-full max-w-sm flex flex-col items-center text-center z-10">

                {/* Pulsing Logo Button */}
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-cyan-500 rounded-full blur-2xl opacity-20 animate-pulse-fast"></div>
                    <button
                        onClick={onStart}
                        className="group relative bg-gradient-to-br from-cyan-500 to-blue-600 w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.3)] transform transition-all active:scale-95 hover:scale-105 overflow-hidden border-2 border-slate-700/50"
                    >
                        <img src={logoUrl} alt="Guitar Tool Logo" className="w-full h-full object-cover" />

                        {/* Inner ring animation */}
                        <div className="absolute inset-0 border-4 border-white/25 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }}></div>
                    </button>
                </div>

                <h2 className="text-4xl font-black mb-5 tracking-tight text-white">
                    Microphone Access Required
                </h2>

                <p className="text-slate-400 text-xl leading-relaxed mb-10 font-medium">
                    To tune your guitar, we need permission to use your microphone. We'll only listen while the app is active.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 flex items-start gap-3 text-left w-full animate-in zoom-in-95 duration-300">
                        <Activity className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-400 text-sm font-bold uppercase tracking-wider mb-1">Access Denied</p>
                            <p className="text-red-300/80 text-sm leading-snug">{error}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={onStart}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold py-5 px-8 text-xl rounded-2xl border border-slate-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <span>Grant Access & Start Tuning</span>
                </button>
            </div>

        </div>
    );
};
