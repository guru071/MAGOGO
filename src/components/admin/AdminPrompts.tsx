'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trash2, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700' };

export default function AdminPrompts({ token }: { token: string }) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ token, page: String(page), limit: '20' });
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        const data = await api(`/api/admin/prompts?${params}`);
        if (!cancelled) {
          const filtered = search ? (data.prompts || []).filter((p: any) => p.title?.toLowerCase().includes(search.toLowerCase())) : data.prompts;
          setPrompts(filtered || []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
        }
      } catch (e: any) { if (!cancelled) toast.error(e.message); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, page, statusFilter, search, refresh]);

  const updatePrompt = async (id: string, body: any) => {
    try {
      await api(`/api/admin/prompts/${id}`, { method: 'PUT', headers: { 'x-token': token }, body: JSON.stringify(body) });
      toast.success('Prompt updated');
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error(e.message); }
  };

  const deletePrompt = async () => {
    if (!deleteId) return;
    try {
      await api(`/api/admin/prompts/${deleteId}`, { method: 'DELETE', headers: { 'x-token': token } });
      toast.success('Prompt deleted');
      setDeleteId(null);
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <ScrollArea className="max-h-[480px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Seller</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Category</TableHead>
                <TableHead className="text-xs text-right">Price</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-center">Feat.</TableHead>
                <TableHead className="text-xs text-center">Trend.</TableHead>
                <TableHead className="text-xs text-right hidden sm:table-cell">DL</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell><TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell><TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell><TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell><TableCell><Skeleton className="h-5 w-5 mx-auto" /></TableCell><TableCell><Skeleton className="h-5 w-5 mx-auto" /></TableCell><TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></TableCell><TableCell><Skeleton className="h-4 w-20" /></TableCell></TableRow>
              )) : prompts.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b hover:bg-muted/40 transition-colors">
                  <TableCell className="text-sm font-medium max-w-[200px] truncate">{p.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.seller?.name}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{p.category?.name}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{p.isFree ? <Badge className="bg-green-100 text-green-700 text-[10px]">FREE</Badge> : `$${p.price?.toFixed(2)}`}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge></TableCell>
                  <TableCell className="text-center"><Star className={`h-4 w-4 mx-auto cursor-pointer transition ${p.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground hover:text-amber-400'}`} onClick={() => updatePrompt(p.id, { status: p.status, isFeatured: !p.isFeatured, isTrending: p.isTrending })} /></TableCell>
                  <TableCell className="text-center"><TrendingUp className={`h-4 w-4 mx-auto cursor-pointer transition ${p.isTrending ? 'text-[#FF6600]' : 'text-muted-foreground hover:text-[#FF6600]'}`} onClick={() => updatePrompt(p.id, { status: p.status, isFeatured: p.isFeatured, isTrending: !p.isTrending })} /></TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">{p.downloadCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {p.status === 'PENDING' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => updatePrompt(p.id, { status: 'APPROVED', isFeatured: p.isFeatured, isTrending: p.isTrending })}><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => updatePrompt(p.id, { status: 'REJECTED', isFeatured: p.isFeatured, isTrending: p.isTrending })}><XCircle className="h-4 w-4" /></Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {!loading && prompts.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No prompts found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total} prompts total</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 text-xs">Page {page} / {pages}</span>
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Prompt?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. The prompt will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deletePrompt} className="bg-destructive text-white">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}