'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store/marketplace'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react'

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, login, register, fetchMe } = useStore()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

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
        const success = await register({ email, password, name })
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="pl-9" />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-9" />
            </div>
          </div>
          <div>
            <Label htmlFor="auth-password">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} className="pl-9" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#0066CC] hover:bg-[#0055AA] text-white font-semibold h-11">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <div className="text-center text-sm text-slate-500">
          {authMode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => setAuthMode('register')} className="text-[#0066CC] font-medium hover:underline">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setAuthMode('login')} className="text-[#0066CC] font-medium hover:underline">Sign in</button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
