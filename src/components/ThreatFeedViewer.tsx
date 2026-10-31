import React, { useState } from 'react';
import { ThreatFeedItem } from '../types';
import {
  Globe,
  Search,
  CheckCircle2,
  Copy,
  Terminal,
  Clock,
  Layers,
  Radio,
} from 'lucide-react';

interface ThreatFeedViewerProps {
  threatFeeds: ThreatFeedItem[];
  onTestInSandbox: (payload: string) => void;
}

export const ThreatFeedViewer: React.FC<ThreatFeedViewerProps> = ({
  threatFeeds,
  onTestInSandbox,
}) => {
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFeeds = threatFeeds.filter((item) => {
    const matchesSource = filterSource === 'ALL' || item.source === filterSource;
    const matchesSearch =
      item.payloadSample.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cveId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetSoftware.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 font-mono">
      {/* Header */}
      <div className="bg-[#061024]/95 border-2 border-cyan-900/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 relative overflow-hidden backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs mb-2">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>GLOBAL THREAT TELEMETRY &amp; ADVISORIES</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              REAL-WORLD SQL INJECTION EXPLOIT FEEDS
            </h1>
            <p className="text-xs text-cyan-200/70 mt-1 max-w-2xl">
              Live CVE feeds, ModSecurity CRS rules, and honeypot attack probes collected from global sensors to update and train the agent continuously.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-[#030816] border border-cyan-900 text-cyan-300 font-bold">
              {threatFeeds.length} Signatures Active
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-cyan-950 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search CVE ID, raw payload, or target software..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#030816] border border-cyan-900 rounded-xl text-xs text-cyan-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'OWASP_HONEYPOT', 'NVD_CVE_FEED', 'MODSECURITY_CRS', 'GITHUB_ADVISORY'].map((src) => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-3 py-2 rounded-xl text-[11px] whitespace-nowrap transition-all cursor-pointer font-bold ${
                  filterSource === src
                    ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-400'
                    : 'bg-[#030816] border border-cyan-950 text-slate-400 hover:text-cyan-200'
                }`}
              >
                {src.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Stream Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredFeeds.map((feed) => (
          <div
            key={feed.id}
            className="bg-[#061024]/95 border-2 border-cyan-950 hover:border-cyan-800 rounded-2xl p-5 transition-all shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyan-950">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-800">
                  {feed.cveId}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#081735] text-slate-300 border border-cyan-950">
                  {feed.source.replace(/_/g, ' ')}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    feed.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-200 border border-rose-600'
                      : 'bg-amber-950 text-amber-200 border border-amber-700'
                  }`}
                >
                  {feed.severity}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(feed.timestamp).toLocaleDateString()}</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {feed.defenseStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-bold text-cyan-300">Target System: {feed.targetSoftware}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {feed.description}
              </p>

              {/* Code Payload Box */}
              <div className="relative group bg-[#030816] border border-cyan-950 rounded-xl p-3 text-xs">
                <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                  <span>INTERCEPTED INJECTION VECTOR:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopy(feed.id, feed.payloadSample)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === feed.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => onTestInSandbox(feed.payloadSample)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Send to Workbench &rarr;</span>
                    </button>
                  </div>
                </div>
                <div className="text-cyan-200 font-bold break-all select-all">
                  {feed.payloadSample}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredFeeds.length === 0 && (
          <div className="text-center py-12 bg-[#061024]/60 border border-cyan-950 rounded-2xl text-slate-500">
            No threat feeds matched your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
