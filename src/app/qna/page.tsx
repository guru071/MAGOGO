'use client'
import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MessageCircle, Search, Send, X, ThumbsUp, ThumbsDown, Clock, CheckCircle, TrendingUp, Award, Sparkles, Filter, Eye, MessageSquare, Star, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

const TAGS = ['midjourney', 'chatgpt', 'pricing', 'technical', 'dalle', 'stable-diffusion', 'prompt-engineering', 'api', 'beginner', 'advanced', 'troubleshooting', 'comparison']

const TAG_COLORS: Record<string, string> = {
  midjourney: 'bg-purple-100 text-purple-700 border-purple-200',
  chatgpt: 'bg-green-100 text-green-700 border-green-200',
  pricing: 'bg-amber-100 text-amber-700 border-amber-200',
  technical: 'bg-blue-100 text-blue-700 border-blue-200',
  dalle: 'bg-pink-100 text-pink-700 border-pink-200',
  'stable-diffusion': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'prompt-engineering': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  api: 'bg-red-100 text-red-700 border-red-200',
  beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  advanced: 'bg-violet-100 text-violet-700 border-violet-200',
  troubleshooting: 'bg-orange-100 text-orange-700 border-orange-200',
  comparison: 'bg-teal-100 text-teal-700 border-teal-200',
}

function getReputation(questionCount: number, totalVotes: number) {
  const score = questionCount * 10 + totalVotes
  if (score >= 100) return { level: 'Gold', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '🥇' }
  if (score >= 40) return { level: 'Silver', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: '🥈' }
  if (score >= 10) return { level: 'Bronze', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: '🥉' }
  return null
}

function getTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function QnAPage() {
  const { user } = useStore()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortTab, setSortTab] = useState('newest')
  const [showAsk, setShowAsk] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [selectedQ, setSelectedQ] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answering, setAnswering] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  const [localVotes, setLocalVotes] = useState<Record<string, { up: Set<string>; down: Set<string> }>>({})
  const [localAnswerVotes, setLocalAnswerVotes] = useState<Record<string, { up: Set<string>; down: Set<string> }>>({})
  const [acceptedAnswers, setAcceptedAnswers] = useState<Record<string, string>>({})
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/qna')
      const d = await res.json()
      if (d.success && Array.isArray(d.data) && d.data.length > 0) {
        const mapped = d.data.map((q: any) => ({
          id: q.id,
          title: q.question || q.title || '',
          body: q.question || q.body || '',
          tags: [],
          answer: q.answerText ? { id: 'api-answer-' + q.id, text: q.answerText, author: q.answer?.name || 'Staff', createdAt: q.updatedAt, votes: 0, isAccepted: false } : null,
          author: q.author?.name || 'Anonymous',
          authorAvatar: q.author?.avatar || null,
          createdAt: q.createdAt,
          answers: q.answerText ? [{ id: 'api-answer-' + q.id, text: q.answerText, author: q.answer?.name || 'Staff', createdAt: q.updatedAt, votes: 0, isAccepted: false }] : [],
        }))
        setQuestions(mapped)
        localStorage.setItem('qna_questions', JSON.stringify(mapped))
      } else {
        setQuestions([])
        localStorage.setItem('qna_questions', JSON.stringify([]))
      }
    } catch (e) {
      console.error('[qna] fetchQuestions error', e)
      try {
        const saved = localStorage.getItem('qna_questions')
        if (saved) setQuestions(JSON.parse(saved))
      } catch (e2) { console.error('[qna] localStorage parse error', e2) }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    if (questions.length > 0 && !loading) {
      localStorage.setItem('qna_questions', JSON.stringify(questions))
    }
  }, [questions, loading])

  const handleAsk = async () => {
    if (!title.trim() || !body.trim()) return toast.error('Fill in all fields')
    setSubmitting(true)
    const newQ = {
      id: 'q_' + Date.now(),
      title: title.trim(),
      body: body.trim(),
      tags: selectedTags,
      author: user?.name || 'Anonymous',
      authorAvatar: user?.avatar || null,
      createdAt: new Date().toISOString(),
      votes: 0,
      views: 0,
      answers: [],
      acceptedAnswerId: null,
    }
    try {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), promptId: 'general' }),
      })
      const d = await res.json()
      if (d.success) newQ.id = d.data?.id || newQ.id
    } catch (e) {
      console.error('[qna] handleAsk error', e)
    }
    setQuestions(prev => [newQ, ...prev])
    toast.success('Question posted')
    setShowAsk(false)
    setTitle('')
    setBody('')
    setSelectedTags([])
    setSubmitting(false)
  }

  const handleAnswer = async (qId: string) => {
    if (!answerText.trim()) return toast.error('Write an answer')
    setAnswering(true)
    const newAnswer = {
      id: 'a_' + Date.now(),
      text: answerText.trim(),
      author: user?.name || 'Anonymous',
      authorAvatar: user?.avatar || null,
      createdAt: new Date().toISOString(),
      votes: 0,
      isAccepted: false,
    }
    try {
      const res = await fetch('/api/qna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, answer: answerText.trim() }),
      })
      const d = await res.json()
      if (d.success) newAnswer.id = d.data?.id || newAnswer.id
    } catch (e) {
      console.error('[qna] handleAnswer error', e)
    }
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, answers: [...q.answers, newAnswer] } : q))
    toast.success('Answer posted')
    setAnswerText('')
    setSelectedQ(null)
    setAnswering(false)
  }

  const handleVote = (qId: string, type: 'up' | 'down') => {
    if (!user) return toast.error('Please login to vote')
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q
      const votes = localVotes[q.id] || { up: new Set(), down: new Set() }
      const up = new Set(votes.up)
      const down = new Set(votes.down)
      if (type === 'up') {
        if (up.has(user.id)) return q
        up.add(user.id)
        down.delete(user.id)
      } else {
        if (down.has(user.id)) return q
        down.add(user.id)
        up.delete(user.id)
      }
      setLocalVotes(prev => ({ ...prev, [qId]: { up, down } }))
      return { ...q, votes: up.size - down.size }
    }))
  }

  const handleAnswerVote = (qId: string, aId: string, type: 'up' | 'down') => {
    if (!user) return toast.error('Please login to vote')
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q
      return {
        ...q,
        answers: q.answers.map((a: any) => {
          if (a.id !== aId) return a
          const key = qId + '_' + aId
          const votes = localAnswerVotes[key] || { up: new Set(), down: new Set() }
          const up = new Set(votes.up)
          const down = new Set(votes.down)
          if (type === 'up') {
            if (up.has(user.id)) return a
            up.add(user.id)
            down.delete(user.id)
          } else {
            if (down.has(user.id)) return a
            down.add(user.id)
            up.delete(user.id)
          }
          setLocalAnswerVotes(prev => ({ ...prev, [key]: { up, down } }))
          return { ...a, votes: up.size - down.size }
        }),
      }
    }))
  }

  const handleAcceptAnswer = (qId: string, aId: string) => {
    if (!user) return toast.error('Please login')
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q
      return {
        ...q,
        acceptedAnswerId: q.acceptedAnswerId === aId ? null : aId,
        answers: q.answers.map((a: any) => ({ ...a, isAccepted: a.id === aId ? !a.isAccepted : false })),
      }
    }))
    setAcceptedAnswers(prev => ({
      ...prev,
      [qId]: prev[qId] === aId ? '' : aId,
    }))
    toast.success(acceptedAnswers[qId] === aId ? 'Answer unmarked as accepted' : 'Answer marked as accepted')
  }

  const handleView = (qId: string) => {
    setViewCounts(prev => ({ ...prev, [qId]: (prev[qId] || 0) + 1 }))
  }

  const handleAiSuggest = async (qTitle: string, qId: string) => {
    if (!user) return toast.error('Please login')
    setAiSuggesting(qId)
    setAiSuggestion('')
    try {
      const res = await fetch(`/api/ai/search/suggest?query=${encodeURIComponent(qTitle)}&top_n=1`)
      const d = await res.json()
      if (d.success && d.data?.suggestions?.length > 0) {
        setAiSuggestion(d.data.suggestions[0])
      } else {
        setAiSuggestion('Based on common community knowledge, consider checking the documentation for best practices related to "' + qTitle + '". You may want to provide more context about your specific use case for a more tailored answer.')
      }
    } catch (e) {
      console.error('[qna] handleAiSuggest error', e)
      setAiSuggestion('AI service unavailable. Common approaches: 1) Check the prompt marketplace for similar examples. 2) Review the documentation for the AI tool you are using. 3) Experiment with different parameter values.')
    } finally {
      setAiSuggesting(null)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const filteredQuestions = useMemo(() => {
    let result = [...questions]

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(q =>
        q.title?.toLowerCase().includes(s) ||
        q.body?.toLowerCase().includes(s) ||
        q.tags?.some((t: string) => t.includes(s))
      )
    }

    if (categoryFilter !== 'all') {
      result = result.filter(q => q.tags?.includes(categoryFilter))
    }

    switch (sortTab) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'votes':
        result.sort((a, b) => (b.votes || 0) - (a.votes || 0))
        break
      case 'unanswered':
        result = result.filter(q => !q.answers || q.answers.length === 0)
        break
      case 'trending':
        result.sort((a, b) => {
          const aScore = (a.votes || 0) * 3 + (a.answers?.length || 0) * 5 + (viewCounts[a.id] || 0) * 0.5
          const bScore = (b.votes || 0) * 3 + (b.answers?.length || 0) * 5 + (viewCounts[b.id] || 0) * 0.5
          return bScore - aScore
        })
        break
    }

    return result
  }, [questions, search, categoryFilter, sortTab, viewCounts])

  const userQuestionCount = questions.filter(q => q.author === user?.name).length
  const userTotalVotes = questions
    .filter(q => q.author === user?.name)
    .reduce((sum, q) => sum + (q.votes || 0), 0)
  const reputation = getReputation(userQuestionCount, userTotalVotes)

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#0066CC] mx-auto" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-[#0066CC]" /> Community Q&A
            </h1>
            {reputation && (
              <Badge variant="outline" className={`${reputation.color} text-xs px-2 py-0.5`}>
                {reputation.icon} {reputation.level} Questioner
              </Badge>
            )}
          </div>
          <p className="text-slate-500 text-sm">Ask questions, share knowledge, and level up your prompt engineering skills</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs px-3 py-1.5">
            <MessageSquare className="h-3 w-3 mr-1" /> {questions.length} questions
          </Badge>
          {user && (
            <Button onClick={() => setShowAsk(!showAsk)} className="bg-[#0066CC] text-white whitespace-nowrap">
              {showAsk ? <X className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {showAsk ? 'Cancel' : 'Ask Question'}
            </Button>
          )}
        </div>
      </div>

      {/* Ask form */}
      {showAsk && (
        <Card className="p-6 border-slate-200 shadow-sm mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-bold text-slate-800 mb-4">Ask the Community</h3>
          <div className="space-y-4">
            <Input placeholder="What is your question about?" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Describe your question in detail. Include what you have tried, what AI tool you are using, and any relevant context..." rows={4} value={body} onChange={e => setBody(e.target.value)} />
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Tags (click to select):</p>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-[#0066CC] text-white border-[#0066CC]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066CC] hover:text-[#0066CC]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleAsk} disabled={submitting || !title.trim() || !body.trim()} className="bg-[#0066CC] text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Post Question
              </Button>
              {selectedTags.length > 0 && (
                <span className="text-xs text-slate-400">{selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search questions, tags, or content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TAGS.map(tag => (
              <SelectItem key={tag} value={tag}>{tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort tabs */}
      <Tabs value={sortTab} onValueChange={setSortTab} className="mb-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="newest" className="text-xs"><Clock className="h-3.5 w-3.5 mr-1.5" />Newest</TabsTrigger>
          <TabsTrigger value="votes" className="text-xs"><ThumbsUp className="h-3.5 w-3.5 mr-1.5" />Most Votes</TabsTrigger>
          <TabsTrigger value="unanswered" className="text-xs"><MessageCircle className="h-3.5 w-3.5 mr-1.5" />Unanswered</TabsTrigger>
          <TabsTrigger value="trending" className="text-xs"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Trending</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Questions list */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-lg">
              {search || categoryFilter !== 'all' ? 'No matching questions found' : 'No questions yet'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {search || categoryFilter !== 'all' ? 'Try a different search or filter' : 'Be the first to ask a question!'}
            </p>
          </div>
        ) : filteredQuestions.map(q => {
          const isExpanded = expandedQ === q.id
          const answerCount = q.answers?.length || 0
          const hasAccepted = q.answers?.some((a: any) => a.isAccepted)
          const voteKey = q.id
          const userVotes = localVotes[voteKey] || { up: new Set(), down: new Set() }

          return (
            <Card
              key={q.id}
              className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setExpandedQ(isExpanded ? null : q.id); handleView(q.id) }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 min-w-[48px] pt-0.5">
                    <button
                      onClick={e => { e.stopPropagation(); handleVote(q.id, 'up') }}
                      className={`p-1.5 rounded-full transition-colors ${
                        userVotes.up.has(user?.id || '') ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <span className={`text-sm font-bold ${q.votes > 0 ? 'text-green-600' : q.votes < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                      {q.votes || 0}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleVote(q.id, 'down') }}
                      className={`p-1.5 rounded-full transition-colors ${
                        userVotes.down.has(user?.id || '') ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Status + tags row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${
                        hasAccepted
                          ? 'text-green-600 border-green-200 bg-green-50'
                          : answerCount > 0
                            ? 'text-blue-600 border-blue-200 bg-blue-50'
                            : 'text-amber-600 border-amber-200 bg-amber-50'
                      }`}>
                        {hasAccepted ? <CheckCircle className="h-3 w-3 mr-0.5" /> : answerCount > 0 ? <MessageSquare className="h-3 w-3 mr-0.5" /> : <Clock className="h-3 w-3 mr-0.5" />}
                        {hasAccepted ? 'Answered' : answerCount > 0 ? `${answerCount} answer${answerCount > 1 ? 's' : ''}` : 'Open'}
                      </Badge>
                      {q.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline" className={`text-[10px] border px-1.5 py-0 ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{q.title}</h3>
                    <p className={`text-sm text-slate-600 mt-1.5 ${isExpanded ? '' : 'line-clamp-2'}`}>{q.body}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#0066CC]/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#0066CC]">
                            {(q.author || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-slate-500">{q.author || 'Anonymous'}</span>
                        {getReputation(
                          questions.filter(x => x.author === q.author).length,
                          questions.filter(x => x.author === q.author).reduce((s, x) => s + (x.votes || 0), 0)
                        ) && (
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
                            getReputation(
                              questions.filter(x => x.author === q.author).length,
                              questions.filter(x => x.author === q.author).reduce((s, x) => s + (x.votes || 0), 0)
                            )?.color || ''
                          }`}>
                            {getReputation(
                              questions.filter(x => x.author === q.author).length,
                              questions.filter(x => x.author === q.author).reduce((s, x) => s + (x.votes || 0), 0)
                            )?.icon} {getReputation(
                              questions.filter(x => x.author === q.author).length,
                              questions.filter(x => x.author === q.author).reduce((s, x) => s + (x.votes || 0), 0)
                            )?.level}
                          </Badge>
                        )}
                      </div>
                      <span>·</span>
                      <span>{getTimeAgo(q.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{viewCounts[q.id] || q.views || 0}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{answerCount}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{q.votes || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded section: answers */}
                {isExpanded && (
                  <div className="mt-5 border-t border-slate-100 pt-4 space-y-4" onClick={e => e.stopPropagation()}>
                    {/* AI Suggest button */}
                    {user && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={async (e) => { e.stopPropagation(); await handleAiSuggest(q.title, q.id) }}
                          disabled={aiSuggesting === q.id}
                        >
                          {aiSuggesting === q.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                          AI Suggest Answer
                        </Button>
                      </div>
                    )}
                    {aiSuggestion && aiSuggesting !== q.id && (
                      <Card className="p-4 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">AI Suggestion</span>
                        </div>
                        <p className="text-sm text-slate-700">{aiSuggestion}</p>
                      </Card>
                    )}

                    {/* Answers */}
                    {q.answers?.map((a: any) => {
                      const aKey = q.id + '_' + a.id
                      const aUserVotes = localAnswerVotes[aKey] || { up: new Set(), down: new Set() }
                      return (
                        <div key={a.id} className={`p-4 rounded-xl border-2 transition-colors ${
                          a.isAccepted
                            ? 'border-green-400 bg-green-50/50'
                            : 'border-slate-100 bg-slate-50/50'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={e => { e.stopPropagation(); handleAnswerVote(q.id, a.id, 'up') }}
                                className={`p-1 rounded transition-colors ${
                                  aUserVotes.up.has(user?.id || '') ? 'text-green-600' : 'text-slate-300 hover:text-green-600'
                                }`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <span className={`text-xs font-bold ${a.votes > 0 ? 'text-green-600' : a.votes < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {a.votes || 0}
                              </span>
                              <button
                                onClick={e => { e.stopPropagation(); handleAnswerVote(q.id, a.id, 'down') }}
                                className={`p-1 rounded transition-colors ${
                                  aUserVotes.down.has(user?.id || '') ? 'text-red-500' : 'text-slate-300 hover:text-red-500'
                                }`}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-slate-700">{a.author || 'Anonymous'}</span>
                                <span className="text-[10px] text-slate-400">· {getTimeAgo(a.createdAt)}</span>
                                {a.isAccepted && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0">
                                    <CheckCircle className="h-3 w-3 mr-0.5" /> Accepted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{a.text}</p>
                              {user && q.author === user?.name && !a.isAccepted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={e => { e.stopPropagation(); handleAcceptAnswer(q.id, a.id) }}
                                >
                                  <Star className="h-3 w-3 mr-1" /> Mark as Accepted
                                </Button>
                              )}
                              {user && q.author === user?.name && a.isAccepted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={e => { e.stopPropagation(); handleAcceptAnswer(q.id, a.id) }}
                                >
                                  <X className="h-3 w-3 mr-1" /> Unmark Accepted
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Answer form */}
                    {user && selectedQ === q.id && (
                      <div className="space-y-2 pt-2">
                        <Textarea placeholder="Write your answer..." rows={3} value={answerText} onChange={e => setAnswerText(e.target.value)} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAnswer(q.id)} disabled={answering || !answerText.trim()} className="bg-[#0066CC] text-white">
                            {answering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Submit Answer
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedQ(null); setAnswerText('') }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    {user && selectedQ !== q.id && (
                      <Button variant="ghost" size="sm" className="text-xs text-[#0066CC]" onClick={() => setSelectedQ(q.id)}>
                        <MessageSquare className="h-3 w-3 mr-1.5" /> Write an answer
                      </Button>
                    )}
                    {!user && (
                      <p className="text-xs text-slate-400 italic">Please log in to answer questions</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
