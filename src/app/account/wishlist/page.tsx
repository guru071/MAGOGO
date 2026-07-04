'use client'

import { useEffect } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Heart, ArrowLeft, ShoppingCart, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function WishlistPage() {
  const { wishlist, fetchWishlist, toggleWishlist, addToCart, user, selectedCurrency } = useStore()

  useEffect(() => {
    if (user) fetchWishlist()
  }, [user])

  const handleRemove = async (id: string) => {
    await toggleWishlist(id)
    toast.success('Removed from wishlist')
    fetchWishlist()
  }

  const handleAddToCart = (prompt: any) => {
    addToCart(prompt)
    toast.success('Added to cart!')
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Heart className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sign in to see your wishlist</h2>
        <Button className="mt-4 bg-[#0066CC] text-white" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
          <p className="text-sm text-slate-500">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">Your wishlist is empty</p>
          <Link href="/browse"><Button variant="outline" className="mt-4">Browse Prompts</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {wishlist.map(prompt => (
            <Card key={prompt.id} className="p-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#0066CC]/10 to-[#FF6600]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-8 w-8 text-[#0066CC]/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/prompt/${prompt.id}`} className="font-medium text-slate-800 hover:text-[#0066CC] line-clamp-1">{prompt.title}</Link>
                  <p className="text-xs text-slate-400 mt-0.5">{prompt.recommendedAI}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{prompt.isFree ? 'Free' : formatPrice(prompt.price, selectedCurrency)}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400" onClick={() => handleRemove(prompt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="h-8 bg-[#0066CC] text-white text-xs" onClick={() => handleAddToCart(prompt)}>
                        <ShoppingCart className="h-3 w-3 mr-1" /> Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
