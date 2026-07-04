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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/account" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0066CC] mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Account
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">Account Settings</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Profile Information</h2>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" value={form.bio} onChange={e => handleChange('bio', e.target.value)} />
            </div>
          </div>

          {user.isSeller && (
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Payout Details (RazorpayX)</h2>
              <p className="text-xs text-slate-500">
                Provide your bank details to receive automated 10-day payouts via RazorpayX.
              </p>
              
              <div>
                <Label>Preferred Payout Method</Label>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => handleChange('paymentMethod', 'BANK_TRANSFER')} className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${form.paymentMethod === 'BANK_TRANSFER' ? 'border-[#0066CC] bg-blue-50 text-[#0066CC]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    Bank Transfer (IMPS/NEFT)
                  </button>
                  <button type="button" onClick={() => handleChange('paymentMethod', 'UPI')} className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${form.paymentMethod === 'UPI' ? 'border-[#0066CC] bg-blue-50 text-[#0066CC]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    UPI
                  </button>
                </div>
              </div>

              {form.paymentMethod === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="bankName">Bank Name (Beneficiary Name)</Label>
                    <Input id="bankName" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Account Number</Label>
                    <Input id="bankAccount" value={form.bankAccount} onChange={e => handleChange('bankAccount', e.target.value)} placeholder="01234567890" />
                  </div>
                  <div>
                    <Label htmlFor="bankIfsc">IFSC Code</Label>
                    <Input id="bankIfsc" value={form.bankIfsc} onChange={e => handleChange('bankIfsc', e.target.value)} placeholder="HDFC0001234" />
                  </div>
                </div>
              )}

              {form.paymentMethod === 'UPI' && (
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input id="upiId" value={form.upiId} onChange={e => handleChange('upiId', e.target.value)} placeholder="john@upi" />
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-[#0066CC] hover:bg-[#0055AA] text-white font-semibold h-11 mt-4">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </form>
      </Card>
    </div>
  )
}
