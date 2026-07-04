'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Activity, Search, ChevronLeft, ChevronRight, RefreshCw, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const ACTION_COLORS: Record<string, string> = {
  BROADCAST_SENT: 'bg-violet-100 text-violet-700',
  ORDER_REFUNDED: 'bg-red-100 text-red-700',
  USER_BANNED: 'bg-red-100 text-red-700',
  USER_UNBANNED: 'bg-green-100 text-green-700',
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  REGISTER: 'bg-sky-100 text-sky-700',
  PROMPT_CREATED: 'bg-amber-100 text-amber-700',
  PROMPT_APPROVED: 'bg-green-100 text-green-700',
  PROMPT_REJECTED: 'bg-red-100 text-red-700',
  ORDER_PLACED: 'bg-blue-100 text-blue-700',
  PAYOUT_PROCESSED: 'bg-teal-100 text-teal-700',
  PURCHASE: 'bg-green-100 text-green-700',
  UPLOAD: 'bg-green-100 text-green-700',
  REFUND: 'bg-amber-100 text-amber-700',
  BAN: 'bg-red-100 text-red-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
  PAYOUT: 'bg-teal-100 text-teal-700',
};

interface AdminActivityProps {
  token: string;
  preFilterUserId?: string;
  preFilterUserName?: string;
  onClearFilter?: () => void;
}

export default function AdminActivity({ token, preFilterUserId, preFilterUserName, onClearFilter }: AdminActivityProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [userIdFilter, setUserIdFilter] = useState<string | undefined>(preFilterUserId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ token, page: String(page), limit: '25' });
        if (actionFilter !== 'ALL') params.set('action', actionFilter);
        if (search) params.set('search', search);
        if (userIdFilter) params.set('userId', userIdFilter);
        const data = await api(`/api/admin/activity-logs?${params}`);
        if (!cancelled) {
          setLogs(data.logs || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
          setActions(data.actions || []);
        }
      } catch (e: any) { if (!cancelled) toast.error(e.message); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, page, actionFilter, search, userIdFilter, refresh]);

  const clearUserFilter = () => {
    setUserIdFilter(undefined);
    setPage(1);
    onClearFilter?.();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Activity className="h-5 w-5 text-violet-500" /> Activity Logs</h2>
          <Badge variant="outline">{total} entries</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefresh(r => r + 1)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* User pre-filter banner */}
      {(userIdFilter || preFilterUserName) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50 border border-violet-200">
          <span className="text-sm">Filtered by user: <strong>{preFilterUserName || userIdFilter}</strong></span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={clearUserFilter}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search action, details, or user..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-[180px]">Timestamp</TableHead>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Details</TableHead>
                <TableHead className="text-xs hidden md:table-cell">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-medium">No activity logs</p>
                    <p className="text-sm">Activity will appear here as users interact with the platform.</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any, i: number) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.user?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground">{log.user?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[300px] truncate">
                      {log.details || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                      {log.ipAddress || '—'}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total} log entries</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 text-xs">Page {page} / {pages}</span>
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </motion.div>
  );
}