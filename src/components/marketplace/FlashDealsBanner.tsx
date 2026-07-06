'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Clock, Loader2 } from 'lucide-react'
import { useStore, formatPrice } from '@/store/marketplace'

interface FlashDeal {
  id: string
  discount: number
  endsAt: string
  prompt: { id: string; title: string; slug: string; price: number }
}

export default function FlashDealsBanner() {
  const [deals, setDeals] = useState<FlashDeal[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedCurrency } = useStore()

  useEffect(() => {
    fetch('/api/flash-deals/active')
      .then(r => r.json())
      .then(d => { if (d.success) setDeals(d.data || []) })
      .catch(e => { console.error('[FlashDealsBanner] fetch error', e) })
      .finally(() => setLoading(false))
  }, [])

  if (loading || deals.length === 0) return null

  return (
    <div className="glass-panel neon-border border-white/10 rounded-3xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-neon-pink drop-shadow-[0_0_5px_currentColor] fill-neon-pink" />
        <span className="font-bold text-sm text-neon-pink">Flash Deals</span>
        <Clock className="h-3.5 w-3.5 text-neon-pink ml-auto" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {deals.map(d => (
          <Link key={d.id} href={`/prompt/${d.prompt.slug}`}
            className="shrink-0 bg-white/5 rounded-2xl border border-white/10 p-3 hover:border-neon-pink/50 hover:bg-white/10 transition-all min-w-[160px]">
            <p className="text-sm font-medium text-white truncate">{d.prompt.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/40 line-through">{formatPrice(d.prompt.price, selectedCurrency)}</span>
              <span className="text-xs font-bold text-neon-pink">{d.discount}% OFF</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
