"use client";

import { useState, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: "Admin" | "Customer";
  time: string;
}

interface BookingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  request: any | null;
  onFinalize: () => void;
}

export default function BookingChatPanel({ isOpen, onClose, request, onFinalize }: BookingChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi, I'm interested in this route. Is the price negotiable?", sender: "Customer", time: "10:30 AM" },
    { id: 2, text: "Hello! We can discuss. What's your proposed budget?", sender: "Admin", time: "10:35 AM" },
    { id: 3, text: "Can we do it for ₦140,000 instead of ₦150,000?", sender: "Customer", time: "10:40 AM" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      text: input,
      sender: "Admin",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none">
      <div 
        className={`absolute inset-0 bg-neutral-900/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[400px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                {request?.customer?.[0] || "C"}
             </div>
             <div>
                <div className="text-[14px] font-bold text-neutral-900">{request?.customer || "Customer"}</div>
                <div className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-success ring-4 ring-success/10" />
                   Online
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-colors">
             <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Request Meta */}
        <div className="p-4 bg-indigo-50/30 border-b border-indigo-100/50 flex items-center justify-between">
           <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.1em]">Target Route</div>
              <div className="text-[12px] font-bold text-indigo-900">{request?.route || "..."}</div>
           </div>
           <button 
             onClick={onFinalize}
             className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
           >
              Finalize Deal
           </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/20">
          <div className="text-center">
             <span className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full border border-neutral-100 shadow-sm">Today</span>
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "Admin" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                msg.sender === "Admin" 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-white border border-neutral-100 text-neutral-800 rounded-tl-none"
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase tracking-tighter">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-100">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              placeholder="Type your message..."
              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3 pl-4 pr-12 text-[13px] outline-none focus:border-primary/30 focus:bg-white transition-all shadow-inner font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
            >
               <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
