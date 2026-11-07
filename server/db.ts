import { IncidentLog, TrainingRun, ThreatFeedItem, AgentStatus } from '../src/types';
import { INITIAL_REAL_WORLD_FEEDS } from './threatFeed';

class AgentDatabase {
  private status: AgentStatus = {
    online: true,
    agentName: 'AegisSQL Sentinel v3.8.5',
    modelVersion: 'v3.8.5-adaptive',
    lastTrainedTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    nextScheduledTraining: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    trainingCronInterval: 'Every 24 Hours (00:00 UTC)',
    activeSignaturesCount: 2600,
    totalPayloadsScreened: 15420,
    totalThreatsBlocked: 448,
    accuracyRate: 99.89,
    falsePositiveRate: 0.015,
    geminiAiEnabled: Boolean(process.env.GEMINI_API_KEY),
    learningMode: 'CONTINUOUS_AUTONOMOUS',
  };

  private trainingHistory: TrainingRun[] = [
    {
      id: 'train-run-104',
      timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
      modelPreviousVersion: 'v3.8.2-adaptive',
      modelNewVersion: 'v3.8.3-adaptive',
      sourcesProcessed: ['OWASP_HONEYPOT', 'MODSECURITY_CRS'],
      logsAnalyzedCount: 4210,
      newPatternsLearned: 38,
      accuracyBefore: 99.65,
      accuracyAfter: 99.78,
      summary: 'Ingested 4,210 raw honeypot probes. Synthesized 38 new heuristic AST tokenizers for inline comment evasion.',
      status: 'COMPLETED'
    },
    {
      id: 'train-run-105',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      modelPreviousVersion: 'v3.8.3-adaptive',
      modelNewVersion: 'v3.8.4-adaptive',
      sourcesProcessed: ['OWASP_HONEYPOT', 'NVD_CVE_FEED', 'GITHUB_ADVISORY'],
      logsAnalyzedCount: 5180,
      newPatternsLearned: 46,
      accuracyBefore: 99.78,
      accuracyAfter: 99.82,
      summary: 'Processed daily CVE feeds and GitHub security advisories. Hardened detection against nested sleep injections and JSON query tampering.',
      status: 'COMPLETED'
    },
    {
      id: 'train-run-106',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      modelPreviousVersion: 'v3.8.4-adaptive',
      modelNewVersion: 'v3.8.5-adaptive',
      sourcesProcessed: ['OWASP_HONEYPOT', 'NVD_CVE_FEED', 'MODSECURITY_CRS'],
      logsAnalyzedCount: 6340,
      newPatternsLearned: 52,
      accuracyBefore: 99.82,
      accuracyAfter: 99.89,
      summary: 'Trained model on ORDER BY column enumeration vectors and Boolean-based blind subquery extraction (@@version, substring). Synthesized 52 new AST tokenizers.',
      status: 'COMPLETED'
    }
  ];

  private incidentLogs: IncidentLog[] = [
    {
      id: 'inc-902',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      ipAddress: '198.51.100.44',
      usernameAttempted: "admin' OR '1'='1'--",
      passwordAttemptedSnippet: '••••••••',
      threatType: 'Tautology Authentication Bypass',
      severity: 'CRITICAL',
      actionTaken: 'BLOCKED_AND_ALERTED',
      tokensFlagged: ["' OR '1'='1'", "--"]
    },
    {
      id: 'inc-901',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      ipAddress: '203.0.113.19',
      usernameAttempted: "'; DROP TABLE credentials;--",
      passwordAttemptedSnippet: '••••••••',
      threatType: 'Piggybacked Stacked Query Execution',
      severity: 'CRITICAL',
      actionTaken: 'BLOCKED_AND_ALERTED',
      tokensFlagged: ["; DROP TABLE", "--"]
    }
  ];

  private threatFeeds: ThreatFeedItem[] = [...INITIAL_REAL_WORLD_FEEDS];

  public getStatus(): AgentStatus {
    this.status.geminiAiEnabled = Boolean(process.env.GEMINI_API_KEY);
    return { ...this.status };
  }

  public getTrainingHistory(): TrainingRun[] {
    return [...this.trainingHistory];
  }

  public getIncidentLogs(): IncidentLog[] {
    return [...this.incidentLogs];
  }

  public getThreatFeeds(): ThreatFeedItem[] {
    return [...this.threatFeeds];
  }

  public addIncident(incident: IncidentLog): void {
    this.incidentLogs.unshift(incident);
    this.status.totalThreatsBlocked += 1;
    this.status.totalPayloadsScreened += 1;
  }

  public recordSafeCheck(): void {
    this.status.totalPayloadsScreened += 1;
  }

  public addTrainingRun(run: TrainingRun, newFeeds: ThreatFeedItem[]): void {
    this.trainingHistory.unshift(run);
    this.threatFeeds = [...newFeeds, ...this.threatFeeds].slice(0, 50);
    
    // Update model status
    this.status.modelVersion = run.modelNewVersion;
    this.status.lastTrainedTime = run.timestamp;
    this.status.nextScheduledTraining = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    this.status.activeSignaturesCount += run.newPatternsLearned;
    this.status.accuracyRate = run.accuracyAfter;
    this.status.falsePositiveRate = Math.max(0.01, +(this.status.falsePositiveRate * 0.95).toFixed(3));
  }

  public clearLogs(): void {
    this.incidentLogs = [];
  }
}

export const db = new AgentDatabase();
