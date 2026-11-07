import { ThreatFeedItem } from '../src/types';

export const INITIAL_REAL_WORLD_FEEDS: ThreatFeedItem[] = [
  {
    id: 'tf-2026-1051',
    cveId: 'CVE-2025-41288',
    source: 'OWASP_HONEYPOT',
    timestamp: '2026-11-06T18:12:00Z',
    targetSoftware: 'SaaS IAM Authentication Gateway',
    severity: 'HIGH',
    payloadSample: "admin' ORDER BY 1--",
    description: 'Column enumeration probe using ORDER BY 1..n to map backend query layout prior to UNION projection.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1050',
    cveId: 'CVE-2025-39902',
    source: 'NVD_CVE_FEED',
    timestamp: '2026-11-05T22:30:15Z',
    targetSoftware: 'Enterprise Financial Portal',
    severity: 'CRITICAL',
    payloadSample: "and (select substring(@@version,1,1))='X'",
    description: 'Boolean-based blind inference exfiltrating database system version byte-by-byte using substring and @@version.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1049',
    cveId: 'CVE-2025-34912',
    source: 'OWASP_HONEYPOT',
    timestamp: '2026-10-31T06:14:22Z',
    targetSoftware: 'E-Commerce Auth Module v4.2',
    severity: 'CRITICAL',
    payloadSample: "admin' OR 1=1 UNION SELECT null, concat(user,0x3a,pass) FROM mysql.user-- -",
    description: 'Automated mass-scanner probing authentication bypass with MySQL dialect comments and hex delimiter.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1048',
    cveId: 'CVE-2025-28103',
    source: 'NVD_CVE_FEED',
    timestamp: '2026-10-30T19:40:10Z',
    targetSoftware: 'Enterprise ERP Login Gateway',
    severity: 'CRITICAL',
    payloadSample: "') OR ('a'='a' AND (SELECT 9982 FROM (SELECT(SLEEP(4)))QoKq))--",
    description: 'Time-based blind SQL injection in password reset and nested parentheses auth parameter.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1047',
    cveId: 'CVE-2025-19401',
    source: 'MODSECURITY_CRS',
    timestamp: '2026-10-30T12:05:00Z',
    targetSoftware: 'CRM Lead Portal',
    severity: 'HIGH',
    payloadSample: "admin'/**/OR/**/1=1#",
    description: 'Inline C-style comment evasion to bypass basic space-splitting regex filters in Web Application Firewalls.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1046',
    cveId: 'CVE-2025-11099',
    source: 'GITHUB_ADVISORY',
    timestamp: '2026-10-29T21:18:45Z',
    targetSoftware: 'Node.js Dynamic Query Builder',
    severity: 'CRITICAL',
    payloadSample: "1'; DROP TABLE session_tokens; --",
    description: 'Stacked query execution through multiple statement execution in misconfigured driver connections.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1045',
    cveId: 'CVE-2024-52309',
    source: 'GLOBAL_SENSOR_NETWORK',
    timestamp: '2026-10-29T08:50:12Z',
    targetSoftware: 'Cloud Microservices Auth Broker',
    severity: 'HIGH',
    payloadSample: "' OR 'x'='x' /*!50000ORDER BY*/ 10--",
    description: 'MySQL conditional version comment injection attempting column count enumeration in login form.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  },
  {
    id: 'tf-2026-1044',
    cveId: 'CVE-2024-49021',
    source: 'OWASP_HONEYPOT',
    timestamp: '2026-10-28T14:32:00Z',
    targetSoftware: 'SaaS Multi-tenant SSO',
    severity: 'CRITICAL',
    payloadSample: "admin' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT @@version), 0x7e))--",
    description: 'Error-based XPath injection for instant data extraction without blind delay overhead.',
    defenseStatus: 'INGESTED_AND_TRAINED'
  }
];

export function generateDailySecurityLogsBatch(dayOffset = 0): ThreatFeedItem[] {
  const now = new Date();
  now.setDate(now.getDate() - dayOffset);
  const timeStr = now.toISOString();
  const batchId = Math.floor(Math.random() * 9000) + 1000;

  const samples = [
    {
      cve: `CVE-2026-0${batchId}`,
      source: 'OWASP_HONEYPOT' as const,
      target: 'FastAPI Microservice Auth',
      severity: 'CRITICAL' as const,
      payload: `admin' OR 1=1; EXEC xp_cmdshell('ping 10.0.0.1')--`,
      desc: 'MSSQL command execution probe combined with auth tautology.'
    },
    {
      cve: `CVE-2026-1${batchId}`,
      source: 'MODSECURITY_CRS' as const,
      target: 'Healthcare Patient Portal',
      severity: 'HIGH' as const,
      payload: `' OR (SELECT CASE WHEN (1=1) THEN pg_sleep(3) ELSE pg_sleep(0) END)--`,
      desc: 'PostgreSQL conditional delay blind SQL injection observed in login form parameter.'
    },
    {
      cve: `CVE-2026-2${batchId}`,
      source: 'NVD_CVE_FEED' as const,
      target: 'Banking Customer Portal',
      severity: 'CRITICAL' as const,
      payload: `' UNION ALL SELECT NULL,NULL,CONCAT_WS(CHAR(32),table_name,column_name) FROM information_schema.columns--`,
      desc: 'Cross-schema harvesting payload using CONCAT_WS and CHAR ASCII functions.'
    },
    {
      cve: `CVE-2026-3${batchId}`,
      source: 'GLOBAL_SENSOR_NETWORK' as const,
      target: 'University Student System',
      severity: 'MEDIUM' as const,
      payload: `admin'||(SELECT 'a' WHERE 1=1)||'`,
      desc: 'Oracle string concatenation tautology bypassing standard OR filters.'
    }
  ];

  return samples.map((s, idx) => ({
    id: `tf-stream-${Date.now()}-${idx}`,
    cveId: s.cve,
    source: s.source,
    timestamp: timeStr,
    targetSoftware: s.target,
    severity: s.severity,
    payloadSample: s.payload,
    description: s.desc,
    defenseStatus: 'INGESTED_AND_TRAINED'
  }));
}
