import React, { useState } from 'react';
import {
  Search,
  Server,
  RefreshCw,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Radio,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { ScanResult } from '../../server/portScanner';

interface PortScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortScanner: React.FC<PortScannerProps> = ({ isOpen, onClose }) => {
  const [target, setTarget] = useState('127.0.0.1');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [copied, setCopied] = useState(false);

  const handleScan = async (overrideTarget?: string) => {
    const targetToScan = overrideTarget ?? target;
    if (!targetToScan.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetToScan }),
      });
      const data: ScanResult = await response.json();
      setScanResult(data);
    } catch (err: any) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const sampleTargets = [
    { label: '127.0.0.1 (Local System & Gateway)', val: '127.0.0.1' },
    { label: '10.0.4.50 (MySQL Database Server)', val: '10.0.4.50:3306' },
    { label: '192.168.1.102 (Web & PostgreSQL Cluster)', val: '192.168.1.102' },
    { label: 'scanme.nmap.org (Public Test Node)', val: 'scanme.nmap.org' },
  ];

  const handleCopyRaw = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult.rawNmapOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-4xl bg-[#060e20] border-2 border-cyan-500/70 rounded-2xl shadow-2xl shadow-cyan-950/80 flex flex-col h-[700px] max-h-[92vh] overflow-hidden cyan-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/60 bg-[#081530]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
              <Server className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  AEGIS-SCAN // NETWORK PORT &amp; SERVICE VERSION DETECTOR
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  NMAP-GRADE v7.94
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/70">
                Active TCP Socket Probing &amp; Deep Service Version Fingerprinting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-white p-1.5 rounded-xl hover:bg-cyan-950/80 transition-colors cursor-pointer border border-transparent hover:border-cyan-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Input & Scanner Controls */}
        <div className="p-4 sm:p-5 bg-[#071126] border-b border-cyan-900/60 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScan();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter IP address or host (e.g., 127.0.0.1 or 192.168.1.1)..."
                required
                className="w-full pl-10 pr-3 py-2.5 bg-[#030816] border border-cyan-800/80 rounded-xl text-cyan-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isScanning || !target.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/30 border border-cyan-400/60 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Probing Ports &amp; Banners...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-cyan-200" />
                  <span>Scan Target Ports</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Target Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="text-cyan-300/80 font-bold">Quick Targets:</span>
            {sampleTargets.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTarget(item.val);
                  handleScan(item.val);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0b1b3a] hover:bg-cyan-950/80 text-cyan-200 hover:text-white border border-cyan-800/70 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Scanning Progress */}
          {isScanning && (
            <div className="text-center py-12 space-y-3 bg-[#081530]/50 rounded-2xl border border-cyan-900/50">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">
                SYN Flood / Connect Probing in Progress
              </div>
              <p className="text-xs text-cyan-300/70 max-w-md mx-auto">
                Dispatching TCP handshake packets across 1,000 common service ports. Interrogating banners on target <code className="text-cyan-200 bg-cyan-950 px-1 py-0.5 rounded">{target}</code>...
              </p>
            </div>
          )}

          {/* Scan Results */}
          {!isScanning && scanResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Stats HUD */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#081530] border border-cyan-900/80 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-cyan-400 font-bold mb-0.5">
                    Target Host
                  </div>
                  <div className="text-base font-extrabold text-white truncate">
                    {scanResult.ip}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> HOST IS UP ({scanResult.latencyMs}ms)
                  </span>
                </div>

                <div className="bg-[#081530] border border-cyan-900/80 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-cyan-400 font-bold mb-0.5">
                    Open Ports Found
                  </div>
                  <div className="text-2xl font-black text-cyan-300">
                    {scanResult.openPortsCount}
                  </div>
                  <span className="text-[10px] text-cyan-400/80">
                    Active listening services
                  </span>
                </div>

                <div className="bg-[#081530] border border-cyan-900/80 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-cyan-400 font-bold mb-0.5">
                    Closed Ports
                  </div>
                  <div className="text-2xl font-black text-slate-300">
                    {scanResult.closedPortsCount}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    RST packet response
                  </span>
                </div>

                <div className="bg-[#081530] border border-cyan-900/80 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-cyan-400 font-bold mb-0.5">
                    Total Ports Scanned
                  </div>
                  <div className="text-2xl font-black text-blue-300">
                    {scanResult.totalPortsScanned}
                  </div>
                  <span className="text-[10px] text-blue-400/80">
                    Top 1,000 standard ports
                  </span>
                </div>
              </div>

              {/* View Switcher: Structured Table vs Raw Nmap Output */}
              <div className="flex items-center justify-between pb-1 border-b border-cyan-900/40">
                <div className="flex space-x-2 text-xs">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-cyan-200'
                    }`}
                  >
                    Structured Service &amp; Version Table
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      viewMode === 'raw'
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-cyan-200'
                    }`}
                  >
                    Raw Nmap Terminal Output
                  </button>
                </div>

                {viewMode === 'raw' && (
                  <button
                    onClick={handleCopyRaw}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-white px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied CLI Output!' : 'Copy Output'}</span>
                  </button>
                )}
              </div>

              {/* View 1: Detailed Table */}
              {viewMode === 'table' && (
                <div className="bg-[#081530] border border-cyan-900/80 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-200 font-mono">
                      <thead className="bg-[#040c1e] text-cyan-400 uppercase text-[10px] tracking-wider border-b border-cyan-900/80">
                        <tr>
                          <th className="py-3 px-3.5">PORT</th>
                          <th className="py-3 px-3.5">STATE</th>
                          <th className="py-3 px-3.5">SERVICE</th>
                          <th className="py-3 px-3.5">VERSION &amp; BANNER</th>
                          <th className="py-3 px-3.5">SECURITY CONTEXT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-950">
                        {scanResult.ports.map((p) => {
                          const isDatabasePort = [3306, 5432, 27017, 6379].includes(p.port);
                          return (
                            <tr key={p.port} className="hover:bg-cyan-950/30 transition-colors">
                              <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                                <span className="text-cyan-300 font-extrabold">{p.port}</span>
                                <span className="text-slate-500">/{p.protocol}</span>
                              </td>
                              <td className="py-3 px-3.5">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                                  {p.state}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 font-bold text-cyan-200 whitespace-nowrap">
                                {p.service}
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-slate-100">{p.version}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {p.banner}
                                </div>
                              </td>
                              <td className="py-3 px-3.5 text-[11px]">
                                {p.vulnerabilityHint ? (
                                  <div className="flex items-start gap-1.5 text-amber-300">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                                    <span>{p.vulnerabilityHint}</span>
                                  </div>
                                ) : isDatabasePort ? (
                                  <span className="text-rose-300 font-semibold">
                                    Database service exposed. Monitor with AegisSQL Sentinel.
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Standard operational port</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 2: Raw Nmap Output */}
              {viewMode === 'raw' && (
                <div className="bg-[#030712] border border-cyan-900 rounded-xl p-4 overflow-x-auto text-xs text-cyan-200 font-mono leading-relaxed whitespace-pre shadow-inner">
                  {scanResult.rawNmapOutput}
                </div>
              )}
            </div>
          )}

          {/* Empty State before scan */}
          {!isScanning && !scanResult && (
            <div className="text-center py-16 text-cyan-300/60 space-y-2">
              <Server className="w-10 h-10 mx-auto text-cyan-500/50" />
              <div className="text-sm font-bold text-slate-300">
                Ready to probe network target
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Enter an IP address or hostname above and click <strong>Scan Target Ports</strong> to detect open ports, listening services, and exact software versions.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#050c1c] border-t border-cyan-900/60 flex items-center justify-between text-xs text-cyan-400/80">
          <span>AegisSQL Network Intelligence Layer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-xs font-bold border border-cyan-800 transition-colors cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
