'use client'

import { useEffect, useState } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'

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
      <Link href="/seller" className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-[#2874F0] transition-all mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Wallet className="h-8 w-8 text-[#2874F0]" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Wallet</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card border-border rounded-sm p-6">
          <p className="text-sm text-muted-foreground font-semibold mb-1">Current Balance</p>
          <p className="text-3xl font-extrabold text-foreground">{formatPrice(user?.currentBalance || 0, selectedCurrency)}</p>
        </Card>
        <Card className="bg-card border-border rounded-sm p-6">
          <p className="text-sm text-muted-foreground font-semibold mb-1">Total Earnings</p>
          <p className="text-3xl font-extrabold text-[#2874F0]">{formatPrice(user?.totalEarnings || 0, selectedCurrency)}</p>
        </Card>
        <Card className="bg-card border-border rounded-sm p-6 flex flex-col justify-between">
          <p className="text-sm text-muted-foreground font-semibold mb-1">Actions</p>
          <div className="flex gap-2">
            <Link href="/seller/payouts"><Button size="sm" className="bg-[#2874F0] text-white font-bold rounded-sm">Withdraw</Button></Link>
            <Link href="/seller"><Button size="sm" variant="outline" className="border-border text-foreground rounded-sm">Dashboard</Button></Link>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-foreground mb-4">Transaction History</h2>
      <Card className="bg-card border-border rounded-sm p-6">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#2874F0] mx-auto" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-muted-foreground text-sm mt-1">Your earnings will appear here once you make sales</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-[#388E3C]/10' : 'bg-[#E53935]/10'}`}>
                    {tx.type === 'CREDIT' ? <ArrowUpRight className="h-5 w-5 text-[#388E3C]" /> : <ArrowDownRight className="h-5 w-5 text-[#E53935]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()} &middot; {tx.status}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${tx.type === 'CREDIT' ? 'text-[#388E3C]' : 'text-[#E53935]'}`}>
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
