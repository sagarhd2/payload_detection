import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  XCircle,
  Layers,
  Radio,
} from 'lucide-react';
import { SQLiWarning, LoginResult } from '../types';

interface LoginPortalProps {
  onLoginAttempt: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginAttempt }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [infoTab, setInfoTab] = useState<'mechanism' | 'code' | 'types' | 'defense'>('mechanism');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() && !password.trim()) return;

    setIsLoading(true);
    setLoginResult(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data: LoginResult = await response.json();
      setLoginResult(data);
      onLoginAttempt();
    } catch (err: any) {
      console.error('Error submitting login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 font-mono">
      {/* Navy + Cyan HUD Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs mb-3 shadow-md shadow-cyan-950/60">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="tracking-widest font-bold">NAVY+CYAN CYBER MATRIX // REAL-TIME SQLi INTERCEPTOR</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          SECURE AUTHENTICATION GATEWAY
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-cyan-200/70">
          Submit normal credentials to log in cleanly, or enter SQL injection code to observe the autonomous detection agent in action.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Login Portal Box */}
        <div className="lg:col-span-6 bg-[#061024]/95 border-2 border-cyan-900/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/60 relative overflow-hidden backdrop-blur">
          {/* Top glowing cyan laser line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 animate-pulse"></div>

          <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-950">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>SEC_PORTAL_AUTH</span>
              </h2>
              <p className="text-[11px] text-cyan-300/70 mt-0.5">
                [INSPECTION ENGINE: DUAL AST + GEMINI ANALYST]
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-700/80 text-cyan-300 text-[10px] font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>GUARD ACTIVE</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center justify-between">
                <span>[INPUT_01: USERNAME_PAYLOAD]</span>
                <span className="text-[10px] text-slate-500 lowercase">e.g. alice or admin' OR 1=1--</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or SQLi test string..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#030816] border border-cyan-900/90 rounded-xl text-cyan-100 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center justify-between">
                <span>[INPUT_02: PASSWORD_HASH_KEY]</span>
                <span className="text-[10px] text-slate-500 lowercase">••••••••••••</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/80">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#030816] border border-cyan-900/90 rounded-xl text-cyan-100 placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/30 border border-cyan-400/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>DECONSTRUCTING PAYLOAD &amp; EVALUATING...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE CREDENTIALS</span>
                    <ArrowRight className="w-4 h-4 text-cyan-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Clear */}
          <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between text-[11px] text-slate-400">
            <span>DEFENSE: FAST AST + GEMINI 3.8 AGENT</span>
            <button
              type="button"
              onClick={() => {
                setUsername('');
                setPassword('');
                setLoginResult(null);
              }}
              className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
            >
              Reset Inputs
            </button>
          </div>
        </div>

        {/* Right Column: Intercept Alert Verdict & Intelligence Manual */}
        <div className="lg:col-span-6 space-y-4">
          {/* 1. If SQL Injection Detected: High-Visibility Security Alert */}
          {loginResult && loginResult.warning && (
            <div className="bg-[#12070f] border-2 border-rose-500 rounded-2xl p-5 shadow-2xl shadow-rose-950/60 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-200 shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      CRITICAL ALERT // SQL INJECTION DETECTED
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900 text-white font-black border border-rose-500 animate-pulse">
                      {loginResult.warning.severity} SEVERITY
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mt-1 tracking-tight">
                    {loginResult.warning.threatType}
                  </h3>
                  <p className="text-xs text-rose-200/90 mt-1">
                    {loginResult.warning.explanation}
                  </p>
                </div>
              </div>

              {/* Technical Analysis Breakdown */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="bg-[#070208] border border-rose-900/80 rounded-xl p-3">
                  <div className="text-[11px] text-rose-400 mb-1 flex items-center justify-between">
                    <span>FLAGGED EXPLOIT TOKENS / AST PATTERN:</span>
                    <span className="text-rose-300 font-bold">{loginResult.warning.confidence}% Certainty</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {loginResult.warning.detectedTokens.map((token, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-700 font-bold text-xs"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#070208] border border-cyan-950 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Target Parameter:</span>
                    <span className="text-cyan-300 font-bold uppercase">{loginResult.warning.targetField}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Attack Vector:</span>
                    <span className="text-blue-300 font-bold">{loginResult.warning.attackVector}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Analysis Engine:</span>
                    <span className="text-cyan-400 font-bold">{loginResult.warning.analysisMode}</span>
                  </div>
                  {loginResult.warning.cveReference && (
                    <div className="flex justify-between text-slate-400">
                      <span>Vulnerability Class:</span>
                      <span className="text-amber-300 font-bold">{loginResult.warning.cveReference}</span>
                    </div>
                  )}
                </div>

                {/* Remediation code snippet */}
                <div className="bg-[#040e0c] border border-emerald-900/80 rounded-xl p-3">
                  <div className="text-[11px] text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DEFENSIVE COUNTERMEASURE (PARAMETERIZED QUERY):</span>
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    {loginResult.warning.recommendedRemediation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. If Normal User: Positive Login Confirmation */}
          {loginResult && loginResult.success && (
            <div className="bg-[#04151a] border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500 text-emerald-300 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      AUTHENTICATION VERIFIED
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-200 font-bold border border-emerald-700">
                      ZERO EXPLOIT PATTERNS
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white mt-1">
                    Access Granted // Welcome, {loginResult.user?.username}!
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-1">
                    {loginResult.message}
                  </p>

                  <div className="mt-4 p-3 bg-[#020b12] border border-cyan-900/60 rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Check:</span>
                      <span className="text-emerald-400 font-bold">Clean Credentials Verified</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">User Role:</span>
                      <span className="text-cyan-300">{loginResult.user?.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audit Timestamp:</span>
                      <span className="text-slate-200">{loginResult.user?.lastLogin}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Educational Intelligence Guide */}
          <div className="bg-[#061024]/95 border-2 border-cyan-950 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyan-950">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  SQL INJECTION INTELLIGENCE &amp; ARCHITECTURE
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                OWASP TOP 10 • CWE-89
              </span>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex space-x-1 mb-4 p-1 rounded-xl bg-[#030816] border border-cyan-950 text-[11px]">
              <button
                type="button"
                onClick={() => setInfoTab('mechanism')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                  infoTab === 'mechanism'
                    ? 'bg-cyan-500/25 text-cyan-100 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                Attack Anatomy
              </button>
              <button
                type="button"
                onClick={() => setInfoTab('code')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                  infoTab === 'code'
                    ? 'bg-cyan-500/25 text-cyan-100 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                Flaw vs Fix
              </button>
              <button
                type="button"
                onClick={() => setInfoTab('types')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                  infoTab === 'types'
                    ? 'bg-cyan-500/25 text-cyan-100 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                Exploit Types
              </button>
              <button
                type="button"
                onClick={() => setInfoTab('defense')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                  infoTab === 'defense'
                    ? 'bg-cyan-500/25 text-cyan-100 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                Aegis Guard
              </button>
            </div>

            {/* Tab 1: Attack Anatomy */}
            {infoTab === 'mechanism' && (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
                <p>
                  <strong className="text-cyan-400">SQL Injection</strong> occurs when untrusted user input is directly concatenated into a SQL statement rather than bound as parameter data.
                </p>

                <div className="bg-[#030816] p-3 rounded-xl border border-cyan-950 space-y-2">
                  <div className="text-[11px] text-cyan-400 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>THE 3-STEP EXPLOIT EXECUTION CHAIN:</span>
                  </div>
                  <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-slate-300">
                    <li>
                      <span className="text-white font-bold">Literal Breakout:</span> Injecting a quote <code className="text-cyan-300 font-bold bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800">'</code> closes the string literal early.
                    </li>
                    <li>
                      <span className="text-white font-bold">Logic Manipulation:</span> Appending <code className="text-cyan-300 font-bold bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800">OR '1'='1'</code> forces query evaluation to TRUE.
                    </li>
                    <li>
                      <span className="text-white font-bold">Syntax Truncation:</span> Comment sequences <code className="text-cyan-300 font-bold bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800">--</code> or <code className="text-cyan-300 font-bold bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800">#</code> discard trailing password verifications.
                    </li>
                  </ol>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800 text-[11px] text-cyan-200">
                  <span className="font-bold text-cyan-400">Outcome:</span> The database interprets <code className="bg-black/60 px-1 rounded text-cyan-300">WHERE user = '' OR '1'='1'</code> as always valid, granting administrative entry.
                </div>
              </div>
            )}

            {/* Tab 2: Flaw vs Fix */}
            {infoTab === 'code' && (
              <div className="space-y-3 text-xs animate-in fade-in duration-150">
                {/* Vulnerable */}
                <div className="bg-[#030816] p-3 rounded-xl border border-rose-900/60">
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold mb-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FATAL FLAW: STRING CONCATENATION (CWE-89)</span>
                  </div>
                  <pre className="text-[11px] text-rose-300/90 overflow-x-auto p-2.5 rounded bg-[#10030a] border border-rose-950">
{`// ATTACK VECTOR: User input is executed as SQL command
const query = "SELECT * FROM users " +
  "WHERE username = '" + username + "' " +
  "AND password = '" + password + "'";
db.execute(query);`}
                  </pre>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Attacker payload alters SQL abstract syntax tree directly.
                  </p>
                </div>

                {/* Secure */}
                <div className="bg-[#030816] p-3 rounded-xl border border-cyan-800/80">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HARDENED: PREPARED STATEMENT &amp; PARAMETER BINDING</span>
                  </div>
                  <pre className="text-[11px] text-cyan-300/90 overflow-x-auto p-2.5 rounded bg-[#040e24] border border-cyan-900/60">
{`// SECURE: Engine strictly treats input as inert string data
const query = "SELECT * FROM users " +
  "WHERE username = ? AND password = ?";
db.execute(query, [username, password]);`}
                  </pre>
                  <p className="text-[10px] text-slate-400 mt-1">
                    The database compiles SQL structure first; parameters cannot alter query logic.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Exploit Types */}
            {infoTab === 'types' && (
              <div className="space-y-2 text-xs animate-in fade-in duration-150">
                <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-white">1. In-Band Tautology Bypass</span>
                    <span className="text-cyan-400 font-bold">' OR '1'='1</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Injects a boolean condition that is perpetually true, causing the query to authenticate as the primary admin.
                  </p>
                </div>

                <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-white">2. UNION Schema Extraction</span>
                    <span className="text-cyan-400 font-bold">' UNION SELECT...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Appends a second query to extract sensitive database tables, password hashes, and user records across databases.
                  </p>
                </div>

                <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-white">3. Time-Based Blind Inference</span>
                    <span className="text-cyan-400 font-bold">SLEEP(5) / pg_sleep</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Used when database errors are masked. The attacker infers characters by measuring response latency.
                  </p>
                </div>

                <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-bold text-white">4. Stacked Query Destruction</span>
                    <span className="text-cyan-400 font-bold">; DROP TABLE users;--</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Appends a semicolon delimiter to execute destructive second-order commands like table drops or user creation.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Aegis Guard */}
            {infoTab === 'defense' && (
              <div className="space-y-2.5 text-xs text-slate-300 animate-in fade-in duration-150">
                <p>
                  <strong className="text-cyan-400">AEGIS-SQL Sentinel</strong> operates a multi-layered defense interceptor:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-cyan-400 font-bold block mb-1">⚡ Sub-ms AST Lexer</span>
                    <p className="text-slate-400">
                      Dissects raw inputs into syntax tokens, catching comment evasions (<code className="text-cyan-300">--</code>, <code className="text-cyan-300">/* */</code>), hex payloads, and quote breakouts.
                    </p>
                  </div>

                  <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-emerald-400 font-bold block mb-1">🎯 Zero False Positives</span>
                    <p className="text-slate-400">
                      Whitelists natural names with single apostrophes (e.g. <code className="text-emerald-300">O'Connor</code>, <code className="text-emerald-300">D'Angelo</code>) so genuine users never get blocked.
                    </p>
                  </div>

                  <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-blue-400 font-bold block mb-1">🧠 Gemini 3.8 AI Agent</span>
                    <p className="text-slate-400">
                      Evaluates complex intent, polyglots, and nested obfuscation while generating exact developer remediation guidance.
                    </p>
                  </div>

                  <div className="bg-[#030816] p-2.5 rounded-xl border border-cyan-950">
                    <span className="text-cyan-300 font-bold block mb-1">🔄 24h Daily Retrain</span>
                    <p className="text-slate-400">
                      Ingests real-world honeypot probes and fresh CVE feeds every 24 hours to automatically counter zero-day bypasses.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
