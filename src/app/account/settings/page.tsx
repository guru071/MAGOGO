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
      queueMicrotask(() => setForm({
        name: user.name || '',
        bio: user.bio || '',
        bankName: user.bankName || '',
        bankAccount: user.bankAccount || '',
        bankIfsc: user.bankIfsc || '',
        upiId: user.upiId || '',
        paypalEmail: user.paypalEmail || '',
        paymentMethod: user.paymentMethod || 'BANK_TRANSFER'
      }))
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 relative z-10">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors bg-card px-4 py-2 rounded-sm border-border">
        <ArrowLeft className="h-4 w-4" /> Back to Account
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-8 tracking-tight">Account Settings</h1>

      <Card className="p-8 bg-card border-border rounded-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Profile Information</h2>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input id="name" value={form.name} onChange={e => handleChange('name', e.target.value)} required className="bg-card border-input text-foreground focus:border-[#2874F0] h-12 rounded-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">Bio</Label>
              <Input id="bio" value={form.bio} onChange={e => handleChange('bio', e.target.value)} className="bg-card border-input text-foreground focus:border-[#2874F0] h-12 rounded-sm" />
            </div>
          </div>

          {user.isSeller && (
            <div className="space-y-5 pt-6 mt-6 border-t border-border">
              <h2 className="text-xl font-bold text-foreground border-b border-border pb-3">Payout Details (RazorpayX)</h2>
              <p className="text-sm text-muted-foreground">
                Provide your bank details to receive automated 10-day payouts via RazorpayX.
              </p>
              
              <div className="space-y-2">
                <Label className="text-foreground">Preferred Payout Method</Label>
                <div className="flex gap-4 mt-2">
                  <button type="button" onClick={() => handleChange('paymentMethod', 'BANK_TRANSFER')} className={`flex-1 p-4 rounded-sm border-2 text-sm font-bold transition-all ${form.paymentMethod === 'BANK_TRANSFER' ? 'border-[#2874F0] bg-[#2874F0]/10 text-[#2874F0]' : 'border-input text-muted-foreground hover:border-border hover:text-foreground bg-card'}`}>
                    Bank Transfer (IMPS/NEFT)
                  </button>
                  <button type="button" onClick={() => handleChange('paymentMethod', 'UPI')} className={`flex-1 p-4 rounded-sm border-2 text-sm font-bold transition-all ${form.paymentMethod === 'UPI' ? 'border-[#2874F0] bg-[#2874F0]/10 text-[#2874F0]' : 'border-input text-muted-foreground hover:border-border hover:text-foreground bg-card'}`}>
                    UPI
                  </button>
                </div>
              </div>

              {form.paymentMethod === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="bankName" className="text-foreground">Bank Name (Beneficiary Name)</Label>
                    <Input id="bankName" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} placeholder="John Doe" className="bg-card border-input text-foreground focus:border-[#2874F0] h-12 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount" className="text-foreground">Account Number</Label>
                    <Input id="bankAccount" value={form.bankAccount} onChange={e => handleChange('bankAccount', e.target.value)} placeholder="01234567890" className="bg-card border-input text-foreground focus:border-[#2874F0] h-12 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankIfsc" className="text-foreground">IFSC Code</Label>
                    <Input id="bankIfsc" value={form.bankIfsc} onChange={e => handleChange('bankIfsc', e.target.value)} placeholder="HDFC0001234" className="bg-card border-input text-foreground focus:border-[#2874F0] h-12 rounded-sm" />
                  </div>
                </div>
              )}

              {form.paymentMethod === 'UPI' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="upiId" className="text-foreground">UPI ID</Label>
                  <Input id="upiId" value={form.upiId} onChange={e => handleChange('upiId', e.target.value)} placeholder="john@upi" className="bg-card border-input text-foreground focus:border-[#2874F0] h-12 rounded-sm" />
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-14 rounded-sm mt-8 transition-all">
            {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            <Save className="h-5 w-5 mr-2" /> Save Settings
          </Button>
        </form>
      </Card>
    </div>
  )
}
