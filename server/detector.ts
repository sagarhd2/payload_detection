import { GoogleGenAI, Type } from '@google/genai';
import { SQLiWarning } from '../src/types';

// Initialize server-side Gemini client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AST & Lexical Rule Definitions
interface HeuristicPattern {
  name: string;
  category: string;
  regex: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  remediation: string;
}

const SQLI_PATTERNS: HeuristicPattern[] = [
  {
    name: 'Tautology Authentication Bypass',
    category: 'Boolean-Based / Tautology',
    regex: /(?:'|\b)\s*(?:OR|\|\||XOR)\s+['"(]?\s*(?:(?:1\s*=\s*1)|(?:'1'\s*=\s*'1')|(?:'a'\s*=\s*'a')|(?:true)|(?:\d+\s*=\s*\d+)|(?:'[a-z]'\s*=\s*'[a-z]'))/i,
    severity: 'CRITICAL',
    explanation: 'Attempts to force the SQL WHERE clause to evaluate to true, bypassing credential validation.',
    remediation: 'Use parameterized queries or prepared statements (e.g. `SELECT * FROM users WHERE username = ?`).',
  },
  {
    name: 'Inline Comment Query Truncation',
    category: 'Comment Evasion',
    regex: /(?:'|\"|\b)\s*(?:--|#|\/\*|\/\*!\d*).*$/m,
    severity: 'HIGH',
    explanation: 'Uses SQL comment markers (`--`, `#`, or `/*`) to truncate the rest of the backend SQL query, suppressing password checks.',
    remediation: 'Enforce strict input parameter binding. Never concatenate user variables into query strings.',
  },
  {
    name: 'UNION-Based Schema & Data Extraction',
    category: 'Union-Based Injection',
    regex: /\bUNION\s+(?:ALL\s+|DISTINCT\s+)?SELECT\b/i,
    severity: 'CRITICAL',
    explanation: 'Appends an arbitrary SELECT query to extract secret tables, passwords, and database metadata.',
    remediation: 'Adopt ORM query builders or parameterization. Restrict database user privileges with least privilege.',
  },
  {
    name: 'Piggybacked / Stacked Multiple Query Execution',
    category: 'Stacked Queries',
    regex: /;\s*(?:DROP|TRUNCATE|DELETE\s+FROM|INSERT\s+INTO|UPDATE|ALTER\s+TABLE|EXEC|SHUTDOWN)\b/i,
    severity: 'CRITICAL',
    explanation: 'Attempts to execute destructive second-order commands such as dropping tables or altering permissions.',
    remediation: 'Disable multi-statement queries in database connection drivers and employ strict least privilege.',
  },
  {
    name: 'Time-Based Blind Delay Injection',
    category: 'Time-Based Blind',
    regex: /\b(?:SLEEP\s*\(|pg_sleep\s*\(|WAITFOR\s+DELAY|BENCHMARK\s*\(|DBMS_LOCK\.SLEEP)/i,
    severity: 'CRITICAL',
    explanation: 'Injects sleep or delay routines to infer database contents character-by-character through response timing.',
    remediation: 'Use parameterized SQL calls and set tight server query execution timeout thresholds.',
  },
  {
    name: 'Error-Based XPath / Function Injection',
    category: 'Error-Based Injection',
    regex: /\b(?:EXTRACTVALUE|UPDATEXML|EXP\(|CAST\s*\(|CONVERT\s*\().*?\bSELECT\b/i,
    severity: 'HIGH',
    explanation: 'Intentionally triggers database syntax/conversion errors to leak sensitive schema data in error messages.',
    remediation: 'Disable verbose database error messaging in production and use parameterized inputs.',
  },
  {
    name: 'Inline Comment Whitespace Obfuscation',
    category: 'WAF Evasion / Obfuscation',
    regex: /\b(?:OR|AND|SELECT|UNION)\/\*.*?\*\/(?:OR|AND|SELECT|1=1|'1'='1')/i,
    severity: 'HIGH',
    explanation: 'Embeds C-style comments between tokens (`admin\'/**/OR/**/1=1`) to evade simplistic whitespace-based regex filters.',
    remediation: 'Implement AST lexical parsing at the application layer and normalize inputs before validation.',
  },
  {
    name: 'Hex / ASCII Function Encoding Evasion',
    category: 'Function-Based Evasion',
    regex: /(?:0x[0-9a-fA-F]{2,}|CHAR\s*\(\s*\d+\s*\)|CHR\s*\(\s*\d+\s*\))/i,
    severity: 'MEDIUM',
    explanation: 'Encodes malicious SQL payloads in hexadecimal or ASCII function calls to circumvent keyword blacklists.',
    remediation: 'Validate input against strict alphanumeric / permitted format whitelists.',
  },
];

// Benign exemptions: normal names like O'Connor or standard emails
function isBenignNameWithApostrophe(str: string): boolean {
  const trimmed = str.trim();
  // e.g. O'Connor, D'Angelo, McDonald's
  if (/^[a-zA-Z]{1,3}'[a-zA-Z]{2,20}$/.test(trimmed)) {
    return true;
  }
  // Standard email format
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return true;
  }
  return false;
}

// Pure benign fast-path: pure alphanumeric, standard symbols without quotes/delimiters
function isClearlyBenign(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return true;
  if (isBenignNameWithApostrophe(trimmed)) return true;
  // If string contains only standard username chars and no quotes, semicolons, comments, or SQL keywords
  if (/^[a-zA-Z0-9_@.\- ]+$/.test(trimmed)) {
    const hasSqlKeywords = /\b(SELECT|UNION|DROP|INSERT|DELETE|UPDATE|SLEEP|EXEC|TABLE)\b/i.test(trimmed);
    return !hasSqlKeywords;
  }
  return false;
}

// Helper to run promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Fast heuristic AST detection
export function runHeuristicDetection(
  username: string,
  password?: string
): SQLiWarning | null {
  const fieldsToCheck: Array<{ field: 'username' | 'password'; value: string }> = [
    { field: 'username', value: username || '' },
  ];
  if (password) {
    fieldsToCheck.push({ field: 'password', value: password });
  }

  for (const { field, value } of fieldsToCheck) {
    if (!value || isBenignNameWithApostrophe(value)) {
      continue;
    }

    for (const pattern of SQLI_PATTERNS) {
      if (pattern.regex.test(value)) {
        const matches = value.match(pattern.regex);
        const flaggedTokens = matches ? [matches[0]] : [value];

        return {
          blocked: true,
          severity: pattern.severity,
          threatType: pattern.name,
          confidence: 96,
          explanation: pattern.explanation,
          detectedTokens: flaggedTokens,
          attackVector: pattern.category,
          recommendedRemediation: pattern.remediation,
          targetField: field,
          rawPayload: value,
          timestamp: new Date().toISOString(),
          cveReference: 'CWE-89: SQL Injection',
          analysisMode: 'HEURISTIC_AST_WAF',
        };
      }
    }

    // Secondary check: quote balancing + logical operators
    const singleQuotes = (value.match(/'/g) || []).length;
    const hasSqlKeywords = /\b(OR|AND|SELECT|DROP|UNION|EXEC|ALTER)\b/i.test(value);
    if (singleQuotes % 2 !== 0 && hasSqlKeywords) {
      return {
        blocked: true,
        severity: 'HIGH',
        threatType: 'Unbalanced String Literal Query Tampering',
        confidence: 88,
        explanation: 'The input contains an unclosed single quote coupled with SQL keywords, indicating an attempt to break out of SQL string literals.',
        detectedTokens: ["'"],
        attackVector: 'Syntax Breakout',
        recommendedRemediation: 'Adopt parameterized queries and input type enforcement.',
        targetField: field,
        rawPayload: value,
        timestamp: new Date().toISOString(),
        cveReference: 'CWE-89',
        analysisMode: 'HEURISTIC_AST_WAF',
      };
    }
  }

  return null;
}

// Gemini AI Autonomous Agent Deep Security Inspection
export async function runGeminiAgentDetection(
  username: string,
  password?: string
): Promise<SQLiWarning | null> {
  if (!ai || !process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    const prompt = `Analyze the following authentication credentials submitted to a web login portal.
Determine whether there is ANY SQL injection attempt (including classic, tautology, comment bypass, time-based blind, union-based, stacked queries, hex/obfuscated, second-order, or polyglot SQLi).
Note: Common benign inputs such as Irish names with single apostrophes (e.g. "O'Connor") or standard email addresses or strong passwords with symbols MUST be classified as safe (isInjection: false).

Username: "${username}"
Password: "${password || ''}"

Return a JSON object conforming strictly to the requested schema.`;

    const apiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are AegisSQL Sentinel, an elite cybersecurity AI agent specializing in real-time SQL injection detection, AST query semantics analysis, and automated threat defense. Distinguish between actual malicious SQL injection payloads and benign edge cases (such as names with apostrophes or standard passwords).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isInjection: {
              type: Type.BOOLEAN,
              description: 'True if a malicious SQL injection attempt is detected, false if safe/benign.',
            },
            severity: {
              type: Type.STRING,
              description: 'Severity level: LOW, MEDIUM, HIGH, or CRITICAL.',
            },
            threatType: {
              type: Type.STRING,
              description: 'Specific classification of the SQL injection technique.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0 and 100.',
            },
            explanation: {
              type: Type.STRING,
              description: 'Clear, concise explanation of the attack payload and its threat mechanic.',
            },
            detectedTokens: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific SQL tokens or snippets flagged.',
            },
            attackVector: {
              type: Type.STRING,
              description: 'Attack vector category (e.g. Tautology, Stacked Query, Blind Time-based, Union).',
            },
            recommendedRemediation: {
              type: Type.STRING,
              description: 'Specific code remediation, e.g. prepared statement syntax.',
            },
            targetField: {
              type: Type.STRING,
              description: 'username, password, or both.',
            },
            cveReference: {
              type: Type.STRING,
              description: 'Relevant CWE or CVE reference.',
            },
          },
          required: [
            'isInjection',
            'severity',
            'threatType',
            'confidence',
            'explanation',
            'detectedTokens',
            'attackVector',
            'recommendedRemediation',
          ],
        },
      },
    });

    const response = await withTimeout(apiCall, 3500, null);
    if (!response) return null;

    const jsonStr = (response.text ?? '').trim();
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr);
    if (parsed.isInjection) {
      return {
        blocked: true,
        severity: (parsed.severity as any) || 'HIGH',
        threatType: parsed.threatType || 'Detected SQL Injection Attack',
        confidence: Math.min(100, Math.max(50, parsed.confidence || 95)),
        explanation: parsed.explanation,
        detectedTokens: parsed.detectedTokens || [username],
        attackVector: parsed.attackVector || 'SQL Injection',
        recommendedRemediation:
          parsed.recommendedRemediation || 'Use parameterized statements and input sanitization.',
        targetField: (parsed.targetField as any) || 'username',
        rawPayload: username || password || '',
        timestamp: new Date().toISOString(),
        cveReference: parsed.cveReference || 'CWE-89: SQL Injection',
        analysisMode: 'GEMINI_AI_AGENT',
      };
    }

    return null;
  } catch (err) {
    console.warn('Gemini agent inspection error or fallback:', err);
    return null;
  }
}

// Master Detector combining both Fast Heuristic WAF and Deep Gemini AI Agent
export async function detectSQLInjection(
  username: string,
  password?: string
): Promise<SQLiWarning | null> {
  // Fast path for clearly benign standard inputs
  if (isClearlyBenign(username) && (!password || isClearlyBenign(password))) {
    return null;
  }

  // Step 1: Run fast heuristic check
  const heuristicVerdict = runHeuristicDetection(username, password);

  // If heuristic found a critical threat, we can fast-return or supplement with AI
  if (heuristicVerdict && !process.env.GEMINI_API_KEY) {
    return heuristicVerdict;
  }

  // Step 2: If Gemini API is available, invoke AI agent for deep intent and contextual analysis
  if (process.env.GEMINI_API_KEY) {
    const aiVerdict = await runGeminiAgentDetection(username, password);
    if (aiVerdict) {
      if (heuristicVerdict) {
        aiVerdict.analysisMode = 'HYBRID';
        aiVerdict.confidence = Math.max(heuristicVerdict.confidence, aiVerdict.confidence);
      }
      return aiVerdict;
    }
  }

  return heuristicVerdict;
}
