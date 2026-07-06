'use client'

import { useState } from 'react'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Store, Loader2, Building, CreditCard, Smartphone } from 'lucide-react'

export function SellerOnboarding() {
  const { becomeSeller } = useStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    paymentMethod: 'BANK_TRANSFER',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    upiId: '',
    paypalEmail: '',
    bio: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (form.paymentMethod === 'BANK_TRANSFER' && (!form.bankName || !form.bankAccount || !form.bankIfsc)) {
      toast.error('Please fill in all bank details')
      return
    }
    if (form.paymentMethod === 'UPI' && !form.upiId) {
      toast.error('Please provide a UPI ID')
      return
    }
    if (form.paymentMethod === 'PAYPAL' && !form.paypalEmail) {
      toast.error('Please provide a PayPal email')
      return
    }

    setLoading(true)
    try {
      const success = await becomeSeller(form)
      if (success) {
        toast.success('Welcome to MAGHGO! Your seller account is ready.')
        window.location.reload()
      } else {
        toast.error('Failed to set up your seller account')
      }
    } catch (err) {
      toast.error('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 relative z-10">
      <Card className="p-8 border-white/10 shadow-xl rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neon-blue to-neon-pink opacity-50" />
        <div className="text-center mb-8">
          <Store className="h-12 w-12 text-neon-blue drop-shadow-[0_0_10px_rgba(0,210,255,0.5)] mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white">Complete Your Seller Profile</h2>
          <p className="text-white/50 mt-2">We need a few details to process your payouts.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="bio" className="text-base font-bold text-white/90">Seller Bio</Label>
            <p className="text-xs text-white/50 mb-2">Tell buyers a bit about yourself and your expertise in prompt engineering.</p>
            <Textarea className="bg-black/40 border-white/20 text-white focus:border-neon-blue rounded-xl" 
              id="bio" 
              value={form.bio} 
              onChange={e => handleChange('bio', e.target.value)} 
              required 
              rows={3} 
              placeholder="I am an AI artist specializing in..." 
            />
          </div>

          <div className="pt-4 border-t border-white/10">
            <Label className="text-base font-bold text-white/90 mb-4 block">Payout Method</Label>
            <RadioGroup value={form.paymentMethod} onValueChange={(v) => handleChange('paymentMethod', v)} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="flex items-center space-x-2 border rounded-xl p-3 hover:border-neon-blue/50 cursor-pointer transition-colors bg-black/40">
                <RadioGroupItem value="BANK_TRANSFER" id="BANK_TRANSFER" />
                <Label htmlFor="BANK_TRANSFER" className="cursor-pointer flex items-center gap-2"><Building className="h-4 w-4 text-white/50"/> Bank</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-xl p-3 hover:border-neon-blue/50 cursor-pointer transition-colors bg-black/40">
                <RadioGroupItem value="UPI" id="UPI" />
                <Label htmlFor="UPI" className="cursor-pointer flex items-center gap-2"><Smartphone className="h-4 w-4 text-white/50"/> UPI</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-xl p-3 hover:border-neon-blue/50 cursor-pointer transition-colors bg-black/40">
                <RadioGroupItem value="PAYPAL" id="PAYPAL" />
                <Label htmlFor="PAYPAL" className="cursor-pointer flex items-center gap-2"><CreditCard className="h-4 w-4 text-white/50"/> PayPal</Label>
              </div>
            </RadioGroup>

            {form.paymentMethod === 'BANK_TRANSFER' && (
              <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/10">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input className="bg-black/40 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" id="bankName" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} placeholder="e.g. Chase Bank" required />
                </div>
                <div>
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input className="bg-black/40 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" id="bankAccount" value={form.bankAccount} onChange={e => handleChange('bankAccount', e.target.value)} placeholder="Enter your account number" required />
                </div>
                <div>
                  <Label htmlFor="bankIfsc">Routing / IFSC Code</Label>
                  <Input className="bg-black/40 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" id="bankIfsc" value={form.bankIfsc} onChange={e => handleChange('bankIfsc', e.target.value)} placeholder="Enter routing or IFSC code" required />
                </div>
              </div>
            )}

            {form.paymentMethod === 'UPI' && (
              <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/10">
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input className="bg-black/40 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" id="upiId" value={form.upiId} onChange={e => handleChange('upiId', e.target.value)} placeholder="e.g. name@bank" required />
                </div>
              </div>
            )}

            {form.paymentMethod === 'PAYPAL' && (
              <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/10">
                <div>
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input className="bg-black/40 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl" id="paypalEmail" type="email" value={form.paypalEmail} onChange={e => handleChange('paypalEmail', e.target.value)} placeholder="e.g. you@example.com" required />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-neon-pink hover:bg-neon-pink/80 text-black shadow-[0_0_15px_rgba(255,0,128,0.5)]  text-white font-bold h-12 text-lg rounded-xl mt-8">
            {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : 'Complete Registration'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
