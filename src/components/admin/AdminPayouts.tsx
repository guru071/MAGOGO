'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Banknote, Loader2, Send } from 'lucide-react';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const STATUS_BADGE: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-green-100 text-green-700' };

export default function AdminPayouts({ token }: { token: string }) {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = async () => {
    try { setPayouts(await api(`/api/admin/payouts?token=${token}`)); } catch (e: any) { console.error('[admin] AdminPayouts:', e); } finally { setLoading(false); }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchPayouts());
  }, [token]);

  const processAll = async () => {
    setProcessing(true);
    try {
      const result = await api('/api/admin/payouts/process', { method: 'POST', headers: { 'x-token': token } });
      toast.success(result?.message || 'All payouts processed');
      fetchPayouts();
    } catch (e: any) {  toast.error(e.message); } finally { setProcessing(false); }
  };

  const filtered = filter === 'ALL' ? payouts : payouts.filter((p: any) => p.status === filter);
  const pendingCount = payouts.filter((p: any) => p.status === 'PENDING').length;
  const pendingTotal = payouts.filter((p: any) => p.status === 'PENDING').reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Banknote className="h-5 w-5 text-green-600" /> Payouts</h2>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && <Badge variant="secondary" className="bg-amber-100 text-amber-700">{pendingCount} pending · ${pendingTotal.toFixed(2)}</Badge>}
          <Button size="sm" className="gap-1.5" onClick={processAll} disabled={processing || pendingCount === 0}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Process All
          </Button>
        </div>
      </div>
      <div className="flex gap-1">
        {['ALL', 'PENDING', 'COMPLETED'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs h-7">{f}</Button>
        ))}
      </div>
      <Card>
        {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No payouts found</div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table><TableHeader><TableRow>
              <TableHead>Seller</TableHead><TableHead>Amount</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Transaction ID</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader><TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div><p className="font-medium text-sm">{p.seller?.name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{p.seller?.paymentMethod} {p.seller?.upiId || p.seller?.paypalEmail || p.seller?.bankAccount || ''}</p></div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">${p.amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{p.periodStart ? `${new Date(p.periodStart).toLocaleDateString()} - ${new Date(p.periodEnd).toLocaleDateString()}` : '-'}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_BADGE[p.status] || ''}`}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">{p.transactionId || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </ScrollArea>
        )}
      </Card>
    </motion.div>
  );
}