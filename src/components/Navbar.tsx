import React from 'react';
import {
  ShieldCheck,
  Activity,
  BookOpen,
  Terminal,
  MessageSquare,
  Server,
  Layers,
} from 'lucide-react';
import { AgentStatus } from '../types';

interface NavbarProps {
  activeTab: 'login' | 'training' | 'feeds' | 'sandbox' | 'logs';
  setActiveTab: (tab: 'login' | 'training' | 'feeds' | 'sandbox' | 'logs') => void;
  status: AgentStatus | null;
  incidentCount: number;
  onOpenChat: () => void;
  onOpenPortScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  status,
  incidentCount,
  onOpenChat,
  onOpenPortScanner,
}) => {
  return (
    <header className="border-b border-cyan-900/60 bg-[#040a18]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Emblem */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-950 border border-cyan-400/70 shadow-lg shadow-cyan-500/25 text-white font-mono">
              <ShieldCheck className="w-5 h-5 text-cyan-100" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg tracking-wider bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-1.5">
                  AegisSQL Sentinel
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase tracking-widest">
                  {status ? status.modelVersion : 'v3.8.4-adaptive'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-cyan-300/70 hidden sm:flex items-center gap-1">
                <span>Autonomous SQL Injection Defense &amp; Daily Learning Agent</span>
              </p>
            </div>
          </div>

          {/* Top Right Controls (Navy + Cyan) */}
          <div className="flex items-center gap-2.5 font-mono">
            {/* Real-Time Sensor Telemetry Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#081735] border border-cyan-800/80 text-cyan-300 text-xs font-bold shadow-sm shadow-cyan-950">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>SENSORS: SYNCHRONIZED</span>
            </div>

            {/* Nmap-Style Port Scanner Trigger */}
            <button
              onClick={onOpenPortScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c1e44] hover:bg-cyan-950 text-cyan-200 hover:text-white border border-cyan-500/70 text-xs font-bold transition-all shadow-md shadow-cyan-950/60 cursor-pointer"
              title="Launch Nmap-Style Port & Version Scanner"
            >
              <Server className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden md:inline">Port Scanner (Nmap)</span>
              <span className="md:hidden">Port Scan</span>
            </button>

            {/* AI Security Analyst Chatbot Trigger */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/60 text-xs font-bold transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
              title="Open Gemini AI Security Chatbot"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-100" />
              <span>Ask Security AI</span>
            </button>
          </div>
        </div>

        {/* Tactical Nav Tabs */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-cyan-900/40 overflow-x-auto py-2 font-mono">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'login'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-900/40 font-bold'
                : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Target Auth Portal &amp; Alert</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'training'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-900/40 font-bold'
                : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Autonomous Retraining Lab</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
              DAILY
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'feeds'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-900/40 font-bold'
                : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Global Threat Feeds</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-900/40 font-bold'
                : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Payload Injector Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-900/40 font-bold'
                : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Intercepted Incidents</span>
            {incidentCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-900 text-cyan-100 font-bold border border-cyan-500">
                {incidentCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
