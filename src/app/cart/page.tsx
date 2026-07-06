'use client'

import { useStore, formatPrice, formatAI } from '@/store/marketplace'
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2 mb-6">Add some prompts to get started!</p>
        <Link href="/browse">
          <Button className="bg-primary text-primary-foreground rounded-sm font-bold cursor-pointer">
            <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" /> Browse Prompts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-foreground cursor-pointer" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" /> Clear All
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.map(prompt => (
            <Card key={prompt.id} className="p-4 flex items-center gap-4 bg-card border-border rounded-sm">
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/prompt/${prompt.id}`} className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                  {prompt.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{formatAI(prompt.recommendedAI)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-extrabold text-foreground">{formatPrice(prompt.price, selectedCurrency)}</span>
                  {prompt.isFree && <span className="text-xs text-brand-green font-bold">Free</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent shrink-0 rounded-full cursor-pointer" onClick={() => handleRemove(prompt.id, prompt.title)} aria-label={`Remove ${prompt.title} from cart`}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Card>
          ))}
        </div>

        <div>
          <Card className="p-6 sticky top-28 bg-card border-border rounded-sm">
            <h2 className="font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cart.length} items)</span>
                <span className="text-foreground">{formatPrice(total, selectedCurrency)}</span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex justify-between font-bold text-foreground text-base">
                <span>Total</span>
                <span className="text-primary">{formatPrice(grandTotal, selectedCurrency)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground font-extrabold h-12 rounded-sm transition-all cursor-pointer">
                Proceed to Checkout
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-primary rounded-sm cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
