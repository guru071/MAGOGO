'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function AccountSettingsPage() {
  const { user, fetchMe } = useStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    bio: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    upiId: '',
    paypalEmail: '',
    paymentMethod: 'BANK_TRANSFER'
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        bankName: user.bankName || '',
        bankAccount: user.bankAccount || '',
        bankIfsc: user.bankIfsc || '',
        upiId: user.upiId || '',
        paypalEmail: user.paypalEmail || '',
        paymentMethod: user.paymentMethod || 'BANK_TRANSFER'
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Settings saved successfully')
        fetchMe()
      } else {
        toast.error(json.error || 'Failed to save settings')
      }
    } catch (e) {
      console.error('Settings save error', e)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 relative z-10">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-8 transition-colors glass-panel px-4 py-2 rounded-full border-white/10">
        <ArrowLeft className="h-4 w-4" /> Back to Account
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Account Settings</h1>

      <Card className="p-8 neon-border glass-panel-heavy border-white/10 rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3">Profile Information</h2>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <Input id="name" value={form.name} onChange={e => handleChange('name', e.target.value)} required className="bg-white/5 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white/70">Bio</Label>
              <Input id="bio" value={form.bio} onChange={e => handleChange('bio', e.target.value)} className="bg-white/5 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" />
            </div>
          </div>

          {user.isSeller && (
            <div className="space-y-5 pt-6 mt-6 border-t border-white/10">
              <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3">Payout Details (RazorpayX)</h2>
              <p className="text-sm text-white/50">
                Provide your bank details to receive automated 10-day payouts via RazorpayX.
              </p>
              
              <div className="space-y-2">
                <Label className="text-white/70">Preferred Payout Method</Label>
                <div className="flex gap-4 mt-2">
                  <button type="button" onClick={() => handleChange('paymentMethod', 'BANK_TRANSFER')} className={`flex-1 p-4 rounded-xl border-2 text-sm font-bold transition-all ${form.paymentMethod === 'BANK_TRANSFER' ? 'border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,210,255,0.2)]' : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white glass-panel'}`}>
                    Bank Transfer (IMPS/NEFT)
                  </button>
                  <button type="button" onClick={() => handleChange('paymentMethod', 'UPI')} className={`flex-1 p-4 rounded-xl border-2 text-sm font-bold transition-all ${form.paymentMethod === 'UPI' ? 'border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,210,255,0.2)]' : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white glass-panel'}`}>
                    UPI
                  </button>
                </div>
              </div>

              {form.paymentMethod === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="bankName" className="text-white/70">Bank Name (Beneficiary Name)</Label>
                    <Input id="bankName" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} placeholder="John Doe" className="bg-white/5 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount" className="text-white/70">Account Number</Label>
                    <Input id="bankAccount" value={form.bankAccount} onChange={e => handleChange('bankAccount', e.target.value)} placeholder="01234567890" className="bg-white/5 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankIfsc" className="text-white/70">IFSC Code</Label>
                    <Input id="bankIfsc" value={form.bankIfsc} onChange={e => handleChange('bankIfsc', e.target.value)} placeholder="HDFC0001234" className="bg-white/5 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" />
                  </div>
                </div>
              )}

              {form.paymentMethod === 'UPI' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="upiId" className="text-white/70">UPI ID</Label>
                  <Input id="upiId" value={form.upiId} onChange={e => handleChange('upiId', e.target.value)} placeholder="john@upi" className="bg-white/5 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" />
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-14 rounded-full mt-8 shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] transition-all">
            {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            <Save className="h-5 w-5 mr-2" /> Save Settings
          </Button>
        </form>
      </Card>
    </div>
  )
}
