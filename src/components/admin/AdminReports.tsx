'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Flag, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-red-100 text-red-700',
};

const FILTERS = ['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'];

export default function AdminReports({ token }: { token: string }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  // Report action dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<any>(null);
  const [actionType, setActionType] = useState<'RESOLVED' | 'DISMISSED' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchReports = async () => {
    try { setReports(await api(`/api/reports?token=${token}`)); } catch (e: any) { console.error('[admin] AdminReports:', e); } finally { setLoading(false); }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchReports());
  }, [token]);

  const openActionDialog = (report: any, type: 'RESOLVED' | 'DISMISSED') => {
    setActionTarget(report);
    setActionType(type);
    setActionNotes('');
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!actionTarget || !actionType) return;
    setActionSubmitting(true);
    try {
      await api(`/api/reports/${actionTarget.id}`, {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ status: actionType, notes: actionNotes || undefined }),
      });
      toast.success(`Report ${actionType.toLowerCase()}`);
      setActionDialogOpen(false);
      setActionTarget(null);
      setActionType(null);
      fetchReports();
    } catch (e: any) {  toast.error(e.message); } finally { setActionSubmitting(false); }
  };

  const filtered = filter === 'ALL' ? reports : reports.filter((r: any) => r.status === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Flag className="h-5 w-5 text-red-500" /> Reports</h2>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs h-7">{f}</Button>
          ))}
        </div>
      </div>
      <Card>
        {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No reports found</div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table><TableHeader><TableRow>
              <TableHead>Reporter</TableHead><TableHead>Prompt</TableHead><TableHead>Reason</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.reporter?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-sm max-w-[120px] truncate">{r.prompt?.title || 'N/A'}<span className="text-muted-foreground text-xs block">by {r.prompt?.seller?.name || 'Unknown'}</span></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{r.reason}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.description || '-'}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_BADGE[r.status] || ''}`}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openActionDialog(r, 'RESOLVED')} disabled={updating === r.id}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openActionDialog(r, 'DISMISSED')} disabled={updating === r.id}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </ScrollArea>
        )}
      </Card>

      {/* Resolve / Dismiss Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'RESOLVED' ? (
                <><CheckCircle className="h-5 w-5 text-green-600" /> Resolve Report</>
              ) : (
                <><XCircle className="h-5 w-5 text-red-500" /> Dismiss Report</>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'RESOLVED'
                ? 'This report will be marked as resolved and the reporter will be notified.'
                : 'This report will be dismissed without further action.'}
            </DialogDescription>
          </DialogHeader>
          {actionTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Prompt:</span> <span className="font-medium">{actionTarget.prompt?.title || 'N/A'}</span></div>
                <div><span className="text-muted-foreground">Reason:</span> <Badge variant="outline" className="text-xs">{actionTarget.reason}</Badge></div>
                <div className="col-span-2"><span className="text-muted-foreground">Description:</span> <span className="text-sm">{actionTarget.description || 'No description provided.'}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Admin Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes about this decision..."
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={actionSubmitting}>Cancel</Button>
            <Button
              onClick={handleActionConfirm}
              disabled={actionSubmitting}
              className={actionType === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {actionSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {actionType === 'RESOLVED' ? 'Resolve' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}