'use client'

import { useEffect } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, ArrowLeft, Sparkles, ChevronRight, ReceiptText } from 'lucide-react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-[#FF9F00]/10 text-[#FF9F00] border border-[#FF9F00]/20',
  COMPLETED: 'bg-[#2874F0]/10 text-[#2874F0] border border-[#2874F0]/20',
  FAILED: 'bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/20',
  REFUNDED: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center mt-12">
        <div className="bg-card border-border rounded-sm p-8">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground">Sign in to see your orders</h2>
          <Button className="mt-6 bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-12 px-8 rounded-sm transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account"><Button variant="ghost" size="icon" className="bg-card border-border text-foreground rounded-sm h-10 w-10"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Orders</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-card border-border rounded-sm">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Explore the marketplace to find premium prompts</p>
          <Link href="/browse"><Button className="bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-11 px-6 rounded-sm transition-all">Browse Prompts</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="p-0 overflow-hidden bg-card border-border rounded-sm group">
              <div className="bg-muted border-b border-border px-6 py-4 flex flex-wrap gap-4 items-center justify-between text-sm">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mb-1">Order Placed</p>
                    <p className="font-semibold text-foreground">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mb-1">Total</p>
                    <p className="font-bold text-[#2874F0]">{formatPrice(order.amount, selectedCurrency)}</p>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <div>
                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mb-1">Order # {order.orderId}</p>
                    <Link href={`/invoice/${order.id}`} className="text-[#FF9F00] hover:text-foreground font-bold text-xs inline-flex items-center transition-colors">
                      <ReceiptText className="h-3.5 w-3.5 mr-1.5" /> View Invoice / Bill
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <Link href={`/prompt/${order.promptId}`} className="shrink-0 relative">
                  <div className="h-28 w-40 rounded-sm bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {getCoverImage(order.prompt) ? (
                      <img src={getCoverImage(order.prompt) || undefined} alt={order.prompt?.title || 'Prompt'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <Sparkles className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/prompt/${order.promptId}`} className="hover:underline">
                    <h3 className="text-xl font-bold text-foreground truncate group-hover:text-[#2874F0] transition-colors">{order.prompt?.title || 'Unknown Prompt'}</h3>
                  </Link>
                  <p className="text-sm font-medium text-muted-foreground mt-1 line-clamp-2">{order.prompt?.isFree ? 'Free Download' : 'Digital Purchase'}</p>
                  <div className="mt-4">
                    <Badge className={`${statusColors[order.status] || 'bg-muted text-muted-foreground border-border'} font-bold px-3 py-1`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
                  <Link href={`/prompt/${order.promptId}`}>
                    <Button className="w-full sm:w-40 bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-11 rounded-sm transition-all">
                      View Prompt <ChevronRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link href={`/invoice/${order.id}`}>
                    <Button variant="outline" className="w-full sm:w-40 border-border text-foreground hover:bg-muted font-bold h-11 rounded-sm">
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
