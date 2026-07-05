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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center glass-panel border-white/10 rounded-3xl mt-12">
        <Heart className="h-16 w-16 text-white/20 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white">Sign in to see your wishlist</h2>
        <Button className="mt-6 bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account"><Button variant="ghost" size="icon" className="glass-panel border-white/20 text-white hover:bg-white/10 rounded-full h-10 w-10"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">My Wishlist</h1>
          <p className="text-sm font-medium text-white/50 mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 glass-panel border-white/10 rounded-3xl">
          <Heart className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-lg font-bold text-white/80">Your wishlist is empty</p>
          <Link href="/browse"><Button className="mt-6 bg-white/10 hover:bg-white/20 text-white font-bold h-11 px-6 rounded-full border border-white/10 transition-all">Browse Prompts</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {wishlist.map(prompt => (
            <Card key={prompt.id} className="p-5 glass-panel neon-border border-white/10 rounded-3xl group transition-all hover:bg-white/5">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-neon-pink/50 transition-colors">
                  <Sparkles className="h-8 w-8 text-white/20 group-hover:text-neon-pink/60 transition-colors" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link href={`/prompt/${prompt.id}`} className="font-bold text-white text-base hover:text-neon-pink line-clamp-1 transition-colors">{prompt.title}</Link>
                    <p className="text-xs font-medium text-white/40 mt-1 uppercase tracking-wider">{prompt.recommendedAI}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-black text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.4)]">{prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-white/40 hover:text-neon-pink hover:bg-neon-pink/10 rounded-full" onClick={() => handleRemove(prompt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="h-9 px-4 bg-white text-black hover:bg-neon-blue hover:text-black font-bold text-xs rounded-full shadow-[0_0_10px_rgba(0,210,255,0)] hover:shadow-[0_0_15px_rgba(0,210,255,0.6)] transition-all" onClick={() => handleAddToCart(prompt)}>
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Cart
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
