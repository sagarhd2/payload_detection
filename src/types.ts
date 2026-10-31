export interface SQLiWarning {
  blocked: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatType: string;
  confidence: number; // 0 - 100
  explanation: string;
  detectedTokens: string[];
  attackVector: string;
  recommendedRemediation: string;
  targetField: 'username' | 'password' | 'both' | 'query';
  rawPayload: string;
  timestamp: string;
  cveReference?: string;
  analysisMode: 'GEMINI_AI_AGENT' | 'HEURISTIC_AST_WAF' | 'HYBRID';
}

export interface LoginResult {
  success: boolean;
  message: string;
  user?: {
    username: string;
    role: string;
    lastLogin: string;
  };
  warning?: SQLiWarning;
}

export interface TrainingRun {
  id: string;
  timestamp: string;
  modelPreviousVersion: string;
  modelNewVersion: string;
  sourcesProcessed: string[];
  logsAnalyzedCount: number;
  newPatternsLearned: number;
  accuracyBefore: number;
  accuracyAfter: number;
  summary: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

export interface ThreatFeedItem {
  id: string;
  cveId: string;
  source: 'OWASP_HONEYPOT' | 'NVD_CVE_FEED' | 'MODSECURITY_CRS' | 'GITHUB_ADVISORY' | 'GLOBAL_SENSOR_NETWORK';
  timestamp: string;
  targetSoftware: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  payloadSample: string;
  description: string;
  defenseStatus: 'INGESTED_AND_TRAINED' | 'PENDING' | 'PROTECTED';
}

export interface IncidentLog {
  id: string;
  timestamp: string;
  ipAddress: string;
  usernameAttempted: string;
  passwordAttemptedSnippet: string;
  threatType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionTaken: 'BLOCKED_AND_ALERTED' | 'MONITORED';
  tokensFlagged: string[];
}

export interface AgentStatus {
  online: boolean;
  agentName: string;
  modelVersion: string;
  lastTrainedTime: string;
  nextScheduledTraining: string;
  trainingCronInterval: string;
  activeSignaturesCount: number;
  totalPayloadsScreened: number;
  totalThreatsBlocked: number;
  accuracyRate: number; // e.g. 99.8
  falsePositiveRate: number; // e.g. 0.02
  geminiAiEnabled: boolean;
  learningMode: 'CONTINUOUS_AUTONOMOUS';
}
