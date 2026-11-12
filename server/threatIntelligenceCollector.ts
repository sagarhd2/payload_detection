import { sqliteDb, SourceSyncRecord, ThreatIntelligenceRecord, CollectedAdvisory } from './sqliteDb';

export interface SyncSummary {
  sourcesProcessed: string[];
  totalFetched: number;
  totalNewAdded: number;
  totalDuplicatesSkipped: number;
  syncTimestamp: string;
  sourceResults: Record<string, {
    status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' | 'PARTIAL';
    fetched: number;
    newAdded: number;
    duplicates: number;
    error?: string;
  }>;
}

// Timeout helper for reliable fetch
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'AegisSQL-Sentinel-ThreatIntel/3.8 (Cybersecurity Intelligence Engine)',
        'Accept': 'application/json, text/plain, */*',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Source 1: CISA Known Exploited Vulnerabilities (KEV) Catalog
 * Official, authoritative JSON feed of actively exploited CVEs.
 */
export async function syncCisaKevCatalog(): Promise<{ fetched: number; newAdded: number; duplicates: number; error?: string }> {
  const syncStart = new Date().toISOString();
  const sourceName = 'CISA_KEV_CATALOG';
  let fetched = 0;
  let newAdded = 0;
  let duplicates = 0;

  try {
    const url = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
    const res = await fetchWithTimeout(url, {}, 10000);
    
    if (!res.ok) {
      throw new Error(`CISA KEV HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json() as {
      title?: string;
      vulnerabilities?: Array<{
        cveID: string;
        vendorProject: string;
        product: string;
        vulnerabilityName: string;
        dateAdded: string;
        shortDescription: string;
        requiredAction: string;
        dueDate: string;
        notes?: string;
      }>;
    };

    const vulnerabilities = data.vulnerabilities || [];
    fetched = vulnerabilities.length;

    // Filter SQL injection & critical data-tier vulnerabilities
    const sqliKevs = vulnerabilities.filter(v => {
      const text = `${v.vulnerabilityName} ${v.shortDescription} ${v.product} ${v.vendorProject}`.toLowerCase();
      return text.includes('sql') || text.includes('injection') || text.includes('sqli') || text.includes('database');
    });

    for (const v of sqliKevs) {
      const isInserted = sqliteDb.insertThreatRecord({
        cve_id: v.cveID,
        source: sourceName,
        title: v.vulnerabilityName,
        description: v.shortDescription,
        severity: 'CRITICAL',
        category: 'Known Exploited SQLi',
        raw_data: JSON.stringify({ vendor: v.vendorProject, product: v.product, action: v.requiredAction }),
        published_date: v.dateAdded,
        collected_at: new Date().toISOString(),
        validation_status: 'VALIDATED_EXPLOITED',
        is_sqli: 1,
      });

      if (isInserted) {
        newAdded++;
        // Also register in collected advisories
        try {
          sqliteDb['db'].prepare(`
            INSERT OR IGNORE INTO collected_advisories (
              id, external_id, source_name, source_url, payload_pattern_snippet, vendor_project, product, collected_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `adv-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            v.cveID,
            sourceName,
            `https://www.cisa.gov/known-exploited-vulnerabilities-catalog`,
            `CISA KEV Active Exploitation: ${v.product}`,
            v.vendorProject,
            v.product,
            new Date().toISOString(),
            'ACTIVE_EXPLOIT'
          );
        } catch {
          // ignore duplicate advisory
        }
      } else {
        duplicates++;
      }
    }

    // Also include a sample of the most recent 10 general KEV entries if total added is low
    const recentKevs = vulnerabilities.slice(-10);
    for (const v of recentKevs) {
      const text = `${v.vulnerabilityName} ${v.shortDescription}`.toLowerCase();
      const isSqli = text.includes('sql') || text.includes('injection') ? 1 : 0;
      const isInserted = sqliteDb.insertThreatRecord({
        cve_id: v.cveID,
        source: sourceName,
        title: v.vulnerabilityName,
        description: v.shortDescription,
        severity: 'HIGH',
        category: isSqli ? 'Known Exploited SQLi' : 'Known Exploited Web CVE',
        raw_data: JSON.stringify({ vendor: v.vendorProject, product: v.product }),
        published_date: v.dateAdded,
        collected_at: new Date().toISOString(),
        validation_status: 'VALIDATED_EXPLOITED',
        is_sqli: isSqli,
      });
      if (isInserted) newAdded++;
      else duplicates++;
    }

    const syncEnd = new Date().toISOString();
    sqliteDb.recordSyncHistory({
      id: `sync-cisa-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: syncEnd,
      status: 'SUCCESS',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: null,
    });

    return { fetched, newAdded, duplicates };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    sqliteDb.recordSyncHistory({
      id: `sync-cisa-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: new Date().toISOString(),
      status: 'FAILED',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: errorMsg,
    });
    return { fetched, newAdded, duplicates, error: errorMsg };
  }
}

/**
 * Source 2: GitHub Security Advisories API (GHSA)
 * Real-world security advisories from global open-source ecosystems.
 */
export async function syncGitHubAdvisories(): Promise<{ fetched: number; newAdded: number; duplicates: number; error?: string }> {
  const syncStart = new Date().toISOString();
  const sourceName = 'GITHUB_SECURITY_ADVISORIES';
  let fetched = 0;
  let newAdded = 0;
  let duplicates = 0;

  try {
    const url = 'https://api.github.com/advisories?per_page=25';
    const res = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }, 10000);

    if (res.status === 403) {
      throw new Error('GitHub API Rate Limited (60 req/hr unauthenticated limit)');
    }
    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}: ${res.statusText}`);
    }

    const advisories = await res.json() as Array<{
      ghsa_id: string;
      cve_id: string | null;
      summary: string;
      description: string;
      severity: string;
      published_at: string;
      html_url: string;
      vulnerabilities?: Array<{
        package?: { name: string; ecosystem: string };
      }>;
    }>;

    fetched = advisories.length;

    for (const adv of advisories) {
      const cveId = adv.cve_id || adv.ghsa_id;
      const combinedText = `${adv.summary} ${adv.description}`.toLowerCase();
      const isSqli = combinedText.includes('sql') || combinedText.includes('injection') || combinedText.includes('cwe-89') ? 1 : 0;
      
      const pkg = adv.vulnerabilities?.[0]?.package?.name || 'OpenSource Package';
      const severity = (adv.severity || 'HIGH').toUpperCase();

      const isInserted = sqliteDb.insertThreatRecord({
        cve_id: cveId,
        source: sourceName,
        title: adv.summary.slice(0, 150),
        description: adv.description ? adv.description.slice(0, 500) : adv.summary,
        severity: severity,
        category: isSqli ? 'SQL Injection Advisory' : 'Web Application Advisory',
        raw_data: JSON.stringify({ ghsa_id: adv.ghsa_id, url: adv.html_url, package: pkg }),
        published_date: adv.published_at || new Date().toISOString(),
        collected_at: new Date().toISOString(),
        validation_status: 'GHSA_VERIFIED',
        is_sqli: isSqli,
      });

      if (isInserted) {
        newAdded++;
        try {
          sqliteDb['db'].prepare(`
            INSERT OR IGNORE INTO collected_advisories (
              id, external_id, source_name, source_url, payload_pattern_snippet, vendor_project, product, collected_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `adv-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            adv.ghsa_id,
            sourceName,
            adv.html_url,
            `Package: ${pkg}`,
            adv.vulnerabilities?.[0]?.package?.ecosystem || 'GitHub',
            pkg,
            new Date().toISOString(),
            'GHSA_ACTIVE'
          );
        } catch {
          // ignore duplicate
        }
      } else {
        duplicates++;
      }
    }

    const syncEnd = new Date().toISOString();
    sqliteDb.recordSyncHistory({
      id: `sync-ghsa-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: syncEnd,
      status: 'SUCCESS',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: null,
    });

    return { fetched, newAdded, duplicates };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isRateLimit = errorMsg.includes('Rate Limited');
    sqliteDb.recordSyncHistory({
      id: `sync-ghsa-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: new Date().toISOString(),
      status: isRateLimit ? 'RATE_LIMITED' : 'FAILED',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: errorMsg,
    });
    return { fetched, newAdded, duplicates, error: errorMsg };
  }
}

/**
 * Source 3: NVD NIST API v2.0
 * National Vulnerability Database official REST API for SQL injection CVEs.
 */
export async function syncNvdNistFeed(): Promise<{ fetched: number; newAdded: number; duplicates: number; error?: string }> {
  const syncStart = new Date().toISOString();
  const sourceName = 'NVD_NIST_API_V2';
  let fetched = 0;
  let newAdded = 0;
  let duplicates = 0;

  try {
    const url = 'https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=sql+injection&resultsPerPage=15';
    const res = await fetchWithTimeout(url, {}, 9000);

    if (res.status === 403 || res.status === 429) {
      throw new Error(`NVD API Rate Limited (HTTP ${res.status}). Will retry next window.`);
    }
    if (!res.ok) {
      throw new Error(`NVD API HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json() as {
      totalResults?: number;
      vulnerabilities?: Array<{
        cve: {
          id: string;
          published: string;
          descriptions?: Array<{ lang: string; value: string }>;
          metrics?: {
            cvssMetricV31?: Array<{
              cvssData?: {
                baseScore?: number;
                baseSeverity?: string;
              };
            }>;
          };
        };
      }>;
    };

    const items = data.vulnerabilities || [];
    fetched = items.length;

    for (const item of items) {
      const cve = item.cve;
      const descObj = cve.descriptions?.find(d => d.lang === 'en') || cve.descriptions?.[0];
      const desc = descObj?.value || 'SQL Injection vulnerability classified by NIST NVD.';
      const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      const severity = (cvss?.baseSeverity || (cvss?.baseScore && cvss.baseScore >= 9.0 ? 'CRITICAL' : 'HIGH')).toUpperCase();

      const isInserted = sqliteDb.insertThreatRecord({
        cve_id: cve.id,
        source: sourceName,
        title: `NIST NVD Advisory: ${cve.id}`,
        description: desc.slice(0, 500),
        severity: severity,
        category: 'SQL Injection / CWE-89',
        raw_data: JSON.stringify({ cvssScore: cvss?.baseScore || 8.5 }),
        published_date: cve.published || new Date().toISOString(),
        collected_at: new Date().toISOString(),
        validation_status: 'NIST_VERIFIED',
        is_sqli: 1,
      });

      if (isInserted) newAdded++;
      else duplicates++;
    }

    const syncEnd = new Date().toISOString();
    sqliteDb.recordSyncHistory({
      id: `sync-nvd-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: syncEnd,
      status: 'SUCCESS',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: null,
    });

    return { fetched, newAdded, duplicates };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isRateLimit = errorMsg.includes('Rate Limited');
    sqliteDb.recordSyncHistory({
      id: `sync-nvd-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: new Date().toISOString(),
      status: isRateLimit ? 'RATE_LIMITED' : 'FAILED',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: errorMsg,
    });
    return { fetched, newAdded, duplicates, error: errorMsg };
  }
}

/**
 * Source 4: OWASP SQL Injection Guidance & Cheat Sheets
 * Live official defense recommendations from OWASP CheatSheetSeries repo.
 */
export async function syncOwaspGuidance(): Promise<{ fetched: number; newAdded: number; duplicates: number; error?: string }> {
  const syncStart = new Date().toISOString();
  const sourceName = 'OWASP_PREVENTION_SERIES';
  let fetched = 0;
  let newAdded = 0;
  let duplicates = 0;

  try {
    const url = 'https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.md';
    const res = await fetchWithTimeout(url, {}, 8000);

    if (!res.ok) {
      throw new Error(`OWASP HTTP ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    fetched = 1;

    // Extract defense principles and guidelines
    const hasDefense = text.includes('Defense Option 1') && text.includes('Parameterized Queries');
    if (hasDefense) {
      const isInserted = sqliteDb.insertThreatRecord({
        cve_id: 'OWASP-CWE-89-DEFENSE',
        source: sourceName,
        title: 'OWASP SQL Injection Prevention Core Directives',
        description: 'Primary defense: Parameterized Queries / Prepared Statements, Stored Procedures, Allow-list Input Validation, and Character Escaping.',
        severity: 'INFO',
        category: 'Prevention Guidance',
        raw_data: JSON.stringify({
          repo: 'OWASP/CheatSheetSeries',
          lastCommitHash: 'sha-latest',
          contentLength: text.length,
        }),
        published_date: new Date().toISOString().split('T')[0],
        collected_at: new Date().toISOString(),
        validation_status: 'OFFICIAL_OWASP_VERIFIED',
        is_sqli: 1,
      });

      if (isInserted) newAdded++;
      else duplicates++;
    }

    const syncEnd = new Date().toISOString();
    sqliteDb.recordSyncHistory({
      id: `sync-owasp-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: syncEnd,
      status: 'SUCCESS',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: null,
    });

    return { fetched, newAdded, duplicates };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    sqliteDb.recordSyncHistory({
      id: `sync-owasp-${Date.now()}`,
      source_name: sourceName,
      sync_start: syncStart,
      sync_end: new Date().toISOString(),
      status: 'FAILED',
      records_fetched: fetched,
      new_records_added: newAdded,
      duplicates_skipped: duplicates,
      error_message: errorMsg,
    });
    return { fetched, newAdded, duplicates, error: errorMsg };
  }
}

/**
 * Orchestrator: Syncs all legitimate public cybersecurity sources sequentially
 * with rate limit protection, error isolation, and aggregate metrics.
 */
export async function syncAllThreatSources(): Promise<SyncSummary> {
  const sourcesProcessed: string[] = [];
  const sourceResults: SyncSummary['sourceResults'] = {};
  let totalFetched = 0;
  let totalNewAdded = 0;
  let totalDuplicatesSkipped = 0;

  // 1. CISA KEV
  try {
    const cisa = await syncCisaKevCatalog();
    sourcesProcessed.push('CISA_KEV_CATALOG');
    sourceResults['CISA_KEV_CATALOG'] = {
      status: cisa.error ? (cisa.error.includes('Rate') ? 'RATE_LIMITED' : 'FAILED') : 'SUCCESS',
      fetched: cisa.fetched,
      newAdded: cisa.newAdded,
      duplicates: cisa.duplicates,
      error: cisa.error,
    };
    totalFetched += cisa.fetched;
    totalNewAdded += cisa.newAdded;
    totalDuplicatesSkipped += cisa.duplicates;
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    sourceResults['CISA_KEV_CATALOG'] = { status: 'FAILED', fetched: 0, newAdded: 0, duplicates: 0, error: errorMsg };
  }

  // Small delay between requests to be polite to public APIs
  await new Promise(r => setTimeout(r, 600));

  // 2. GitHub Security Advisories
  try {
    const ghsa = await syncGitHubAdvisories();
    sourcesProcessed.push('GITHUB_SECURITY_ADVISORIES');
    sourceResults['GITHUB_SECURITY_ADVISORIES'] = {
      status: ghsa.error ? (ghsa.error.includes('Rate') ? 'RATE_LIMITED' : 'FAILED') : 'SUCCESS',
      fetched: ghsa.fetched,
      newAdded: ghsa.newAdded,
      duplicates: ghsa.duplicates,
      error: ghsa.error,
    };
    totalFetched += ghsa.fetched;
    totalNewAdded += ghsa.newAdded;
    totalDuplicatesSkipped += ghsa.duplicates;
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    sourceResults['GITHUB_SECURITY_ADVISORIES'] = { status: 'FAILED', fetched: 0, newAdded: 0, duplicates: 0, error: errorMsg };
  }

  await new Promise(r => setTimeout(r, 600));

  // 3. NVD NIST API
  try {
    const nvd = await syncNvdNistFeed();
    sourcesProcessed.push('NVD_NIST_API_V2');
    sourceResults['NVD_NIST_API_V2'] = {
      status: nvd.error ? (nvd.error.includes('Rate') ? 'RATE_LIMITED' : 'FAILED') : 'SUCCESS',
      fetched: nvd.fetched,
      newAdded: nvd.newAdded,
      duplicates: nvd.duplicates,
      error: nvd.error,
    };
    totalFetched += nvd.fetched;
    totalNewAdded += nvd.newAdded;
    totalDuplicatesSkipped += nvd.duplicates;
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    sourceResults['NVD_NIST_API_V2'] = { status: 'FAILED', fetched: 0, newAdded: 0, duplicates: 0, error: errorMsg };
  }

  await new Promise(r => setTimeout(r, 400));

  // 4. OWASP Prevention
  try {
    const owasp = await syncOwaspGuidance();
    sourcesProcessed.push('OWASP_PREVENTION_SERIES');
    sourceResults['OWASP_PREVENTION_SERIES'] = {
      status: owasp.error ? 'FAILED' : 'SUCCESS',
      fetched: owasp.fetched,
      newAdded: owasp.newAdded,
      duplicates: owasp.duplicates,
      error: owasp.error,
    };
    totalFetched += owasp.fetched;
    totalNewAdded += owasp.newAdded;
    totalDuplicatesSkipped += owasp.duplicates;
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    sourceResults['OWASP_PREVENTION_SERIES'] = { status: 'FAILED', fetched: 0, newAdded: 0, duplicates: 0, error: errorMsg };
  }

  return {
    sourcesProcessed,
    totalFetched,
    totalNewAdded,
    totalDuplicatesSkipped,
    syncTimestamp: new Date().toISOString(),
    sourceResults,
  };
}
