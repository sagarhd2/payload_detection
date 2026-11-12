import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { sqliteDb, RetrainingHistoryRecord } from './sqliteDb';
import { syncAllThreatSources, SyncSummary } from './threatIntelligenceCollector';
import { executeRetrainingPipeline } from './retrainingPipeline';

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

let isTrainingInProgress = false;

export async function executeAutonomousTrainingCycle(
  jobType: 'SCHEDULED_DAILY' | 'MANUAL' = 'MANUAL'
): Promise<{
  syncSummary: SyncSummary;
  retrainingResult: RetrainingHistoryRecord;
}> {
  if (isTrainingInProgress) {
    throw new Error('A daily training or threat sync cycle is already in progress.');
  }

  const acquired = sqliteDb.acquireSchedulerLock('daily_training_agent');
  if (!acquired) {
    throw new Error('Database scheduler lock held by active worker. Please wait for current cycle to conclude.');
  }

  isTrainingInProgress = true;
  try {
    console.log(`[AegisSQL Training Agent] Initiating ${jobType} cycle...`);

    // Step 1: Collect actual fresh cybersecurity intelligence from legitimate public feeds
    console.log('[AegisSQL Training Agent] 1/3 Ingesting from CISA KEV, GHSA, NVD, OWASP...');
    const syncSummary = await syncAllThreatSources();
    console.log(`[AegisSQL Training Agent] Ingested ${syncSummary.totalFetched} records, added ${syncSummary.totalNewAdded} new entries, skipped ${syncSummary.totalDuplicatesSkipped} duplicates.`);

    // Step 2: Separate model training from CVE descriptions. Train on verified labelled dataset.
    console.log('[AegisSQL Training Agent] 2/3 Executing genuine candidate model training & validation split evaluation...');
    const retrainingResult = await executeRetrainingPipeline(jobType);
    console.log(`[AegisSQL Training Agent] Model candidate evaluation: ${retrainingResult.validation_result}. Precision: ${retrainingResult.precision}, F1: ${retrainingResult.f1_score}.`);

    // Step 3: AI Threat Intelligence Executive Summary (if Gemini available)
    if (ai && process.env.GEMINI_API_KEY && syncSummary.totalNewAdded > 0) {
      try {
        const prompt = `Synthesize a concise 2-sentence executive briefing summarizing the newly synchronized cybersecurity intelligence (${syncSummary.totalNewAdded} records from CISA KEV and NIST) and model evaluation status (F1 Score: ${retrainingResult.f1_score}) for the SOC dashboard.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
        if (response.text) {
          retrainingResult.summary = `${retrainingResult.summary} AI SOC Briefing: ${response.text.trim()}`;
          // Update summary in SQLite
          sqliteDb['db'].prepare('UPDATE retraining_history SET summary = ? WHERE id = ?').run(retrainingResult.summary, retrainingResult.id);
        }
      } catch {
        // Safe AI summary skip
      }
    }

    console.log(`[AegisSQL Training Agent] ${jobType} cycle completed successfully.`);
    return { syncSummary, retrainingResult };
  } finally {
    sqliteDb.releaseSchedulerLock();
    isTrainingInProgress = false;
  }
}

// Background Autonomous Scheduler: Runs safely every 24 hours
export function initAutonomousTrainingScheduler() {
  console.log('[AegisSQL Agent] 24-Hour Autonomous Retraining Scheduler active.');

  // Run initial lightweight source sync on boot if database has few threat records
  setTimeout(async () => {
    try {
      const stats = sqliteDb.getThreatStats();
      if (stats.total < 10) {
        console.log('[AegisSQL Agent] Bootstrapping initial real-world threat feeds...');
        await syncAllThreatSources();
      }
    } catch (e) {
      console.warn('[AegisSQL Agent] Initial threat feed bootstrap notice:', e);
    }
  }, 3000);

  // Check every 30 minutes if 24 hours have elapsed since the last completed training run
  setInterval(async () => {
    if (isTrainingInProgress) return;

    try {
      const history = sqliteDb.getRetrainingHistory(1);
      const lastRun = history[0];
      const now = Date.now();
      const lastRunTime = lastRun ? new Date(lastRun.timestamp).getTime() : 0;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      if (now - lastRunTime >= twentyFourHoursMs) {
        console.log('[AegisSQL Agent] 24-hour interval elapsed. Triggering autonomous daily cycle...');
        await executeAutonomousTrainingCycle('SCHEDULED_DAILY');
      }
    } catch (err) {
      console.error('[AegisSQL Agent] Scheduler check error:', err);
    }
  }, 30 * 60 * 1000);
}
