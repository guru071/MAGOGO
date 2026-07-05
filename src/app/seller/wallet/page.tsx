'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/marketplace'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import Script from 'next/script'

type Tx = {
  id: string
  amount: number
  type: string
  description: string | null
  status: string
  createdAt: string
}

export default function SellerWalletPage() {
  const { user, fetchMe } = useStore()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Tx[]>([])
  
  // Top-up Modal state
  const [showTopup, setShowTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState('10')
  const [processing, setProcessing] = useState(false)

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/seller/wallet')
      const json = await res.json()
      if (json.success) setTransactions(json.data.transactions)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallet()
  }, [])

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(topupAmount)
    if (isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount')

    setProcessing(true)
    try {
      const res = await fetch('/api/razorpay/wallet-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(amount * 8350), // INR paise approximation matching backend
        currency: 'INR',
        name: 'Maghgo',
        description: 'Wallet Top-up',
        order_id: data.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/razorpay/wallet-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountUsd: amount,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            })
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            toast.success('Wallet topped up successfully!')
            setShowTopup(false)
            setTopupAmount('10')
            fetchMe() // refresh user balance
            fetchWallet() // refresh tx list
          } else {
            toast.error(verifyData.error || 'Verification failed')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#0066CC' }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment failed')
      })
      rzp.open()

    } catch (e: any) {
      toast.error(e.message || 'Failed to initiate top-up')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" /></div>

  return (
    <div className="space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          <p className="text-sm text-slate-500">Manage your balance and transactions.</p>
        </div>
        <Button onClick={() => setShowTopup(true)} className="bg-[#0066CC] hover:bg-[#0052a3]">
          <Plus className="h-4 w-4 mr-2" /> Add Money
        </Button>
      </div>

      {showTopup && (
        <Card className="border-[#0066CC] bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Top Up Wallet via Razorpay</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTopup(false)}>Cancel</Button>
            </div>
            <form onSubmit={handleTopup} className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Amount (USD)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input 
                    type="number" 
                    min="1" 
                    step="0.01" 
                    value={topupAmount} 
                    onChange={e => setTopupAmount(e.target.value)} 
                    className="pl-7" 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" disabled={processing} className="w-32 bg-[#FF6600] hover:bg-[#E65C00]">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay Now'}
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">The amount will be converted to INR at checkout.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#0066CC] to-[#004d99] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <WalletIcon className="h-5 w-5" />
              <span className="font-medium">Current Balance</span>
            </div>
            <div className="text-4xl font-bold">${(user?.currentBalance || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No transactions yet.</div>
          ) : (
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'CREDIT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{tx.description || tx.type}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
