import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPortal } from './components/LoginPortal';
import { AgentTrainingCenter } from './components/AgentTrainingCenter';
import { ThreatFeedViewer } from './components/ThreatFeedViewer';
import { PayloadSandbox } from './components/PayloadSandbox';
import { SecurityIncidentLogs } from './components/SecurityIncidentLogs';
import { CyberAiChatbot } from './components/CyberAiChatbot';
import { PortScanner } from './components/PortScanner';
import { PresentationDeck } from './components/PresentationDeck';
import { StartingLandingPage } from './components/StartingLandingPage';
import { Bot, Sparkles } from 'lucide-react';
import { AgentStatus, TrainingRun, ThreatFeedItem, IncidentLog } from './types';

const DEFAULT_STATUS: AgentStatus = {
  online: true,
  agentName: 'AegisSQL Sentinel v3.8.5',
  modelVersion: 'v3.8.5-adaptive',
  lastTrainedTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  nextScheduledTraining: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  trainingCronInterval: 'Every 24 Hours (00:00 UTC)',
  activeSignaturesCount: 2600,
  totalPayloadsScreened: 15420,
  totalThreatsBlocked: 448,
  accuracyRate: 99.89,
  falsePositiveRate: 0.015,
  geminiAiEnabled: true,
  learningMode: 'CONTINUOUS_AUTONOMOUS',
};

async function fetchJsonSafe<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      return await res.json();
    }
    return fallback;
  } catch {
    // If dev-server is restarting or transient network drop, retry once silently after brief delay
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const retryRes = await fetch(url, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (retryRes.ok) {
        return await retryRes.json();
      }
    } catch {
      // Gracefully fall back without breaking the app or throwing unhandled errors
    }
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'training' | 'feeds' | 'sandbox' | 'logs'>('login');
  const [status, setStatus] = useState<AgentStatus>(DEFAULT_STATUS);
  const [trainingHistory, setTrainingHistory] = useState<TrainingRun[]>([]);
  const [threatFeeds, setThreatFeeds] = useState<ThreatFeedItem[]>([]);
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [sandboxPayload, setSandboxPayload] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isPortScannerOpen, setIsPortScannerOpen] = useState<boolean>(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const refreshAllData = async () => {
    try {
      const [newStatus, newHistory, newFeeds, newLogs] = await Promise.all([
        fetchJsonSafe<AgentStatus>('/api/agent/status', status),
        fetchJsonSafe<TrainingRun[]>('/api/agent/training-history', trainingHistory),
        fetchJsonSafe<ThreatFeedItem[]>('/api/agent/threat-feeds', threatFeeds),
        fetchJsonSafe<IncidentLog[]>('/api/agent/incident-logs', incidentLogs),
      ]);
      if (newStatus) setStatus(newStatus);
      if (newHistory && newHistory.length > 0) setTrainingHistory(newHistory);
      if (newFeeds && newFeeds.length > 0) setThreatFeeds(newFeeds);
      if (newLogs) setIncidentLogs(newLogs);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshAllData();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerTraining = async () => {
    setIsTraining(true);
    try {
      const res = await fetch('/api/agent/train-daily', { method: 'POST' });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.warn('Daily training run request failed', e);
    } finally {
      setIsTraining(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/agent/clear-logs', { method: 'POST' });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.warn('Failed to clear logs', e);
    }
  };

  const handleTestInSandbox = (payload: string) => {
    setSandboxPayload(payload);
    setActiveTab('sandbox');
    setHasStarted(true);
  };

  if (!hasStarted) {
    return (
      <>
        <StartingLandingPage
          status={status}
          onGetStarted={(targetTab) => {
            if (targetTab) setActiveTab(targetTab);
            setHasStarted(true);
          }}
          onOpenPortScanner={() => setIsPortScannerOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenPresentation={() => setIsPresentationOpen(true)}
        />

        {/* Project PPT Presentation Modal */}
        <PresentationDeck
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
        />

        {/* Nmap-Style Network Port Scanner Modal */}
        <PortScanner
          isOpen={isPortScannerOpen}
          onClose={() => setIsPortScannerOpen(false)}
        />

        {/* AI Security Analyst Chatbot Modal */}
        <CyberAiChatbot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          contextHint={{
            activeTab: 'landing',
            currentWorkbenchPayload: sandboxPayload || undefined,
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] cyber-grid text-slate-100 flex flex-col font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        incidentCount={incidentLogs.length}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenPortScanner={() => setIsPortScannerOpen(true)}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        onBackToLanding={() => setHasStarted(false)}
      />

      {/* Floating Gemini AI Chat Action Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono text-xs shadow-2xl shadow-cyan-500/40 border border-cyan-400/80 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title="Open Multi-Turn Gemini Security Chatbot"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-cyan-100 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
          </span>
        </div>
        <div className="flex flex-col text-left">
          <span className="flex items-center gap-1 leading-tight">
            <span>Ask Security AI</span>
            <Sparkles className="w-3 h-3 text-cyan-200" />
          </span>
          <span className="text-[10px] text-cyan-200/80 font-normal">Multi-Turn Active</span>
        </div>
      </button>

      <main className="flex-1 pb-16">
        {activeTab === 'login' && (
          <LoginPortal onLoginAttempt={refreshAllData} />
        )}

        {activeTab === 'training' && (
          <AgentTrainingCenter
            status={status}
            trainingHistory={trainingHistory}
            onTriggerTraining={handleTriggerTraining}
            isTraining={isTraining}
            onRefreshStatus={refreshAllData}
          />
        )}

        {activeTab === 'feeds' && (
          <ThreatFeedViewer
            threatFeeds={threatFeeds}
            onTestInSandbox={handleTestInSandbox}
          />
        )}

        {activeTab === 'sandbox' && (
          <PayloadSandbox initialPayload={sandboxPayload} />
        )}

        {activeTab === 'logs' && (
          <SecurityIncidentLogs
            incidentLogs={incidentLogs}
            onClearLogs={handleClearLogs}
            onInspectPayload={handleTestInSandbox}
          />
        )}
      </main>

      {/* Project PPT Presentation Modal */}
      <PresentationDeck
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
      />

      {/* Nmap-Style Network Port Scanner Modal */}
      <PortScanner
        isOpen={isPortScannerOpen}
        onClose={() => setIsPortScannerOpen(false)}
      />

      {/* AI Security Analyst Chatbot Modal */}
      <CyberAiChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        contextHint={{
          activeTab,
          currentWorkbenchPayload: sandboxPayload || undefined,
        }}
      />

      {/* Navy + Cyan Footer */}
      <footer className="border-t border-cyan-950 bg-[#020614]/90 py-4 px-6 text-center text-xs text-cyan-400/70 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            AEGIS-SQL // NAVY+CYAN ADAPTIVE DEFENSE MATRIX • SENSORS SYNCHRONIZED
          </span>
          <span className="text-slate-500">
            NVD CVE EXPLOIT STREAM • NMAP PORT RECON • PORT 3000
          </span>
        </div>
      </footer>
    </div>
  );
}
