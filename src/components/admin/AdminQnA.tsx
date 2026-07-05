'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Loader2, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminQnA({ token }: { token: string }) {
  const [qnas, setQnas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQnas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/qna?token=${token}`);
      const json = await res.json();
      if (json.success) setQnas(json.data.qnas);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load Q&A');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQnas();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Q&A entry?')) return;
    try {
      const res = await fetch(`/api/admin/qna?id=${id}&token=${token}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Q&A deleted');
        setQnas(qnas.filter(q => q.id !== id));
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Deletion failed');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neon-blue" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Community Q&A</h2>
          <p className="text-white/60">Moderate questions and answers across the marketplace</p>
        </div>
        <Button onClick={fetchQnas} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white">Refresh</Button>
      </div>

      <div className="grid gap-4">
        {qnas.length === 0 ? (
          <Card className="glass-panel p-8 text-center text-white/50">No Q&A entries found</Card>
        ) : (
          qnas.map(q => (
            <Card key={q.id} className="glass-panel p-4 flex gap-4 items-start shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
              <div className="h-10 w-10 rounded-xl bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{q.author?.name} <span className="text-white/40 font-normal">asked about</span> {q.prompt?.title}</p>
                    <p className="text-sm text-white/50">{formatDistanceToNow(new Date(q.createdAt))} ago</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="font-bold text-white">Q: {q.question}</p>
                </div>
                {q.answerText && (
                  <div className="mt-2 p-3 bg-neon-blue/10 rounded-xl border border-neon-blue/20">
                    <p className="text-sm text-white/50 mb-1 font-bold">Answered by {q.answer?.name}</p>
                    <p className="text-white/90">A: {q.answerText}</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
