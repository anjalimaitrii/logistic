"use client";

import { useState, useEffect, useRef } from "react";
import { chatService, ChatMessage } from "@/services/chatService";

interface ClientChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  clientId: string;
  clientName: string;
}

export default function ClientChatPanel({ isOpen, onClose, jobId, clientId, clientName }: ClientChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !clientId) return;

    const socket = chatService.connect();

    socket.on("connect", () => {
      setConnected(true);
      chatService.joinRoom(clientId);
      chatService.loadHistory(clientId);
    });

    if (socket.connected) {
      setConnected(true);
      chatService.joinRoom(clientId);
      chatService.loadHistory(clientId);
    }

    chatService.onHistory((msgs) => setMessages(msgs));
    chatService.onMessage((msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      chatService.offAll();
      socket.off("connect");
    };
  }, [isOpen, clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !clientId) return;
    chatService.sendMessage({
      roomId: clientId,
      message: input.trim(),
      sender: "client",
      senderName: clientName || "Client",
    });
    setInput("");
  };

  const fmt = (ts: string | Date) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-600 pointer-events-none">
      <div
        className={`absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-100 bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            </div>
            <div>
              <div className="text-[14px] font-display font-black text-neutral-900 tracking-tight">Support Chat</div>
              <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5" style={{ color: connected ? "#22c55e" : "#f59e0b" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: connected ? "#22c55e" : "#f59e0b" }} />
                {connected ? `${jobId} · Live` : "Connecting..."}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
          <p className="text-[10px] font-bold text-neutral-400 text-center uppercase tracking-widest">Typical response time: &lt; 2 minutes</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/30">
          {messages.length === 0 && (
            <p className="text-center text-[11px] text-neutral-300 font-bold uppercase tracking-widest mt-8">No messages yet. Say hello!</p>
          )}
          {messages.map((msg, i) => (
            <div key={msg._id || i} className={`flex flex-col ${msg.sender === "client" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${
                msg.sender === "client"
                  ? "bg-primary text-white rounded-br-none"
                  : "bg-white border border-neutral-100 text-neutral-800 rounded-tl-none"
              }`}>
                {msg.message}
              </div>
              <span className="text-[9px] font-black text-neutral-300 mt-1.5 uppercase tracking-tighter">
                {msg.senderName} • {fmt(msg.timestamp)}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-neutral-100 bg-white">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-4 pr-14 text-xs outline-none focus:border-primary/40 focus:bg-white transition-all shadow-inner font-bold text-neutral-900 placeholder:text-neutral-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
