'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/marketplace'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user } = useStore()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.resolve().then(() => setLoading(true))
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { if (d.success) setNotifications(d.data || []) })
      .catch(e => { console.error('[NotificationBell] fetch notifications error', e) })
      .finally(() => setLoading(false))

    // Real-time subscription
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Notification', filter: `userId=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    await Promise.all(unread.map(n =>
      fetch(`/api/notifications/${n.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) })
    ))
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
        <Bell className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-neon-pink text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(255,0,128,0.5)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-panel-heavy border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 max-h-96 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
            <span className="font-bold text-sm text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-neon-blue font-bold hover:underline drop-shadow-[0_0_5px_rgba(0,210,255,0.4)] flex items-center gap-1">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 bg-black/40">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-neon-blue mx-auto" /></div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-sm">No notifications yet</div>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/10 cursor-pointer transition-colors ${!n.isRead ? 'bg-neon-blue/10' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-neon-blue shadow-[0_0_5px_rgba(0,210,255,0.8)]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{n.title}</p>
                    <p className="text-xs text-white/70 line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
