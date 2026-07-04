'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Ban, Unlock, Eye, ShieldAlert, Clock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const ROLE_COLORS: Record<string, string> = { ADMIN: 'bg-red-100 text-red-700', SELLER: 'bg-blue-100 text-blue-700', BUYER: 'bg-slate-100 text-slate-700' };

function getUserStatus(u: any): { label: string; color: string } {
  if (!u.isActive) return { label: 'Banned', color: 'bg-red-100 text-red-700' };
  if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) return { label: 'Locked', color: 'bg-orange-100 text-orange-700' };
  return { label: 'Active', color: 'bg-green-100 text-green-700' };
}

export default function AdminUsers({ token, onViewActivity }: { token: string; onViewActivity?: (userId: string, userName: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);

  // Ban dialog
  const [banUser, setBanUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ token, page: String(page), limit: '20' });
        if (roleFilter !== 'ALL') params.set('role', roleFilter);
        if (search) params.set('search', search);
        const data = await api(`/api/admin/users?${params}`);
        if (!cancelled && data) {
          setUsers(data.users || []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
        }
      } catch (e: any) { if (!cancelled) toast.error(e.message); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, page, roleFilter, search, refresh]);

  const updateUser = async (id: string, body: any) => {
    try {
      await api(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'x-token': token }, body: JSON.stringify(body) });
      toast.success('User updated');
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error(e.message); }
  };

  const openBanDialog = (user: any) => {
    setBanUser(user);
    setBanReason('');
    setBanDialogOpen(true);
  };

  const handleBan = async () => {
    if (!banUser || !banReason.trim()) return toast.error('Ban reason is required');
    setBanning(true);
    try {
      await api(`/api/admin/users/${banUser.id}`, {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ banReason: banReason.trim(), isActive: false }),
      });
      toast.success(`User "${banUser.name}" has been banned`);
      setBanDialogOpen(false);
      setBanUser(null);
      setBanReason('');
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error(e.message); }
    setBanning(false);
  };

  const handleUnban = async (user: any) => {
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ unban: true }),
      });
      toast.success(`User "${user.name}" has been unbanned`);
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SELLER">Seller</SelectItem>
            <SelectItem value="BUYER">Buyer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <ScrollArea className="max-h-[480px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Verified</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Attempts</TableHead>
                <TableHead className="text-xs text-right">Earnings</TableHead>
                <TableHead className="text-xs text-right hidden sm:table-cell">Spent</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              )) : users.map((u, i) => {
                const status = getUserStatus(u);
                return (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        {u.twoFactorEnabled && (
                          <Badge variant="outline" className="text-[9px] mt-0.5 gap-0.5">
                            <KeyRound className="h-2.5 w-2.5" /> 2FA
                          </Badge>
                        )}
                        {u.isOnline && <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 ml-1" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={v => updateUser(u.id, { role: v, isActive: u.isActive, isVerified: u.isVerified })}>
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="SELLER">Seller</SelectItem>
                          <SelectItem value="BUYER">Buyer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Switch
                        checked={!!u.isVerified}
                        onCheckedChange={v => updateUser(u.id, { role: u.role, isActive: u.isActive, isVerified: v })}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      {u.lastLoginAt ? (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(u.lastLoginAt).toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground/60">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`text-xs font-mono ${u.loginAttempts > 3 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                        {u.loginAttempts}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-green-600 font-medium">${(u.totalEarnings || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm text-rose-600 hidden sm:table-cell">${(u.totalSpent || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onViewActivity && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="View activity" onClick={() => onViewActivity(u.id, u.name)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {u.isActive ? (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" title="Ban user" onClick={() => openBanDialog(u)}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-50" title="Unban user" onClick={() => handleUnban(u)}>
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total} users total</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 text-xs">Page {page} / {pages}</span>
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Ban User</DialogTitle>
            <DialogDescription>
              You are about to ban <span className="font-semibold">{banUser?.name}</span> ({banUser?.email}).
              They will be unable to access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ban Reason <span className="text-red-500">*</span></label>
            <Textarea
              placeholder="Why is this user being banned?"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">This will immediately deactivate the user&apos;s account. They will not be able to log in until an admin unbans them.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan} disabled={banning || !banReason.trim()}>
              {banning ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}