import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Activity,
  Terminal,
  BookOpen,
  Server,
  MessageSquare,
  Layers,
  Cpu,
  Lock,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AgentStatus } from '../types';

interface StartingLandingPageProps {
  status: AgentStatus;
  onGetStarted: (targetTab?: 'login' | 'training' | 'feeds' | 'sandbox' | 'logs') => void;
  onOpenPortScanner: () => void;
  onOpenChat: () => void;
  onOpenPresentation: () => void;
}

export const StartingLandingPage: React.FC<StartingLandingPageProps> = ({
  status,
  onGetStarted,
  onOpenPortScanner,
  onOpenChat,
  onOpenPresentation,
}) => {
  const capabilities = [
    {
      id: 'login' as const,
      title: 'Target Auth Portal & Warning Engine',
      description:
        'Simulate login authentication with live SQL injection detection. Catches tautologies, ORDER BY probes, and blind substring extraction before database execution.',
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      actionLabel: 'Test Auth Portal',
    },
    {
      id: 'training' as const,
      title: '24-Hour Autonomous Retraining Lab',
      description:
        'Continuous learning pipeline that fetches real-world telemetry from OWASP Honeypot clusters and NVD CVE advisories, auto-calibrating AST heuristic weights daily.',
      icon: <Activity className="w-5 h-5 text-cyan-400" />,
      actionLabel: 'Inspect Retraining Lab',
    },
    {
      id: 'sandbox' as const,
      title: 'Payload Injector Workbench',
      description:
        'Interactive laboratory to test raw queries, AST token decomposition, and evasion techniques with instant threat classification and confidence scoring.',
      icon: <Terminal className="w-5 h-5 text-cyan-400" />,
      actionLabel: 'Open Workbench',
    },
    {
      id: 'feeds' as const,
      title: 'Global CVE & Honeypot Telemetry',
      description:
        'Real-time ingestion feed tracking active SQL injection campaigns, zero-day CVE advisories, and honeypot attack telemetry from worldwide sensor clusters.',
      icon: <BookOpen className="w-5 h-5 text-cyan-400" />,
      actionLabel: 'View Threat Feeds',
    },
    {
      id: 'logs' as const,
      title: 'Intercepted Security Incidents',
      description:
        'Forensic incident ledger detailing every blocked SQL injection attempt with IP timestamps, token markers, severity classification, and mitigation audits.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      actionLabel: 'Review Incidents',
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 cyber-grid flex flex-col font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Bar */}
      <header className="border-b border-cyan-900/60 bg-[#040a18]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-950 border border-cyan-400/80 shadow-md shadow-cyan-950 text-white">
              <ShieldCheck className="w-5 h-5 text-cyan-100" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AegisSQL Sentinel
              </span>
              <span className="ml-2 text-[10px] text-cyan-400/70 hidden sm:inline">
                Autonomous Defense Matrix
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={onOpenPresentation}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#081735] hover:bg-cyan-950 text-cyan-200 hover:text-white border border-cyan-800 text-xs font-bold transition-all cursor-pointer"
              title="Open Architecture & Training Slides"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Project Deck</span>
            </button>

            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#08183a] hover:bg-cyan-950 text-cyan-200 hover:text-white border border-cyan-500/70 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-cyan-950"
              title="Open Gemini Multi-Turn Security Chatbot"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
              <span>Ask Security AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-cyan-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Status Subtitle */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07173a] border border-cyan-700/60 text-cyan-300 text-xs font-semibold mb-6 shadow-sm shadow-cyan-950">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>NEXT-GEN AUTONOMOUS SQL INJECTION DEFENSE &amp; LEARNING MATRIX</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Stop SQL Injection at the Lexical AST Boundary.
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            AegisSQL Sentinel intercepts sophisticated injection vectors—tautologies, column enumeration,
            blind time delays, and AST bypasses. Continuous 24-hour autonomous retraining synthesizes real-world
            threat telemetry from OWASP Honeypot clusters and CVE advisories.
          </p>

          {/* Core Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={() => onGetStarted('login')}
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm tracking-wide shadow-xl shadow-cyan-900/80 border border-cyan-300 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenChat}
              className="px-5 py-3.5 rounded-xl bg-[#08183a] hover:bg-cyan-950 text-cyan-200 hover:text-white font-bold text-xs sm:text-sm border border-cyan-700/80 flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-950"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Ask Security AI</span>
            </button>

            <button
              onClick={onOpenPortScanner}
              className="px-5 py-3.5 rounded-xl bg-[#05112c] hover:bg-[#091a40] text-slate-300 hover:text-cyan-200 font-bold text-xs sm:text-sm border border-cyan-900 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Nmap Port Scanner</span>
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-[#061432] border border-cyan-900/80 shadow-md">
              <span className="text-[11px] text-cyan-300/70 block">Model Engine</span>
              <span className="text-sm sm:text-base font-black text-white">{status.modelVersion}</span>
              <span className="text-[10px] text-emerald-400 mt-0.5 block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Online &amp; Synchronized
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#061432] border border-cyan-900/80 shadow-md">
              <span className="text-[11px] text-cyan-300/70 block">Detection Accuracy</span>
              <span className="text-sm sm:text-base font-black text-cyan-300">{status.accuracyRate}%</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                False Positive: {status.falsePositiveRate}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#061432] border border-cyan-900/80 shadow-md">
              <span className="text-[11px] text-cyan-300/70 block">Active Signatures</span>
              <span className="text-sm sm:text-base font-black text-white">
                {status.activeSignaturesCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-cyan-400 mt-0.5 block">Compiled AST Rules</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#061432] border border-cyan-900/80 shadow-md">
              <span className="text-[11px] text-cyan-300/70 block">Training Cycle</span>
              <span className="text-sm sm:text-base font-black text-white">Every 24h</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">00:00 UTC Scheduled</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Integrated Cyber Defense Modules
          </h2>
          <p className="text-xs sm:text-sm text-cyan-300/70 mt-2 max-w-2xl mx-auto">
            Click on any module below to launch directly into that workspace, or press Get Started above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              onClick={() => onGetStarted(cap.id)}
              className="p-5 rounded-2xl bg-[#06112a] border border-cyan-900/80 hover:border-cyan-400 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/80 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#081a3d] border border-cyan-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {cap.icon}
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {cap.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-cyan-950/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-200">
                <span>{cap.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}

          {/* Nmap Port Scanner Card */}
          <div
            onClick={onOpenPortScanner}
            className="p-5 rounded-2xl bg-gradient-to-br from-[#071940] to-[#040e26] border border-cyan-600/70 hover:border-cyan-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/80 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center mb-4 text-cyan-300 group-hover:scale-105 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span>Nmap Port &amp; Version Scanner</span>
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Scan live IP addresses and subnets for open TCP ports, service version discovery
                (HTTP, MySQL, PostgreSQL, SSH), banner grabbing, and CVE vulnerability identification.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-cyan-950/80 flex items-center justify-between text-xs font-bold text-cyan-300 group-hover:text-white">
              <span>Launch Port Scanner</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Quick Gemini Assistant Card */}
          <div
            onClick={onOpenChat}
            className="p-5 rounded-2xl bg-gradient-to-br from-[#061436] to-[#040e26] border border-cyan-700/80 hover:border-cyan-400 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/80 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center mb-4 text-cyan-300 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span>Multi-Turn Gemini Security AI</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Consult with our Red Team Offensive Security Architect or Blue Team Defender.
                Deconstructs payloads, writes production parameterized code, and explains network CVEs.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-cyan-950/80 flex items-center justify-between text-xs font-bold text-cyan-300 group-hover:text-white">
              <span>Open Security AI</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Bottom Callout Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#061435] via-[#081d4b] to-[#0a1838] border border-cyan-500/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl text-white">
                Ready to Test SQL Injection Defense?
              </span>
            </div>
            <p className="text-xs sm:text-sm text-cyan-200/80 mt-1.5 max-w-xl">
              Launch the live Target Auth Portal to run real attack payloads like{' '}
              <code className="text-cyan-300 bg-cyan-950/80 px-1 rounded">admin' OR '1'='1</code>,{' '}
              <code className="text-cyan-300 bg-cyan-950/80 px-1 rounded">ORDER BY 1</code>, and{' '}
              <code className="text-cyan-300 bg-cyan-950/80 px-1 rounded">SUBSTRING(@@version,1,1)</code>.
            </p>
          </div>

          <button
            onClick={() => onGetStarted('login')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-900 border border-cyan-300 flex items-center gap-2 whitespace-nowrap transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-950 bg-[#020614]/90 py-5 px-6 text-center text-xs text-cyan-400/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            AEGIS-SQL SENTINEL • AUTONOMOUS INJECTION DEFENSE &amp; LEARNING AGENT
          </span>
          <span className="text-slate-500">
            PORT 3000 • OWASP TELEMETRY • NMAP PORT RECON
          </span>
        </div>
      </footer>
    </div>
  );
};
