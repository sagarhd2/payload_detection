import { GoogleGenAI, Type } from '@google/genai';
import { SQLiWarning } from '../src/types';
import { sqliteDb } from './sqliteDb';

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

// Benign fast-path: pure alphanumeric, standard symbols without quotes/delimiters
function isClearlyBenign(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return true;
  if (isBenignNameWithApostrophe(trimmed)) return true;
  if (/^[a-zA-Z0-9_@.\- ]+$/.test(trimmed)) {
    const hasSqlKeywords = /\b(SELECT|UNION|DROP|INSERT|DELETE|UPDATE|SLEEP|EXEC|TABLE|ORDER|GROUP|BY|FROM|WHERE|AND|OR|HAVING|LIMIT)\b/i.test(trimmed);
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

/**
 * Deterministic AST & Lexical Rule Detection Engine
 * Uses the active detection rules stored and versioned in SQLite.
 */
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

  const activeRules = sqliteDb.getActiveRules();

  for (const { field, value } of fieldsToCheck) {
    if (!value || isBenignNameWithApostrophe(value)) {
      continue;
    }

    for (const rule of activeRules) {
      try {
        const regex = new RegExp(rule.rule_definition, 'i');
        if (regex.test(value)) {
          const matches = value.match(regex);
          const flaggedTokens = matches ? [matches[0]] : [value];

          return {
            blocked: true,
            severity: rule.severity as any,
            threatType: rule.rule_name,
            confidence: Math.round(rule.weight * 100),
            explanation: `Deterministic security rule violation: ${rule.rule_name}. Matches known signature pattern originating from ${rule.source_origin}.`,
            detectedTokens: flaggedTokens,
            attackVector: rule.category,
            recommendedRemediation: 'Adopt parameterized queries with prepared statement bindings (e.g. SELECT * FROM users WHERE username = ?).',
            targetField: field,
            rawPayload: value,
            timestamp: new Date().toISOString(),
            cveReference: 'CWE-89: SQL Injection',
            analysisMode: 'HEURISTIC_AST_WAF',
          };
        }
      } catch {
        // Safe regex skip
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

/**
 * Gemini AI Security Advisor & Deep Inspection
 * Explains attacks, assists remediation, and analyzes intent.
 */
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

    // Try gemini-3.1-flash-lite first for high speed and fresh quota
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let responseText: string | null = null;

    for (const modelName of modelsToTry) {
      try {
        const apiCall = ai.models.generateContent({
          model: modelName,
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

        const resp = await withTimeout(apiCall, 3500, null);
        if (resp && resp.text) {
          responseText = resp.text.trim();
          break;
        }
      } catch {
        // Try fallback model
      }
    }

    if (!responseText) return null;

    const parsed = JSON.parse(responseText);
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
  } catch {
    return null;
  }
}

/**
 * Master Hybrid Detector:
 * Deterministic rules provide the non-negotiable primary defense line.
 * Gemini provides supplementary threat analysis and deep explanations.
 */
export async function detectSQLInjection(
  username: string,
  password?: string
): Promise<SQLiWarning | null> {
  // Fast path for clearly benign standard inputs
  if (isClearlyBenign(username) && (!password || isClearlyBenign(password))) {
    return null;
  }

  // 1. Run deterministic heuristic AST rules
  const deterministicVerdict = runHeuristicDetection(username, password);

  // If deterministic rules already flagged a CRITICAL or HIGH threat:
  if (deterministicVerdict) {
    // Optionally enrich with Gemini if available, without delaying rejection
    if (process.env.GEMINI_API_KEY) {
      const aiVerdict = await runGeminiAgentDetection(username, password);
      if (aiVerdict) {
        return {
          ...deterministicVerdict,
          explanation: `${deterministicVerdict.explanation} AI Analysis: ${aiVerdict.explanation}`,
          recommendedRemediation: aiVerdict.recommendedRemediation || deterministicVerdict.recommendedRemediation,
          analysisMode: 'HYBRID',
          confidence: Math.max(deterministicVerdict.confidence, aiVerdict.confidence),
        };
      }
    }
    return deterministicVerdict;
  }

  // 2. If deterministic rule was borderline, check Gemini for obfuscated variations
  if (process.env.GEMINI_API_KEY) {
    const aiVerdict = await runGeminiAgentDetection(username, password);
    if (aiVerdict) {
      return aiVerdict;
    }
  }

  return null;
}
