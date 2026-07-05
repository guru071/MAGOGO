'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/marketplace'
import {
  MessageCircle, X, Send, Loader2, Trash2,
  Headset, MessageSquare, Ticket, Download,
  Check, CheckCheck
} from 'lucide-react'
import { toast } from 'sonner'

type MessageStatus = 'sending' | 'sent' | 'seen'

interface ChatMessage {
  id?: string
  content: string
  role: string
  createdAt?: string
  status?: MessageStatus
  senderId?: string
}

const CANNED_RESPONSES = [
  "Hello! 👋",
  "Thanks for your message",
  "I need help with...",
  "Can you clarify?",
]

const QUICK_ACTIONS = [
  { label: 'Report Issue', template: "I'd like to report an issue with..." },
  { label: 'Request Refund', template: "I'd like to request a refund for order #..." },
  { label: 'Seller Inquiry', template: "I have a question about a seller..." },
]

export default function ChatButton() {
  const [open, setOpen] = useState(false)
  const { user } = useStore()

  return (
    <>
      {open && <ChatPanel onClose={() => setOpen(false)} />}
      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-neon-blue hover:bg-neon-blue/80 text-black shadow-xl shadow-[0_0_20px_rgba(0,210,255,0.5)] z-50 transition-all"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </>
  )
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { user, setShowAuthModal } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState<'chat' | 'ticket'>('chat')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const mapMessage = useCallback((m: any, uid?: string): ChatMessage => ({
    ...m,
    role: m.role || (m.senderId === uid ? 'user' : 'support'),
  }), [])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch('/api/chat')
      .then(r => r.json())
      .then(d => {
        if (d.success) setMessages((d.data || []).map((m: any) => mapMessage(m, user.id)))
      })
      .catch(e => { console.error('[ChatButton] fetch messages error', e) })
      .finally(() => setLoading(false))
  }, [user, mapMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const simulateTyping = () => {
    setTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500)
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    if (!user) { setShowAuthModal(true); return }

    let content = input.trim()
    if (mode === 'ticket' && subject.trim()) {
      content = `**Ticket: ${subject.trim()}**\n\n${content}`
    }

    setInput('')
    setSending(true)
    simulateTyping()

    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = { id: tempId, content, role: 'user', status: 'sending' }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const d = await res.json()
      if (d.success) {
        const saved = mapMessage(d.data, user.id)
        setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, status: 'sending' } : m))
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === (saved.id || tempId) ? { ...m, status: 'sent' } : m))
        }, 1000)
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === (saved.id || tempId) ? { ...m, status: 'seen' } : m))
        }, 2000)
      }
    } catch { toast.error('Failed to send message') }
    finally { setSending(false) }
  }

  const handleClear = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' })
      setMessages([])
      toast.success('Chat cleared')
    } catch { toast.error('Failed to clear') }
  }

  const handleDownload = useCallback(() => {
    const lines = messages.map(m => {
      const time = m.createdAt
        ? new Date(m.createdAt).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          })
        : new Date().toLocaleString()
      const sender = m.role === 'user' ? 'You' : 'Support'
      return `[${time}] ${sender}: ${m.content}`
    })
    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Chat exported')
  }, [messages])

  const handleCannedResponse = (text: string) => {
    setInput(prev => prev ? `${prev} ${text}` : text)
  }

  const handleQuickAction = (template: string) => {
    setInput(template)
  }

  // Group consecutive messages from same sender
  const groupedMessages = messages.reduce<{ msgs: ChatMessage[]; role: string }[]>((acc, m) => {
    const last = acc[acc.length - 1]
    if (last && last.role === m.role) {
      last.msgs.push(m)
    } else {
      acc.push({ msgs: [m], role: m.role })
    }
    return acc
  }, [])

  const statusIcon = (status?: MessageStatus) => {
    switch (status) {
      case 'sending': return <Loader2 className="h-3 w-3 animate-spin text-white/60" />
      case 'sent': return <Check className="h-3 w-3 text-white/60" />
      case 'seen': return <CheckCheck className="h-3 w-3 text-blue-300" />
      default: return null
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] glass-panel-heavy border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-black/40 border-b border-white/10 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <Headset className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Support Team</p>
            <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
              Online
            </p>
          </div>
        </div>
        <div className="flex gap-1 text-white/60">
          {messages.length > 0 && (
            <>
              <button onClick={handleDownload} className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors" title="Download Chat">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-white/10 hover:text-neon-pink transition-colors" title="Clear Chat">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex border-b border-white/10 shrink-0 bg-black/40 p-1 gap-1">
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
            mode === 'chat' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={() => setMode('ticket')}
          className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
            mode === 'ticket' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Ticket className="h-3.5 w-3.5" />
          Ticket
        </button>
      </div>

      {/* Subject input (ticket mode) */}
      {mode === 'ticket' && (
        <div className="px-3 pt-3 shrink-0 bg-black/40">
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ticket subject..."
            className="text-xs bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue rounded-xl"
            disabled={sending}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black/40">
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-neon-blue" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/40">
            <MessageCircle className="h-10 w-10 mb-3 text-white/20" />
            <p className="text-sm font-bold text-white/60">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start chatting</p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {group.msgs.map((m, mi) => (
                <div key={m.id || `${gi}-${mi}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${mi > 0 ? 'mt-0.5' : 'mt-2'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm relative ${
                    m.role === 'user'
                      ? 'bg-neon-blue text-black font-medium rounded-br-sm shadow-[0_0_10px_rgba(0,210,255,0.2)]'
                      : 'glass-panel border-white/10 text-white rounded-bl-sm'
                  } ${mi === 0 && m.role === 'support' ? 'ml-2' : ''}`}>
                    {m.content.startsWith('**Ticket:') ? (
                      <div>
                        <p className="font-bold text-xs mb-1 opacity-70">
                          {m.content.split('\n')[0].replace(/\*\*/g, '')}
                        </p>
                        <p>{m.content.split('\n').slice(2).join('\n')}</p>
                      </div>
                    ) : (
                      <p>{m.content}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {m.createdAt && (
                        <span className={`text-[9px] font-bold ${m.role === 'user' ? 'text-black/60' : 'text-white/40'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {m.role === 'user' && m.status && statusIcon(m.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        {typing && (
          <div className="flex justify-start mt-2 ml-2">
            <div className="glass-panel border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="h-1.5 w-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Canned Responses */}
      {user && messages.length > 0 && (
        <div className="px-3 flex gap-1.5 overflow-x-auto shrink-0 pb-2 border-t border-white/10 pt-3 bg-black/40">
          {CANNED_RESPONSES.map((text, i) => (
            <button
              key={i}
              onClick={() => handleCannedResponse(text)}
              className="text-[10px] font-bold whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/10 shrink-0 bg-black/40">
        {user ? (
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === 'ticket' ? 'Describe your issue...' : 'Type a message...'}
              className="flex-1 text-sm bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue rounded-xl h-11"
              disabled={sending}
            />
            <Button type="submit" size="icon" className="bg-neon-blue hover:bg-neon-blue/80 text-black h-11 w-11 rounded-xl shrink-0 shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all" disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        ) : (
          <Button className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-11 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)]" onClick={() => setShowAuthModal(true)}>
            Sign in to chat
          </Button>
        )}

        {/* Quick Actions */}
        {user && messages.length === 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.template)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
