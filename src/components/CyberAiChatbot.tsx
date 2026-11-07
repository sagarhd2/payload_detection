import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  X,
  RefreshCw,
  MessageSquare,
  Shield,
  Swords,
  Zap,
  Trash2,
  Copy,
  Check,
  Cpu,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export type GeminiModel = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';
export type ChatRole = 'red_team' | 'blue_team' | 'fast_auditor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: GeminiModel;
}

interface CyberAiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODEL_CONFIGS: Record<
  GeminiModel,
  { label: string; tag: string; description: string; badgeColor: string }
> = {
  'gemini-3.8-flash': {
    label: 'Gemini 3.8 Flash',
    tag: 'Balanced / General',
    description: 'High-speed reasoning for general cybersecurity queries & payload analysis',
    badgeColor: 'border-cyan-500/70 text-cyan-300 bg-cyan-950/80',
  },
  'gemini-3.1-flash-lite': {
    label: 'Gemini 3.1 Flash-Lite',
    tag: 'Ultra-Fast',
    description: 'Lowest latency for instant query syntax audits and token checks',
    badgeColor: 'border-blue-500/70 text-blue-300 bg-blue-950/80',
  },
  'gemini-4-argon': {
    label: 'Gemini 4 Argon',
    tag: 'Deep Reasoning',
    description: 'Complex multi-step AST bypass analysis and comprehensive secure architectures',
    badgeColor: 'border-indigo-500/70 text-indigo-300 bg-indigo-950/80',
  },
};

const ROLE_CONFIGS: Record<
  ChatRole,
  { name: string; title: string; icon: React.ReactNode; prompt: string }
> = {
  red_team: {
    name: 'Red Team',
    title: 'Offensive Security & Exploit Architect',
    icon: <Swords className="w-3.5 h-3.5 text-cyan-300" />,
    prompt: 'Specializes in SQLi vectors, WAF bypass heuristics, blind delays, and AST evasion.',
  },
  blue_team: {
    name: 'Blue Team',
    title: 'Defensive Cyber & Code Remediation Architect',
    icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
    prompt: 'Specializes in parameterized query rewrites, DB least privilege, and AST token filters.',
  },
  fast_auditor: {
    name: 'Rapid Auditor',
    title: 'High-Speed SQL Syntax Classifier',
    icon: <Zap className="w-3.5 h-3.5 text-amber-300" />,
    prompt: 'Provides rapid 3-point risk reports, suspicious token alerts, and instant 1-line fixes.',
  },
};

export const CyberAiChatbot: React.FC<CyberAiChatbotProps> = ({ isOpen, onClose }) => {
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('red_team');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-init',
      role: 'model',
      content: `### 🛡️ Aegis-Red Sentinel Security Intelligence Activated
Greetings, Operator. I am your multi-turn **Gemini-powered Security Assistant**.

**Current Active Profile:** Red Team Offensive Security Architect  
**Active Model Engine:** \`gemini-3.8-flash\` (Balanced General)

You can ask me to:
1. Deconstruct complex SQL injection payloads (e.g. \`ORDER BY 1\`, \`' UNION SELECT...\`, \`SLEEP(5)\`)
2. Generate production-ready parameterized code (Node.js pg, Python asyncpg, Java)
3. Audit suspicious database strings or explain open network ports

Switch personas or models above to adapt my analysis depth!`,
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: 'gemini-3.8-flash',
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
  }, [messages, isOpen, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Conversation thread reset. **${ROLE_CONFIGS[selectedRole].title}** ready using **${MODEL_CONFIGS[selectedModel].label}**. How can I assist with your security analysis?`,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: selectedModel,
      },
    ]);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText ?? input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        content: data.reply || 'No response from security agent.',
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'model',
          content: '⚠️ Connection timeout to security intelligence matrix. Re-attempting connection...',
          timestamp: new Date().toLocaleTimeString(),
          modelUsed: selectedModel,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const roleSuggestions: Record<ChatRole, string[]> = {
    red_team: [
      "Why does ' ORDER BY 1, 2, 3-- work for column enumeration?",
      "How does boolean blind extraction like (select substring(@@version,1,1))='X' work?",
      "Explain WAF evasion using comment delimiters like UN/**/ION SEL/**/ECT",
      "Deconstruct second-order SQL injection exploit mechanics",
    ],
    blue_team: [
      "Show how to fix 'SELECT * FROM users WHERE user=' + input in Node.js pg",
      "How to securely allow dynamic ORDER BY column sorting without SQLi?",
      "What is the Principle of Least Privilege for Postgres database users?",
      "Write a regex or AST token filter for suspicious SQL keywords",
    ],
    fast_auditor: [
      "Quick audit: admin' OR '1'='1' --",
      "Quick audit: ORDER BY 2",
      "Quick audit: and (select substring(@@version,1,1))='5'",
      "Quick audit: user_query_search_text_clean",
    ],
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-4xl bg-[#030a1c] border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-950/90 flex flex-col h-[740px] max-h-[92vh] overflow-hidden cyan-border-glow">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-cyan-900/80 bg-[#05112c] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-950 border border-cyan-400/80 flex items-center justify-center text-cyan-100 shadow-md shadow-cyan-950">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-wider flex items-center gap-1.5">
                  AEGIS-SQL SENTINEL AI
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                  Multi-Turn
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/70 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Powered by Gemini Language Models • Continuous Context</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#081735] hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-cyan-900 text-xs transition-colors cursor-pointer"
              title="Reset Conversation Thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-cyan-950 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tactical Control Bar: Model & Role Selectors */}
        <div className="px-4 py-2.5 bg-[#040e24] border-b border-cyan-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Persona / Role Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1">
              Role:
            </span>
            {(Object.keys(ROLE_CONFIGS) as ChatRole[]).map((r) => {
              const active = selectedRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-400 shadow-sm shadow-cyan-900/50'
                      : 'bg-[#061432] text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/60 border border-cyan-950'
                  }`}
                >
                  {ROLE_CONFIGS[r].icon}
                  <span>{ROLE_CONFIGS[r].name}</span>
                </button>
              );
            })}
          </div>

          {/* Model Engine Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              Model:
            </span>
            {(Object.keys(MODEL_CONFIGS) as GeminiModel[]).map((m) => {
              const active = selectedModel === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  title={MODEL_CONFIGS[m].description}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-600 text-white border border-cyan-300 shadow-sm shadow-cyan-900/60'
                      : 'bg-[#061432] text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/60 border border-cyan-950'
                  }`}
                >
                  {MODEL_CONFIGS[m].label.replace('Gemini ', '')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#030919] to-[#020612]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-950/90 border border-cyan-700/80 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 shadow-sm shadow-cyan-950">
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 text-xs sm:text-[13px] leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-700/40 to-blue-700/40 text-cyan-50 border border-cyan-500/80 rounded-tr-none shadow-cyan-950/40'
                      : 'bg-[#071533] text-slate-200 border border-cyan-900/80 rounded-tl-none shadow-black/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-slate-200">
                    {/* Render line breaks and markdown format */}
                    {m.content.split('\n').map((line, idx) => {
                      if (line.startsWith('### ')) {
                        return (
                          <h3
                            key={idx}
                            className="font-mono text-cyan-300 font-bold text-sm sm:text-base mt-2 mb-1.5 flex items-center gap-1.5"
                          >
                            {line.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <div
                            key={idx}
                            className="font-mono font-bold text-cyan-200 my-1"
                          >
                            {line.replace(/\*\*/g, '')}
                          </div>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <li
                            key={idx}
                            className="ml-4 list-disc text-slate-300 my-0.5"
                          >
                            {line.replace('- ', '')}
                          </li>
                        );
                      }
                      if (line.startsWith('```')) {
                        return (
                          <div
                            key={idx}
                            className="text-[10px] text-cyan-400/80 font-mono my-0.5"
                          >
                            {line}
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="my-0.5">
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Message Meta & Copy Action */}
                  <div className="text-[10px] text-cyan-400/60 mt-2.5 pt-2 border-t border-cyan-950/70 flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1.5">
                      {m.modelUsed && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                          {m.modelUsed}
                        </span>
                      )}
                      <span>{m.timestamp}</span>
                    </span>

                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="text-cyan-400/70 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#0c2452] border border-cyan-600/80 flex items-center justify-center text-cyan-200 shrink-0 mt-0.5 shadow-sm shadow-cyan-950">
                    <User className="w-4 h-4 text-cyan-300" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/90 border border-cyan-700/80 flex items-center justify-center text-cyan-300 shrink-0">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div className="bg-[#071533] border border-cyan-900 rounded-2xl px-4 py-3 text-xs text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Synthesizing intelligence with {MODEL_CONFIGS[selectedModel].label}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions Based on Role */}
        <div className="px-4 py-2.5 bg-[#030919] border-t border-cyan-950/90 overflow-x-auto flex items-center gap-2">
          <span className="text-[10px] text-cyan-400/80 font-bold shrink-0 uppercase tracking-wider">
            Quick Prompts:
          </span>
          {roleSuggestions[selectedRole].map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-[#07173a] hover:bg-cyan-950 border border-cyan-900 text-slate-300 hover:text-cyan-200 text-[11px] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Box */}
        <div className="p-3 sm:p-4 bg-[#040e24] border-t border-cyan-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${ROLE_CONFIGS[selectedRole].name} about payloads, ORDER BY, UNION attacks, open ports, code fixes...`}
              className="flex-1 bg-[#020713] border border-cyan-800/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 border border-cyan-400/60 cursor-pointer shadow-lg shadow-cyan-950"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span>
              Maintaining multi-turn context • Active: {MODEL_CONFIGS[selectedModel].label}
            </span>
            <span className="text-cyan-400/60">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
