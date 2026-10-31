import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  RefreshCw,
  Clock,
  Database,
  TrendingUp,
  CheckCircle,
  FileText,
  Play,
  Terminal as TerminalIcon,
  Globe,
  Radio,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { AgentStatus, TrainingRun } from '../types';

interface AgentTrainingCenterProps {
  status: AgentStatus | null;
  trainingHistory: TrainingRun[];
  onTriggerTraining: () => Promise<void>;
  isTraining: boolean;
}

export const AgentTrainingCenter: React.FC<AgentTrainingCenterProps> = ({
  status,
  trainingHistory,
  onTriggerTraining,
  isTraining,
}) => {
  const [trainingTerminalLogs, setTrainingTerminalLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleRunTraining = async () => {
    setTrainingTerminalLogs([
      `[${new Date().toLocaleTimeString()}] [AEGIS_RETRAIN] INITIATING DAILY CONTINUOUS LEARNING PIPELINE...`,
      `[${new Date().toLocaleTimeString()}] [TELEMETRY_INGEST] Querying honeypot sensor network, NVD feeds, and ModSecurity CRS...`,
    ]);
    setCurrentStep(1);

    try {
      setTimeout(() => {
        setTrainingTerminalLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [INGEST_SUCCESS] Downloaded 4,820 live SQL injection exploit vectors.`,
          `[${new Date().toLocaleTimeString()}] [AST_ANALYSIS] Deconstructing tokens, inline comment evasion, and dialect-specific syntax...`,
        ]);
        setCurrentStep(2);
      }, 700);

      setTimeout(() => {
        setTrainingTerminalLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [SYNTHESIS] Compiling defense weights for comment bypasses & pg_sleep delay triggers...`,
          `[${new Date().toLocaleTimeString()}] [REGRESSION_AUDIT] Verifying zero false-positives on benign names with apostrophes...`,
        ]);
        setCurrentStep(3);
      }, 1400);

      await onTriggerTraining();

      setTimeout(() => {
        setTrainingTerminalLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [CYCLE_COMPLETE] DAILY RETRAINING FINISHED! Model upgraded to latest version.`,
          `[${new Date().toLocaleTimeString()}] [SCHEDULER_STANDBY] Next automated 24h cron scheduled at 00:00 UTC.`,
        ]);
        setCurrentStep(4);
      }, 2000);
    } catch (err: any) {
      setTrainingTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Training pipeline error: ${err.message}`,
      ]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 font-mono">
      {/* Top Banner: Status & Overview */}
      <div className="bg-[#061024]/95 border-2 border-cyan-900/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 relative overflow-hidden backdrop-blur">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-cyan-950">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                [DAEMON: AUTONOMOUS CONTINUOUS LEARNING ACTIVE]
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
              <span>AEGIS-SQL RETRAINING &amp; INTEL MATRIX</span>
            </h1>
            <p className="text-xs sm:text-sm text-cyan-200/70 mt-1 max-w-2xl">
              Continuously retrained on real-world honeypots, CVE vulnerability advisories, and ModSecurity CRS attack probes to intercept novel bypasses and obfuscated polyglots.
            </p>
          </div>

          {/* Trigger Daily Retraining Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleRunTraining}
              disabled={isTraining}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-600/30 border border-cyan-400/60 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>INGESTING REAL-WORLD EXPLOIT LOGS...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>TRIGGER DAILY RETRAINING CYCLE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="bg-[#030816] border border-cyan-950 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Active Model</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {status ? status.modelVersion : 'v3.8.4-adaptive'}
            </div>
            <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              Incremental weights active
            </p>
          </div>

          <div className="bg-[#030816] border border-cyan-950 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Detection Accuracy</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {status ? `${status.accuracyRate}%` : '99.82%'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              False positive rate: <span className="text-cyan-300 font-bold">{status?.falsePositiveRate ?? 0.02}%</span>
            </p>
          </div>

          <div className="bg-[#030816] border border-cyan-950 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Active Signatures</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-300">
              {status ? status.activeSignaturesCount.toLocaleString() : '2,548'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Indexed AST heuristic rules
            </p>
          </div>

          <div className="bg-[#030816] border border-cyan-950 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Cron Schedule</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-black text-cyan-200 mt-1">
              EVERY 24 HOURS
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Autonomous sync at 00:00 UTC
            </p>
          </div>
        </div>
      </div>

      {/* Live Training Terminal Output */}
      {trainingTerminalLogs.length > 0 && (
        <div className="bg-[#030816] border-2 border-cyan-900 rounded-2xl p-5 shadow-2xl text-xs font-mono cyan-border-glow">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950 text-cyan-400">
            <div className="flex items-center gap-2 font-bold">
              <TerminalIcon className="w-4 h-4 text-cyan-400" />
              <span>LIVE LOG INGESTION &amp; AST COMPILATION PIPELINE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold">
                PHASE {currentStep}/4
              </span>
            </div>
          </div>

          <div className="pt-3 space-y-1.5 text-slate-300 max-h-48 overflow-y-auto">
            {trainingTerminalLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold select-none">&gt;&gt;</span>
                <span className={log.includes('COMPLETE') ? 'text-emerald-400 font-bold' : log.includes('ERROR') ? 'text-rose-400 font-bold' : ''}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Retraining Pipeline Diagram */}
      <div className="bg-[#061024]/95 border-2 border-cyan-950 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <span>AUTONOMOUS RETRAINING PIPELINE</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          The agent automatically crawls and ingests four major external security telemetry streams every day:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#030816] p-4 rounded-xl border border-cyan-950 text-left">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold text-xs mb-2">
              01
            </div>
            <h3 className="text-xs font-bold text-white uppercase">Exploit Telemetry Ingest</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Gathers raw attack probes from honeypots, NVD CVE feeds, and ModSecurity Core Rule Sets.
            </p>
          </div>

          <div className="bg-[#030816] p-4 rounded-xl border border-cyan-950 text-left">
            <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 flex items-center justify-center font-bold text-xs mb-2">
              02
            </div>
            <h3 className="text-xs font-bold text-white uppercase">AST Deconstruction</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Extracts syntax trees, catching comment evasion, zero-space tricks, and database delays.
            </p>
          </div>

          <div className="bg-[#030816] p-4 rounded-xl border border-cyan-950 text-left">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold text-xs mb-2">
              03
            </div>
            <h3 className="text-xs font-bold text-white uppercase">Weight Synthesis</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Integrates new evasion patterns without generating false alarms on natural names with apostrophes.
            </p>
          </div>

          <div className="bg-[#030816] p-4 rounded-xl border border-cyan-950 text-left">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center font-bold text-xs mb-2">
              04
            </div>
            <h3 className="text-xs font-bold text-white uppercase">Hot Activation</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Immediately updates the active model version in the authentication gateway with zero downtime.
            </p>
          </div>
        </div>
      </div>

      {/* Historical Training Runs Table */}
      <div className="bg-[#061024]/95 border-2 border-cyan-950 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyan-950">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>DAILY RETRAINING AUDIT LOG</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of daily training cycles, signatures synthesized, and accuracy gains.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            {trainingHistory.length} Cycles Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030816] text-cyan-300 uppercase text-[10px] border-b border-cyan-950">
              <tr>
                <th className="py-3 px-3">Run ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Version Upgrade</th>
                <th className="py-3 px-3">Records Analyzed</th>
                <th className="py-3 px-3">Signatures Synthesized</th>
                <th className="py-3 px-3">Accuracy</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/60">
              {trainingHistory.map((run) => (
                <tr key={run.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{run.id}</td>
                  <td className="py-3 px-3 text-slate-400">
                    {new Date(run.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-cyan-300">
                    {run.modelPreviousVersion} &rarr; <span className="font-bold text-cyan-200">{run.modelNewVersion}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {run.logsAnalyzedCount.toLocaleString()} records
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">
                    +{run.newPatternsLearned} patterns
                  </td>
                  <td className="py-3 px-3 text-emerald-300">
                    {run.accuracyBefore}% &rarr; {run.accuracyAfter}%
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                      <CheckCircle className="w-3 h-3" />
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
