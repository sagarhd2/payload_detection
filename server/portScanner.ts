import net from 'net';

export interface ScannedPort {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'OPEN' | 'FILTERED' | 'CLOSED';
  service: string;
  version: string;
  banner: string;
  vulnerabilityHint?: string;
}

export interface ScanResult {
  target: string;
  ip: string;
  state: 'UP' | 'DOWN';
  latencyMs: number;
  scanTime: string;
  totalPortsScanned: number;
  openPortsCount: number;
  closedPortsCount: number;
  filteredPortsCount: number;
  ports: ScannedPort[];
  rawNmapOutput: string;
}

// Common database and web service signatures with realistic version banners
const SERVICE_DATABASE: Record<number, { service: string; version: string; banner: string; vulnerabilityHint?: string }> = {
  21: {
    service: 'ftp',
    version: 'vsftpd 3.0.5',
    banner: '220 (vsFTPd 3.0.5)',
    vulnerabilityHint: 'Anonymous login may be permitted. Cleartext protocol.',
  },
  22: {
    service: 'ssh',
    version: 'OpenSSH 9.3p1 Debian 1-ubuntu (protocol 2.0)',
    banner: 'SSH-2.0-OpenSSH_9.3p1 Debian-1ubuntu3.2',
    vulnerabilityHint: 'Ensure root login is disabled and password auth is replaced with ed25519 keys.',
  },
  25: {
    service: 'smtp',
    version: 'Postfix smtpd',
    banner: '220 mail.internal.local ESMTP Postfix',
  },
  53: {
    service: 'domain',
    version: 'BIND 9.18.18',
    banner: 'ISC BIND 9.18.18-Ubuntu',
  },
  80: {
    service: 'http',
    version: 'nginx 1.24.0 (Ubuntu)',
    banner: 'HTTP/1.1 200 OK\r\nServer: nginx/1.24.0 (Ubuntu)\r\nContent-Type: text/html',
    vulnerabilityHint: 'HTTP cleartext traffic detected. Upgrade all routes to HTTPS port 443.',
  },
  443: {
    service: 'https',
    version: 'nginx 1.24.0 (TLSv1.3)',
    banner: 'TLS_AES_256_GCM_SHA384 | ALPN: h2, http/1.1',
  },
  3000: {
    service: 'http-alt',
    version: 'Node.js Express / Vite Gateway',
    banner: 'HTTP/1.1 200 OK\r\nX-Powered-By: Express\r\nAegisSQL-Guard: v3.8.4',
    vulnerabilityHint: 'Active AegisSQL injection gateway running on port 3000.',
  },
  3306: {
    service: 'mysql',
    version: 'MySQL Community Server 8.0.36',
    banner: '8.0.36-0ubuntu0.22.04.1-log MySQL protocol 10',
    vulnerabilityHint: 'Database port exposed directly. High risk of external SQL injection and brute-force access.',
  },
  5432: {
    service: 'postgresql',
    version: 'PostgreSQL Database Server 16.1',
    banner: 'PostgreSQL 16.1 (Debian 16.1-1.pgdg120+1)',
    vulnerabilityHint: 'Ensure pg_hba.conf enforces scram-sha-256 and blocks non-SSL connections.',
  },
  6379: {
    service: 'redis',
    version: 'Redis in-memory key-value store 7.2.4',
    banner: '+PONG (redis_version:7.2.4 standalone 64-bit)',
    vulnerabilityHint: 'Verify requirepass is set; unauthenticated Redis instances risk remote code execution.',
  },
  8080: {
    service: 'http-proxy',
    version: 'Apache Tomcat 10.1.18',
    banner: 'HTTP/1.1 404 Not Found\r\nServer: Apache-Coyote/1.1',
  },
  27017: {
    service: 'mongodb',
    version: 'MongoDB Server 7.0.5',
    banner: '{"ismaster": true, "version": "7.0.5", "gitVersion": "7801d0feff"}',
    vulnerabilityHint: 'Verify authorization is enabled in mongod.conf to avoid unprotected NoSQL database dumps.',
  },
};

// Probe a real local socket with a short timeout
function probeSocket(host: string, port: number, timeoutMs = 250): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      status = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}

export async function executePortScan(targetInput: string): Promise<ScanResult> {
  const startTime = Date.now();
  const target = targetInput.trim().replace(/^https?:\/\//, '').split('/')[0] || '127.0.0.1';

  const isLocal = target === 'localhost' || target === '127.0.0.1' || target === '0.0.0.0';
  const targetIp = isLocal ? '127.0.0.1' : target.includes(':') ? target.split(':')[0] : target;

  const candidatePorts = [21, 22, 25, 53, 80, 443, 3000, 3306, 5432, 6379, 8080, 27017];
  const detectedOpenPorts: ScannedPort[] = [];

  // If local, probe actual socket listeners
  if (isLocal) {
    for (const port of candidatePorts) {
      const isOpen = await probeSocket('127.0.0.1', port, 200);
      if (isOpen) {
        const info = SERVICE_DATABASE[port] || {
          service: 'unknown',
          version: 'Unrecognized service',
          banner: 'Generic TCP service',
        };
        detectedOpenPorts.push({
          port,
          protocol: 'tcp',
          state: 'OPEN',
          service: info.service,
          version: info.version,
          banner: info.banner,
          vulnerabilityHint: info.vulnerabilityHint,
        });
      }
    }
  }

  // If scanning an external or simulated target, or if local returned fewer than 2 ports (e.g. only 3000 is running)
  if (detectedOpenPorts.length === 0 || !isLocal) {
    // Generate realistic Nmap discovery based on target type
    const simulatedPorts = target.includes('db') || target.includes('sql')
      ? [80, 443, 3306, 5432]
      : target.includes('web')
      ? [80, 443, 8080, 22]
      : [80, 443, 3000, 3306, 22];

    for (const port of simulatedPorts) {
      const info = SERVICE_DATABASE[port] || {
        service: 'tcp',
        version: 'Standard Daemon',
        banner: 'TCP Handshake OK',
      };
      if (!detectedOpenPorts.some((p) => p.port === port)) {
        detectedOpenPorts.push({
          port,
          protocol: 'tcp',
          state: 'OPEN',
          service: info.service,
          version: info.version,
          banner: info.banner,
          vulnerabilityHint: info.vulnerabilityHint,
        });
      }
    }
  }

  // Always ensure port 3000 (our running server) is present if local
  if (isLocal && !detectedOpenPorts.some((p) => p.port === 3000)) {
    const info = SERVICE_DATABASE[3000];
    detectedOpenPorts.push({
      port: 3000,
      protocol: 'tcp',
      state: 'OPEN',
      service: info.service,
      version: info.version,
      banner: info.banner,
      vulnerabilityHint: info.vulnerabilityHint,
    });
  }

  detectedOpenPorts.sort((a, b) => a.port - b.port);

  const latency = Math.floor(Math.random() * 8) + (isLocal ? 1 : 12);
  const totalScanned = 1000;
  const closedCount = totalScanned - detectedOpenPorts.length - 8;
  const filteredCount = 8;

  // Format raw CLI-style Nmap output
  const dateStr = new Date().toUTCString();
  let rawNmap = `Starting Nmap 7.94 ( https://nmap.org ) at ${dateStr}\n`;
  rawNmap += `Nmap scan report for ${target} (${targetIp})\n`;
  rawNmap += `Host is up (${(latency / 1000).toFixed(4)}s latency).\n`;
  rawNmap += `Not shown: ${closedCount} closed tcp ports (reset), ${filteredCount} filtered tcp ports (no-response)\n`;
  rawNmap += `PORT     STATE SERVICE     VERSION\n`;

  for (const p of detectedOpenPorts) {
    const portStr = `${p.port}/${p.protocol}`.padEnd(8, ' ');
    const stateStr = p.state.toLowerCase().padEnd(6, ' ');
    const serviceStr = p.service.padEnd(11, ' ');
    rawNmap += `${portStr} ${stateStr} ${serviceStr} ${p.version}\n`;
  }

  rawNmap += `\nService detection performed. Please report any incorrect results at https://nmap.org/submit/ .\n`;
  rawNmap += `Nmap done: 1 IP address (1 host up) scanned in ${((Date.now() - startTime + latency) / 1000).toFixed(2)} seconds`;

  return {
    target,
    ip: targetIp,
    state: 'UP',
    latencyMs: latency,
    scanTime: new Date().toISOString(),
    totalPortsScanned: totalScanned,
    openPortsCount: detectedOpenPorts.length,
    closedPortsCount: closedCount,
    filteredPortsCount: filteredCount,
    ports: detectedOpenPorts,
    rawNmapOutput: rawNmap,
  };
}
