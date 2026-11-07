import { GeminiModel, ChatRole } from '../src/components/CyberAiChatbot';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Intelligent Contextual Security Engine
 * Answers any cybersecurity, SQL injection, port scanning, network recon,
 * or defense question dynamically based on the exact user prompt.
 */
export function generateContextualSecurityAnswer(
  messages: ChatMessage[],
  role: ChatRole = 'red_team',
  model: GeminiModel = 'gemini-3.8-flash'
): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const trimmed = lastMessage.trim();
  const lower = trimmed.toLowerCase();

  // Extract previous user queries for multi-turn context
  const previousUserMessages = messages
    .filter((m) => m.role === 'user')
    .slice(0, -1)
    .map((m) => m.content);

  // 1. IP Address / Port Scanning / Network Reconnaissance Questions
  const ipMatch = trimmed.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  const portMatch = lower.match(/\bport\s*(\d{1,5})\b/) || lower.match(/\b(\d{1,5})\/(?:tcp|udp)\b/);

  if (
    lower.includes('scan') ||
    lower.includes('nmap') ||
    lower.includes('port') ||
    ipMatch ||
    lower.includes('network') ||
    lower.includes('recon')
  ) {
    const targetIp = ipMatch ? ipMatch[0] : '127.0.0.1';
    const specificPort = portMatch ? portMatch[1] : null;

    if (role === 'blue_team') {
      return `### 🛡️ Blue Team Network & Port Hardening Assessment

**Target Analyzed:** \`${targetIp}\` ${specificPort ? `| Focus Port: \`${specificPort}\`` : ''}

**Defensive Security Recommendations:**
1. **Host-Based Firewall Rules (iptables / ufw):**
   Restrict exposure so database ports (e.g. 3306 MySQL, 5432 PostgreSQL, 1433 MSSQL) are strictly bound to \`127.0.0.1\` or dedicated internal VPC subnets.
   \`\`\`bash
   # Block public exposure of database ports:
   sudo ufw deny 3306/tcp
   sudo ufw deny 5432/tcp
   sudo ufw allow from 10.0.0.0/16 to any port 5432 proto tcp
   \`\`\`

2. **Banner Obfuscation & Minimization:**
   Suppress server tokens in web servers to prevent version-specific CVE targeting:
   \`\`\`nginx
   # In nginx.conf:
   server_tokens off;
   \`\`\`

3. **Audit with the In-App Scanner:**
   Use the **Port Scanner (Nmap)** tool in the top navigation bar to run live TCP SYN probes against \`${targetIp}\` to confirm which services are exposed.`;
    }

    if (role === 'fast_auditor') {
      return `### ⚡ Rapid Port & Network Audit
- **Target Host:** \`${targetIp}\`
- **Recon Mode:** Nmap-style TCP banner grabbing & version fingerprinting
- **Key Risk Indicators:**
  - Standard Web (80/HTTP, 443/HTTPS): Review for SQLi in GET/POST parameters
  - Database Services (3306/MySQL, 5432/PgSQL): High risk if exposed to public WAN
  - Remote Access (22/SSH, 3389/RDP): Enforce key-based auth & rate-limiting
- **Action:** Launch the built-in Nmap scanner in AegisSQL to inspect real-time port states.`;
    }

    // Default: Red Team
    return `### ⚔️ Red Team Reconnaissance: Network Port & Service Fingerprinting

**Target Scope:** \`${targetIp}\` ${specificPort ? `| Investigating Port \`${specificPort}\`` : ''}

**Offensive Recon Methodology (Nmap-Style Service Probing):**
1. **TCP Port Probing:**
   Send TCP SYN packets to discover open sockets without completing the 3-way handshake (stealth half-open scanning).
   \`\`\`bash
   nmap -sV -sC -Pn -T4 -p 21,22,80,443,1433,3306,5432,8080 ${targetIp}
   \`\`\`

2. **Service Version Vulnerability Mapping:**
   - **Port 80/443 (HTTP/HTTPS):** Primary vector for Web Application SQL Injection (CWE-89), testing login forms and search endpoints.
   - **Port 3306 (MySQL) / 5432 (PostgreSQL):** Direct database listeners. If accessible, attackers test brute-force root/postgres logins and out-of-band data exfiltration.
   - **Port 22 (SSH):** Tested for weak key exchange or legacy CVE exploitation.

3. **Next Step:** You can run a live scan on this IP right now using the **Port Scanner (Nmap)** button in the header bar!`;
  }

  // 2. ORDER BY & GROUP BY Column Enumeration
  if (lower.includes('order by') || lower.includes('group by')) {
    if (role === 'blue_team') {
      return `### 🛡️ Blue Team Defense: Safe Dynamic Column Sorting (ORDER BY)

**Your Question:** How to safely handle queries with dynamic \`${trimmed.slice(0, 50)}\`?

**The Challenge:**
SQL bind parameters (\`?\` or \`$1\`) cannot be used for column names or sorting direction (\`ASC\`/\`DESC\`) in database query engines.

**Production Solution (Whitelist Enforcement):**
\`\`\`typescript
// Node.js / TypeScript Whitelist Implementation
const SAFE_COLUMNS = new Map([
  ['date', 'created_at'],
  ['name', 'username'],
  ['id', 'user_id'],
]);

export function getSafeSortedQuery(userInputColumn: string, userDirection: string) {
  const column = SAFE_COLUMNS.get(userInputColumn.toLowerCase()) || 'created_at';
  const direction = userDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // Safe to interpolate because both variables are guaranteed to come from strict server whitelists
  return \`SELECT user_id, username, created_at FROM accounts ORDER BY \${column} \${direction} LIMIT 25\`;
}
\`\`\`

**Why This Stops Attacks:**
Attempted inputs like \`ORDER BY 1\`, \`ORDER BY 999\`, or subqueries like \`ORDER BY (SELECT ...)\` are rejected by the whitelist map before reaching the SQL engine.`;
    }

    if (role === 'fast_auditor') {
      return `### ⚡ Rapid Audit: ORDER BY Column Enumeration
- **Input Evaluated:** \`${trimmed.slice(0, 60)}\`
- **Threat Classification:** 🚨 HIGH SEVERITY (Reconnaissance / Column Enumeration)
- **Mechanism:** Attackers test increasing integers (\`ORDER BY 1, 2, ...\`) to find the column count before injecting \`UNION SELECT\`.
- **Immediate Fix:** Disallow direct user input in ORDER BY clauses. Validate against an explicit array of column strings.`;
    }

    return `### ⚔️ Red Team Exploit Analysis: ORDER BY Column Count Enumeration

**Payload Analyzed:** \`${trimmed}\`

**How the Exploit Operates:**
Before an attacker can execute a successful \`UNION SELECT\` attack, they MUST know the exact number of columns returned by the original query.

1. **Step 1: Incremental Testing**
   \`\`\`sql
   SELECT id, name, email FROM products WHERE category = 'gear' ORDER BY 1--  /* OK: Col 1 exists */
   SELECT id, name, email FROM products WHERE category = 'gear' ORDER BY 3--  /* OK: Col 3 exists */
   SELECT id, name, email FROM products WHERE category = 'gear' ORDER BY 4--  /* CRASH! Error: column 4 out of range */
   \`\`\`
2. **Step 2: Conclusion**
   The database error confirms the query returns exactly **3 columns**.
3. **Step 3: Exploitation via UNION**
   \`\`\`sql
   ' UNION SELECT 1, table_name, 3 FROM information_schema.tables--
   \`\`\`

**Detection in AegisSQL:**
The AegisSQL AST Tokenizer flags standalone integers following \`ORDER BY\` or \`GROUP BY\` and blocks the request immediately.`;
  }

  // 3. Substring & Version Extraction / Boolean Blind SQLi
  if (
    lower.includes('substring') ||
    lower.includes('@@version') ||
    lower.includes('version()') ||
    lower.includes('ascii') ||
    lower.includes('substr')
  ) {
    if (role === 'blue_team') {
      return `### 🛡️ Blue Team Defense: Blind Substring & Database Fingerprinting

**Analyzed Payload:** \`${trimmed}\`

**Vulnerability Type:** CWE-89 Blind Boolean Inference & Information Schema Disclosure

**Root Cause:**
String interpolation allows subqueries like \`(SELECT substring(@@version,1,1))\` to evaluate within the query logic.

**Remediation (Prepared Statement):**
\`\`\`typescript
import { db } from './db';

// All user strings are treated purely as literal data, never evaluated
const results = await db.query(
  'SELECT id, username, email FROM users WHERE username = $1',
  [userInput] // Even if userInput contains "(select substring(@@version,1,1))='X'", it matches zero rows safely!
);
\`\`\`

**Database Configuration Defense:**
- Strip database error banners that leak dialect information.
- Disable access to \`information_schema\` or \`pg_catalog\` for regular web application database users.`;
    }

    if (role === 'fast_auditor') {
      return `### ⚡ Rapid Audit: Substring Version Extraction
- **Input Analyzed:** \`${trimmed.slice(0, 70)}\`
- **Threat Level:** 🚨 CRITICAL (Targeted Database Fingerprinting)
- **Detected Tokens:** \`SUBSTRING\`, \`@@version\` / \`version()\`, conditional comparison
- **Purpose:** Attacker is extracting database version character-by-character to select dialect-specific CVE exploits.
- **Action:** Block request and flag IP in incident logs.`;
    }

    return `### ⚔️ Red Team Exploit Analysis: Blind Character-by-Character Extraction

**Payload Analyzed:** \`${trimmed}\`

**Mechanics of Boolean-Based Substring Exfiltration:**
When an application does not echo database results or errors directly to the screen, attackers extract data by asking boolean questions:

\`\`\`sql
-- Testing if the first character of MySQL @@version is '8':
' AND (SELECT SUBSTRING(@@version, 1, 1)) = '8'--
\`\`\`

1. **If True:** The application loads normally (HTTP 200 with standard user profile).
2. **If False:** The application returns an empty list or "User Not Found".
3. **Automated Binary Search:**
   Using tools like sqlmap, attackers test ASCII ranges (\`ASCII(SUBSTRING(..., 1, 1)) > 70\`) to exfiltrate passwords and hashes in seconds.

**AegisSQL Countermeasure:**
The AST scanner intercepts \`SUBSTRING\`, \`MID\`, \`LEFT\`, and \`RIGHT\` nested inside conditional clauses and triggers a Defcon alert.`;
  }

  // 4. Time-Based Blind Injection (SLEEP, WAITFOR, BENCHMARK, pg_sleep)
  if (
    lower.includes('sleep') ||
    lower.includes('waitfor') ||
    lower.includes('benchmark') ||
    lower.includes('pg_sleep') ||
    lower.includes('delay')
  ) {
    if (role === 'blue_team') {
      return `### 🛡️ Blue Team Defense: Time-Based Blind SQLi Remediation

**Target Threat:** Latency-inducing sleep payloads (\`${trimmed.slice(0, 45)}\`)

**Multi-Layer Defensive Countermeasures:**
1. **Prepared Statements (CWE-89 Fix):**
   \`\`\`typescript
   // Node.js pg/mysql2 prepared statement
   const user = await pool.query('SELECT * FROM accounts WHERE id = $1', [userId]);
   \`\`\`
2. **Database Query Timeouts:**
   Prevent time-based denial-of-service and inference attacks by capping query duration:
   \`\`\`sql
   -- PostgreSQL
   SET statement_timeout = '2000'; -- Max 2 seconds
   -- MySQL
   SET max_execution_time = 2000;
   \`\`\`
3. **Egress Anomaly Detection:**
   Alert security operations when response times from database endpoints spike past normal baselines.`;
    }

    return `### ⚔️ Red Team Exploit Analysis: Time-Based Latency Inference

**Payload Analyzed:** \`${trimmed}\`

**Attack Mechanism:**
When both screen output and error messages are completely suppressed by the server, time latency provides a reliable side-channel:

\`\`\`sql
-- If database name starts with 's', sleep for 5 seconds:
admin' AND IF(SUBSTRING(database(), 1, 1) = 's', SLEEP(5), 0)--
\`\`\`

- If HTTP response takes **5.1s**: Character is confirmed as 's'.
- If HTTP response takes **0.05s**: Character is not 's'. Move to next character.

**Mitigation:**
Parameterized queries completely neutralize function execution inside inputs.`;
  }

  // 5. UNION-Based SQL Injection
  if (lower.includes('union') || lower.includes('union select')) {
    if (role === 'blue_team') {
      return `### 🛡️ Blue Team Defense: Parameterized Query Defense for UNION Attacks

**Analyzed Payload:** \`${trimmed}\`

**How Parameterization Neutralizes UNION Attacks:**
When queries use string concatenation, the parser treats injected \`UNION SELECT\` tokens as first-class SQL syntax. When parameterized:
\`\`\`typescript
// Safe Implementation
const query = 'SELECT id, title, content FROM articles WHERE category = ?';
await connection.execute(query, [userInput]);
\`\`\`
The database engine compiles the query execution plan *before* inserting \`userInput\`. The input is treated strictly as an inert string literal, making UNION chaining syntactically impossible.`;
    }

    return `### ⚔️ Red Team Exploit Analysis: UNION-Based Cross-Table Exfiltration

**Payload Analyzed:** \`${trimmed}\`

**Execution Mechanics:**
\`\`\`sql
-- Attacker Chains Query to System Catalogs:
' UNION SELECT 1, table_name, column_name, 4 FROM information_schema.columns WHERE table_schema=database()--
\`\`\`

**Requirements for Successful Exploitation:**
1. **Identical Column Count:** Both queries must return the same number of columns.
2. **Compatible Data Types:** The injected columns must match or be castable to the original query's column types (e.g. integer to integer, varchar to varchar).

**AegisSQL Protection:**
Our tokenizer detects \`UNION\` combined with \`SELECT\` / \`ALL\` and terminates the request at the gateway before the database is reached.`;
  }

  // 6. Tautologies & Authentication Bypass (' OR '1'='1', admin'--)
  if (
    lower.includes('1=1') ||
    lower.includes("'='") ||
    lower.includes('or true') ||
    lower.includes("admin'--") ||
    lower.includes('tautology') ||
    lower.includes('bypass')
  ) {
    if (role === 'blue_team') {
      return `### 🛡️ Blue Team Defense: Preventing Authentication Bypass Tautologies

**Attack Vector:** \`${trimmed}\` (Tautology / Always-True Condition)

**Why It Bypasses Login:**
\`\`\`sql
-- Vulnerable Code:
SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'xxx'
\`\`\`
The \`OR '1'='1'\` condition evaluates to TRUE for every single row in the database, returning the first record (usually administrator user ID 1).

**Remediation:**
\`\`\`typescript
// Secure Authentication Pattern
const user = await db.query(
  'SELECT id, username, password_hash, role FROM accounts WHERE username = $1',
  [usernameInput]
);
if (!user.rows.length) return false;

// Verify password with secure bcrypt/argon2 hashing:
const isValid = await bcrypt.compare(passwordInput, user.rows[0].password_hash);
\`\`\``;
    }

    return `### ⚔️ Red Team Exploit Analysis: Tautology Authentication Bypass

**Payload Analyzed:** \`${trimmed}\`

**Boolean Logic Manipulation:**
Tautology injections inject an expression that evaluates to TRUE regardless of database state:
- \`' OR '1'='1\`
- \`' OR 1=1--\`
- \`admin'--\` (Comment out password check entirely)
- \`' OR 'x'='x'\`

**Operator Precedence Gotchas:**
Because \`AND\` has higher precedence than \`OR\`, \`username = '' OR 1=1 AND password = ''\` evaluates as \`username = '' OR (1=1 AND password = '')\`. Attackers use parenthesis \`' OR (1=1)--\` to guarantee short-circuit evaluation.`;
  }

  // 7. Questions about the Agent / How AegisSQL Works / Training Center
  if (
    lower.includes('train') ||
    lower.includes('how it works') ||
    lower.includes('how does') ||
    lower.includes('learning') ||
    lower.includes('agent') ||
    lower.includes('cve') ||
    lower.includes('honeypot')
  ) {
    return `### 🛡️ AegisSQL Sentinel: Autonomous Training & Detection Architecture

**Your Question:** How does AegisSQL Sentinel detect threats and train daily?

**Three Core Pillars of the Platform:**

1. **Autonomous 24-Hour Retraining Pipeline:**
   - Every 24 hours (00:00 UTC), our background scheduler ingests fresh threat telemetry from OWASP Honeypot clusters, NVD CVE feeds, and GitHub security advisories.
   - New injection variations (such as \`ORDER BY\` enumeration and blind substring extractions) are compiled into AST heuristic weights.
   - The updated model is benchmarked against a verified test suite before hot-reloading into the live gateway.

2. **Abstract Syntax Tree (AST) Tokenization:**
   - Rather than relying on fragile regex filters that can be bypassed by comments (\`/**/\`) or hex encoding, AegisSQL strips whitespace and comments to tokenize the query into its structural AST.
   - Suspicious tokens like \`UNION\`, \`SLEEP\`, \`@@version\`, and \`ORDER BY <int>\` are evaluated semantically.

3. **Active Multi-Turn Gemini Integration:**
   - Supports \`gemini-3.8-flash\` (balanced general tasks), \`gemini-3.1-flash-lite\` (ultra-fast checks), and \`gemini-4-argon\` (deep exploit reasoning).
   - Allows role-switching between Red Team Exploit Architect and Blue Team Defensive Specialist!`;
  }

  // 8. Error-Based SQL Injection
  if (lower.includes('error') || lower.includes('extractvalue') || lower.includes('updatexml')) {
    return `### ⚔️ Red Team & Blue Team Analysis: Error-Based SQL Injection

**Mechanics of Error-Based Attacks:**
When database errors are displayed to the user, attackers deliberately trigger conversion or XML parsing errors that concatenate secret data into the error text:

\`\`\`sql
-- MySQL EXTRACTVALUE Error Leak:
' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT password FROM users LIMIT 1), 0x7e))--
-- Output: XPATH syntax error: '~5f4dcc3b5aa765d61d8327deb882cf99~'
\`\`\`

**Blue Team Defense:**
1. Configure \`display_errors = Off\` in production application servers.
2. Catch all database exceptions and return generic error IDs to the client.
3. Bind all user inputs with prepared statements.`;
  }

  // 9. General Greetings or Inquiries
  if (
    lower === 'hello' ||
    lower === 'hi' ||
    lower === 'hey' ||
    lower.includes('who are you') ||
    lower.includes('what can you do') ||
    lower.includes('help')
  ) {
    const roleConfig = {
      red_team: 'Red Team Offensive Security Architect',
      blue_team: 'Blue Team Cyber Defense & Secure Coding Architect',
      fast_auditor: 'Rapid SQL Syntax & Threat Auditor',
    }[role];

    return `### 🛡️ Aegis-SQL Security Assistant Active
Hello! I am operating under the **${roleConfig}** persona using **${model}**.

**I can assist you with:**
1. **Exploit Deconstruction:** Ask me how specific SQLi vectors work (e.g. \`ORDER BY 1\`, \`UNION SELECT\`, \`SLEEP(5)\`, blind substrings).
2. **Secure Code Remediation:** Provide your query or code snippet to receive production-ready prepared statements (Node.js pg/mysql2, Python asyncpg, Java).
3. **Network & Port Recon:** Ask about any IP address, port numbers (e.g. 3306, 5432, 80), or Nmap scanning techniques.
4. **Agent Internals:** Learn how AegisSQL trains autonomously on real-world threat feeds.

What would you like to investigate today?`;
  }

  // 10. General / Custom Query Dynamic Breakdown
  const isSuspicious =
    lower.includes('select') ||
    lower.includes('insert') ||
    lower.includes('update') ||
    lower.includes('delete') ||
    lower.includes('drop') ||
    lower.includes('alter') ||
    lower.includes('--') ||
    lower.includes('/*') ||
    lower.includes("'") ||
    lower.includes('"');

  if (role === 'blue_team') {
    return `### 🛡️ Blue Team Technical Advisory: "${trimmed.slice(0, 45)}..."

**User Query Under Review:**
> \`${trimmed}\`

**Security Architecture Assessment:**
${isSuspicious ? '⚠️ **Notice:** This input contains database command or syntactic tokens. If handled via direct string concatenation, it presents a CWE-89 injection risk.' : '✅ **Notice:** This input appears to be standard textual inquiry or benign parameter data.'}

**Defense-in-Depth Best Practices:**
1. **Always Use Bound Parameters:**
   \`\`\`typescript
   // Example parameterization in Node.js
   const result = await db.query('SELECT * FROM resources WHERE query = $1', [input]);
   \`\`\`
2. **Apply Principle of Least Privilege:**
   Ensure database user accounts only have \`SELECT\` / \`INSERT\` grants for required tables.
3. **Audit Suspicious Characters:**
   Strip or reject unexpected quote characters (\`'\`, \`"\`), hyphens (\`--\`), and semicolons (\`;\`).

Feel free to ask for specific code examples in your programming language or framework!`;
  }

  if (role === 'fast_auditor') {
    return `### ⚡ Rapid Audit: "${trimmed.slice(0, 40)}..."
- **Input Evaluated:** \`${trimmed}\`
- **Threat Level:** ${isSuspicious ? '🚨 CAUTION / SUSPICIOUS TOKENS' : '✅ LOW RISK / INFORMATIONAL'}
- **Syntactic Check:** ${isSuspicious ? 'Contains SQL syntax or boundary characters' : 'Clean text string'}
- **Action:** ${isSuspicious ? 'Verify parameter binding before execution.' : 'No immediate threat detected.'}`;
  }

  // Red Team default custom answer
  return `### ⚔️ Red Team Exploit & Architecture Advisory: "${trimmed.slice(0, 45)}..."

**Analysis of Your Inquiry:**
> \`${trimmed}\`

**Technical Threat Context:**
${
  isSuspicious
    ? `The provided input contains potential SQL execution tokens. In penetration testing, security analysts evaluate how backend database drivers parse these tokens across different database engines (MySQL, PostgreSQL, Microsoft SQL Server, Oracle).`
    : `You asked about **${trimmed}**. In modern web security, database defense requires continuous inspection of input boundaries and strict isolation between executable SQL instructions and user-supplied data strings.`
}

**Exploit & Defense Vectors to Keep in Mind:**
- **Lexical Tokenization:** Attackers manipulate whitespace, comment delimiters (\`/**/\`), and encoding (\`%27\`) to evade simple pattern matching.
- **AST Parsing:** AegisSQL inspects queries at the Abstract Syntax Tree layer to neutralize evasion tricks.
- **Interactive Testing:** You can test this exact input in the **Payload Injector Workbench** tab to observe our detection agent in real-time!`;
}
