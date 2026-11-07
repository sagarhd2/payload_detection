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
import { AgentStatus, TrainingRun, ThreatFeedItem, IncidentLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'training' | 'feeds' | 'sandbox' | 'logs'>('login');
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingRun[]>([]);
  const [threatFeeds, setThreatFeeds] = useState<ThreatFeedItem[]>([]);
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [sandboxPayload, setSandboxPayload] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isPortScannerOpen, setIsPortScannerOpen] = useState<boolean>(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch agent status', e);
    }
  };

  const fetchTrainingHistory = async () => {
    try {
      const res = await fetch('/api/agent/training-history');
      if (res.ok) {
        const data = await res.json();
        setTrainingHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch training history', e);
    }
  };

  const fetchThreatFeeds = async () => {
    try {
      const res = await fetch('/api/agent/threat-feeds');
      if (res.ok) {
        const data = await res.json();
        setThreatFeeds(data);
      }
    } catch (e) {
      console.error('Failed to fetch threat feeds', e);
    }
  };

  const fetchIncidentLogs = async () => {
    try {
      const res = await fetch('/api/agent/incident-logs');
      if (res.ok) {
        const data = await res.json();
        setIncidentLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch incident logs', e);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchStatus(),
      fetchTrainingHistory(),
      fetchThreatFeeds(),
      fetchIncidentLogs(),
    ]);
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 8000);
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
      console.error('Daily training run failed', e);
    } finally {
      setIsTraining(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/agent/clear-logs', { method: 'POST' });
      if (res.ok) {
        await fetchIncidentLogs();
      }
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  };

  const handleTestInSandbox = (payload: string) => {
    setSandboxPayload(payload);
    setActiveTab('sandbox');
  };

  return (
    <div className="min-h-screen bg-[#030712] cyber-grid text-slate-100 flex flex-col font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        incidentCount={incidentLogs.length}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenPortScanner={() => setIsPortScannerOpen(true)}
      />

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
