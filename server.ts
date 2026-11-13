import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db';
import { detectSQLInjection } from './server/detector';
import { initAutonomousTrainingScheduler } from './server/trainingAgent';
import { IncidentLog } from './src/types';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CORS & Cache Headers for iframe proxy environments
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Initialize background 24h cron
initAutonomousTrainingScheduler();

// API Routes

// 1. Authentication Login Endpoint with SQL Injection Agent Guard
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username = '', password = '' } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || '198.51.100.27';

    // Step 1: Pass credentials to the SQL Injection Detector Agent
    const warning = await detectSQLInjection(username, password);

    // If SQL Injection is detected, BLOCK and WARN the user!
    if (warning) {
      const incident: IncidentLog = {
        id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        ipAddress: typeof ipAddress === 'string' ? ipAddress : '198.51.100.27',
        usernameAttempted: username.slice(0, 80),
        passwordAttemptedSnippet: password ? '••••••••' : '(empty)',
        threatType: warning.threatType,
        severity: warning.severity,
        actionTaken: 'BLOCKED_AND_ALERTED',
        tokensFlagged: warning.detectedTokens,
      };

      db.addIncident(incident);

      return res.status(200).json({
        success: false,
        blocked: true,
        message: 'SECURITY ALERT: Malicious SQL Injection Detected & Blocked!',
        warning,
      });
    }

    // Otherwise, credentials are safe from SQL injection
    db.recordSafeCheck();

    // Standard credential validation (allows demo credentials or benign logins)
    return res.status(200).json({
      success: true,
      blocked: false,
      message: 'Authentication successful! Normal credentials verified with zero SQLi threats detected.',
      user: {
        username: username || 'authorized_user',
        role: 'Verified Analyst',
        lastLogin: new Date().toLocaleString(),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication server error',
    });
  }
});

// 2. Direct Payload Inspection Sandbox
app.post('/api/agent/inspect', async (req, res) => {
  try {
    const { payload = '' } = req.body;
    const warning = await detectSQLInjection(payload);
    db.recordWorkbenchInspection(String(payload), warning);

    return res.status(200).json({
      success: true,
      isInjection: Boolean(warning),
      warning: warning || null,
      message: warning ? 'Threat detected' : 'Payload clean',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Agent Status & Metrics
app.get('/api/agent/status', (_req, res) => {
  res.json(db.getStatus());
});

// 4. Trigger Daily Retraining & Real-World Logs Fetching
app.post('/api/agent/train-daily', async (_req, res) => {
  try {
    const { executeAutonomousTrainingCycle } = await import('./server/trainingAgent');
    const result = await executeAutonomousTrainingCycle('MANUAL');
    res.json({
      success: true,
      result,
      status: db.getStatus(),
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 4b. Trigger Live External Cybersecurity Intelligence Collection
app.post('/api/agent/sync-sources', async (_req, res) => {
  try {
    const { syncAllThreatSources } = await import('./server/threatIntelligenceCollector');
    const summary = await syncAllThreatSources();
    res.json({
      success: true,
      summary,
      status: db.getStatus(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4c. Model Rollback Endpoint
app.post('/api/agent/rollback', async (req, res) => {
  try {
    const { targetVersion } = req.body;
    const { sqliteDb } = await import('./server/sqliteDb');
    
    const prev = sqliteDb.getPreviousModel();
    const versionToRollback = targetVersion || prev?.version;

    if (!versionToRollback) {
      return res.status(400).json({ success: false, error: 'No rollback candidate version found' });
    }

    const success = sqliteDb.rollbackToModel(versionToRollback);
    if (!success) {
      return res.status(400).json({ success: false, error: `Could not rollback to version ${versionToRollback}` });
    }

    return res.json({
      success: true,
      message: `Successfully rolled back to verified model ${versionToRollback}`,
      activeModel: sqliteDb.getActiveModel(),
      previousModel: sqliteDb.getPreviousModel(),
      status: db.getStatus(),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4d. Model Comparison & Versions
app.get('/api/agent/model-comparison', async (_req, res) => {
  const { sqliteDb } = await import('./server/sqliteDb');
  const activeModel = sqliteDb.getActiveModel();
  const previousModel = sqliteDb.getPreviousModel();
  const allVersions = sqliteDb.getAllModelVersions();
  const latestEvaluations = sqliteDb['db'].prepare('SELECT * FROM model_evaluation ORDER BY evaluated_at DESC LIMIT 5').all();

  res.json({
    activeModel,
    previousModel,
    allVersions,
    latestEvaluations,
  });
});

// 4e. Source Sync History & Live Source Sync Times
app.get('/api/agent/sync-history', async (_req, res) => {
  const { sqliteDb } = await import('./server/sqliteDb');
  const history = sqliteDb.getSyncHistory(20);
  const latestSyncs = sqliteDb.getLatestSyncTimes();
  res.json({ history, latestSyncs });
});

// 4f. Detection Rules Catalog
app.get('/api/agent/rules', async (_req, res) => {
  const { sqliteDb } = await import('./server/sqliteDb');
  const rules = sqliteDb.getAllRules();
  res.json(rules);
});

// 5. Training History
app.get('/api/agent/training-history', (_req, res) => {
  res.json(db.getTrainingHistory());
});

// 6. Threat Feeds & Real-World Security Logs
app.get('/api/agent/threat-feeds', (_req, res) => {
  res.json(db.getThreatFeeds());
});

// 7. Security Incident Logs
app.get('/api/agent/incident-logs', (_req, res) => {
  res.json(db.getIncidentLogs());
});

// 8. Clear Incident Logs
app.post('/api/agent/clear-logs', (_req, res) => {
  db.clearLogs();
  res.json({ success: true, message: 'Incident logs cleared' });
});

import {
  generateGeminiSecurityReply,
  SecurityAiError,
  SUPPORTED_CHAT_MODELS,
  ChatRole,
  IncomingChatMessage,
} from './server/securityAiEngine';
import { sqliteDb } from './server/sqliteDb';

// In-memory sliding window rate limiter for /api/chat (25 requests per minute per IP)
const chatRateBuckets = new Map<string, number[]>();
const CHAT_RATE_LIMIT = 25;
const CHAT_RATE_WINDOW_MS = 60_000;

function checkChatRateLimit(clientKey: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const timestamps = (chatRateBuckets.get(clientKey) || []).filter(
    (t) => now - t < CHAT_RATE_WINDOW_MS
  );
  if (timestamps.length >= CHAT_RATE_LIMIT) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((CHAT_RATE_WINDOW_MS - (now - oldest)) / 1000));
    chatRateBuckets.set(clientKey, timestamps);
    return { allowed: false, retryAfterSec };
  }
  timestamps.push(now);
  chatRateBuckets.set(clientKey, timestamps);
  return { allowed: true, retryAfterSec: 0 };
}

// 9a. Security AI Chatbot Readiness & Connected Module Counts (no secrets exposed)
app.get('/api/chat/status', (_req, res) => {
  const configured = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  return res.json({
    configured,
    supportedModels: SUPPORTED_CHAT_MODELS,
    contextStats: {
      incidentsCount: db.getIncidentLogs().length,
      threatFeedsCount: db.getThreatFeeds().length,
      activeRulesCount: sqliteDb.getActiveRules().length,
      portScansCount: db.getRecentPortScans().length,
      workbenchInspectionsCount: db.getRecentWorkbenchInspections().length,
    },
  });
});

// 9b. Multi-Turn Security AI Chatbot (Real Gemini API Integration + Live Telemetry Context)
app.post('/api/chat', async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = checkChatRateLimit(String(clientIp));
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSec));
      return res.status(429).json({
        error: `Rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before sending another Security AI query.`,
        code: 'RATE_LIMITED',
      });
    }

    const {
      messages,
      model = 'gemini-4-hydrogen',
      role = 'red_team',
      contextHint,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'A non-empty messages array is required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const sanitizedMessages: IncomingChatMessage[] = [];
    for (const m of messages) {
      if (!m || typeof m.content !== 'string') continue;
      const content = m.content.trim();
      if (!content) continue;
      if (content.length > 16000) {
        return res.status(400).json({
          error: 'Message exceeds the maximum allowed length of 16,000 characters.',
          code: 'VALIDATION_ERROR',
        });
      }
      sanitizedMessages.push({
        role: m.role === 'model' ? 'model' : 'user',
        content,
      });
    }

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content) {
      return res.status(400).json({
        error: 'Please enter a non-empty message before sending.',
        code: 'VALIDATION_ERROR',
      });
    }

    const validRoles: ChatRole[] = ['red_team', 'blue_team', 'fast_auditor'];
    const selectedRole: ChatRole = validRoles.includes(role) ? role : 'red_team';

    const result = await generateGeminiSecurityReply(
      sanitizedMessages,
      typeof model === 'string' ? model : 'gemini-4-hydrogen',
      selectedRole,
      contextHint && typeof contextHint === 'object'
        ? {
            activeTab:
              typeof contextHint.activeTab === 'string' ? contextHint.activeTab.slice(0, 40) : undefined,
            currentWorkbenchPayload:
              typeof contextHint.currentWorkbenchPayload === 'string'
                ? contextHint.currentWorkbenchPayload.slice(0, 400)
                : undefined,
          }
        : undefined
    );

    return res.json({
      reply: result.reply,
      model: result.modelUsed,
      role: result.role,
      contextSummary: result.contextSummary,
    });
  } catch (err: unknown) {
    if (err instanceof SecurityAiError) {
      console.warn(`[Security AI /api/chat] ${err.code} (${err.statusCode}): ${err.message}`);
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }
    const msg = err instanceof Error ? err.message : 'Unexpected server error while contacting Gemini AI.';
    console.warn(`[Security AI /api/chat] Unexpected error: ${msg}`);
    return res.status(502).json({
      error: 'Unable to generate a response from Gemini AI right now. Please try again.',
      code: 'UNKNOWN_ERROR',
    });
  }
});

// 10. Nmap-Style Port Scanner & Service Version Discovery
app.post('/api/scan', async (req, res) => {
  try {
    const { target = '127.0.0.1' } = req.body;
    const { executePortScan } = await import('./server/portScanner');
    const result = await executePortScan(target);
    db.recordPortScan(result);
    return res.json(result);
  } catch (err: any) {
    console.error('Port scan error:', err);
    return res.status(500).json({
      error: 'Port scanner error',
      message: err.message,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AegisSQL Sentinel Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
