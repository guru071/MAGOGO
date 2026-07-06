'use client'

import { useEffect } from 'react'
import { useStore, formatPrice, type Prompt } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Heart, ArrowLeft, ShoppingCart, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function WishlistPage() {
  const { wishlist, fetchWishlist, toggleWishlist, addToCart, user, selectedCurrency } = useStore()

  useEffect(() => {
    if (user) fetchWishlist()
  }, [user, fetchWishlist])

  const handleRemove = async (id: string) => {
    await toggleWishlist(id)
    toast.success('Removed from wishlist')
    fetchWishlist()
  }

  const handleAddToCart = (prompt: Prompt) => {
    addToCart(prompt)
    toast.success('Added to cart!')
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center mt-12">
        <div className="bg-card border-border rounded-sm p-8">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground">Sign in to see your wishlist</h2>
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
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Wishlist</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-card border-border rounded-sm">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">Your wishlist is empty</p>
          <Link href="/browse"><Button className="mt-6 bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-11 px-6 rounded-sm transition-all">Browse Prompts</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {wishlist.map(prompt => (
            <Card key={prompt.id} className="p-5 bg-card border-border rounded-sm group transition-all">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link href={`/prompt/${prompt.id}`} className="font-bold text-foreground text-base hover:text-[#FF9F00] line-clamp-1 transition-colors">{prompt.title}</Link>
                    <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{prompt.recommendedAI}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-black text-[#2874F0]">{prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-[#FF9F00] rounded-full" onClick={() => handleRemove(prompt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="h-9 px-4 bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold text-xs rounded-sm transition-all" onClick={() => handleAddToCart(prompt)}>
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
