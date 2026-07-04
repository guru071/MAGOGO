import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// IP Blacklist persistence path
// ---------------------------------------------------------------------------

const BLACKLIST_FILE = path.join(process.cwd(), 'db', 'ip-blacklist.json');

interface BlacklistEntry {
  ip: string;
  reason: string;
  blockedAt: string;
}

function readBlacklistFile(): Map<string, BlacklistEntry> {
  const map = new Map<string, BlacklistEntry>();
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      const raw = fs.readFileSync(BLACKLIST_FILE, 'utf-8');
      const arr: BlacklistEntry[] = JSON.parse(raw);
      for (const entry of arr) {
        map.set(entry.ip, entry);
      }
    }
  } catch (e) {
    console.error('[security] read blacklist file error', e);
    // If file is corrupt, start fresh
  }
  return map;
}

function writeBlacklistFile(map: Map<string, BlacklistEntry>) {
  const dir = path.dirname(BLACKLIST_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Array.from(map.values()), null, 2));
}

// ---------------------------------------------------------------------------
// In-memory IP blacklist (server-side, persists to JSON)
// ---------------------------------------------------------------------------

const ipBlacklist = readBlacklistFile();

export function isIPBlacklisted(ip: string): boolean {
  return ipBlacklist.has(ip);
}

export function blockIP(ip: string, reason: string): void {
  const entry: BlacklistEntry = { ip, reason, blockedAt: new Date().toISOString() };
  ipBlacklist.set(ip, entry);
  writeBlacklistFile(ipBlacklist);
}

export function unblockIP(ip: string): boolean {
  const deleted = ipBlacklist.delete(ip);
  if (deleted) writeBlacklistFile(ipBlacklist);
  return deleted;
}

export function getBlacklistedIPs(): BlacklistEntry[] {
  return Array.from(ipBlacklist.values());
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (per IP)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 100; // requests per minute
const ADMIN_LIMIT = 30; // requests per minute for admin routes
const BAN_MULTIPLIER = 5; // Ban IP if exceeds limit by this factor

export function checkRateLimit(ip: string, isAdmin: boolean): { allowed: boolean; remaining: number; shouldBan: boolean } {
  const now = Date.now();
  const limit = isAdmin ? ADMIN_LIMIT : DEFAULT_LIMIT;
  const windowMs = 60 * 1000; // 1 minute

  let entry = rateLimitMap.get(ip);

  // Reset if window expired
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitMap.set(ip, entry);
  }

  entry.count++;

  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit * BAN_MULTIPLIER; // Allow up to 5x but flag for ban
  const shouldBan = entry.count > limit * BAN_MULTIPLIER;

  return { allowed, remaining, shouldBan };
}

export function getRateLimitStatus(): { ip: string; count: number; resetAt: number }[] {
  const now = Date.now();
  const result: { ip: string; count: number; resetAt: number }[] = [];
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now < entry.resetAt) {
      result.push({ ip, count: entry.count, resetAt: entry.resetAt });
    }
  }
  return result.sort((a, b) => b.count - a.count);
}

export function clearRateLimits(): void {
  rateLimitMap.clear();
}

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------

export function sanitizeInput(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Strip potential XSS vectors
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\s*img[^>]*on\w+\s*=[^>]*>/gi, '')
    .replace(/<\s*[^>]+on\w+\s*=[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Trim whitespace
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------

export async function createAuditLog(params: {
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string | null;
}) {
  await db.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress ?? undefined,
    },
  });
}

// ---------------------------------------------------------------------------
// Known suspicious User-Agent patterns
// ---------------------------------------------------------------------------

const SUSPICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /hydra/i,
  /burpsuite/i,
  /zgrab/i,
  /httpx/i,
  /subfinder/i,
  /nuclei/i,
  /curl\//i,          // generic curl (often used by bots/scanners)
  /wget\//i,          // generic wget
  /python-requests/i, // generic Python scraper
  /scrapy/i,
  /java\/\d/i,        // raw Java HTTP client
  /go-http/i,         // raw Go HTTP client
];

export function isSuspiciousUserAgent(ua: string | null): boolean {
  if (!ua) return true; // No UA is suspicious
  return SUSPICIOUS_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

// ---------------------------------------------------------------------------
// IP extraction helper
// ---------------------------------------------------------------------------

export function extractIP(request: Request | { headers: Headers }): string {
  const headers = request instanceof Request ? request.headers : request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}