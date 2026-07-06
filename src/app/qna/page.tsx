'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { MessageSquare, Search, ArrowLeft, ChevronRight, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface QnaItem {
  id: string
  promptId: string
  prompt: { id: string; title: string; slug: string }
  question: string
  answerText?: string | null
  answer?: { id: string; name: string } | null
  author: { id: string; name: string; avatar?: string | null }
  createdAt: string
}

export default function QnaPage() {
  const [qnas, setQnas] = useState<QnaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/qna?promptId=all')
      .then(r => r.json())
      .then(d => { if (d.success) setQnas(d.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? qnas.filter(q => q.question.toLowerCase().includes(search.toLowerCase()) || q.prompt?.title?.toLowerCase().includes(search.toLowerCase()))
    : qnas

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Support
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="h-8 w-8 text-neon-blue" />
          <h1 className="text-3xl font-extrabold text-foreground">Community Q&A</h1>
        </div>
        <p className="text-muted-foreground mb-8">Browse questions and answers from the MAGHGO community.</p>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or prompts..."
            className="pl-12 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl"
          />
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin text-neon-blue mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 glass-panel-heavy rounded-3xl p-12 border-border">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">No questions found</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to ask a question on a prompt page!</p>
            <Link href="/browse"><Button className="mt-6 bg-neon-blue text-white rounded-full">Browse Prompts</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(qna => (
              <div key={qna.id} className="glass-panel-heavy border-border rounded-2xl p-6 transition-all hover:border-neon-blue/30">
                <Link href={`/prompt/${qna.promptId}`} className="text-xs text-neon-blue font-semibold mb-2 flex items-center gap-1 hover:underline">
                  {qna.prompt?.title || 'View Prompt'} <ChevronRight className="h-3 w-3" />
                </Link>
                <p className="font-semibold text-foreground mb-1">{qna.question}</p>
                <p className="text-xs text-muted-foreground mb-3">Asked by {qna.author?.name || 'Customer'} &middot; {new Date(qna.createdAt).toLocaleDateString()}</p>
                {qna.answerText ? (
                  <div className="mt-3 p-4 bg-muted rounded-xl border border-border flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-neon-blue shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground">{qna.answerText}</p>
                      <p className="text-xs text-muted-foreground mt-1">Answered by {qna.answer?.name || 'Seller'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Awaiting answer</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
