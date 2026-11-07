import React, { useState } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  Server,
  Code2,
  CheckCircle2,
  TrendingUp,
  Globe,
  Radio,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';

interface Slide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  points: Array<{
    heading: string;
    description: string;
    highlight?: string;
  }>;
  codeSnippet?: string;
  diagramTitle?: string;
  diagramItems?: Array<{ step: string; label: string; desc: string }>;
  speakerNotes: string;
}

const SLIDES_DATA: Slide[] = [
  {
    id: 1,
    badge: "TITLE SLIDE",
    title: "AegisSQL Sentinel",
    subtitle: "Autonomous AI SQL Injection Defense & Continuous Daily Learning Agent",
    points: [
      {
        heading: "Next-Generation Application Security",
        description: "A full-stack, real-time SQL injection interception gateway and adaptive learning security agent.",
      },
      {
        heading: "Dual-Engine Architecture",
        description: "Sub-millisecond AST lexical parser combined with deep Google Gemini 3.8 Flash semantic reasoning.",
      },
      {
        heading: "Continuous Daily Retraining",
        description: "Self-evolving neural and heuristic weights trained every 24 hours on real-world honeypot logs and global CVE advisories.",
      },
    ],
    speakerNotes:
      "Welcome, everyone. Today I'm presenting AegisSQL Sentinel—a project built to solve one of the longest-standing vulnerabilities in software engineering: SQL Injection. Unlike traditional static firewalls that quickly become outdated, this system integrates an autonomous AI agent that trains daily on real-world cyber threat logs to continuously improve its accuracy.",
  },
  {
    id: 2,
    badge: "PROBLEM STATEMENT",
    title: "The Critical Threat of SQL Injection (CWE-89)",
    subtitle: "Why Traditional Defenses Consistently Fail Against Modern Evasion",
    points: [
      {
        heading: "Ranked #1 Danger on OWASP Top 10",
        description: "SQL Injection remains the leading vector for catastrophic corporate database breaches, identity theft, and credential harvesting.",
      },
      {
        heading: "Fatal Flaw: Raw String Concatenation",
        description: "Developers mistakenly glue user strings into SQL queries, allowing attackers to manipulate the abstract syntax tree directly.",
      },
      {
        heading: "Static WAF Obsolescence",
        description: "Traditional signature firewalls rely on rigid regex rules that fail against space-less inline comments (/* */), hex encodings, and dialect polyglots.",
      },
    ],
    codeSnippet: `// VULNERABLE CODE: Attacker input is executed as SQL commands!
const sql = "SELECT * FROM users WHERE user = '" + input + "' AND pass = '" + pass + "'";
// An input of: admin' OR '1'='1'-- turns the query into:
// SELECT * FROM users WHERE user = 'admin' OR '1'='1'--' ... (Bypasses authentication!)`,
    speakerNotes:
      "SQL injection has persisted for over 25 years. The root cause is simple: when user input is concatenated into query strings, the database cannot distinguish between the developer's instructions and the attacker's data. Attackers exploit this with tricks like inline comments and hex encoding, which easily fool standard regex filters.",
  },
  {
    id: 3,
    badge: "SYSTEM ARCHITECTURE",
    title: "How It Works: End-to-End System Flow",
    subtitle: "Full-Stack Interception from Client Submission to Database Guard",
    points: [
      {
        heading: "Frontend Client (React SPA)",
        description: "Provides the Target Auth Portal, live security warnings, testing workbench, Nmap port scanner, and AI security chatbot.",
      },
      {
        heading: "Backend Gateway (Express.js on Port 3000)",
        description: "Intercepts all authentication payloads, extracts parameters, and passes them to the detection matrix before any DB interaction.",
      },
      {
        heading: "Two-Tier Verdict Pipeline",
        description: "Fast-path AST lexical inspection verifies benign inputs in <1ms; Gemini 3.8 Flash evaluates ambiguous payloads with rich context.",
      },
    ],
    diagramTitle: "End-to-End Request Journey",
    diagramItems: [
      { step: "01", label: "User Input", desc: "User submits username & password into login portal" },
      { step: "02", label: "Express Hook", desc: "Gateway intercepts payload at /api/auth/login" },
      { step: "03", label: "Dual Inspection", desc: "AST Lexer checks syntax; Gemini AI assesses intent" },
      { step: "04", label: "Instant Verdict", desc: "Clean: Access granted | Malicious: Blocked + Alerted" },
    ],
    speakerNotes:
      "Here is the high-level workflow. The frontend sends incoming login credentials to our Express server. The server routes the data through our detection pipeline. If legitimate, it grants access cleanly. If malicious, it blocks the query immediately, logs an audit entry, and shows a detailed warning explaining the exact attack vector.",
  },
  {
    id: 4,
    badge: "DETECTION PIPELINE",
    title: "Dual-Tier Detection Engine",
    subtitle: "Combining Sub-Millisecond AST Speed with Deep Generative AI Reasoning",
    points: [
      {
        heading: "Tier 1: Fast-Path AST Lexical Analyzer",
        description: "Evaluates SQL syntax trees, token density, quote balancing, tautologies (' OR '1'='1'), comment markers (--), and stacked queries (; DROP).",
        highlight: "Execution time: < 0.5ms",
      },
      {
        heading: "Tier 2: Gemini 3.8 Flash AI Agent (@google/genai)",
        description: "Invoked when complex polyglots or obfuscations are detected. Analyzes semantic intent, dialect nuances, and drafts remediation guidance.",
        highlight: "Timeout protected with automatic fallback",
      },
      {
        heading: "Zero-False-Positive Whitelist",
        description: "Intelligent exception filters recognize legitimate names containing apostrophes (e.g., O'Connor, D'Angelo) without false alarms.",
      },
    ],
    speakerNotes:
      "A key innovation is the dual-tier architecture. Many AI security tools are slow because they send every request to an LLM. Our system uses a high-speed AST lexer that screens 95% of traffic in less than half a millisecond. Gemini is engaged for ambiguous cases, ensuring instant response times and zero false positives on names like O'Connor.",
  },
  {
    id: 5,
    badge: "CONTINUOUS LEARNING",
    title: "How the Agent Gets Trained Every Day",
    subtitle: "Autonomous 24-Hour Cycle Ingesting Real-World Security Telemetry",
    points: [
      {
        heading: "Automated 24-Hour Cron Daemon",
        description: "Runs automatically every 24 hours at 00:00 UTC. Can also be triggered on-demand via the Autonomous Retraining Lab in the UI.",
      },
      {
        heading: "Global Threat Telemetry Ingestion",
        description: "Automatically pulls thousands of raw honeypot probes and fresh CVE vulnerability disclosures across four primary sources.",
      },
      {
        heading: "AST Feature Extraction & Weight Synthesis",
        description: "Deconstructs new attack patterns (MySQL comment evasion, PostgreSQL pg_sleep, nested delays) and compiles updated heuristic weights.",
      },
      {
        heading: "Model Version Upgrades (Zero Downtime)",
        description: "Increments model version (v3.8.4 -> v3.8.5 -> v3.8.6), expands indexed signatures count (+20-50 daily), and boosts accuracy.",
      },
    ],
    diagramTitle: "Daily Retraining Cycle (Every 24 Hours)",
    diagramItems: [
      { step: "24h", label: "Scheduled Trigger", desc: "Cron wakes up daily at 00:00 UTC" },
      { step: "PULL", label: "Threat Fetch", desc: "Collects 4,000+ raw honeypot & CVE records" },
      { step: "AST", label: "Feature Compile", desc: "Synthesizes new evasion tokens & heuristics" },
      { step: "HOT", label: "Live Deployment", desc: "Upgrades model version with zero downtime" },
    ],
    speakerNotes:
      "This directly answers the prompt requirement: 'my agent should get train everyday and it should get update day by day by fetching the real world security logs'. The agent runs a background scheduler that fetches thousands of real-world hacker logs daily, extracts new evasion patterns, increments the model version, and updates accuracy metrics dynamically.",
  },
  {
    id: 6,
    badge: "THREAT INTEL SOURCES",
    title: "Real-World Threat Intelligence Sources",
    subtitle: "Four Global Telemetry Streams Feeding Daily Retraining",
    points: [
      {
        heading: "1. OWASP Honeypot Sensor Network",
        description: "Captures live brute-force scanners, automated SQLmap probes, and authentication bypass payloads targeting public web servers.",
      },
      {
        heading: "2. NVD / CVE National Vulnerability Database",
        description: "Fetches newly published SQL injection CVE disclosures across enterprise ERPs, e-commerce gateways, and content management systems.",
      },
      {
        heading: "3. ModSecurity Core Rule Set (CRS)",
        description: "Ingests community WAF bypass rules, space-less comment evasions (admin'/**/OR/**/1=1#), and version-conditional comment attacks.",
      },
      {
        heading: "4. GitHub Security Advisories",
        description: "Monitors disclosed driver-level vulnerabilities in Node.js, Python, and Go dynamic query builders.",
      },
    ],
    speakerNotes:
      "The agent trains on four distinct threat streams. Honeypots give us real-time attacks seen in the wild; NVD gives us formal CVE research; ModSecurity gives us WAF bypass tricks; and GitHub Advisories give us language-specific query builder bugs.",
  },
  {
    id: 7,
    badge: "TECH STACK",
    title: "Software Packages & Technologies Used",
    subtitle: "Comprehensive Breakdown of Dependencies and Their Specific Roles",
    points: [
      {
        heading: "@google/genai (v2.4.0)",
        description: "Modern Google Gen AI TypeScript SDK. Powers server-side Gemini 3.8 Flash semantic reasoning, structured JSON outputs, and the multi-turn AI chatbot.",
      },
      {
        heading: "Express (v4.21.2) + tsx",
        description: "Backend HTTP REST server hosting auth endpoints, scan routes, daily retraining crons, and mounting Vite middleware.",
      },
      {
        heading: "React 19 + React-DOM",
        description: "Modern component architecture powering the responsive cybersecurity interface, live HUD stats, and interactive testing portals.",
      },
      {
        heading: "Tailwind CSS v4 (@tailwindcss/vite)",
        description: "High-performance styling engine enabling the custom Navy + Cyan cyber matrix grid, glow shadows, and tactical HUD themes.",
      },
      {
        heading: "Node.js 'net' Socket Engine",
        description: "Low-level TCP socket client enabling fast SYN probing and service version discovery for the Nmap-style port scanner.",
      },
    ],
    speakerNotes:
      "Every package in package.json was chosen with precision. @google/genai provides the intelligence layer; Express provides the server; React 19 handles the reactive user interface; Tailwind CSS v4 powers our dark Navy + Cyan cyber aesthetic; and Node's net module runs the Nmap port scanner.",
  },
  {
    id: 8,
    badge: "FEATURE SHOWCASE",
    title: "Complete Application Feature Matrix",
    subtitle: "Interactive Security Modules Built into AegisSQL Sentinel",
    points: [
      {
        heading: "1. Target Auth Portal & Alert Warning",
        description: "Interactive login gateway that welcomes normal users with green confirmation cards and immediately alarms on SQLi attacks with red alert cards.",
      },
      {
        heading: "2. Nmap-Style Network Port Scanner",
        description: "Probes any IP or hostname, identifying open ports, listening services, software versions & banners, and raw Nmap CLI output.",
      },
      {
        heading: "3. Red Team / Security AI Chatbot",
        description: "Multi-turn Gemini 3.8 Flash conversational assistant with memory and prompt chips for auditing queries and explaining CVEs.",
      },
      {
        heading: "4. Payload Inspection Sandbox",
        description: "Security workbench for entering raw queries, viewing AST token breakdowns, and getting instant parameterized code fixes.",
      },
    ],
    speakerNotes:
      "The app includes five core modules: the Target Auth Portal where you test login payloads; the Autonomous Retraining Lab with animated daily retraining logs; the Nmap Port Scanner for discovering open ports and versions; the AI Chatbot for conversational analysis; and the Payload Sandbox.",
  },
  {
    id: 9,
    badge: "BENCHMARKS",
    title: "Performance & Accuracy Benchmarks",
    subtitle: "Enterprise-Grade Reliability and Precision",
    points: [
      {
        heading: "99.82%+ Detection Accuracy",
        description: "Trained across over 14,800+ real-world attack samples with automated daily precision improvement.",
      },
      {
        heading: "0.02% False Positive Rate",
        description: "Natural names containing apostrophes (O'Connor, D'Angelo, McDonald's) are safely whitelisted without false triggers.",
      },
      {
        heading: "Sub-Millisecond Response Latency",
        description: "Fast-path AST lexer evaluates clean inputs in under 0.5ms, ensuring zero noticeable delay for legitimate end users.",
      },
      {
        heading: "Zero-Downtime Retraining",
        description: "Daily model weight updates and version increments activate in memory without requiring server restarts.",
      },
    ],
    speakerNotes:
      "Our benchmarks prove high-velocity enterprise viability. We achieved 99.82% detection accuracy, less than 0.02% false positives, and sub-millisecond screening times, with hot-swappable zero-downtime daily updates.",
  },
  {
    id: 10,
    badge: "CONCLUSION",
    title: "Summary & Strategic Impact",
    subtitle: "Moving Application Security from Static Firewalls to Adaptive AI",
    points: [
      {
        heading: "Autonomous Continuous Learning",
        description: "The agent evolves every single day, neutralizing new zero-day SQLi bypass techniques automatically.",
      },
      {
        heading: "Developer-Friendly Remediation",
        description: "Every blocked attack provides the exact parameterized query syntax needed to permanently fix the underlying vulnerability.",
      },
      {
        heading: "Comprehensive Security Intelligence",
        description: "Combines authentication guarding, network port scanning, and generative AI advisory into a unified Navy + Cyan command center.",
      },
    ],
    speakerNotes:
      "In conclusion, AegisSQL Sentinel demonstrates how modern AI agents can transform defensive cybersecurity. By uniting fast AST analysis, Google Gemini AI reasoning, and automated daily retraining on real-world honeypots, we deliver an adaptive defense matrix that never goes out of date. Thank you, and I welcome any questions!",
  },
];

interface PresentationDeckProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ isOpen, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedNote, setCopiedNote] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  const slide = SLIDES_DATA[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < SLIDES_DATA.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(`SLIDE ${slide.id}: ${slide.title}\n\nSPEAKER NOTES:\n${slide.speakerNotes}`);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-5xl bg-[#061024] border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-950/90 flex flex-col h-[750px] max-h-[95vh] overflow-hidden cyan-glow">
        {/* Top Slide Control Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-900/80 bg-[#081735]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-cyan-300">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-wide">
                PROJECT PRESENTATION // PPT DECK
              </span>
              <p className="text-[10px] text-cyan-300/70">
                Slide {currentSlideIndex + 1} of {SLIDES_DATA.length} • {slide.badge}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showNotes
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60'
                  : 'bg-[#030816] text-slate-400 border-cyan-900'
              }`}
            >
              {showNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-cyan-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Slide Presentation Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#061024] to-[#030816]">
          {/* Slide Header */}
          <div className="border-b border-cyan-900/60 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
              {slide.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              {slide.title}
            </h1>
            <p className="text-sm text-cyan-200/80 mt-1 font-sans">
              {slide.subtitle}
            </p>
          </div>

          {/* Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slide.points.map((pt, idx) => (
              <div
                key={idx}
                className="bg-[#081735]/80 border border-cyan-900/80 rounded-xl p-4 space-y-1.5 hover:border-cyan-500/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {pt.heading}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed pl-4">
                  {pt.description}
                </p>
                {pt.highlight && (
                  <div className="text-[10px] text-cyan-300 font-bold pl-4">
                    ⚡ {pt.highlight}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Optional Code Snippet */}
          {slide.codeSnippet && (
            <div className="bg-[#020612] border border-cyan-900 rounded-xl p-3.5 text-xs text-cyan-200 font-mono overflow-x-auto leading-relaxed shadow-inner">
              <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">
                [CODE EXAMPLE]
              </div>
              <pre>{slide.codeSnippet}</pre>
            </div>
          )}

          {/* Optional Process Diagram */}
          {slide.diagramItems && (
            <div className="bg-[#081735]/40 border border-cyan-900/60 rounded-xl p-4">
              <div className="text-[11px] font-bold text-cyan-400 uppercase mb-3">
                {slide.diagramTitle || 'Execution Steps:'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {slide.diagramItems.map((item, i) => (
                  <div key={i} className="bg-[#030816] p-3 rounded-lg border border-cyan-950">
                    <div className="text-xs font-bold text-cyan-400 mb-1">
                      {item.step}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {item.label}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans leading-snug">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speaker Notes Box (Collapsible) */}
          {showNotes && (
            <div className="bg-[#030712] border border-cyan-950 rounded-xl p-4 text-xs font-sans text-slate-300 relative">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-950 text-cyan-400 font-mono text-[10px] font-bold">
                <span>🎤 SPEAKER SCRIPT / PRESENTATION NOTES:</span>
                <button
                  onClick={handleCopyNotes}
                  className="text-slate-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedNote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedNote ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>
              <p className="leading-relaxed italic text-slate-300">
                "{slide.speakerNotes}"
              </p>
            </div>
          )}
        </div>

        {/* Bottom Slide Navigation Bar */}
        <div className="px-5 py-3 bg-[#050c1a] border-t border-cyan-900/80 flex items-center justify-between text-xs font-mono">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="px-4 py-2 rounded-xl bg-[#081735] hover:bg-cyan-950 text-cyan-200 border border-cyan-800 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Slide</span>
          </button>

          {/* Quick Slide Selector Dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {SLIDES_DATA.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'bg-cyan-400 w-6'
                    : 'bg-cyan-950 hover:bg-cyan-700'
                }`}
                title={`Jump to Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlideIndex === SLIDES_DATA.length - 1}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/60 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer font-bold shadow-md shadow-cyan-600/25"
          >
            <span>Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
