'use client'

import { useEffect, useState } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ShoppingCart, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SellerSalesHistoryPage() {
  const { user, selectedCurrency } = useStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.isSeller) {
      fetch('/api/orders?type=sold')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrders(data.data)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return <div className="p-8 flex justify-center text-neon-blue">Loading...</div>
  }

  if (!user?.isSeller) {
    return <div className="p-8 text-center text-white">Please onboard as a seller first.</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Sales History</h1>
        <p className="text-white/60">A complete record of all your prompt sales and earnings.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="glass-panel border-white/10 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <ShoppingCart className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No Sales Yet</h3>
          <p className="text-white/50 mb-6">Keep promoting your prompts to get your first sale!</p>
          <Link href="/seller/prompts">
            <Button className="bg-neon-blue text-black font-bold">Manage Prompts</Button>
          </Link>
        </Card>
      ) : (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="bg-white/5 text-white/60 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Prompt</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4 text-right">Gross Amount</th>
                  <th className="px-6 py-4 text-right">Platform Fee</th>
                  <th className="px-6 py-4 text-right">Net Earning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-white/50">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4">
                      {order.prompt ? (
                        <div className="flex items-center">
                          <span className="font-medium truncate max-w-[200px]" title={order.prompt.title}>
                            {order.prompt.title}
                          </span>
                          <Link href={`/prompt/${order.prompt.id}`} target="_blank" className="ml-2 text-neon-blue hover:text-white">
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-white/40 italic">Deleted Prompt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {order.buyer?.name || 'Anonymous User'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatPrice(order.amount, selectedCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-400">
                      -{formatPrice(order.totalFees || order.platformFee, selectedCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      +{formatPrice(order.sellerAmount, selectedCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
