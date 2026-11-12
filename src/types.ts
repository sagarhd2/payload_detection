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
  precision?: number;
  recall?: number;
  f1Score?: number;
  fpr?: number;
  fnr?: number;
  durationMs?: number;
  validationResult?: 'PASSED' | 'FAILED' | 'SKIPPED_INSUFFICIENT_DATA';
  summary: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'ROLLED_BACK';
}

export interface ThreatFeedItem {
  id: string;
  cveId: string;
  source: string;
  timestamp: string;
  targetSoftware: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  payloadSample: string;
  description: string;
  defenseStatus: 'INGESTED_AND_TRAINED' | 'INGESTED' | 'PENDING' | 'PROTECTED';
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
  previousModelVersion?: string;
  lastTrainedTime: string;
  nextScheduledTraining: string;
  trainingCronInterval: string;
  activeSignaturesCount: number;
  totalPayloadsScreened: number;
  totalThreatsBlocked: number;
  accuracyRate: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  falsePositiveRate: number;
  falseNegativeRate?: number;
  geminiAiEnabled: boolean;
  learningMode: 'CONTINUOUS_AUTONOMOUS';
  threatIntelTotal?: number;
  threatIntelSqli?: number;
  activeSourcesCount?: number;
}

export interface SourceSyncRecord {
  id: string;
  source_name: string;
  sync_start: string;
  sync_end: string;
  status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' | 'PARTIAL';
  records_fetched: number;
  new_records_added: number;
  duplicates_skipped: number;
  error_message: string | null;
}

export interface DetectionRule {
  id: string;
  rule_name: string;
  category: string;
  pattern_type: string;
  rule_definition: string;
  severity: string;
  weight: number;
  is_active: number;
  updated_at: string;
  source_origin: string;
}

export interface ModelVersionInfo {
  version: string;
  trained_at: string;
  dataset_version: string;
  algorithm: string;
  weights_json: string;
  is_active: number;
  is_rollback_candidate: number;
  created_at: string;
}

export interface ModelComparisonData {
  activeModel: ModelVersionInfo;
  previousModel: ModelVersionInfo | null;
  allVersions: ModelVersionInfo[];
  latestEvaluations: Array<{
    id: string;
    model_version: string;
    evaluated_at: string;
    validation_dataset_version: string;
    total_validation_samples: number;
    true_positives: number;
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    precision: number;
    recall: number;
    f1_score: number;
    decision: string;
  }>;
}
