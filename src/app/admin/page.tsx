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
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" /></div>
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center maghgo-gradient p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              <div className="h-20 w-20 rounded-2xl bg-white shadow-xl shadow-black/20 flex items-center justify-center overflow-hidden p-2 relative">
                <Image src="/logo.jpeg" alt="MAGHGO" fill className="object-contain" priority sizes="80px" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">MAGHGO</h1>
            <p className="text-blue-200 mt-1 text-sm font-medium">Admin Control Panel</p>
          </div>
          <Card className="p-6 border-white/10 bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/10">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-4 w-4 text-[#0066CC]" />
              <h2 className="font-semibold text-slate-800">Admin Sign In</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-email" className="text-slate-600 font-medium">Email</Label>
                <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="mt-1.5 bg-slate-50 border-slate-200" />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-slate-600 font-medium">Password</Label>
                <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="mt-1.5 bg-slate-50 border-slate-200" />
              </div>
              <Button type="submit" disabled={signingIn} className="w-full bg-[#0066CC] hover:bg-[#0055AA] text-white h-11">
                {signingIn && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Card>
          <Link href="/">
            <div className="flex items-center justify-center mt-6 gap-1.5 text-xs text-blue-200/80 hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </div>
          </Link>
        </motion.div>
      </div>
    )
  }

  return <AdminPanel token={session.access_token} user={user} onLogout={handleLogout} />
}
