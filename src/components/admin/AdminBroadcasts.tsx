'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Megaphone, Send, Info, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const TYPES = [
  { value: 'BROADCAST', label: 'Broadcast', color: 'bg-gray-100 text-gray-700' },
  { value: 'ORDER', label: 'Order', color: 'bg-green-100 text-green-700' },
  { value: 'SYSTEM', label: 'System', color: 'bg-amber-100 text-amber-700' },
  { value: 'PAYOUT', label: 'Payout', color: 'bg-blue-100 text-blue-700' },
  { value: 'PROMOTION', label: 'Promotion', color: 'bg-violet-100 text-violet-700' },
];

export default function AdminBroadcasts({ token }: { token: string }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('BROADCAST');
  const [sending, setSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api(`/api/admin/broadcasts?token=${token}&page=${page}&limit=10`);
        if (!cancelled) {
          setBroadcasts(data.broadcasts || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
        }
      } catch (e: any) {  if (!cancelled) toast.error(e.message); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, page, refresh]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return toast.error('Title and message are required');
    setSending(true);
    try {
      const data = await api('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'x-token': token },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type }),
      });
      toast.success(`Broadcast "${data.title}" sent to ${data.recipientCount} active users`);
      setTitle(''); setMessage(''); setType('BROADCAST');
      setRefresh(r => r + 1);
    } catch (e: any) {  toast.error(e.message); }
    setSending(false);
  };

  const typeBadge = (t: string) => {
    const found = TYPES.find(x => x.value === t);
    return found ? found : { label: t, color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-violet-500" /> Broadcasts
        </h2>
        <Badge variant="outline">{total} total</Badge>
      </div>

      {/* Send New Broadcast */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm">Send New Broadcast</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bc-title">Title</Label>
            <Input id="bc-title" placeholder="e.g. Platform Maintenance" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-msg">Message</Label>
          <Textarea id="bc-msg" placeholder="Write your broadcast message..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[100px]" />
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">Broadcast will be sent to all active users as an in-app notification.</p>
        </div>
        <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()} className="w-full gap-2">
          {sending ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
          Send to All Users
        </Button>
      </Card>

      <Separator />

      {/* Past Broadcasts */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Past Broadcasts</h3>
        </div>
        <ScrollArea className="max-h-[420px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                  <Skeleton className="h-4 w-4 rounded mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Megaphone className="h-10 w-10 mb-2" />
              <p className="font-medium">No broadcasts yet</p>
              <p className="text-sm">Send your first broadcast above.</p>
            </div>
          ) : (
            <div className="divide-y">
              {broadcasts.map((b: any, i: number) => {
                const tb = typeBadge(b.type);
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{b.title}</p>
                          <Badge className={`text-[10px] shrink-0 ${tb.color}`}>{tb.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{b.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {b.recipientCount} recipients</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(b.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {pages > 1 && (
          <div className="flex items-center justify-between p-3 border-t">
            <span className="text-xs text-muted-foreground">{total} broadcasts</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-3 text-xs">Page {page} / {pages}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}