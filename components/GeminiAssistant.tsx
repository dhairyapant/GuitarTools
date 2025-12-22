import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const GeminiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I can help with tuning tips, string maintenance, or guitar setup questions.' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !process.env.API_KEY) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: "You are a professional guitar technician and luthier. Keep your answers concise, practical, and encouraging for a guitarist trying to tune their instrument. Focus on standard tuning EADGBE."
        }
      });
      
      const text = response.text || "Sorry, I couldn't get a response right now.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops, connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-lg shadow-cyan-900/50 transition-all z-50 group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm h-[500px] rounded-2xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white">Tuner Assistant</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                m.role === 'user' 
                  ? 'bg-cyan-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                 <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
               </div>
             </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about tuning..."
              className="flex-1 bg-slate-800 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-slate-700"
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-cyan-600 text-white p-2 rounded-xl hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
