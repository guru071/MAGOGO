import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBlacklistedIPs,
  blockIP,
  unblockIP,
  getRateLimitStatus,
  clearRateLimits,
  createAuditLog,
} from '@/lib/security';

// ---------------------------------------------------------------------------
// GET — Security dashboard data
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const [blacklistedIPs, rateLimitStatus] = await Promise.all([
      Promise.resolve(getBlacklistedIPs()),
      Promise.resolve(getRateLimitStatus()),
    ]);

    // Security events from ActivityLog (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const securityEvents = await db.activityLog.findMany({
      where: {
        OR: [
          { action: { contains: 'BAN' } },
          { action: { contains: 'LOCK' } },
          { action: { contains: 'FAILED_LOGIN' } },
          { action: { contains: 'BLOCK_IP' } },
          { action: { contains: 'UNBLOCK_IP' } },
        ],
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Login failure stats (last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [failedLoginCount, recentFailedLogins] = await Promise.all([
      db.loginHistory.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      db.loginHistory.findMany({
        where: {
          status: 'FAILED',
          createdAt: { gte: twentyFourHoursAgo },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Successful logins (last 24h) for context
    const successLoginCount = await db.loginHistory.count({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    // Top failed IPs (last 24h)
    const failedByIP = await db.loginHistory.groupBy({
      by: ['ipAddress'],
      where: {
        status: 'FAILED',
        ipAddress: { not: null },
        createdAt: { gte: twentyFourHoursAgo },
      },
      _count: { ipAddress: true },
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        blacklistedIPs,
        rateLimitStatus,
        securityEvents,
        loginStats: {
          failedCount: failedLoginCount,
          successCount: successLoginCount,
          recentFailedLogins,
          failedByIP,
        },
      },
    });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Block/unblock IP, clear logs
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, ip, reason } = body;
    const adminIP =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    switch (action) {
      case 'block-ip': {
        if (!ip || !reason) {
          return NextResponse.json(
            { success: false, error: 'IP and reason are required' },
            { status: 400 }
          );
        }
        blockIP(ip, reason);
        await createAuditLog({
          userId: user.id!,
          action: 'BLOCK_IP',
          details: `Blocked IP: ${ip} — ${reason}`,
          ipAddress: adminIP,
        });
        return NextResponse.json({ success: true, message: `IP ${ip} blocked` });
      }

      case 'unblock-ip': {
        if (!ip) {
          return NextResponse.json(
            { success: false, error: 'IP is required' },
            { status: 400 }
          );
        }
        const removed = unblockIP(ip);
        if (!removed) {
          return NextResponse.json(
            { success: false, error: 'IP not found in blacklist' },
            { status: 404 }
          );
        }
        await createAuditLog({
          userId: user.id!,
          action: 'UNBLOCK_IP',
          details: `Unblocked IP: ${ip}`,
          ipAddress: adminIP,
        });
        return NextResponse.json({ success: true, message: `IP ${ip} unblocked` });
      }

      case 'clear-logs': {
        clearRateLimits();
        await createAuditLog({
          userId: user.id!,
          action: 'CLEAR_RATE_LIMITS',
          details: 'Cleared all rate limit counters',
          ipAddress: adminIP,
        });
        return NextResponse.json({ success: true, message: 'Rate limit counters cleared' });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}