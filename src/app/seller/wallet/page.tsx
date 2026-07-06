'use client'

import { useEffect, useState } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  description: string
  status: string
  createdAt: string
}

export default function SellerWalletPage() {
  const { user, selectedCurrency } = useStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wallet/transactions')
      .then(r => r.json())
      .then(d => { if (d.success) setTransactions(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
      <Link href="/seller" className="flex items-center gap-1.5 text-sm font-bold text-white/50 hover:text-neon-blue transition-all mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Wallet className="h-8 w-8 text-neon-blue" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Wallet</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="glass-panel-heavy border-white/10 rounded-2xl p-6">
          <p className="text-sm text-white/50 font-semibold mb-1">Current Balance</p>
          <p className="text-3xl font-extrabold text-white">{formatPrice(user?.currentBalance || 0, selectedCurrency)}</p>
        </Card>
        <Card className="glass-panel-heavy border-white/10 rounded-2xl p-6">
          <p className="text-sm text-white/50 font-semibold mb-1">Total Earnings</p>
          <p className="text-3xl font-extrabold text-neon-blue">{formatPrice(user?.totalEarnings || 0, selectedCurrency)}</p>
        </Card>
        <Card className="glass-panel-heavy border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <p className="text-sm text-white/50 font-semibold mb-1">Actions</p>
          <div className="flex gap-2">
            <Link href="/seller/payouts"><Button size="sm" className="bg-neon-blue text-black font-bold rounded-full">Withdraw</Button></Link>
            <Link href="/seller"><Button size="sm" variant="outline" className="border-white/20 text-white rounded-full">Dashboard</Button></Link>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Transaction History</h2>
      <Card className="glass-panel-heavy border-white/10 rounded-2xl p-6">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-neon-blue mx-auto" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No transactions yet</p>
            <p className="text-white/30 text-sm mt-1">Your earnings will appear here once you make sales</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-neon-blue/10' : 'bg-red-500/10'}`}>
                    {tx.type === 'CREDIT' ? <ArrowUpRight className="h-5 w-5 text-neon-blue" /> : <ArrowDownRight className="h-5 w-5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{tx.description}</p>
                    <p className="text-xs text-white/40">{new Date(tx.createdAt).toLocaleDateString()} &middot; {tx.status}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-neon-blue' : 'text-red-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatPrice(tx.amount, selectedCurrency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
