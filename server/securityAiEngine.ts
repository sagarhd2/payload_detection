import { GoogleGenAI, ThinkingLevel, GenerateContentResponse } from '@google/genai';
import { db } from './db';
import { sqliteDb } from './sqliteDb';

export type SupportedGeminiModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
export type ChatRole = 'red_team' | 'blue_team' | 'fast_auditor';

export interface IncomingChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatContextHint {
  activeTab?: string;
  currentWorkbenchPayload?: string;
}

export type AiErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'EMPTY_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

export class SecurityAiError extends Error {
  public readonly statusCode: number;
  public readonly code: AiErrorCode;

  constructor(message: string, statusCode: number, code: AiErrorCode) {
    super(message);
    this.name = 'SecurityAiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const SUPPORTED_CHAT_MODELS: SupportedGeminiModel[] = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
];

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new SecurityAiError(
      'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.',
      503,
      'MISSING_API_KEY'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Collects sanitized, real-time telemetry from AegisSQL Sentinel backend modules.
 * Never includes passwords, API keys, or confidential secrets.
 */
export function buildLiveSystemContext(hint?: ChatContextHint): string {
  const status = db.getStatus();
  const activeRules = sqliteDb.getActiveRules();
  const incidents = db.getIncidentLogs().slice(0, 8);
  const workbench = db.getRecentWorkbenchInspections().slice(0, 5);
  const scans = db.getRecentPortScans().slice(0, 3);
  const feeds = db.getThreatFeeds().slice(0, 6);
  const syncHistory = sqliteDb.getSyncHistory(4);
  const trainingHistory = db.getTrainingHistory().slice(0, 3);

  const lines: string[] = [
    '=== LIVE AEGISSQL SENTINEL SYSTEM TELEMETRY (USE ONLY VERIFIED DATA BELOW; NEVER FABRICATE) ===',
    `1. DETECTION ENGINE & MODEL STATUS:`,
    `   - Active Model: ${status.modelVersion} (Previous Rollback Candidate: ${status.previousModelVersion || 'none'})`,
    `   - Learning Mode: ${status.learningMode} | Schedule: ${status.trainingCronInterval}`,
    `   - Validation Metrics: Precision=${status.precision ?? 'N/A'}, Recall=${status.recall ?? 'N/A'}, F1=${status.f1Score ?? 'N/A'}, FPR=${status.falsePositiveRate}, FNR=${status.falseNegativeRate ?? 'N/A'}`,
    `   - Screened Payloads: ${status.totalPayloadsScreened} | Blocked Threats: ${status.totalThreatsBlocked} | Active Rules: ${activeRules.length}`,
    `   - Last Trained: ${status.lastTrainedTime} | Next Scheduled Run: ${status.nextScheduledTraining}`,
    '',
    `2. ACTIVE SQL INJECTION DETECTION RULES (${activeRules.length} rules in SQLite):`,
    ...activeRules.map(
      (r) => `   - [${r.id}] ${r.rule_name} | Category: ${r.category} | Severity: ${r.severity} | Weight: ${r.weight}`
    ),
    '',
    `3. RECENT INTERCEPTED AUTHENTICATION INCIDENTS (${incidents.length} most recent; passwords redacted):`,
  ];

  if (incidents.length === 0) {
    lines.push('   - No SQL injection login incidents currently recorded in detection_logs.');
  } else {
    for (const inc of incidents) {
      lines.push(
        `   - [${inc.id}] Time: ${inc.timestamp} | Source IP: ${inc.ipAddress} | Input: ${JSON.stringify(inc.usernameAttempted)} | Threat: ${inc.threatType} | Severity: ${inc.severity} | Flagged Tokens: ${JSON.stringify(inc.tokensFlagged)} | Action: ${inc.actionTaken}`
      );
    }
  }

  lines.push('');
  lines.push(`4. RECENT PAYLOAD WORKBENCH INSPECTIONS (${workbench.length} most recent):`);
  if (workbench.length === 0) {
    lines.push('   - No recent Payload Workbench inspections recorded in this session.');
  } else {
    for (const w of workbench) {
      lines.push(
        `   - Time: ${w.timestamp} | Payload: ${JSON.stringify(w.payload)} | Verdict: ${w.isInjection ? `BLOCKED (${w.warning?.threatType}, ${w.warning?.severity})` : 'CLEAN/BENIGN'}`
      );
    }
  }

  lines.push('');
  lines.push(`5. RECENT NMAP PORT SCANNER RESULTS (${scans.length} most recent):`);
  if (scans.length === 0) {
    lines.push('   - No port scans have been executed in this session yet.');
  } else {
    for (const s of scans) {
      const openSummary = s.ports.map((p) => `${p.port}/${p.protocol}(${p.service}:${p.version})`).join(', ') || 'none';
      lines.push(
        `   - Target: ${s.target} (${s.ip}) | State: ${s.state} | Open Ports (${s.openPortsCount}): ${openSummary} | Latency: ${s.latencyMs}ms | Time: ${s.scanTime}`
      );
    }
  }

  lines.push('');
  lines.push(`6. THREAT INTELLIGENCE FEED & SYNC STATUS (Total SQLite records: ${status.threatIntelTotal ?? feeds.length}):`);
  for (const f of feeds) {
    lines.push(`   - [${f.cveId}] Source: ${f.source} | Severity: ${f.severity} | Title: ${f.targetSoftware}`);
  }
  if (syncHistory.length > 0) {
    lines.push('   Recent Source Syncs:');
    for (const sy of syncHistory) {
      lines.push(
        `   - ${sy.source_name}: ${sy.status} (Fetched: ${sy.records_fetched}, New: ${sy.new_records_added}, Duplicates Skipped: ${sy.duplicates_skipped}, End: ${sy.sync_end})`
      );
    }
  }

  lines.push('');
  lines.push(`7. AUTONOMOUS RETRAINING HISTORY (${trainingHistory.length} latest):`);
  for (const t of trainingHistory) {
    lines.push(
      `   - [${t.id}] ${t.timestamp}: ${t.modelPreviousVersion} -> ${t.modelNewVersion} | Result: ${t.validationResult || t.status} | Summary: ${t.summary}`
    );
  }

  if (hint?.activeTab || hint?.currentWorkbenchPayload) {
    lines.push('');
    lines.push('8. ACTIVE UI CONTEXT:');
    if (hint.activeTab) lines.push(`   - User currently viewing tab: ${hint.activeTab}`);
    if (hint.currentWorkbenchPayload) {
      lines.push(`   - Current Payload Workbench editor text: ${JSON.stringify(hint.currentWorkbenchPayload.slice(0, 400))}`);
    }
  }

  lines.push('=== END LIVE TELEMETRY ===');
  return lines.join('\n');
}

function buildSystemInstruction(role: ChatRole, liveContext: string): string {
  let personaGuidance = '';

  if (role === 'blue_team') {
    personaGuidance = `You are Aegis-Blue Guardian, the defensive cybersecurity and secure coding specialist for **AegisSQL Sentinel**.
Focus on:
- Defensive analysis, root-cause explanations, and production-ready remediation code (parameterized queries / prepared statements in Node.js pg/mysql2, Python psycopg/asyncpg, Java JDBC, Go database/sql, ORMs).
- Database hardening (principle of least privilege, statement timeouts, disabling verbose DB errors, strict allowlists for dynamic ORDER BY columns).
- Analyzing intercepted login incidents, workbench payloads, port scanner results, and OWASP Top 10 / CWE-89 risks.`;
  } else if (role === 'fast_auditor') {
    personaGuidance = `You are Aegis-Quick Auditor, a concise high-speed SQL syntax and security auditor for **AegisSQL Sentinel**.
Focus on:
- Crisp, structured bullet points: Threat Classification, Flagged Tokens/Mechanisms, Impact, and Concrete 1-line/short Secure Code Fix.
- High technical precision with zero fluff.`;
  } else {
    personaGuidance = `You are Aegis-Red Sentinel, an authorized defensive cybersecurity educator and SQL injection analyst for **AegisSQL Sentinel**.
Focus on:
- Explaining conceptually and technically how SQL injection vulnerabilities work (Boolean-based, UNION-based, Error-based, Time-based blind, Stacked queries, Comment syntax, Encoding patterns) strictly for defensive understanding, code auditing, and vulnerability remediation.
- Pairing every vulnerability analysis with how AegisSQL's AST/lexical rules detect it and how developers prevent it using parameterized queries / prepared statements.`;
  }

  return `${personaGuidance}

CRITICAL RULES FOR ACCURACY, GROUNDING & CYBERSECURITY SAFETY:
1. Respond directly and specifically to the user's actual question while maintaining full conversational context across previous messages.
2. When the user asks about intercepted incidents, why a login request was blocked, port scan results, workbench payloads, threat feeds, active rules, or model retraining metrics, inspect the LIVE AEGISSQL SENTINEL SYSTEM TELEMETRY provided below and reference the exact real records (IDs, timestamps, IPs, payloads, rules, CVEs, or ports).
3. NEVER invent, fabricate, or hallucinate CVEs, incident logs, port scan results, or security events. If no port scan or no matching incident exists in the telemetry, explicitly state that none has been recorded yet.
4. Distinguish clearly between confirmed findings (e.g., detected rules/blocked payloads in logs) and potential/hypothetical risks.
5. Prioritize defensive cybersecurity and authorized lab testing only. Do not provide actionable malware or instructions for attacking unauthorized external systems.
6. Format code examples in clean fenced markdown code blocks (\`\`\`sql, \`\`\`typescript, \`\`\`python, etc.) and keep explanations clear, technical, and non-repetitive.
7. Never reveal or repeat raw API keys, environment variables, or passwords.

${liveContext}`;
}

function extractCleanProviderMessage(raw: string): string {
  const redacted = raw
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED_KEY]')
    .replace(/AQ\.[0-9A-Za-z._-]{15,}/g, '[REDACTED_KEY]')
    .trim();
  try {
    const parsed = JSON.parse(redacted);
    if (parsed?.error?.message) {
      return String(parsed.error.message);
    }
  } catch {
    // Not pure JSON; try extracting nested JSON "message":"..."
    const m = redacted.match(/"message"\s*:\s*"([^"]+)"/);
    if (m && m[1]) {
      return m[1];
    }
  }
  return redacted.slice(0, 180);
}

function classifyGeminiError(err: unknown): SecurityAiError {
  if (err instanceof SecurityAiError) {
    return err;
  }

  const anyErr = err as { status?: number; code?: string | number; message?: string; name?: string };
  const status = typeof anyErr?.status === 'number' ? anyErr.status : 0;
  const rawMsg = String(anyErr?.message || err || 'Unknown Gemini API error');
  const cleanMsg = extractCleanProviderMessage(rawMsg);
  const lower = `${rawMsg} ${cleanMsg}`.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || status === 401) {
    return new SecurityAiError(
      `The configured Gemini API key is invalid or unauthorized (${cleanMsg}). Please verify GEMINI_API_KEY in Settings > Secrets.`,
      401,
      'INVALID_API_KEY'
    );
  }

  if (status === 403 || lower.includes('permission_denied')) {
    return new SecurityAiError(
      `Permission denied by Gemini API (${cleanMsg}). Please check your API key permissions in Settings > Secrets.`,
      403,
      'INVALID_API_KEY'
    );
  }

  if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return new SecurityAiError(
      'Gemini API rate limit or quota exceeded. Please wait briefly or check your billing tier in Settings > Secrets.',
      429,
      'QUOTA_EXCEEDED'
    );
  }

  if (status === 404 || lower.includes('not_found') || lower.includes('is not found')) {
    return new SecurityAiError(
      'The requested Gemini model is unavailable or unsupported. Please switch between Gemini 4 Hydrogen and Gemini 3.1 Flash-Lite.',
      404,
      'MODEL_UNAVAILABLE'
    );
  }

  if (anyErr?.name === 'AbortError' || lower.includes('timeout') || lower.includes('timed out')) {
    return new SecurityAiError(
      'The Gemini AI request timed out while waiting for a response. Please try again.',
      504,
      'TIMEOUT'
    );
  }

  if (
    lower.includes('fetch failed') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('network')
  ) {
    return new SecurityAiError(
      'Unable to reach the Gemini API due to a network connectivity failure. Please verify internet access and retry.',
      502,
      'NETWORK_ERROR'
    );
  }

  if (status >= 500 && status < 600) {
    return new SecurityAiError(
      'Gemini API service is temporarily experiencing an internal error. Please retry shortly.',
      503,
      'MODEL_UNAVAILABLE'
    );
  }

  return new SecurityAiError(
    `Gemini AI processing failed: ${cleanMsg}`,
    502,
    'UNKNOWN_ERROR'
  );
}

async function callGeminiWithTimeout(
  ai: GoogleGenAI,
  model: SupportedGeminiModel,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string,
  role: ChatRole,
  timeoutMs = 22000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const config: Record<string, unknown> = {
      systemInstruction,
      abortSignal: controller.signal,
    };

    if (model === 'gemini-4-hydrogen') {
      config.thinkingConfig = {
        thinkingLevel: role === 'fast_auditor' ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
      };
    } else if (model === 'gemini-3.1-flash-lite') {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.MINIMAL,
      };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const text = response.text?.trim() ?? '';
    if (!text) {
      const blockReason = response.promptFeedback?.blockReason;
      throw new SecurityAiError(
        blockReason
          ? `Model could not complete this request (reason: ${blockReason}). Retrying or rephrasing may help.`
          : 'Gemini returned an empty response. Please rephrase your question or retry.',
        502,
        'EMPTY_RESPONSE'
      );
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

export interface GeminiChatResult {
  reply: string;
  modelUsed: SupportedGeminiModel;
  role: ChatRole;
  contextSummary: {
    incidentsCount: number;
    threatFeedsCount: number;
    activeRulesCount: number;
    portScansCount: number;
    workbenchInspectionsCount: number;
  };
}

/**
 * Generates a real, multi-turn, context-aware Gemini AI response grounded in live AegisSQL Sentinel telemetry.
 * Includes timeout protection, exponential backoff retries on transient errors, and transparent error propagation.
 */
export async function generateGeminiSecurityReply(
  messages: IncomingChatMessage[],
  requestedModel: string = 'gemini-4-hydrogen',
  role: ChatRole = 'red_team',
  hint?: ChatContextHint
): Promise<GeminiChatResult> {
  const ai = getGeminiClient();

  const primaryModel: SupportedGeminiModel = SUPPORTED_CHAT_MODELS.includes(
    requestedModel as SupportedGeminiModel
  )
    ? (requestedModel as SupportedGeminiModel)
    : 'gemini-4-hydrogen';

  const fallbackModel: SupportedGeminiModel =
    primaryModel === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

  // Keep up to the most recent 20 messages for clean multi-turn memory
  const recentMessages = messages.slice(-20);

  // Ensure Gemini contents sequence is valid (starts with user role or only valid alternating/non-empty turns)
  const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const m of recentMessages) {
    const cleanText = m.content.trim();
    if (!cleanText) continue;
    const msgRole = m.role === 'model' ? 'model' : 'user';
    // Skip leading model welcome message if first in array so conversation starts cleanly with user turn
    if (formattedContents.length === 0 && msgRole === 'model') {
      continue;
    }
    formattedContents.push({
      role: msgRole,
      parts: [{ text: cleanText }],
    });
  }

  if (formattedContents.length === 0 || formattedContents[formattedContents.length - 1].role !== 'user') {
    throw new SecurityAiError(
      'Please enter a non-empty question for the Security AI assistant.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const liveContext = buildLiveSystemContext(hint);
  const systemInstruction = buildSystemInstruction(role, liveContext);

  const contextSummary = {
    incidentsCount: db.getIncidentLogs().length,
    threatFeedsCount: db.getThreatFeeds().length,
    activeRulesCount: sqliteDb.getActiveRules().length,
    portScansCount: db.getRecentPortScans().length,
    workbenchInspectionsCount: db.getRecentWorkbenchInspections().length,
  };

  // Attempt primary model with 1 retry for transient 5xx/timeout/network failures
  const maxPrimaryAttempts = 2;
  let lastError: SecurityAiError | null = null;

  for (let attempt = 1; attempt <= maxPrimaryAttempts; attempt++) {
    try {
      const reply = await callGeminiWithTimeout(
        ai,
        primaryModel,
        formattedContents,
        systemInstruction,
        role,
        22000
      );
      return {
        reply,
        modelUsed: primaryModel,
        role,
        contextSummary,
      };
    } catch (err) {
      const classified = classifyGeminiError(err);
      lastError = classified;

      // Do not retry on invalid API key or validation errors
      if (classified.code === 'INVALID_API_KEY' || classified.code === 'MISSING_API_KEY' || classified.code === 'VALIDATION_ERROR') {
        throw classified;
      }

      // Exponential backoff before retry on transient errors
      if (attempt < maxPrimaryAttempts && (classified.code === 'NETWORK_ERROR' || classified.code === 'TIMEOUT' || classified.statusCode >= 500)) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
        continue;
      }
      break;
    }
  }

  // Automatic failover to secondary supported Gemini model if primary hit quota/unavailable/timeout/empty
  if (
    lastError &&
    (lastError.code === 'QUOTA_EXCEEDED' ||
      lastError.code === 'MODEL_UNAVAILABLE' ||
      lastError.code === 'TIMEOUT' ||
      lastError.code === 'EMPTY_RESPONSE')
  ) {
    try {
      const reply = await callGeminiWithTimeout(
        ai,
        fallbackModel,
        formattedContents,
        systemInstruction,
        role,
        22000
      );
      return {
        reply,
        modelUsed: fallbackModel,
        role,
        contextSummary,
      };
    } catch (fallbackErr) {
      throw classifyGeminiError(fallbackErr);
    }
  }

  throw lastError || new SecurityAiError('Unable to obtain a response from Gemini AI.', 502, 'UNKNOWN_ERROR');
}
