import React, { useState } from 'react';
import { IncidentLog } from '../types';
import {
  Trash2,
  Download,
  Search,
  Eye,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface SecurityIncidentLogsProps {
  incidentLogs: IncidentLog[];
  onClearLogs: () => Promise<void>;
  onInspectPayload: (payload: string) => void;
}

export const SecurityIncidentLogs: React.FC<SecurityIncidentLogsProps> = ({
  incidentLogs,
  onClearLogs,
  onInspectPayload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = incidentLogs.filter(
    (log) =>
      log.usernameAttempted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.threatType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm)
  );

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incidentLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis-sql-incidents-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 font-mono">
      <div className="bg-[#061024]/95 border-2 border-cyan-900/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-950">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                INTERCEPTED INCIDENT LOG // AUDIT TRAIL
              </h1>
            </div>
            <p className="text-xs text-cyan-300/70">
              Live chronological record of blocked SQL injection probes captured by the login guard gateway.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={incidentLogs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#081735] hover:bg-cyan-950 text-slate-200 text-xs flex items-center gap-1.5 transition-colors border border-cyan-900/80 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Audit JSON</span>
            </button>
            <button
              onClick={onClearLogs}
              disabled={incidentLogs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 border border-cyan-700 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Audit Log</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by payload, exploit classification, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#030816] border border-cyan-900 rounded-xl text-xs text-cyan-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Incident table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030816] text-cyan-400 uppercase text-[10px] border-b border-cyan-950">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Origin IP</th>
                <th className="py-3 px-3">Threat Classification</th>
                <th className="py-3 px-3">Intercepted Payload</th>
                <th className="py-3 px-3">Flagged Tokens</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">{log.ipAddress}</td>
                  <td className="py-3 px-3 font-semibold text-white">{log.threatType}</td>
                  <td className="py-3 px-3 text-rose-300 font-bold max-w-xs truncate">
                    {log.usernameAttempted}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {log.tokensFlagged.map((token, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]"
                        >
                          {token}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-200 border border-rose-600'
                          : 'bg-amber-950 text-amber-200 border border-amber-700'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onInspectPayload(log.usernameAttempted)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Zero security incident events recorded. Test an injection string in the Target Auth Portal!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
