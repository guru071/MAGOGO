'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Loader2, MessageSquare, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminComments({ token }: { token: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        fetch(`/api/admin/comments?token=${token}`).then(r => r.json()),
        fetch(`/api/admin/reviews?token=${token}`).then(r => r.json())
      ]);
      if (cRes.success) setComments(cRes.data.comments);
      if (rRes.success) setReviews(rRes.data.reviews);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/admin/comments?id=${id}&token=${token}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Comment deleted');
        setComments(comments.filter(c => c.id !== id));
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Deletion failed');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}&token=${token}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Review deleted');
        setReviews(reviews.filter(r => r.id !== id));
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
          <h2 className="text-2xl font-bold">Comments & Reviews</h2>
          <p className="text-slate-500">Moderate user feedback on prompts</p>
        </div>
        <Button onClick={fetchAll} variant="outline">Refresh</Button>
      </div>

      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comments" className="mt-4">
          <div className="grid gap-4">
            {comments.length === 0 ? (
              <Card className="p-8 text-center text-slate-500">No comments found</Card>
            ) : (
              comments.map(c => (
                <Card key={c.id} className="p-4 flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{c.user?.name} <span className="text-slate-400 font-normal">on</span> {c.prompt?.title}</p>
                        <p className="text-sm text-slate-500">{formatDistanceToNow(new Date(c.createdAt))} ago</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteComment(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-slate-700">{c.content}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="grid gap-4">
            {reviews.length === 0 ? (
              <Card className="p-8 text-center text-slate-500">No reviews found</Card>
            ) : (
              reviews.map(r => (
                <Card key={r.id} className="p-4 flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{r.user?.name} <span className="text-slate-400 font-normal">on</span> {r.prompt?.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                          <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(r.createdAt))} ago</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteReview(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {r.comment && <p className="mt-2 text-slate-700">{r.comment}</p>}
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
