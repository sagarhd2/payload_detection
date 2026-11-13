import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  X,
  RefreshCw,
  Shield,
  Swords,
  Zap,
  Trash2,
  Copy,
  Check,
  Cpu,
  Sparkles,
  AlertTriangle,
  Database,
  Activity,
  Radar,
  ShieldAlert,
  RotateCcw,
  Terminal,
} from 'lucide-react';

export type GeminiModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
export type ChatRole = 'red_team' | 'blue_team' | 'fast_auditor';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: GeminiModel;
}

export interface ChatContextHint {
  activeTab?: string;
  currentWorkbenchPayload?: string;
}

interface ChatStatusResponse {
  configured: boolean;
  supportedModels: GeminiModel[];
  contextStats: {
    incidentsCount: number;
    threatFeedsCount: number;
    activeRulesCount: number;
    portScansCount: number;
    workbenchInspectionsCount: number;
  };
}

interface ChatErrorState {
  message: string;
  code?: string;
  retryHistory: ChatMessage[];
}

interface CyberAiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  contextHint?: ChatContextHint;
}

const STORAGE_KEY = 'aegis_sql_chat_history_v1';

const MODEL_CONFIGS: Record<
  GeminiModel,
  { label: string; tag: string; description: string }
> = {
  'gemini-4-hydrogen': {
    label: 'Gemini 4 Hydrogen',
    tag: 'Deep Security Reasoning',
    description:
      'Flagship reasoning for SQLi deconstruction, live incident correlation, and secure code remediation',
  },
  'gemini-3.1-flash-lite': {
    label: 'Gemini 3.1 Flash-Lite',
    tag: 'Ultra-Fast',
    description:
      'Low-latency engine for rapid syntax audits, quick Q&A, and token classification',
  },
};

const ROLE_CONFIGS: Record<
  ChatRole,
  { name: string; title: string; icon: React.ReactNode }
> = {
  red_team: {
    name: 'Red Team',
    title: 'Offensive Security & Exploit Analyst',
    icon: <Swords className="w-3.5 h-3.5 text-cyan-300" />,
  },
  blue_team: {
    name: 'Blue Team',
    title: 'Defensive Architect & Remediation',
    icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
  },
  fast_auditor: {
    name: 'Rapid Auditor',
    title: 'High-Speed SQL Syntax Classifier',
    icon: <Zap className="w-3.5 h-3.5 text-amber-300" />,
  },
};

const CORE_SUGGESTED_QUESTIONS = [
  'Explain SQL Injection.',
  "Analyze a suspicious SQL query: admin' OR '1'='1'--",
  'How can I prevent SQL Injection?',
  'Explain intercepted incidents in my logs.',
  'How do prepared statements work?',
];

const ROLE_SUGGESTIONS: Record<ChatRole, string[]> = {
  red_team: [
    ...CORE_SUGGESTED_QUESTIONS,
    "Compare Boolean-based, Error-based, UNION-based, and Time-based blind SQLi.",
    'What open ports or attack surfaces were found in recent Port Scanner results?',
  ],
  blue_team: [
    ...CORE_SUGGESTED_QUESTIONS,
    'Rewrite a vulnerable Node.js login query using parameterized prepared statements.',
    'How do I enforce Principle of Least Privilege for PostgreSQL/SQLite?',
  ],
  fast_auditor: [
    ...CORE_SUGGESTED_QUESTIONS,
    "Quick audit: 1' UNION SELECT null, table_name FROM information_schema.tables--",
    'Quick audit: SELECT id, email FROM users WHERE id = $1',
  ],
};

function createWelcomeMessage(model: GeminiModel, role: ChatRole): ChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'model',
    content: `### 🛡️ AegisSQL Sentinel Security AI Active
Hello, Operator. I am your **Gemini-powered Cybersecurity Assistant** connected directly to AegisSQL Sentinel's live telemetry.

**Active Persona:** ${ROLE_CONFIGS[role].title}  
**Model Engine:** \`${model}\`

Ask me anything about:
- **SQL Injection Techniques:** Boolean-based, Error-based, Time-based, UNION-based, Stacked queries, and WAF evasion
- **Live System Telemetry:** Intercepted authentication incidents, Payload Workbench detections, SQLite detection rules, Threat Intelligence feeds, and Nmap Port Scanner findings
- **Secure Coding & Defense:** Parameterized queries, prepared statements, OWASP Top 10 (CWE-89), and database hardening`,
    timestamp: new Date().toLocaleTimeString(),
    modelUsed: model,
  };
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#020817] border border-cyan-800/70 text-cyan-300 font-mono text-[11px] sm:text-xs"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlockCard: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-cyan-800/80 bg-[#020612] shadow-inner">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#06132b] border-b border-cyan-900/70 text-[10px] font-mono">
        <span className="flex items-center gap-1.5 text-cyan-300 uppercase tracking-wider font-bold">
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>{language || 'code'}</span>
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1 text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] sm:text-xs font-mono text-cyan-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MarkdownMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const segments: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', content: content.slice(lastIdx, match.index) });
    }
    segments.push({
      type: 'code',
      lang: match[1] || 'text',
      content: match[2].replace(/\n$/, ''),
    });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIdx) });
  }

  return (
    <div className="space-y-1.5 font-sans text-slate-200 leading-relaxed">
      {segments.map((seg, segIdx) => {
        if (seg.type === 'code') {
          return (
            <CodeBlockCard
              key={`seg-code-${segIdx}`}
              language={seg.lang || 'code'}
              code={seg.content}
            />
          );
        }

        const lines = seg.content.split('\n');
        return (
          <div key={`seg-txt-${segIdx}`} className="space-y-1">
            {lines.map((rawLine, lineIdx) => {
              const line = rawLine.trimEnd();
              if (!line.trim()) {
                return <div key={lineIdx} className="h-1.5" />;
              }
              if (line.startsWith('### ')) {
                return (
                  <h3
                    key={lineIdx}
                    className="font-mono text-cyan-300 font-bold text-sm sm:text-base pt-1.5 pb-0.5"
                  >
                    {renderInlineFormatting(line.slice(4))}
                  </h3>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2
                    key={lineIdx}
                    className="font-mono text-cyan-200 font-extrabold text-sm sm:text-base pt-2 pb-0.5 border-b border-cyan-900/60"
                  >
                    {renderInlineFormatting(line.slice(3))}
                  </h2>
                );
              }
              if (line.startsWith('# ')) {
                return (
                  <h1
                    key={lineIdx}
                    className="font-mono text-white font-extrabold text-base pt-2 pb-1"
                  >
                    {renderInlineFormatting(line.slice(2))}
                  </h1>
                );
              }
              if (line.startsWith('> ')) {
                return (
                  <blockquote
                    key={lineIdx}
                    className="border-l-2 border-cyan-500 pl-3 py-0.5 my-1 text-cyan-100/90 bg-cyan-950/30 rounded-r"
                  >
                    {renderInlineFormatting(line.slice(2))}
                  </blockquote>
                );
              }
              const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
              if (bulletMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <div className="flex-1 text-slate-200">
                      {renderInlineFormatting(bulletMatch[1])}
                    </div>
                  </div>
                );
              }
              const numMatch = line.match(/^\s*(\d+\.)\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-cyan-400 font-mono font-bold text-xs mt-0.5 shrink-0">
                      {numMatch[1]}
                    </span>
                    <div className="flex-1 text-slate-200">
                      {renderInlineFormatting(numMatch[2])}
                    </div>
                  </div>
                );
              }

              return (
                <p key={lineIdx} className="text-slate-200 break-words">
                  {renderInlineFormatting(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const CyberAiChatbot: React.FC<CyberAiChatbotProps> = ({
  isOpen,
  onClose,
  contextHint,
}) => {
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3.1-flash-lite');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('red_team');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<ChatStatusResponse | null>(null);
  const [errorState, setErrorState] = useState<ChatErrorState | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: ChatMessage) => ({
            ...m,
            modelUsed:
              m.modelUsed === 'gemini-4-hydrogen' || m.modelUsed === 'gemini-3.1-flash-lite'
                ? m.modelUsed
                : undefined,
          }));
        }
      }
    } catch {
      // Ignore corrupt storage
    }
    return [createWelcomeMessage('gemini-3.1-flash-lite', 'red_team')];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchChatStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/status', {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data: ChatStatusResponse = await res.json();
        setChatStatus(data);
      }
    } catch {
      // Status check failure should not block rendering
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchChatStatus();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [isOpen, fetchChatStatus]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    const fresh = [createWelcomeMessage(selectedModel, selectedRole)];
    setMessages(fresh);
    setErrorState(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
  };

  const executeChatRequest = async (conversationHistory: ChatMessage[]) => {
    setIsLoading(true);
    setErrorState(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          role: selectedRole,
          contextHint,
        }),
      });

      let data: {
        reply?: string;
        model?: GeminiModel;
        error?: string;
        code?: string;
        contextSummary?: ChatStatusResponse['contextStats'];
      } = {};

      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        const errorMessage =
          data.error ||
          `Security AI returned HTTP ${response.status}. Please check server status or retry.`;
        if (data.code === 'INVALID_API_KEY' || data.code === 'MISSING_API_KEY') {
          setChatStatus((prev) => (prev ? { ...prev, configured: false } : prev));
        }
        setErrorState({
          message: errorMessage,
          code: data.code || `HTTP_${response.status}`,
          retryHistory: conversationHistory,
        });
        return;
      }

      if (!data.reply || !data.reply.trim()) {
        setErrorState({
          message: 'Gemini returned an empty response. Please retry your question.',
          code: 'EMPTY_RESPONSE',
          retryHistory: conversationHistory,
        });
        return;
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString(),
        modelUsed: data.model || selectedModel,
      };
      setMessages((prev) => [...prev, botMsg]);

      if (data.contextSummary) {
        setChatStatus((prev) =>
          prev ? { ...prev, contextStats: data.contextSummary! } : prev
        );
      }
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setErrorState({
        message: isAbort
          ? 'Request timed out after 30 seconds waiting for Gemini AI. Please retry.'
          : 'Network error reaching the backend Security AI server. Please check connectivity and retry.',
        code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        retryHistory: conversationHistory,
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSend = async (messageText?: string) => {
    const rawText = messageText ?? input;
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    if (trimmed.length > 16000) {
      setErrorState({
        message: 'Message exceeds the 16,000-character limit. Please shorten your prompt.',
        code: 'VALIDATION_ERROR',
        retryHistory: messages,
      });
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!messageText) {
      setInput('');
    }

    await executeChatRequest(updatedHistory);
  };

  const handleRetry = async () => {
    if (!errorState || isLoading) return;
    await executeChatRequest(errorState.retryHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-4xl bg-[#030a1c] border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-950/90 flex flex-col h-[760px] max-h-[92vh] overflow-hidden cyan-border-glow">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-cyan-900/80 bg-[#05112c] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-950 border border-cyan-400/80 flex items-center justify-center text-cyan-100 shadow-md shadow-cyan-950">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-wider">
                  AEGIS-SQL SENTINEL AI
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                    chatStatus === null || chatStatus.configured
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-rose-950/80 text-rose-300 border-rose-700'
                  }`}
                >
                  {chatStatus === null
                    ? 'Connecting...'
                    : chatStatus.configured
                    ? 'Gemini Live'
                    : 'Key Missing'}
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/70 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Multi-Turn Gemini API • Grounded in Live Project Modules</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#081735] hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-cyan-900 text-xs transition-colors cursor-pointer"
              title="Clear & Reset Conversation History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-cyan-950 border border-transparent hover:border-cyan-800 transition-colors cursor-pointer"
              title="Close Security AI"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tactical Control Bar: Model, Role, and Live Module Grounding Telemetry */}
        <div className="px-4 py-2.5 bg-[#040e24] border-b border-cyan-950 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Persona / Role Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1">
                Role:
              </span>
              {(Object.keys(ROLE_CONFIGS) as ChatRole[]).map((r) => {
                const active = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                Model:
              </span>
              {(Object.keys(MODEL_CONFIGS) as GeminiModel[]).map((m) => {
                const active = selectedModel === m;
                return (
                  <button
                    key={m}
                    type="button"
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

          {/* Connected Live Modules Telemetry Strip */}
          {chatStatus && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-cyan-950/80 text-[10px] text-slate-400">
              <span className="text-cyan-400/80 font-bold uppercase tracking-wider">
                Connected Modules:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#071533] border border-cyan-900/60 text-cyan-200">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                {chatStatus.contextStats.incidentsCount} Incidents
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#071533] border border-cyan-900/60 text-cyan-200">
                <Database className="w-3 h-3 text-cyan-400" />
                {chatStatus.contextStats.activeRulesCount} SQLi Rules
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#071533] border border-cyan-900/60 text-cyan-200">
                <Activity className="w-3 h-3 text-emerald-400" />
                {chatStatus.contextStats.threatFeedsCount} Threat Intel
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#071533] border border-cyan-900/60 text-cyan-200">
                <Radar className="w-3 h-3 text-amber-300" />
                {chatStatus.contextStats.portScansCount} Port Scans
              </span>
            </div>
          )}
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
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3.5 text-xs sm:text-[13px] shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-700/40 to-blue-700/40 text-cyan-50 border border-cyan-500/80 rounded-tr-none shadow-cyan-950/40'
                      : 'bg-[#071533] text-slate-200 border border-cyan-900/80 rounded-tl-none shadow-black/60'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans text-cyan-50 break-words">
                      {m.content}
                    </div>
                  ) : (
                    <MarkdownMessageContent content={m.content} />
                  )}

                  {/* Message Meta & Copy Action */}
                  <div className="text-[10px] text-cyan-400/60 mt-2.5 pt-2 border-t border-cyan-950/70 flex items-center justify-between gap-3 font-mono">
                    <span className="flex items-center gap-1.5">
                      {m.modelUsed && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                          {m.modelUsed}
                        </span>
                      )}
                      <span>{m.timestamp}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(m.content, m.id)}
                      className="text-cyan-400/70 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy full message"
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
              <div className="bg-[#071533] border border-cyan-900 rounded-2xl px-4 py-3 text-xs text-cyan-300 flex items-center gap-2.5">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.1s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                </span>
                <span>
                  Analyzing with {MODEL_CONFIGS[selectedModel].label} &amp; live telemetry...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Real Error Banner with Retry (never fakes an AI response) */}
        {errorState && (
          <div className="px-4 py-2.5 bg-rose-950/75 border-t border-rose-500/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-start gap-2 text-rose-200 flex-1 min-w-[200px]">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300 uppercase mr-1.5">
                  [{errorState.code || 'AI_ERROR'}]
                </span>
                <span>{errorState.message}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={() => setErrorState(null)}
                className="p-1 text-rose-300 hover:text-white cursor-pointer"
                title="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Suggested Security Prompts */}
        <div className="px-4 py-2 bg-[#030919] border-t border-cyan-950/90 overflow-x-auto flex items-center gap-2">
          <span className="text-[10px] text-cyan-400/80 font-bold shrink-0 uppercase tracking-wider">
            Suggested:
          </span>
          {ROLE_SUGGESTIONS[selectedRole].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-[#07173a] hover:bg-cyan-950 border border-cyan-900 text-slate-300 hover:text-cyan-200 text-[11px] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Multiline Chat Input Box */}
        <div className="p-3 sm:p-4 bg-[#040e24] border-t border-cyan-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2.5"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${ROLE_CONFIGS[selectedRole].name} about SQLi attacks, logs, port scans, or prepared statements...`}
              className="flex-1 resize-none bg-[#020713] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono shadow-inner leading-relaxed"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 border border-cyan-400/60 cursor-pointer shadow-lg shadow-cyan-950 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span>
              Multi-turn conversation persisted locally • Engine: {MODEL_CONFIGS[selectedModel].label}
            </span>
            <span className={input.length > 14000 ? 'text-amber-400 font-bold' : 'text-cyan-400/60'}>
              {input.length > 14000
                ? `${input.length}/16000 chars`
                : 'Enter to send • Shift+Enter for newline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
