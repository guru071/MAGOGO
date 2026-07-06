'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Loader2, Zap, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminFlashDeals({ token }: { token: string }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    promptId: '',
    discount: '50',
    maxClaims: '100',
    startsAt: '',
    endsAt: ''
  });

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flash-deals?token=${token}`);
      const json = await res.json();
      if (json.success) setDeals(json.data);
    } catch (e) {
      toast.error('Failed to load flash deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
    // Set default dates
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setForm(prev => ({
      ...prev,
      startsAt: now.toISOString().slice(0, 16),
      endsAt: tomorrow.toISOString().slice(0, 16),
    }));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/flash-deals?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Flash deal created');
        setDeals([json.data, ...deals]);
        setShowForm(false);
        setForm({ ...form, promptId: '' });
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Failed to create flash deal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flash deal?')) return;
    try {
      const res = await fetch(`/api/admin/flash-deals?id=${id}&token=${token}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Flash deal deleted');
        setDeals(deals.filter(d => d.id !== id));
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Deletion failed');
    }
  };

  if (loading && deals.length === 0) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Flash Deals</h2>
          <p className="text-slate-500">Manage time-limited discounts on prompts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDeals} variant="outline">Refresh</Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6 border-orange-200 bg-orange-50/30">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-orange-500" /> Create Flash Deal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Prompt ID</Label>
                <Input required value={form.promptId} onChange={e => setForm({...form, promptId: e.target.value})} placeholder="e.g. clk123..." />
              </div>
              <div>
                <Label>Discount (%)</Label>
                <Input type="number" min="1" max="99" required value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
              </div>
              <div>
                <Label>Starts At</Label>
                <Input type="datetime-local" required value={form.startsAt} onChange={e => setForm({...form, startsAt: e.target.value})} />
              </div>
              <div>
                <Label>Ends At</Label>
                <Input type="datetime-local" required value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} />
              </div>
              <div>
                <Label>Max Claims (Inventory)</Label>
                <Input type="number" min="1" required value={form.maxClaims} onChange={e => setForm({...form, maxClaims: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">Create Deal</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {deals.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">No flash deals found</Card>
        ) : (
          deals.map(deal => {
            const isActive = new Date(deal.startsAt) <= new Date() && new Date(deal.endsAt) >= new Date() && deal.isActive;
            const isUpcoming = new Date(deal.startsAt) > new Date();
            
            return (
              <Card key={deal.id} className="p-4 flex gap-4 items-center">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-orange-100' : isUpcoming ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <Zap className={`h-6 w-6 ${isActive ? 'text-orange-500' : isUpcoming ? 'text-blue-500' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{deal.prompt?.title || 'Unknown Prompt'}</p>
                        {isActive && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">Active</span>}
                        {isUpcoming && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Upcoming</span>}
                        {!isActive && !isUpcoming && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">Ended</span>}
                      </div>
                      <p className="text-sm text-slate-500">
                        {deal.discount}% off • {deal.claimedCount} / {deal.maxClaims} claimed
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(deal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 font-mono">
                    {format(new Date(deal.startsAt), 'PP p')} — {format(new Date(deal.endsAt), 'PP p')}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
