import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  X,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface CyberAiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CyberAiChatbot: React.FC<CyberAiChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content:
        'Greetings, Operator. I am **Aegis-SQL AI**, your Security Operations & SQL Injection Analyst. Ask me anything about SQL injection exploits, query payload deconstruction, CVE advisories, port security, or parameterized defenses.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText ?? input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        content: data.reply || 'No response from security agent.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'model',
          content: '⚠️ Connection timeout to security intelligence matrix.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "How does a UNION-based SQLi bypass work?",
    "Explain blind time-delay injection using SLEEP()",
    "Audit this query: SELECT * FROM admin WHERE user='x'",
    "What are parameterized queries and prepared statements?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-2xl bg-[#060e20] border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-950/80 flex flex-col h-[650px] max-h-[90vh] overflow-hidden cyan-border-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-950 bg-[#081530]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wide">
                  AEGIS-SQL SECURITY AI
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="text-[10px] text-cyan-300/70">
                Active Multi-Turn Threat Advisory Agent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-cyan-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cyan-600/30 text-cyan-50 border border-cyan-500/80 rounded-tr-none'
                    : 'bg-[#081735] text-slate-200 border border-cyan-950 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="text-[9px] text-cyan-400/60 mt-1.5 text-right">
                  {m.timestamp}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#0e2758] border border-cyan-700 flex items-center justify-center text-cyan-200 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#081735] border border-cyan-950 rounded-2xl px-4 py-2.5 text-xs text-cyan-300 animate-pulse">
                Deconstructing query heuristics &amp; synthesizing response...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 bg-[#050c1a] border-t border-cyan-950 overflow-x-auto flex gap-1.5">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-lg bg-[#081735] hover:bg-cyan-950/70 border border-cyan-950 text-slate-300 hover:text-cyan-200 text-[10px] whitespace-nowrap transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-[#050c1a] border-t border-cyan-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SQLi payloads, open ports, CVE advisories, code fixes..."
              className="flex-1 bg-[#030816] border border-cyan-900/80 rounded-xl px-3.5 py-2.5 text-xs text-cyan-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 border border-cyan-400/60 cursor-pointer shadow-md shadow-cyan-900/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
