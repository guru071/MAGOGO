'use client'
import { useState } from 'react'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield, Lock, KeyRound, User } from 'lucide-react'
import { toast } from 'sonner'

export default function SecurityPage() {
  const { user, setShowAuthModal } = useStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">Sign in to manage security</h2>
        <p className="text-muted-foreground mt-2 mb-6">Update your password and account settings</p>
        <Button className="bg-[#2874F0] text-white font-bold" onClick={() => setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Fill in all fields')
    }
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase-client')
      const supabase = createSupabaseBrowserClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.email) throw new Error('Not authenticated')

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      })
      if (reauthError) throw new Error('Current password is incorrect')

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-[#2874F0]" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account security and password</p>
        </div>
      </div>

      <Card className="p-6 border-border bg-card rounded-sm">
        <h2 className="font-bold text-foreground mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#2874F0]" /> Change Password
        </h2>
        <p className="text-xs text-muted-foreground mb-6">Use a strong password with at least 6 characters</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Current Password</label>
            <Input type="password" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-card border-input" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">New Password</label>
            <Input type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-card border-input" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Confirm New Password</label>
            <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-card border-input" />
          </div>
          <Button onClick={handleChangePassword} disabled={loading} className="bg-[#2874F0] text-white font-bold rounded-sm">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card rounded-sm mt-6">
        <h2 className="font-bold text-foreground mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#2874F0]" /> Account Information
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="text-foreground font-medium">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Account Type:</span>
            <span className="text-foreground font-medium">{user.role === 'ADMIN' ? 'Administrator' : user.isSeller ? 'Seller' : 'Buyer'}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
