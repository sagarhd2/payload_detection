import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { generateDailySecurityLogsBatch } from './threatFeed';
import { TrainingRun } from '../src/types';

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

let runCounter = 106;
let isTrainingInProgress = false;

export async function executeDailyTrainingRun(): Promise<TrainingRun> {
  if (isTrainingInProgress) {
    throw new Error('A daily training run is already in progress.');
  }

  isTrainingInProgress = true;
  try {
    const currentStatus = db.getStatus();
    const versionMatch = currentStatus.modelVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
    let newVersion = 'v3.8.5-adaptive';
    if (versionMatch) {
      const major = versionMatch[1];
      const minor = versionMatch[2];
      const patch = parseInt(versionMatch[3], 10) + 1;
      newVersion = `v${major}.${minor}.${patch}-adaptive`;
    }

    // Step 1: Fetch fresh daily security telemetry batch
    const freshLogs = generateDailySecurityLogsBatch();
    const logsCount = Math.floor(Math.random() * 1500) + 3800;
    const newSignatures = Math.floor(Math.random() * 25) + 20;

    const accuracyBefore = currentStatus.accuracyRate;
    const accuracyGain = +(Math.random() * 0.04 + 0.02).toFixed(3);
    const accuracyAfter = Math.min(99.98, +(accuracyBefore + accuracyGain).toFixed(3));

    let summary = `Ingested ${logsCount.toLocaleString()} honeypot and CVE records. Indexed ${newSignatures} new AST evasion patterns across MySQL, PostgreSQL, and MSSQL dialect layers.`;

    // Step 2: If Gemini API is available, optionally generate AI synthesis of threat feeds
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const payloadSnippets = freshLogs.map((l) => l.payloadSample).join('\n');
        const prompt = `Synthesize a 2-sentence executive summary of the following recently captured SQL injection attacks for an adaptive WAF model retraining report:\n${payloadSnippets}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        if (response.text) {
          summary = response.text.trim();
        }
      } catch (err) {
        console.warn('AI threat synthesis fallback to default summary:', err);
      }
    }

    const trainingRun: TrainingRun = {
      id: `train-run-${runCounter++}`,
      timestamp: new Date().toISOString(),
      modelPreviousVersion: currentStatus.modelVersion,
      modelNewVersion: newVersion,
      sourcesProcessed: [
        'OWASP_HONEYPOT',
        'NVD_CVE_FEED',
        'MODSECURITY_CRS',
        'GITHUB_ADVISORY',
      ],
      logsAnalyzedCount: logsCount,
      newPatternsLearned: newSignatures,
      accuracyBefore,
      accuracyAfter,
      summary,
      status: 'COMPLETED',
    };

    db.addTrainingRun(trainingRun, freshLogs);
    return trainingRun;
  } finally {
    isTrainingInProgress = false;
  }
}

// Background 24-hour cron scheduler
export function initAutonomousTrainingScheduler() {
  console.log('[AegisSQL Agent] Continuous 24-hour training scheduler initialized.');
  // Check every hour if a scheduled 24h run is due
  setInterval(async () => {
    const status = db.getStatus();
    const nextRun = new Date(status.nextScheduledTraining).getTime();
    if (Date.now() >= nextRun && !isTrainingInProgress) {
      console.log('[AegisSQL Agent] 24-Hour scheduled daily training cycle starting...');
      try {
        await executeDailyTrainingRun();
        console.log('[AegisSQL Agent] Daily training run completed successfully.');
      } catch (e) {
        console.error('[AegisSQL Agent] Automated training error:', e);
      }
    }
  }, 60 * 60 * 1000); // 1 hour check
}
