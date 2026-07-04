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
        <Shield className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sign in to manage security</h2>
        <p className="text-slate-500 mt-2 mb-6">Update your password and account settings</p>
        <Button className="bg-[#0066CC] text-white" onClick={() => setShowAuthModal(true)}>Sign In</Button>
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
        <Shield className="h-8 w-8 text-[#0066CC]" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
          <p className="text-sm text-slate-500">Manage your account security and password</p>
        </div>
      </div>

      <Card className="p-6 border-slate-200">
        <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#0066CC]" /> Change Password
        </h2>
        <p className="text-xs text-slate-400 mb-6">Use a strong password with at least 6 characters</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Current Password</label>
            <Input type="password" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">New Password</label>
            <Input type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Confirm New Password</label>
            <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={loading} className="bg-[#0066CC] text-white">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-slate-200 mt-6">
        <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#0066CC]" /> Account Information
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Email:</span>
            <span className="text-slate-800 font-medium">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Account Type:</span>
            <span className="text-slate-800 font-medium">{user.role === 'ADMIN' ? 'Administrator' : user.isSeller ? 'Seller' : 'Buyer'}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}