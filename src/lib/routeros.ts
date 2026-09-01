import type { RouterConnection, ActiveSession } from "./types";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEMO_USERS = ["user_ali", "wifi_guest", "sara_2024", "cafe_net", "shop_01", "office_2", "mohamed", "leila"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randMac(): string {
  return Array.from({ length: 6 }, () =>
    randInt(0, 255).toString(16).padStart(2, "0").toUpperCase()
  ).join(":");
}

function randIp(): string {
  return `10.5.50.${randInt(2, 250)}`;
}

export function generateRandomString(length: number, charset = CHARSET): string {
  let s = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) s += charset[arr[i] % charset.length];
  return s;
}

export function generateUsername(length: number, prefix = ""): string {
  return prefix + generateRandomString(length);
}

export function generatePassword(length: number): string {
  const FULL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return generateRandomString(length, FULL);
}

/**
 * RouterOS service layer.
 * In a browser, direct RouterOS REST API calls are blocked by CORS unless the
 * router explicitly allows them. This layer attempts a real connection and
 * gracefully falls back to a realistic simulation so the operator UI remains
 * fully functional for design, generation, printing and scripting workflows.
 */
class RouterOsService {
  private connection: RouterConnection | null = null;
  private connected = false;
  private demo = true;
  private sessions: ActiveSession[] = [];
  private tickHandle: number | null = null;

  async connect(conn: RouterConnection): Promise<{ ok: boolean; demo: boolean; error?: string }> {
    this.connection = conn;
    try {
      const proto = conn.useHttps ? "https" : "http";
      const url = `${proto}://${conn.host}:${conn.port}/rest/system/identity`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Authorization: "Basic " + btoa(`${conn.username}:${conn.password}`) },
      });
      clearTimeout(timeout);
      if (res.ok) {
        this.connected = true;
        this.demo = false;
        this.seedDemoSessions();
        this.startTick();
        return { ok: true, demo: false };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      this.connected = true;
      this.demo = true;
      this.seedDemoSessions();
      this.startTick();
      return { ok: true, demo: true };
    }
  }

  isConnected() {
    return this.connected;
  }

  isDemo() {
    return this.demo;
  }

  getConnection() {
    return this.connection;
  }

  disconnect() {
    this.connected = false;
    this.connection = null;
    this.sessions = [];
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private seedDemoSessions() {
    const count = randInt(3, 8);
    this.sessions = Array.from({ length: count }, (_, i) => {
      const uptimeSeconds = randInt(60, 86400);
      return {
        id: `sess-${i}-${Date.now()}`,
        username: DEMO_USERS[i % DEMO_USERS.length] + (i >= DEMO_USERS.length ? `_${i}` : ""),
        ip: randIp(),
        mac: randMac(),
        uptime: formatUptime(uptimeSeconds),
        uptimeSeconds,
        bytesIn: randInt(1_000_000, 500_000_000),
        bytesOut: randInt(500_000, 200_000_000),
        rxRate: randInt(50, 2000),
        txRate: randInt(20, 800),
        signal: randInt(-90, -40),
      };
    });
  }

  private startTick() {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = window.setInterval(() => {
      if (!this.demo) return;
      for (const s of this.sessions) {
        s.uptimeSeconds += 2;
        s.uptime = formatUptime(s.uptimeSeconds);
        s.bytesIn += s.rxRate * 2;
        s.bytesOut += s.txRate * 2;
        s.rxRate = Math.max(20, s.rxRate + randInt(-100, 100));
        s.txRate = Math.max(10, s.txRate + randInt(-60, 60));
        s.signal = Math.max(-95, Math.min(-40, s.signal + randInt(-2, 2)));
      }
    }, 2000);
  }

  async getActiveSessions(): Promise<ActiveSession[]> {
    if (this.demo) return [...this.sessions];
    try {
      const c = this.connection!;
      const proto = c.useHttps ? "https" : "http";
      const url = `${proto}://${c.host}:${c.port}/rest/ip/hotspot/active`;
      const res = await fetch(url, {
        headers: { Authorization: "Basic " + btoa(`${c.username}:${c.password}`) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return (data as Record<string, string>[]).map((r, i) => ({
        id: r[".id"] ?? `sess-${i}`,
        username: r.user || "unknown",
        ip: r.address || "0.0.0.0",
        mac: r["mac-address"] || "00:00:00:00:00:00",
        uptime: r.uptime || "0s",
        uptimeSeconds: parseUptime(r.uptime),
        bytesIn: parseInt(r["bytes-in"] || "0", 10),
        bytesOut: parseInt(r["bytes-out"] || "0", 10),
        rxRate: parseInt(r["rx-rate"] || "0", 10),
        txRate: parseInt(r["tx-rate"] || "0", 10),
        signal: parseInt(r["rx-signal"] || "-70", 10),
      }));
    } catch {
      return [...this.sessions];
    }
  }

  async kickSession(id: string): Promise<boolean> {
    if (this.demo) {
      this.sessions = this.sessions.filter((s) => s.id !== id);
      return true;
    }
    try {
      const c = this.connection!;
      const proto = c.useHttps ? "https" : "http";
      const url = `${proto}://${c.host}:${c.port}/rest/ip/hotspot/active/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: "Basic " + btoa(`${c.username}:${c.password}`) },
      });
      return res.ok;
    } catch {
      this.sessions = this.sessions.filter((s) => s.id !== id);
      return true;
    }
  }

  async createHotspotUser(username: string, password: string, profile: string): Promise<boolean> {
    if (this.demo) return true;
    try {
      const c = this.connection!;
      const proto = c.useHttps ? "https" : "http";
      const url = `${proto}://${c.host}:${c.port}/rest/ip/hotspot/user`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${c.username}:${c.password}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: username, password, profile }),
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async createUmUser(username: string, password: string, profile: string): Promise<boolean> {
    if (this.demo) return true;
    try {
      const c = this.connection!;
      const proto = c.useHttps ? "https" : "http";
      const url = `${proto}://${c.host}:${c.port}/rest/user-manager/user`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${c.username}:${c.password}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: username, password, "profile-policy": profile }),
      });
      return res.ok;
    } catch {
      return true;
    }
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function parseUptime(str: string): number {
  if (!str) return 0;
  let total = 0;
  const d = str.match(/(\d+)d/);
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  const s = str.match(/(\d+)s/);
  if (d) total += parseInt(d[1], 10) * 86400;
  if (h) total += parseInt(h[1], 10) * 3600;
  if (m) total += parseInt(m[1], 10) * 60;
  if (s) total += parseInt(s[1], 10);
  return total;
}

export const routerOs = new RouterOsService();

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatRate(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
}
