'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore, formatPrice, formatAI } from '@/store/marketplace'
import {
  Store, Star, Sparkles, Package, Heart, MapPin,
  Calendar, ArrowLeft,
} from 'lucide-react'

export default function StorePage() {
  const { id } = useParams<{ id: string }>()
  const [seller, setSeller] = useState<any | null>(null)
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { selectedCurrency, wishlistedPromptIds, toggleWishlist, addToCart, cart } = useStore()

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/users/${id}`).then(r => r.json()),
      fetch(`/api/prompts?sellerId=${id}`).then(r => r.json()),
    ]).then(([userRes, promptsRes]) => {
      if (userRes.success) setSeller(userRes.data)
      if (promptsRes.success) setPrompts(promptsRes.data || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [id])

  const isInCart = (pid: string) => cart.some((item: { id: string }) => item.id === pid)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-48 w-full rounded-sm mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Store Not Found</h2>
        <p className="text-muted-foreground mb-6">This seller does not exist.</p>
        <Link href="/"><Button variant="outline">Return Home</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Browse
        </Link>

        <div className="bg-card border border-border p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shrink-0">
              {(seller.name || 'S')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground mb-1">{seller.name || 'Seller'}</h1>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{seller.bio || seller.description || 'No description provided.'}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {seller.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" aria-hidden="true" /> {seller.location}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary" aria-hidden="true" /> Joined {new Date(seller.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3 text-primary" aria-hidden="true" /> {prompts.length} Prompts</span>
                {seller.avgRating > 0 && (
                  <span className="flex items-center gap-1 text-brand-green"><Star className="h-3 w-3 fill-brand-green text-brand-green" aria-hidden="true" /> {seller.avgRating.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" aria-hidden="true" /> Prompts by {seller.name || 'Seller'}
        </h2>

        {prompts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="font-medium">No prompts listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {prompts.map((prompt: any) => (
              <Link key={prompt.id} href={`/prompt/${prompt.id}`} className="bg-card border border-border hover:shadow-md transition-shadow flex flex-col group">
                <div className="relative h-36 bg-muted flex items-center justify-center overflow-hidden">
                  {(() => {
                    let images: string[] = [];
                    try { images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : (prompt.sampleImages || []); } catch { }
                    if (images.length > 0) return <img src={images[0]} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
                    return <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />;
                  })()}
                  {prompt.isFree && <span className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-0.5">FREE</span>}
                  <button onClick={(e) => { e.preventDefault(); toggleWishlist(prompt.id) }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-all cursor-pointer"
                    aria-label={wishlistedPromptIds.has(prompt.id) ? `Remove ${prompt.title} from wishlist` : `Add ${prompt.title} to wishlist`}>
                    <Heart className={`h-3.5 w-3.5 ${wishlistedPromptIds.has(prompt.id) ? 'fill-brand-red text-brand-red' : 'text-muted-foreground'}`} aria-hidden="true" />
                  </button>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{formatAI(prompt.recommendedAI)}</span>
                  <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">{prompt.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3 flex-1">{prompt.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="font-bold text-sm text-foreground">{prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}</span>
                    {isInCart(prompt.id) ? (
                      <span className="text-xs text-brand-green font-medium">In Cart</span>
                    ) : (
                      <button onClick={(e) => { e.preventDefault(); addToCart(prompt) }}
                        className="text-xs text-primary font-medium hover:underline cursor-pointer">Add to Cart</button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
