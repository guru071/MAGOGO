'use client'

import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Trash2, ArrowLeft, Sparkles, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

export default function CartPage() {
  const { cart, removeFromCart, clearCart, selectedCurrency } = useStore()

  const total = cart.reduce((sum, p) => sum + p.price, 0)
  const grandTotal = total

  const handleRemove = (id: string, title: string) => {
    removeFromCart(id)
    toast.success(`Removed "${title}" from cart`)
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
        <ShoppingBag className="h-16 w-16 text-white/20 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
        <p className="text-white/50 mt-2 mb-6">Add some prompts to get started!</p>
        <Link href="/browse">
          <Button className="bg-neon-blue text-black hover:bg-neon-blue/80 shadow-[0_0_15px_rgba(0,210,255,0.4)]">
            <Sparkles className="h-4 w-4 mr-2" /> Browse Prompts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Shopping Cart</h1>
          <p className="text-sm text-white/50 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-neon-pink hover:text-white hover:bg-white/10" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.map(prompt => (
            <Card key={prompt.id} className="p-4 flex items-center gap-4 glass-panel border-white/10 bg-black/40">
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-neon-blue/10 to-neon-pink/10 flex items-center justify-center shrink-0 border border-white/10">
                <Sparkles className="h-8 w-8 text-neon-blue/40" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/prompt/${prompt.id}`} className="font-bold text-white hover:text-neon-blue transition-colors line-clamp-1">
                  {prompt.title}
                </Link>
                <p className="text-xs text-white/40 mt-0.5">{prompt.recommendedAI}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-extrabold text-white">{formatPrice(prompt.price, selectedCurrency)}</span>
                  {prompt.isFree && <span className="text-xs text-neon-blue font-bold">Free</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-neon-pink hover:bg-white/10 shrink-0 rounded-full" onClick={() => handleRemove(prompt.id, prompt.title)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        <div>
          <Card className="p-6 sticky top-28 glass-panel border-white/10 bg-black/40">
            <h3 className="font-bold text-white mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal ({cart.length} items)</span>
                <span className="text-white/80">{formatPrice(total, selectedCurrency)}</span>
              </div>
              <Separator className="my-2 bg-white/10" />
              <div className="flex justify-between font-bold text-white text-base">
                <span>Total</span>
                <span className="text-neon-blue drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]">{formatPrice(grandTotal, selectedCurrency)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-6 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-extrabold h-12 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] transition-all">
                Proceed to Checkout
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost" className="w-full mt-2 text-white/50 hover:text-neon-blue rounded-full">
                <ArrowLeft className="h-4 w-4 mr-1" /> Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
