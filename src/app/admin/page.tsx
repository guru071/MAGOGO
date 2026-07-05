'use client'

import { useEffect, useState } from 'react'
import AdminPanel from '@/components/admin/AdminPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { toast } from 'sonner'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

export default function AdminPage() {
  const [session, setSession] = useState<any | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadAdminSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { session: activeSession } } = await supabase.auth.getSession()

        if (!activeSession) {
          setSession(null)
          setUser(null)
          return
        }

        const res = await fetch('/api/auth/me')
        const json = await res.json()
        if (cancelled) return

        if (json.success && json.data.role === 'ADMIN') {
          setSession(activeSession)
          setUser(json.data)
          return
        }
      } catch (e) { console.error('[admin] AdminPage:', e); } finally {
        if (!cancelled) setLoading(false)
      }

      if (!cancelled) {
        setSession(null)
        setUser(null)
      }
    }

    loadAdminSession()

    return () => { cancelled = true }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Login failed'); return }

      const me = await fetch('/api/auth/me')
      const meJson = await me.json()
      if (!meJson.success || meJson.data.role !== 'ADMIN') {
        toast.error('Access denied. Admin only.')
        return
      }
      setSession(json.data.supabaseSession)
      setUser(meJson.data)
      toast.success('Welcome back, Admin!')
    } catch (e) { console.error('[admin] AdminPage:', e);
      toast.error('Login failed')
    } finally {
      setSigningIn(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setSession(null)
    setUser(null)
    toast.success('Logged out')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center relative z-10"><Loader2 className="h-8 w-8 animate-spin text-neon-blue" /></div>
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              <div className="h-20 w-20 rounded-2xl bg-black/40 border border-white/20 shadow-[0_0_20px_rgba(0,210,255,0.3)] flex items-center justify-center overflow-hidden p-2 relative backdrop-blur-xl">
                <Image src="/logo.jpeg" alt="MAGHGO" fill className="object-contain" priority sizes="80px" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">MAGHGO</h1>
            <p className="text-white/60 mt-1 text-sm font-medium">Admin Control Panel</p>
          </div>
          <Card className="glass-panel p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-4 w-4 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.8)]" />
              <h2 className="font-semibold text-white">Admin Sign In</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-email" className="text-white/70 font-bold ml-1">Email</Label>
                <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11" />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-white/70 font-bold ml-1">Password</Label>
                <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="mt-1.5 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11" />
              </div>
              <Button type="submit" disabled={signingIn} className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-extrabold h-11 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all">
                {signingIn && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Card>
          <Link href="/">
            <div className="flex items-center justify-center mt-6 gap-1.5 text-xs text-white/50 hover:text-white hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] transition-all">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </div>
          </Link>
        </motion.div>
      </div>
    )
  }

  return <AdminPanel token={session.access_token as string} user={user} onLogout={handleLogout} />
}
