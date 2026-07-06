'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore, formatPrice } from '@/store/marketplace'
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
        <Store className="h-16 w-16 text-[#C4C4C4] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#212121] mb-2">Store Not Found</h2>
        <p className="text-[#878787] mb-6">This seller does not exist.</p>
        <Link href="/"><Button variant="outline">Return Home</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/browse" className="inline-flex items-center gap-2 text-[#878787] hover:text-[#2874F0] mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>

        <div className="bg-white border border-[#F0F0F0] p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-[#2874F0] flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {(seller.name || 'S')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#212121] mb-1">{seller.name || 'Seller'}</h1>
              <p className="text-sm text-[#878787] mb-2 line-clamp-2">{seller.bio || seller.description || 'No description provided.'}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#878787]">
                {seller.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#2874F0]" /> {seller.location}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#2874F0]" /> Joined {new Date(seller.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3 text-[#2874F0]" /> {prompts.length} Prompts</span>
                {seller.avgRating > 0 && (
                  <span className="flex items-center gap-1 text-[#388E3C]"><Star className="h-3 w-3 fill-[#388E3C] text-[#388E3C]" /> {seller.avgRating.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#212121] mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-[#2874F0]" /> Prompts by {seller.name || 'Seller'}
        </h2>

        {prompts.length === 0 ? (
          <div className="text-center py-16 text-[#878787]">
            <Sparkles className="h-10 w-10 text-[#C4C4C4] mx-auto mb-3" />
            <p className="font-medium">No prompts listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {prompts.map((prompt: any) => (
              <Link key={prompt.id} href={`/prompt/${prompt.id}`} className="bg-white border border-[#F0F0F0] hover:shadow-md transition-shadow flex flex-col group">
                <div className="relative h-36 bg-[#F1F3F6] flex items-center justify-center overflow-hidden">
                  {(() => {
                    let images: string[] = [];
                    try { images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : (prompt.sampleImages || []); } catch { }
                    if (images.length > 0) return <img src={images[0]} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
                    return <Sparkles className="h-8 w-8 text-[#C4C4C4]" />;
                  })()}
                  {prompt.isFree && <span className="absolute top-2 left-2 bg-[#388E3C] text-white text-[10px] font-bold px-2 py-0.5">FREE</span>}
                  <button onClick={(e) => { e.preventDefault(); toggleWishlist(prompt.id) }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-all cursor-pointer">
                    <Heart className={`h-3.5 w-3.5 ${wishlistedPromptIds.has(prompt.id) ? 'fill-[#FF6161] text-[#FF6161]' : 'text-[#878787]'}`} />
                  </button>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <span className="text-[10px] text-[#878787] uppercase tracking-wide mb-1">{prompt.recommendedAI || 'General'}</span>
                  <h3 className="font-medium text-sm text-[#212121] line-clamp-1 mb-1 group-hover:text-[#2874F0] transition-colors">{prompt.title}</h3>
                  <p className="text-xs text-[#878787] line-clamp-1 mb-3 flex-1">{prompt.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0]">
                    <span className="font-bold text-sm text-[#212121]">{prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}</span>
                    {isInCart(prompt.id) ? (
                      <span className="text-xs text-[#388E3C] font-medium">In Cart</span>
                    ) : (
                      <button onClick={(e) => { e.preventDefault(); addToCart(prompt) }}
                        className="text-xs text-[#2874F0] font-medium hover:underline cursor-pointer">Add to Cart</button>
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
