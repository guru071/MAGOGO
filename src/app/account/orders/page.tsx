'use client'

import { useEffect } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, ArrowLeft, Sparkles, ChevronRight, ReceiptText } from 'lucide-react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
}

const getCoverImage = (prompt: any) => {
  try {
    const images = typeof prompt?.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : (prompt?.sampleImages || []);
    return Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' ? images[0] : null;
  } catch (e) {
    return null;
  }
};

export default function OrdersPage() {
  const { orders, fetchOrders, user, selectedCurrency } = useStore()

  useEffect(() => {
    if (user) fetchOrders('bought')
  }, [user])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sign in to see your orders</h2>
        <Button className="mt-4 bg-[#0066CC] text-white" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No orders yet</p>
          <Link href="/browse"><Button variant="outline" className="mt-4">Browse Prompts</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex flex-wrap gap-4 items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-slate-500 font-medium uppercase text-[10px] tracking-wider mb-0.5">Order Placed</p>
                    <p className="font-semibold text-slate-700">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium uppercase text-[10px] tracking-wider mb-0.5">Total</p>
                    <p className="font-semibold text-slate-700">{formatPrice(order.amount, selectedCurrency)}</p>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <div>
                    <p className="text-slate-500 font-medium uppercase text-[10px] tracking-wider mb-0.5">Order # {order.orderId}</p>
                    <Link href={`/invoice/${order.id}`} className="text-[#0066CC] hover:underline font-medium text-xs inline-flex items-center">
                      <ReceiptText className="h-3 w-3 mr-1" /> View Invoice / Bill
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <Link href={`/prompt/${order.promptId}`} className="shrink-0 relative group">
                  <div className="h-24 w-36 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {getCoverImage(order.prompt) ? (
                      <img src={getCoverImage(order.prompt) || undefined} alt={order.prompt?.title || 'Prompt'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Sparkles className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/prompt/${order.promptId}`} className="hover:underline">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{order.prompt?.title || 'Unknown Prompt'}</h3>
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{order.prompt?.isFree ? 'Free Download' : 'Digital Purchase'}</p>
                  <div className="mt-3">
                    <Badge className={`${statusColors[order.status] || 'bg-slate-100 text-slate-600'} border-0`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <Link href={`/prompt/${order.promptId}`}>
                    <Button className="w-full bg-[#0066CC] hover:bg-[#0055AA] text-white">
                      View Prompt <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href={`/invoice/${order.id}`}>
                    <Button variant="outline" className="w-full">
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
