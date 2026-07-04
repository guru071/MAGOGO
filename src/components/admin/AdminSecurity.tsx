'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Ban,
  Unlock,
  Activity,
  UserX,
  Clock,
  AlertTriangle,
  Trash2,
  Loader2,
  Globe,
  MonitorSmartphone,
  Fingerprint,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlacklistedIP {
  ip: string;
  reason: string;
  blockedAt: string;
}

interface RateLimitEntry {
  ip: string;
  count: number;
  resetAt: number;
}

interface SecurityEvent {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface FailedLogin {
  id: string;
  status: string;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface FailedByIP {
  ipAddress: string | null;
  _count: { ipAddress: number };
}

interface SecurityData {
  blacklistedIPs: BlacklistedIP[];
  rateLimitStatus: RateLimitEntry[];
  securityEvents: SecurityEvent[];
  loginStats: {
    failedCount: number;
    successCount: number;
    recentFailedLogins: FailedLogin[];
    failedByIP: FailedByIP[];
  };
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSecurity({ token }: { token: string }) {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockIPVal, setBlockIPVal] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const fetchSecurity = async () => {
    try {
      const result = await api(`/api/admin/security?token=${encodeURIComponent(token)}`);
      setData(result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchSecurity());
  }, [token]);

  // ---- Actions ----

  const handleBlockIP = async () => {
    if (!blockIPVal.trim() || !blockReason.trim()) {
      toast.error('IP and reason are required');
      return;
    }
    setBlockSubmitting(true);
    try {
      await api(`/api/admin/security?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'block-ip', ip: blockIPVal.trim(), reason: blockReason.trim() }),
      });
      toast.success(`IP ${blockIPVal.trim()} blocked`);
      setBlockIPVal('');
      setBlockReason('');
      setBlockDialogOpen(false);
      fetchSecurity();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await api(`/api/admin/security?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'unblock-ip', ip }),
      });
      toast.success(`IP ${ip} unblocked`);
      fetchSecurity();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClearRateLimits = async () => {
    try {
      await api(`/api/admin/security?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'clear-logs' }),
      });
      toast.success('Rate limit counters cleared');
      fetchSecurity();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ---- Helpers ----

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatReset = (ts: number) => {
    const sec = Math.max(0, Math.ceil((ts - Date.now()) / 1000));
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  const getEventIcon = (action: string) => {
    if (action.includes('BAN') || action.includes('BLOCK_IP')) return <ShieldX className="h-4 w-4 text-red-500" />;
    if (action.includes('UNBLOCK_IP')) return <ShieldCheck className="h-4 w-4 text-[#0066CC]" />;
    if (action.includes('LOCK')) return <ShieldAlert className="h-4 w-4 text-amber-500" />;
    if (action.includes('FAILED_LOGIN')) return <UserX className="h-4 w-4 text-red-400" />;
    return <Activity className="h-4 w-4 text-slate-400" />;
  };

  // ---- Loading skeleton ----

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const loginStats = data?.loginStats;
  const blacklisted = data?.blacklistedIPs || [];
  const rateLimits = data?.rateLimitStatus || [];
  const securityEvents = data?.securityEvents || [];
  const recentFailed = loginStats?.recentFailedLogins || [];
  const failedByIP = loginStats?.failedByIP || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0066CC]" />
            Security Center
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor threats, manage IP bans, and review login activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearRateLimits}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear Rate Limits
          </Button>
          <Button size="sm" onClick={() => setBlockDialogOpen(true)}>
            <Ban className="h-4 w-4 mr-1.5" />
            Block IP
          </Button>
        </div>
      </div>

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{blacklisted.length}</p>
              <p className="text-xs text-muted-foreground">Blocked IPs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <UserX className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loginStats?.failedCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Failed Logins (24h)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#0066CC]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loginStats?.successCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Successful Logins (24h)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MonitorSmartphone className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rateLimits.length}</p>
              <p className="text-xs text-muted-foreground">Active Rate Limits</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ---- Main Content ---- */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Blocked IPs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldX className="h-4 w-4 text-red-500" />
              Blocked IPs
              {blacklisted.length > 0 && (
                <Badge variant="destructive" className="text-[10px] ml-auto">
                  {blacklisted.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-80">
              {blacklisted.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="h-8 w-8 text-[#0066CC] mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No blocked IPs — all clear!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blacklisted.map((entry) => (
                    <div
                      key={entry.ip}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="mt-0.5 h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <Ban className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium">{entry.ip}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.reason}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Blocked {formatTime(entry.blockedAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#0066CC] hover:text-[#0055AA] hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0"
                        onClick={() => handleUnblockIP(entry.ip)}
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Rate Limit Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-slate-500" />
              Rate Limit Status
              {rateLimits.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {rateLimits.length} tracked
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-80">
              {rateLimits.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active rate limits</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rateLimits.slice(0, 20).map((entry) => {
                    const pct = Math.min(100, (entry.count / 100) * 100);
                    const isHigh = pct > 80;
                    return (
                      <div
                        key={entry.ip}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono">{entry.ip}</span>
                            <span className={`text-xs font-medium ${isHigh ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {entry.count} req
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isHigh ? 'bg-red-500' : 'bg-[#0066CC]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Resets in {formatReset(entry.resetAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ---- Recent Failed Logins ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Recent Failed Logins
            {recentFailed.length > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {recentFailed.length} shown
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="max-h-72">
            {recentFailed.length === 0 ? (
              <div className="text-center py-6">
                <ShieldCheck className="h-6 w-6 text-[#0066CC] mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">No failed login attempts</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentFailed.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 border-l-2 border-red-400"
                  >
                    <UserX className="h-4 w-4 text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.user?.name || 'Unknown User'}</span>
                        {log.user?.email && (
                          <span className="text-muted-foreground ml-1.5 text-xs">({log.user.email})</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {log.ipAddress && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {log.ipAddress}
                          </Badge>
                        )}
                        {log.device && (
                          <span className="text-[10px] text-muted-foreground">{log.device}</span>
                        )}
                        {log.browser && (
                          <span className="text-[10px] text-muted-foreground">{log.browser}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ---- Bottom section: Events + Top Failed IPs ---- */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Security Events Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-500" />
              Security Events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-72">
              {securityEvents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No security events (last 7 days)</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {securityEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="mt-0.5 shrink-0">{getEventIcon(event.action)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <Badge
                            variant={event.action.includes('BAN') || event.action.includes('BLOCK') ? 'destructive' : 'secondary'}
                            className="text-[10px] mr-1.5"
                          >
                            {event.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.user?.name || 'System'}
                          </span>
                        </p>
                        {event.details && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {event.details}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(event.createdAt)}
                          {event.ipAddress && (
                            <span className="ml-2 font-mono">IP: {event.ipAddress}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Failed IPs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-500" />
              Top Failed IPs (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-72">
              {failedByIP.length === 0 ? (
                <div className="text-center py-6">
                  <ShieldCheck className="h-6 w-6 text-[#0066CC] mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">No suspicious IP activity</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {failedByIP.map((item) => {
                    const isBlocked = blacklisted.some((b) => b.ip === item.ipAddress);
                    return (
                      <div
                        key={item.ipAddress || 'unknown'}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium">
                              {item.ipAddress || 'unknown'}
                            </span>
                            {isBlocked && (
                              <Badge variant="destructive" className="text-[10px]">BLOCKED</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item._count.ipAddress} failed attempts
                          </p>
                        </div>
                        {item.ipAddress && !isBlocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                            onClick={() => {
                              setBlockIPVal(item.ipAddress!);
                              setBlockReason(`Manual ban: ${item._count.ipAddress} failed logins`);
                              setBlockDialogOpen(true);
                            }}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Ban
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ---- Block IP Dialog ---- */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Block IP Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Address</label>
              <Input
                placeholder="e.g. 192.168.1.100"
                value={blockIPVal}
                onChange={(e) => setBlockIPVal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Input
                placeholder="e.g. Excessive failed login attempts"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                This IP will be immediately blocked from accessing the application. All requests will return 403 Forbidden.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockIP}
              disabled={blockSubmitting}
            >
              {blockSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-1.5" />
                  Block IP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}