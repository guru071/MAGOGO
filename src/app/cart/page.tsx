'use client'

import { useStore, formatPrice, CURRENCIES } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Trash2, ShoppingCart as CartIcon, ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function CartPage() {
  const { cart, removeFromCart, clearCart, selectedCurrency, setSelectedCurrency } = useStore()

  const total = cart.reduce((sum, p) => sum + p.price, 0)
  const platformFee = total * 0.1
  const grandTotal = total + platformFee

  const handleRemove = (id: string, title: string) => {
    removeFromCart(id)
    toast.success(`Removed "${title}" from cart`)
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <CartIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Your cart is empty</h2>
        <p className="text-slate-500 mt-2 mb-6">Add some prompts to get started!</p>
        <Link href="/browse">
          <Button className="bg-[#0066CC] text-white">
            <Sparkles className="h-4 w-4 mr-2" /> Browse Prompts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.map(prompt => (
            <Card key={prompt.id} className="p-4 flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#0066CC]/10 to-[#FF6600]/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-8 w-8 text-[#0066CC]/30" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/prompt/${prompt.id}`} className="font-semibold text-slate-800 hover:text-[#0066CC] transition-colors line-clamp-1">
                  {prompt.title}
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">{prompt.recommendedAI}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-bold text-slate-900">{formatPrice(prompt.price, selectedCurrency)}</span>
                  {prompt.isFree && <span className="text-xs text-green-600 font-medium">Free</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 shrink-0" onClick={() => handleRemove(prompt.id, prompt.title)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        <div>
          <Card className="p-6 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.length} items)</span>
                <span>{formatPrice(total, selectedCurrency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee (10%)</span>
                <span>{formatPrice(platformFee, selectedCurrency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-slate-900 text-base">
                <span>Total</span>
                <span>{formatPrice(grandTotal, selectedCurrency)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-6 bg-[#FF6600] hover:bg-[#E65C00] text-white font-semibold h-12 shadow-lg shadow-[#FF6600]/20">
                Proceed to Checkout
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost" className="w-full mt-2 text-slate-500">
                <ArrowLeft className="h-4 w-4 mr-1" /> Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
