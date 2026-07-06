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
    <div className="bg-white border border-[#F0F0F0] rounded-sm p-6">
      <h3 className="font-semibold text-sm text-[#212121] mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#2874F0]" /> Comments ({topLevel.length})
      </h3>

      {user ? (
        <div className="flex gap-2 mb-6">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit(replyTo)}
            placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
            className="flex-1 text-sm border border-[#E0E0E0] bg-white rounded-sm px-3 py-2 text-[#212121] placeholder:text-[#878787] focus:outline-none focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0]"
            aria-label={replyTo ? 'Write a reply' : 'Write a comment'} />
          <button onClick={() => submit(replyTo)}
            className="bg-[#2874F0] text-white px-3 rounded-sm hover:bg-[#1a5dc7] transition-colors cursor-pointer"
            aria-label="Submit comment">
            <Send className="h-4 w-4" />
          </button>
          {replyTo && <button onClick={() => { setReplyTo(null); setInput('') }}
            className="text-xs text-[#2874F0] hover:underline cursor-pointer">Cancel</button>}
        </div>
      ) : (
        <p className="text-sm text-[#878787] mb-6">
          <button onClick={() => setShowAuthModal(true)} className="text-[#2874F0] hover:underline font-medium cursor-pointer">Sign in</button> to leave a comment
        </p>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#2874F0] mx-auto" /></div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-[#878787] text-center py-6">No comments yet. Be the first!</p>
      ) : topLevel.map(c => (
        <div key={c.id} className="mb-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-[#F1F3F6] flex items-center justify-center text-xs font-bold text-[#2874F0] shrink-0">
              {(c.user.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#212121]">{c.user.name}</span>
                <span className="text-xs text-[#878787]">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-[#212121] mt-0.5">{c.content}</p>
              {user && (
                <button onClick={() => { setReplyTo(c.id); setInput('') }}
                  className="text-xs text-[#2874F0] hover:underline mt-1 cursor-pointer">Reply</button>
              )}
              {getReplies(c.id).map(r => (
                <div key={r.id} className="flex gap-2 mt-3 ml-2">
                  <div className="h-6 w-6 rounded-full bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#2874F0] shrink-0">
                    {(r.user.name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#212121]">{r.user.name}</span>
                      <span className="text-xs text-[#878787]">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-[#212121]">{r.content}</p>
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
