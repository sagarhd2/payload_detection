import React, { useState } from 'react';
import {
  Terminal,
  Play,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Code2,
} from 'lucide-react';
import { SQLiWarning } from '../types';

interface PayloadSandboxProps {
  initialPayload?: string;
}

export const PayloadSandbox: React.FC<PayloadSandboxProps> = ({ initialPayload = '' }) => {
  const [payload, setPayload] = useState(initialPayload);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    isInjection: boolean;
    warning: SQLiWarning | null;
  } | null>(null);

  const handleInspect = async (queryText?: string) => {
    const textToAnalyze = queryText ?? payload;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/agent/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: textToAnalyze }),
      });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Inspection failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleVectors = [
    { label: "Classic Tautology", val: "' OR '1'='1" },
    { label: "Inline Comment Bypass", val: "admin'/**/OR/**/1=1#" },
    { label: "Union Schema Extraction", val: "1' UNION SELECT 1, column_name, 3 FROM information_schema.columns--" },
    { label: "Blind Time Delay", val: "admin' AND (SELECT 1 FROM (SELECT(SLEEP(5)))x)--" },
    { label: "Piggybacked Drop", val: "user'; DROP TABLE audit_trail; --" },
    { label: "Benign Name: D'Angelo", val: "D'Angelo" },
    { label: "Benign Email", val: "security_auditor@company.com" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 font-mono">
      <div className="bg-[#061024]/95 border-2 border-cyan-900/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 backdrop-blur">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-cyan-950">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                PAYLOAD INJECTION &amp; AST WORKBENCH
              </h1>
            </div>
            <p className="text-xs text-cyan-300/70">
              Submit arbitrary payload strings to observe lexical syntax breakdown, AST pattern matching, and Gemini agent verdict.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dual AST + AI Engine</span>
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300">
            [INPUT_VECTOR: RAW PAYLOAD STRING]
          </label>
          <div className="relative">
            <textarea
              rows={4}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="e.g. admin' OR '1'='1' or ' UNION SELECT NULL, version()--"
              className="w-full p-3.5 bg-[#030816] border border-cyan-900 rounded-xl text-cyan-100 font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Sample Vectors:</span>
            {sampleVectors.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPayload(s.val);
                  handleInspect(s.val);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#081735] hover:bg-cyan-950/80 text-cyan-200 hover:text-white transition-colors border border-cyan-900 cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setPayload('');
                setAnalysisResult(null);
              }}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleInspect()}
              disabled={isAnalyzing || !payload.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-600/30 border border-cyan-400/60 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>DECONSTRUCTING SYNTAX...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>EXECUTE AST DECONSTRUCTION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {analysisResult.isInjection && analysisResult.warning ? (
            <div className="bg-[#12070f] border-2 border-rose-500 rounded-2xl p-6 shadow-2xl shadow-rose-950/60">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-200">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                      [AGENT VERDICT: MALICIOUS SQL INJECTION CONFIRMED]
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">
                      {analysisResult.warning.threatType}
                    </h3>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-rose-900 text-white font-black border border-rose-500">
                  {analysisResult.warning.severity} SEVERITY
                </span>
              </div>

              <p className="mt-3 text-sm text-rose-100/90">
                {analysisResult.warning.explanation}
              </p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#070208] rounded-xl border border-rose-950">
                  <div className="text-rose-400 mb-1 font-bold">FLAGGED AST TOKENS:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.warning.detectedTokens.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-700 font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#070208] rounded-xl border border-cyan-950 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Attack Vector:</span>
                    <span className="text-blue-300 font-bold">{analysisResult.warning.attackVector}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Analysis Engine:</span>
                    <span className="text-cyan-400 font-bold">{analysisResult.warning.analysisMode}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Certainty Score:</span>
                    <span className="text-emerald-400 font-bold">{analysisResult.warning.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#040e0c] border border-emerald-900/80 rounded-xl text-xs text-emerald-300 font-mono">
                <span className="font-bold">DEFENSIVE REMEDIATION: </span>
                {analysisResult.warning.recommendedRemediation}
              </div>
            </div>
          ) : (
            <div className="bg-[#04151a] border-2 border-emerald-500 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500 text-emerald-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    [AGENT VERDICT: BENIGN / CLEAN INPUT]
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Zero Injection Constructs Detected
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-1">
                    The payload passed through lexical AST analysis and pattern filters with 0 violations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
