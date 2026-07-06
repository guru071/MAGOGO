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
      <DialogContent className="sm:max-w-md bg-card border-border p-8 rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <Label htmlFor="name" className="text-muted-foreground ml-1">Full Name</Label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary h-11 rounded-sm" />
              </div>
            </div>
          )}
          {authMode === 'register' && (
            <div>
              <Label htmlFor="country" className="text-muted-foreground ml-1">Country</Label>
              <div className="relative mt-1.5">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="pl-9 w-full bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary h-11 appearance-none rounded-sm">
                  {COUNTRIES.map(c => <option key={c} value={c} className="bg-background text-foreground">{c}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="auth-email" className="text-muted-foreground ml-1">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary h-11 rounded-sm" />
            </div>
          </div>
          <div>
            <Label htmlFor="auth-password" className="text-muted-foreground ml-1">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary h-11 rounded-sm" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 mt-2 rounded-sm transition-all">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
        </div>
        <button
          onClick={() => useStore.getState().signInWithGoogle()}
          className="w-full flex items-center justify-center gap-3 bg-card hover:bg-muted text-foreground font-medium h-12 rounded-sm border border-border transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <div className="text-center text-sm text-muted-foreground pt-2">
          {authMode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => setAuthMode('register')} className="text-primary font-bold hover:underline transition-all">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setAuthMode('login')} className="text-primary font-bold hover:underline transition-all">Sign in</button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
