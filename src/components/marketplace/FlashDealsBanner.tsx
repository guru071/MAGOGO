'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Clock, Loader2 } from 'lucide-react'

interface FlashDeal {
  id: string
  discount: number
  endsAt: string
  prompt: { id: string; title: string; slug: string; price: number }
}

export default function FlashDealsBanner() {
  const [deals, setDeals] = useState<FlashDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/flash-deals/active')
      .then(r => r.json())
      .then(d => { if (d.success) setDeals(d.data || []) })
      .catch(e => { console.error('[FlashDealsBanner] fetch error', e) })
      .finally(() => setLoading(false))
  }, [])

  if (loading || deals.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-[#FF6600]/10 to-[#FF6600]/5 border border-[#FF6600]/20 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-[#FF6600] fill-[#FF6600]" />
        <span className="font-bold text-sm text-[#FF6600]">Flash Deals</span>
        <Clock className="h-3.5 w-3.5 text-[#FF6600] ml-auto" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {deals.map(d => (
          <Link key={d.id} href={`/prompt/${d.prompt.slug}`}
            className="shrink-0 bg-white rounded-lg border border-slate-100 p-3 hover:shadow-md transition-shadow min-w-[160px]">
            <p className="text-sm font-medium text-slate-800 truncate">{d.prompt.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 line-through">${d.prompt.price.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#FF6600]">{d.discount}% OFF</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
