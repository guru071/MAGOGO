'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore, formatPrice, CURRENCIES } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, ShoppingCart, Star, Eye, Download, Sparkles,
  MessageSquare, Share2, ArrowLeft, Loader2, Check, Flag,
  User as UserIcon, Clock, ShieldCheck, Zap,
  ChevronRight, Code, Lock
} from 'lucide-react'
import ReportModal from '@/components/marketplace/ReportModal'

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const {
    selectedPrompt, comments, promptReviews, loading,
    user, selectedCurrency, cart, likedPromptIds, wishlistedPromptIds,
    fetchPromptDetail, toggleLike, toggleWishlist, addToCart,
    addComment, addReview, setShowAuthModal, setAuthMode,
  } = useStore()

  const [commentText, setCommentText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [qnaList, setQnaList] = useState<any[]>([])
  const [questionText, setQuestionText] = useState('')

  useEffect(() => {
    if (id) {
      fetchPromptDetail(id)
      fetch(`/api/qna?promptId=${id}`).then(r => r.json()).then(d => {
        if (d.success) setQnaList(d.data)
      }).catch(console.error)
    }
  }, [id])

  if (loading || !selectedPrompt) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  const prompt = selectedPrompt
  const isLiked = likedPromptIds.has(prompt.id)
  const isWishlisted = wishlistedPromptIds.has(prompt.id)
  const isInCart = cart.some(c => c.id === prompt.id)
  const isOwner = (prompt as any).accessReason === 'OWNER'
  const isAdmin = (prompt as any).accessReason === 'ADMIN'
  const hasPurchased = (prompt as any).accessReason === 'PURCHASED'
  const hasAccess = (prompt as any).hasAccess

  const handleLike = async () => {
    const result = await toggleLike(prompt.id)
    if (result) toast.success(result ? 'Liked!' : 'Removed like')
  }

  const handleWishlist = async () => {
    const result = await toggleWishlist(prompt.id)
    if (result) toast.success(result ? 'Added to wishlist' : 'Removed from wishlist')
  }

  const handleAddToCart = async () => {
    if (!user) { setShowAuthModal(true); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id })
      });
      const data = await res.json();
      if (data.success || data.error === 'Item already in cart') {
        addToCart(prompt); // Optimistic UI update
        toast.success('Added to cart!');
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Failed to add to cart');
    } finally {
      setSubmitting(false);
    }
  }

  const handleBuyNow = async () => {
    if (!user) { setShowAuthModal(true); return }
    await handleAddToCart()
    router.push('/checkout')
  }

  const handleReview = async () => {
    if (!user) { setShowAuthModal(true); return }
    if (!reviewComment.trim()) return
    setSubmitting(true)
    const result = await addReview(prompt.id, reviewRating, reviewComment)
    setSubmitting(false)
    
    if (result && result.success) {
      setReviewComment('')
      toast.success('Review submitted')
    } else {
      toast.error(result?.error || 'Failed to submit review')
    }
  }

  const handleAskQuestion = async () => {
    if (!user) { setShowAuthModal(true); return }
    if (!questionText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id, question: questionText })
      })
      const d = await res.json()
      if (d.success) {
        toast.success('Question submitted!')
        setQnaList([{ ...d.data, author: { name: user.name, avatar: user.avatar } }, ...qnaList])
        setQuestionText('')
      }
    } catch {
      toast.error('Failed to submit question')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-sm breadcrumbs text-white/50 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-neon-blue transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/browse?category=${prompt.category?.slug}`} className="hover:text-neon-pink transition-colors">{prompt.category?.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white font-medium truncate">{prompt.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Images & Details */}
        <div className="flex-1 space-y-8 w-full min-w-0">
          <div className="relative h-[400px] sm:h-[500px] rounded-2xl glass-panel-heavy flex items-center justify-center overflow-hidden border border-white/10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none opacity-50"></div>
            {(() => {
              let images = [];
              try { images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : (prompt.sampleImages || []); } catch (e) {}
              if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') {
                return <img src={images[0]} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />;
              }
              return <Sparkles className="h-32 w-32 text-white/20" />;
            })()}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              {prompt.isFree && <Badge className="bg-neon-blue text-black border-0 shadow-[0_0_15px_rgba(0,210,255,0.5)] px-3 py-1 text-sm font-bold">FREE</Badge>}
              {prompt.discount > 0 && <Badge variant="destructive" className="bg-neon-pink text-white border-0 shadow-[0_0_15px_rgba(255,0,128,0.5)] px-3 py-1 text-sm font-bold">-{prompt.discount}% OFF</Badge>}
              {prompt.isFeatured && <Badge className="bg-amber-400 text-black border-0 shadow-[0_0_15px_rgba(251,191,36,0.5)] px-3 py-1 text-sm font-bold">AMAZON'S CHOICE</Badge>}
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Product Description</h2>
            <p className="text-white/70 leading-relaxed text-lg">{prompt.description}</p>
            
            <div className="mt-8">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Code className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" /> The Prompt</h3>
              {hasAccess ? (
                <div className="p-5 rounded-xl bg-black/60 border border-white/10 text-neon-blue font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner relative group liquid-glass">
                  {(isOwner || isAdmin) && (
                    <div className="mb-4 p-2 bg-white/5 rounded text-xs text-white/70 border border-white/10 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-neon-blue" />
                      Visible to you because you are {isOwner ? 'the seller' : 'an admin'}. Buyers will not see this until they purchase.
                    </div>
                  )}
                  {prompt.promptText}
                  <Button size="sm" variant="secondary" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => { navigator.clipboard.writeText(prompt.promptText || ''); toast.success('Copied to clipboard'); }}>Copy</Button>
                </div>
              ) : (
                <div className="p-6 rounded-xl glass-panel border-white/10 text-center liquid-glass">
                  <Lock className="h-8 w-8 text-white/40 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                  <p className="text-white/60 font-medium text-lg">Purchase to unlock the prompt</p>
                </div>
              )}
            </div>

            {prompt.tags && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(() => {
                  let tags: string[] = [];
                  try { tags = typeof prompt.tags === 'string' && prompt.tags.startsWith('[') ? JSON.parse(prompt.tags) : prompt.tags.split(','); } catch (e) { tags = prompt.tags.split(','); }
                  if (!Array.isArray(tags)) tags = [tags as string];
                  return tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="glass-panel text-white/80 hover:bg-white/10 hover:text-white border-white/20 transition-colors">{tag?.trim?.() || tag}</Badge>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Customer Questions & Answers */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Customer questions & answers</h2>
            
            <div className="flex gap-3 mb-8">
              <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Have a question? Ask the seller..." className="flex-1 bg-black/40 border-white/20 text-white focus:border-neon-blue focus:ring-neon-blue rounded-xl h-12" />
              <Button onClick={handleAskQuestion} disabled={submitting || !questionText.trim()} className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold px-8 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)] h-12">
                Ask
              </Button>
            </div>

            <div className="space-y-6">
              {qnaList.length === 0 ? (
                <p className="text-white/40 text-center py-4 italic">No questions yet. Be the first to ask!</p>
              ) : (
                qnaList.map((qna: any) => (
                  <div key={qna.id} className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className="font-black text-neon-pink w-8 drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]">Q:</div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{qna.question}</p>
                        <p className="text-xs text-white/40 mt-1">Asked by {qna.author?.name || 'Customer'} on {new Date(qna.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {qna.answerText && (
                      <div className="flex gap-4 mt-4">
                        <div className="font-black text-neon-blue w-8 drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]">A:</div>
                        <div className="flex-1 p-4 rounded-xl glass-panel border-white/10">
                          <p className="text-white/80">{qna.answerText}</p>
                          <p className="text-xs text-white/40 mt-3 flex items-center gap-2 border-t border-white/10 pt-2">
                            Answered by <Badge variant="outline" className="text-[10px] bg-white/5 text-neon-blue border-neon-blue/30">Seller</Badge> <span className="font-semibold text-white/60">{qna.answer?.name}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Reviews */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl w-full">
            <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Customer Reviews</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">{prompt.rating.toFixed(1)}</span>
                  <div className="flex flex-col">
                    <div className="flex text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"><Star className="fill-amber-400 h-5 w-5"/><Star className="fill-amber-400 h-5 w-5"/><Star className="fill-amber-400 h-5 w-5"/><Star className="fill-amber-400 h-5 w-5"/><Star className="h-5 w-5"/></div>
                    <span className="text-sm text-white/50 mt-1">{prompt.reviewCount} global ratings</span>
                  </div>
                </div>

                <div className="glass-panel-heavy p-6 rounded-2xl border-white/10 liquid-glass">
                  <h4 className="font-bold text-white mb-2">Review this product</h4>
                  <p className="text-sm text-white/50 mb-4">Share your thoughts with other customers</p>
                  <div className="flex items-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setReviewRating(r)} className="hover:scale-125 transition-transform hover:rotate-6">
                        <Star className={`h-8 w-8 transition-colors ${r <= reviewRating ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-white/20'}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Write your review here..." rows={4} className="mb-4 bg-black/40 border-white/20 text-white focus:border-neon-blue focus:ring-neon-blue rounded-xl w-full resize-none" />
                  <Button onClick={handleReview} disabled={submitting || !reviewComment.trim()} className="w-full bg-neon-purple hover:bg-neon-purple/80 text-white font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(58,123,213,0.5)]">
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Review
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                {promptReviews.length === 0 ? (
                  <div className="py-16 px-6 text-center glass-panel rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center shadow-inner border border-white/10 mb-4">
                      <MessageSquare className="h-8 w-8 text-white/30" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">No reviews yet</h3>
                    <p className="text-white/50 max-w-sm text-center leading-relaxed">
                      Be the first to share your experience with this prompt! Your feedback helps other buyers make informed decisions.
                    </p>
                  </div>
                ) : (
                  promptReviews.map((review: any) => (
                    <div key={review.id} className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-12 w-12 rounded-full glass-panel flex items-center justify-center bg-gradient-to-tr from-neon-blue/20 to-neon-purple/20 border-white/20">
                          <UserIcon className="h-6 w-6 text-white/70" />
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-wide">{review.user?.name || 'Customer'}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400' : 'text-white/20'}`} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]"><ShieldCheck className="h-3.5 w-3.5"/> Verified Purchase</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/80 leading-relaxed ml-16">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Buy Box (Sticky) */}
        <div className="w-full lg:w-[400px] shrink-0 relative">
          <div className="sticky top-24 space-y-4">
            <Card className="glass-panel-heavy p-8 border-white/20 liquid-glass rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-3 tracking-tight relative z-10">{prompt.title}</h1>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Badge variant="outline" className="border-neon-blue/50 text-neon-blue bg-neon-blue/10 font-bold px-3 py-1 shadow-[0_0_10px_rgba(0,210,255,0.2)]">{prompt.recommendedAI}</Badge>
                <span className="text-white/30">|</span>
                <span className="flex items-center gap-1.5 text-sm text-amber-400 font-bold drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"><Star className="h-4 w-4 fill-amber-400"/> {prompt.rating.toFixed(1)}</span>
              </div>
              
              <div className="mb-8 relative z-10">
                {prompt.isFree ? (
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">FREE</span>
                ) : (
                  <div>
                    {prompt.discount > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-neon-pink font-black text-xl drop-shadow-[0_0_10px_rgba(255,0,128,0.5)]">-{prompt.discount}%</span>
                        <span className="text-white/40 line-through text-md font-medium">{formatPrice(prompt.originalPrice || prompt.price, selectedCurrency)}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      {(() => {
                        const formatted = formatPrice(prompt.price, selectedCurrency);
                        const symbol = formatted.replace(/[0-9.,]/g, '').trim() || '$';
                        const amount = formatted.replace(/[^0-9.,]/g, '').trim();
                        return (
                          <>
                            <span className="text-xl font-bold mt-1 text-white/80">{symbol}</span>
                            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{amount}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 relative z-10">
                {isOwner || isAdmin ? (
                  <div className="p-5 glass-panel bg-neon-blue/10 border-neon-blue/30 rounded-2xl">
                    <p className="text-neon-blue font-bold text-center mb-4 flex items-center justify-center gap-2 drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]">
                      <ShieldCheck className="h-6 w-6" /> You are {isOwner ? 'the seller' : 'an admin'}
                    </p>
                    <Link href={isOwner ? '/seller/prompts' : '/admin'}>
                      <Button className="w-full bg-white hover:bg-white/90 text-black font-extrabold h-14 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all">
                        Manage Prompt
                      </Button>
                    </Link>
                  </div>
                ) : hasPurchased ? (
                  <div className="p-5 glass-panel bg-emerald-500/10 border-emerald-500/30 rounded-2xl">
                    <p className="text-emerald-400 font-bold text-center mb-4 flex items-center justify-center gap-2 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                      <Check className="h-6 w-6" /> You own this prompt
                    </p>
                    {(prompt as any).purchasedOrderId && (
                      <Link href={`/invoice/${(prompt as any).purchasedOrderId}`}>
                        <Button className="w-full bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold h-14 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all">
                          View Invoice
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {isInCart ? (
                      <Button className="w-full glass-panel bg-white/5 border-emerald-500/50 text-emerald-400 font-extrabold h-14 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.3)]" disabled>
                        <Check className="h-6 w-6 mr-2" /> Added to Cart
                      </Button>
                    ) : (
                      <Button onClick={handleAddToCart} disabled={submitting} className="w-full glass-panel bg-white/10 hover:bg-white/20 text-white font-extrabold h-14 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all border-white/20">
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add to Cart'}
                      </Button>
                    )}
                    <Button onClick={handleBuyNow} disabled={submitting} className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-black h-14 text-lg rounded-full shadow-[0_0_25px_rgba(0,210,255,0.6)] transition-all flex items-center justify-center">
                      <Zap className="h-5 w-5 mr-2" /> Buy Now
                    </Button>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-4 text-sm text-white/50 border-t border-white/10 pt-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-white/40" /> Secure transaction</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Sold by</span>
                  <Link href={`/store/${prompt.seller?.id}`} className="text-neon-purple hover:text-neon-pink font-bold transition-colors">{prompt.seller?.name || 'Seller'}</Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Returns</span>
                  <span className="font-medium text-white/70">Eligible for Refund</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10 relative z-10">
                <button onClick={handleWishlist} className={`flex items-center gap-2 text-sm font-bold transition-all ${isWishlisted ? 'text-neon-pink drop-shadow-[0_0_8px_rgba(255,0,128,0.6)]' : 'text-white/50 hover:text-white'}`}>
                  <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-neon-pink' : ''}`} /> {isWishlisted ? 'Saved to List' : 'Add to List'}
                </button>
                <button onClick={() => setReportOpen(true)} className="flex items-center gap-2 text-sm font-medium text-white/30 hover:text-red-400 hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.5)] transition-all">
                  <Flag className="h-4 w-4" /> Report
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <ReportModal promptId={prompt.id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
