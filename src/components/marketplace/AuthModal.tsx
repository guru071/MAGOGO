'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store/marketplace'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, User as UserIcon, Globe } from 'lucide-react'

const COUNTRIES = [
  'INDIA', 'USA', 'UK', 'EUROPE', 'AUSTRALIA', 
  'CANADA', 'UAE', 'JAPAN', 'BRAZIL', 'NIGERIA'
]

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, login, register, fetchMe } = useStore()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [country, setCountry] = useState('INDIA')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (authMode === 'login') {
        const success = await login(email, password)
        if (success) {
          await fetchMe()
          toast.success('Welcome back!')
          setShowAuthModal(false)
        } else {
          toast.error('Invalid email or password')
        }
      } else {
        if (!name.trim()) { toast.error('Name is required'); setLoading(false); return }
        const success = await register({ email, password, name, country })
        if (success) {
          await login(email, password)
          await fetchMe()
          if (useStore.getState().user) {
            toast.success('Account created! Welcome aboard.')
            setShowAuthModal(false)
          } else {
            toast.success('Account created! Please sign in.')
          }
        } else {
          toast.error('Registration failed. Email may already be in use.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
      <DialogContent className="sm:max-w-md glass-panel-heavy border border-white/20 text-white rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <Label htmlFor="name" className="text-white/70 ml-1">Full Name</Label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11" />
              </div>
            </div>
          )}
          {authMode === 'register' && (
            <div>
              <Label htmlFor="country" className="text-white/70 ml-1">Country</Label>
              <div className="relative mt-1.5">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="pl-9 w-full bg-white/5 border border-white/20 text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11 appearance-none">
                  {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#0f172a] text-white">{c}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="auth-email" className="text-white/70 ml-1">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11" />
            </div>
          </div>
          <div>
            <Label htmlFor="auth-password" className="text-white/70 ml-1">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl h-11" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 mt-2 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <div className="text-center text-sm text-white/50 pt-2">
          {authMode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => setAuthMode('register')} className="text-neon-blue font-bold hover:underline drop-shadow-[0_0_5px_rgba(0,210,255,0.4)] transition-all">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setAuthMode('login')} className="text-neon-blue font-bold hover:underline drop-shadow-[0_0_5px_rgba(0,210,255,0.4)] transition-all">Sign in</button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
