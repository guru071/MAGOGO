'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Ticket, Plus, Loader2, Trash2 } from 'lucide-react';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

export default function AdminCoupons({ token }: { token: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', maxUses: '', minAmount: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = async () => {
    try { setCoupons(await api(`/api/admin/coupons?token=${token}`)); } catch (e: any) { console.error('[admin] AdminCoupons:', e); } finally { setLoading(false); }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchCoupons());
  }, [token]);

  const handleCreate = async () => {
    if (!form.code || !form.discount) return toast.error('Code and discount are required');
    setSaving(true);
    try {
      await api('/api/admin/coupons', {
        method: 'POST', headers: { 'x-token': token },
        body: JSON.stringify({ code: form.code, discount: Number(form.discount), maxUses: Number(form.maxUses) || 0, minAmount: Number(form.minAmount) || 0, expiresAt: form.expiresAt || null }),
      });
      toast.success('Coupon created');
      setForm({ code: '', discount: '', maxUses: '', minAmount: '', expiresAt: '' });
      setOpen(false);
      fetchCoupons();
    } catch (e: any) {  toast.error(e.message); } finally { setSaving(false); }
  };

  const toggleActive = async (c: any) => {
    try {
      await api(`/api/admin/coupons/${c.id}`, { method: 'PUT', headers: { 'x-token': token }, body: JSON.stringify({ isActive: !c.isActive }) });
      toast.success(`Coupon ${c.isActive ? 'deactivated' : 'activated'}`);
      fetchCoupons();
    } catch (e: any) {  toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/coupons/${deleteTarget.id}`, { method: 'DELETE', headers: { 'x-token': token } });
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      fetchCoupons();
    } catch (e: any) {  toast.error(e.message); } finally { setDeleting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Ticket className="h-5 w-5 text-amber-500" /> Coupons</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Create Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Code</Label><Input placeholder="SUMMER20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Discount %</Label><Input type="number" min="1" max="100" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="mt-1" /></div>
                <div><Label>Max Uses</Label><Input type="number" min="0" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Min Amount ($)</Label><Input type="number" min="0" step="0.01" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })} className="mt-1" /></div>
                <div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="mt-1" /></div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        {loading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : coupons.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No coupons yet</div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table><TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Used/Max</TableHead><TableHead>Min Amt</TableHead><TableHead>Expires</TableHead><TableHead>Active</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader><TableBody>
              {coupons.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                  <TableCell><Badge variant="secondary">{c.discount}%</Badge></TableCell>
                  <TableCell>{c.usedCount ?? 0}/{c.maxUses || '∞'}</TableCell>
                  <TableCell>${c.minAmount || 0}</TableCell>
                  <TableCell className="text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell><Switch checked={c.isActive} onCheckedChange={() => toggleActive(c)} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </ScrollArea>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon <span className="font-mono font-semibold">{deleteTarget?.code}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}