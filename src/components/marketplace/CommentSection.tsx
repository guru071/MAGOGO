'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2, Send, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  content: string
  parentId: string | null
  createdAt: string
  user: { id: string; name: string; avatar?: string }
  replies?: Comment[]
}

export default function CommentSection({ promptId }: { promptId: string }) {
  const { user, setShowAuthModal } = useStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/prompts/${promptId}/comments`)
      .then(r => r.json())
      .then(d => { if (d.success) setComments(d.data || []) })
      .catch(e => { console.error('[CommentSection] fetch comments error', e) })
      .finally(() => setLoading(false))
  }, [promptId])

  const submit = async (parentId?: string | null) => {
    if (!user) { setShowAuthModal(true); return }
    if (!input.trim()) return
    const res = await fetch(`/api/prompts/${promptId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input, parentId: parentId || null }),
    })
    const json = await res.json()
    if (json.success) {
      setComments(prev => [json.data, ...prev])
      setInput('')
      setReplyTo(null)
    }
  }

  const topLevel = comments.filter(c => !c.parentId)
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId)

  return (
    <div className="mt-8">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#0066CC]" /> Comments ({topLevel.length})
      </h3>

      {user ? (
        <div className="flex gap-2 mb-6">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit(replyTo)}
            placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0066CC]" />
          <Button onClick={() => submit(replyTo)} size="sm" className="bg-[#0066CC] text-white">
            <Send className="h-3.5 w-3.5" />
          </Button>
          {replyTo && <Button onClick={() => { setReplyTo(null); setInput('') }} size="sm" variant="outline">Cancel</Button>}
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-6">
          <button onClick={() => setShowAuthModal(true)} className="text-[#0066CC] hover:underline">Sign in</button> to leave a comment
        </p>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#0066CC] mx-auto" /></div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No comments yet. Be the first!</p>
      ) : topLevel.map(c => (
        <div key={c.id} className="mb-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0066CC]/20 to-[#FF6600]/20 flex items-center justify-center text-xs font-bold text-[#0066CC] shrink-0">
              {(c.user.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{c.user.name}</span>
                <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{c.content}</p>
              {user && (
                <button onClick={() => { setReplyTo(c.id); setInput('') }} className="text-xs text-[#0066CC] hover:underline mt-1">Reply</button>
              )}
              {getReplies(c.id).map(r => (
                <div key={r.id} className="flex gap-2 mt-3 ml-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#0066CC]/10 to-[#FF6600]/10 flex items-center justify-center text-[10px] font-bold text-[#0066CC] shrink-0">
                    {(r.user.name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-800">{r.user.name}</span>
                      <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-slate-600">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
