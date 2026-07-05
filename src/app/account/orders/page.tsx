'use client'

import { useEffect } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, ArrowLeft, Sparkles, ChevronRight, ReceiptText } from 'lucide-react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  COMPLETED: 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30',
  FAILED: 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30',
  REFUNDED: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
}

const getCoverImage = (prompt: { sampleImages?: string | string[] } | undefined) => {
  try {
    const images = typeof prompt?.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : (prompt?.sampleImages || []);
    return Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' ? images[0] : null;
  } catch { 
    return null;
  }
};

export default function OrdersPage() {
  const { orders, fetchOrders, user, selectedCurrency } = useStore()

  useEffect(() => {
    if (user) fetchOrders('bought')
  }, [user, fetchOrders])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center glass-panel border-white/10 rounded-3xl mt-12">
        <Package className="h-16 w-16 text-white/20 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white">Sign in to see your orders</h2>
        <Button className="mt-6 bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account"><Button variant="ghost" size="icon" className="glass-panel border-white/20 text-white hover:bg-white/10 rounded-full h-10 w-10"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">My Orders</h1>
          <p className="text-sm font-medium text-white/50 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} recorded in network</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 glass-panel border-white/10 rounded-3xl">
          <Package className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-lg font-bold text-white/80">No orders yet</p>
          <p className="text-sm text-white/50 mt-1 mb-6">Explore the marketplace to find premium prompts</p>
          <Link href="/browse"><Button className="bg-white/10 hover:bg-white/20 text-white font-bold h-11 px-6 rounded-full border border-white/10 transition-all">Browse Prompts</Button></Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <Card key={order.id} className="p-0 overflow-hidden glass-panel neon-border border-white/10 rounded-3xl group">
              <div className="bg-black/60 border-b border-white/10 px-6 py-4 flex flex-wrap gap-4 items-center justify-between text-sm backdrop-blur-md">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest mb-1">Order Placed</p>
                    <p className="font-semibold text-white/90">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest mb-1">Total</p>
                    <p className="font-bold text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.4)]">{formatPrice(order.amount, selectedCurrency)}</p>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <div>
                    <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest mb-1">Order # {order.orderId}</p>
                    <Link href={`/invoice/${order.id}`} className="text-neon-pink hover:text-white hover:underline font-bold text-xs inline-flex items-center transition-colors">
                      <ReceiptText className="h-3.5 w-3.5 mr-1.5" /> View Invoice / Bill
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-black/40">
                <Link href={`/prompt/${order.promptId}`} className="shrink-0 relative">
                  <div className="h-28 w-40 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                    {getCoverImage(order.prompt) ? (
                      <img src={getCoverImage(order.prompt) || undefined} alt={order.prompt?.title || 'Prompt'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                    ) : (
                      <Sparkles className="h-10 w-10 text-white/10 group-hover:text-neon-blue/50 transition-colors duration-700" />
                    )}
                  </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/prompt/${order.promptId}`} className="hover:underline decoration-neon-blue">
                    <h3 className="text-xl font-bold text-white truncate group-hover:text-neon-blue transition-colors">{order.prompt?.title || 'Unknown Prompt'}</h3>
                  </Link>
                  <p className="text-sm font-medium text-white/50 mt-1 line-clamp-2">{order.prompt?.isFree ? 'Free Download' : 'Digital Purchase'}</p>
                  <div className="mt-4">
                    <Badge className={`${statusColors[order.status] || 'bg-white/10 text-white/60 border border-white/20'} font-bold px-3 py-1`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
                  <Link href={`/prompt/${order.promptId}`}>
                    <Button className="w-full sm:w-40 bg-white text-black hover:bg-neon-blue hover:text-black font-bold h-11 rounded-full shadow-[0_0_10px_rgba(0,210,255,0)] hover:shadow-[0_0_15px_rgba(0,210,255,0.6)] transition-all">
                      View Prompt <ChevronRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link href={`/invoice/${order.id}`}>
                    <Button variant="outline" className="w-full sm:w-40 glass-panel border-white/20 text-white hover:bg-white/10 font-bold h-11 rounded-full">
                      Download Bill
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
