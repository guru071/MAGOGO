'use client'

import { useState } from 'react'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Wallet } from 'lucide-react'
import Link from 'next/link'

export default function SellerPayoutsPage() {
  const { selectedCurrency } = useStore()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'PAYPAL' | 'BANK'>('PAYPAL')
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!account.trim()) { toast.error('Enter your payout account details'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), method, accountDetails: account }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Payout requested!')
        setAmount('')
        setAccount('')
      } else {
        toast.error(json.error || 'Failed to request payout')
      }
    } catch (e) {
      console.error('[payouts] request error', e)
      toast.error('Failed to request payout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 relative z-10">
      <Link href="/seller" className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-[#2874F0] transition-all mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-6">Request Payout</h1>

      <Card className="bg-card border-border rounded-sm p-8">
        <form onSubmit={handleRequest} className="space-y-5">
          <div>
            <Label htmlFor="amount" className="text-foreground ml-1 font-bold">Amount ({selectedCurrency})</Label>
            <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50.00" required className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0] rounded-sm h-11" />
          </div>
          <div>
            <Label className="text-foreground ml-1 font-bold">Payout Method</Label>
            <div className="flex gap-3 mt-1.5">
              <button type="button" onClick={() => setMethod('PAYPAL')} className={`flex-1 p-3 rounded-sm border-2 text-sm font-bold transition-colors ${method === 'PAYPAL' ? 'border-[#2874F0] bg-[#2874F0]/10 text-[#2874F0]' : 'border-input text-muted-foreground hover:border-border hover:text-foreground bg-card'}`}>
                PayPal
              </button>
              <button type="button" onClick={() => setMethod('BANK')} className={`flex-1 p-3 rounded-sm border-2 text-sm font-bold transition-colors ${method === 'BANK' ? 'border-[#2874F0] bg-[#2874F0]/10 text-[#2874F0]' : 'border-input text-muted-foreground hover:border-border hover:text-foreground bg-card'}`}>
                Bank Transfer
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="account" className="text-foreground ml-1 font-bold">{method === 'PAYPAL' ? 'PayPal Email' : 'Bank Account Details'}</Label>
            <Input id="account" value={account} onChange={e => setAccount(e.target.value)} placeholder={method === 'PAYPAL' ? 'seller@example.com' : 'Account number / IFSC / Routing'} required className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-1 focus:ring-[#2874F0] rounded-sm h-11" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-extrabold h-12 rounded-sm transition-all">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Wallet className="h-4 w-4 mr-2" /> Request Payout
          </Button>
        </form>
      </Card>
    </div>
  )
}
