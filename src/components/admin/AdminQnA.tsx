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

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Community Q&A</h2>
          <p className="text-slate-500">Moderate questions and answers across the marketplace</p>
        </div>
        <Button onClick={fetchQnas} variant="outline">Refresh</Button>
      </div>

      <div className="grid gap-4">
        {qnas.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">No Q&A entries found</Card>
        ) : (
          qnas.map(q => (
            <Card key={q.id} className="p-4 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{q.author?.name} <span className="text-slate-400 font-normal">asked about</span> {q.prompt?.title}</p>
                    <p className="text-sm text-slate-500">{formatDistanceToNow(new Date(q.createdAt))} ago</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <p className="font-semibold text-slate-900">Q: {q.question}</p>
                </div>
                {q.answerText && (
                  <div className="mt-2 p-3 bg-[#0066CC]/5 rounded-md border border-[#0066CC]/10">
                    <p className="text-sm text-slate-500 mb-1">Answered by {q.answer?.name}</p>
                    <p className="text-slate-700">A: {q.answerText}</p>
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
