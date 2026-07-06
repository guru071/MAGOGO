'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore, formatPrice } from '@/store/marketplace'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Heart, ShoppingCart, Star, Download, Sparkles,
  MessageSquare, Loader2, Check, Flag,
  Users, ShieldCheck, Zap,
  ChevronRight, Code, Lock, Store, ArrowRight
} from 'lucide-react'
import ReportModal from '@/components/marketplace/ReportModal'
import CommentSection from '@/components/marketplace/CommentSection'

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const {
    selectedPrompt, loading,
    user, selectedCurrency, cart, wishlistedPromptIds,
    fetchPromptDetail, toggleWishlist, addToCart,
    setShowAuthModal,
  } = useStore()

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [qnaList, setQnaList] = useState<any[]>([])
  const [questionText, setQuestionText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [relatedPrompts, setRelatedPrompts] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      fetchPromptDetail(id)
      fetch(`/api/qna?promptId=${id}`).then(r => r.json()).then(d => {
        if (d.success) setQnaList(d.data)
      }).catch(console.error)
    }
  }, [id, fetchPromptDetail])

  useEffect(() => {
    if (!selectedPrompt?.category?.id) return
    fetch(`/api/prompts?category=${selectedPrompt.category.id}&limit=5&sort=popular`)
      .then(r => r.json()).then(d => {
        if (d.success && d.data) {
          setRelatedPrompts(d.data.prompts.filter((p: any) => p.id !== selectedPrompt.id).slice(0, 4))
        }
      }).catch(() => {})
  }, [selectedPrompt?.id, selectedPrompt?.category?.id])

  if (loading || !selectedPrompt) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 bg-background min-h-screen">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-8">
          <div className="flex-1">
            <Skeleton className="h-80 w-full mb-4" />
          </div>
          <div className="w-80">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const prompt = selectedPrompt
  const isWishlisted = wishlistedPromptIds.has(prompt.id)
  const isInCart = cart.some(c => c.id === prompt.id)
  const isOwner = (prompt as any).accessReason === 'OWNER'
  const isAdmin = (prompt as any).accessReason === 'ADMIN'
  const hasPurchased = (prompt as any).accessReason === 'PURCHASED'
  const hasAccess = prompt.hasAccess

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
        addToCart(prompt);
        toast.success('Added to cart!');
      } else {
        toast.error(data.error);
      }
    } catch {
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

  const submitReview = async () => {
    if (!user) { setShowAuthModal(true); return }
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/prompts/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Review submitted successfully!')
        setReviewComment('')
        setReviewRating(5)
        fetch(`/api/prompts/${id}/reviews`).then(r => r.json()).then(d => {
          if (d.success) setReviews(d.data)
        })
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setSubmittingReview(false)
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
    <div className="bg-[#F1F3F6] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-[#878787]">
            <Link href="/" className="text-[#2874F0] hover:text-[#1a5dc7]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/browse?category=${prompt.category?.slug}`} className="text-[#2874F0] hover:text-[#1a5dc7]">{prompt.category?.name || 'Category'}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#212121] truncate max-w-[200px]">{prompt.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Product Images + Description */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Main Image */}
            <div className="bg-white border border-[#F0F0F0] rounded-sm p-4 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
              {(() => {
                let images = [];
                try { images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : (prompt.sampleImages || []); } catch {}
                if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') {
                  return <img src={images[0]} alt={prompt.title} className="max-w-full max-h-[400px] object-contain" />;
                }
                return <Sparkles className="h-24 w-24 text-[#C4C4C4]" />;
              })()}
            </div>

            {/* Description */}
            <div className="bg-white border border-[#F0F0F0] rounded-sm p-6">
              <h2 className="text-lg font-semibold text-[#212121] mb-4">Product Description</h2>
              <p className="text-sm text-[#212121] leading-relaxed">{prompt.description}</p>

              {/* Tags */}
              {prompt.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(() => {
                    let tags: string[] = [];
                    try { tags = typeof prompt.tags === 'string' && prompt.tags.startsWith('[') ? JSON.parse(prompt.tags) : prompt.tags.split(','); } catch { tags = prompt.tags.split(','); }
                    if (!Array.isArray(tags)) tags = [tags as string];
                    return tags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs bg-[#F1F3F6] text-[#878787] px-2 py-1 rounded-sm">{tag?.trim?.() || tag}</span>
                    ));
                  })()}
                </div>
              )}

              {/* Prompt text */}
              <div className="mt-6">
                <h3 className="font-semibold text-sm text-[#212121] mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4 text-[#2874F0]" /> The Prompt
                </h3>
                {hasAccess ? (
                  <div className="p-4 bg-[#F1F3F6] border border-[#E0E0E0] rounded-sm text-sm text-[#212121] font-mono leading-relaxed whitespace-pre-wrap relative">
                    {(isOwner || isAdmin) && (
                      <div className="mb-3 p-2 bg-[#E3F2FD] rounded text-xs text-[#2874F0] flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Visible to you because you are {isOwner ? 'the seller' : 'an admin'}.
                      </div>
                    )}
                    {prompt.promptText}
                    <button
                      onClick={() => { navigator.clipboard.writeText(prompt.promptText || ''); toast.success('Copied to clipboard'); }}
                      className="absolute top-2 right-2 text-xs bg-white border border-[#E0E0E0] px-2 py-1 rounded-sm hover:bg-[#F1F3F6] transition-colors cursor-pointer"
                      aria-label="Copy prompt text"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-[#F1F3F6] border border-[#E0E0E0] rounded-sm text-center">
                    <Lock className="h-6 w-6 text-[#878787] mx-auto mb-2" />
                    <p className="text-sm text-[#878787]">Purchase to unlock the prompt</p>
                  </div>
                )}
              </div>
            </div>

            {/* Q&A Section */}
            <div className="bg-white border border-[#F0F0F0] rounded-sm p-6">
              <h2 className="text-lg font-semibold text-[#212121] mb-4">Customer Questions & Answers</h2>
              <div className="flex gap-3 mb-6">
                <Input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Have a question? Ask the seller..."
                  className="flex-1 bg-white border-[#E0E0E0] text-[#212121] placeholder:text-[#878787] rounded-sm h-10 text-sm"
                  aria-label="Ask a question"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={submitting || !questionText.trim()}
                  className="bg-[#2874F0] text-white px-6 rounded-sm text-sm font-medium hover:bg-[#1a5dc7] disabled:opacity-50 cursor-pointer"
                >
                  Ask
                </button>
              </div>
              <div className="space-y-4">
                {qnaList.length === 0 ? (
                  <p className="text-sm text-[#878787] text-center py-4 italic">No questions yet.</p>
                ) : (
                  qnaList.map((qna: any) => (
                    <div key={qna.id} className="pb-4 border-b border-[#F0F0F0] last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <div className="font-bold text-[#2874F0] shrink-0">Q:</div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#212121]">{qna.question}</p>
                          <p className="text-xs text-[#878787] mt-1">Asked by {qna.author?.name || 'Customer'} on {new Date(qna.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {qna.answerText && (
                        <div className="flex gap-3 mt-3 ml-4">
                          <div className="font-bold text-[#388E3C] shrink-0">A:</div>
                          <div className="flex-1 p-3 bg-[#F1F3F6] rounded-sm">
                            <p className="text-sm text-[#212121]">{qna.answerText}</p>
                            <p className="text-xs text-[#878787] mt-2">Answered by {qna.answer?.name || 'Seller'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <CommentSection promptId={prompt.id} />

            {/* Reviews */}
            <div className="bg-white border border-[#F0F0F0] rounded-sm p-6">
              <h2 className="text-lg font-semibold text-[#212121] mb-4">Customer Reviews</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl font-bold text-[#212121]">{prompt.rating.toFixed(1)}</div>
                <div className="flex flex-col">
                  <div className="flex text-[#FF9F00]">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(prompt.rating) ? 'fill-[#FF9F00]' : 'text-[#E0E0E0]'}`} />)}
                  </div>
                  <span className="text-xs text-[#878787] mt-0.5">{prompt.reviewCount || 0} ratings</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  {hasPurchased && !isOwner && !reviews.find((r: any) => r.userId === user?.id) && (
                    <div className="bg-[#F1F3F6] p-4 rounded-sm">
                      <h4 className="font-medium text-sm text-[#212121] mb-2">Rate this product</h4>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(r => (
                          <button key={r} onClick={() => setReviewRating(r)}
                            className="hover:scale-110 transition-transform cursor-pointer" aria-label={`Rate ${r} stars`}>
                            <Star className={`h-6 w-6 ${r <= reviewRating ? 'fill-[#FF9F00] text-[#FF9F00]' : 'text-[#C4C4C4]'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your review..."
                        rows={3}
                        className="w-full text-sm border border-[#E0E0E0] rounded-sm p-2 mb-3 bg-white text-[#212121] placeholder:text-[#878787] focus:outline-none focus:border-[#2874F0] resize-none"
                        aria-label="Review comment"
                      />
                      <button
                        onClick={submitReview}
                        disabled={submittingReview || !reviewComment.trim()}
                        className="w-full bg-[#2874F0] text-white text-sm font-medium py-2 rounded-sm hover:bg-[#1a5dc7] disabled:opacity-50 cursor-pointer"
                      >
                        {submittingReview && <Loader2 className="h-3 w-3 animate-spin inline mr-1" />} Submit Review
                      </button>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-[#E0E0E0] rounded-sm">
                      <MessageSquare className="h-8 w-8 text-[#C4C4C4] mx-auto mb-2" />
                      <p className="text-sm text-[#878787]">No reviews yet</p>
                    </div>
                  ) : (
                    reviews.map((review: any) => (
                      <div key={review.id} className="pb-4 border-b border-[#F0F0F0] last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-8 w-8 rounded-full bg-[#F1F3F6] flex items-center justify-center overflow-hidden">
                            {review.user?.avatar ? (
                              <img src={review.user.avatar} alt={`${review.user?.name || 'User'}'s avatar`} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-4 w-4 text-[#878787]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#212121]">{review.user?.name || 'Customer'}</p>
                            <div className="flex text-[#FF9F00]">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-[#FF9F00]' : 'text-[#E0E0E0]'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-[#212121] ml-11">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Buy Box */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white border border-[#F0F0F0] rounded-sm p-6 sticky top-20">
              <h1 className="text-lg font-semibold text-[#212121] mb-2">{prompt.title}</h1>

              {prompt.isFree ? (
                <div className="text-2xl font-bold text-[#388E3C] mb-4">FREE</div>
              ) : (
                <div className="mb-4">
                  {prompt.discount > 0 && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flipkart-discount text-sm">-{prompt.discount}%</span>
                      <span className="flipkart-original-price">{formatPrice(prompt.originalPrice || prompt.price, selectedCurrency)}</span>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-[#212121]">{formatPrice(prompt.price, selectedCurrency)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
                </div>
              )}

              {/* Seller info */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">Sold by</span>
                <Link href={`/store/${prompt.seller?.id}`} className="text-xs font-medium text-primary hover:text-primary/80">
                  {prompt.seller?.name || 'Seller'}
                </Link>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {isOwner || isAdmin ? (
                  <div className="p-3 bg-primary/5 rounded-sm text-center">
                    <p className="text-sm font-medium text-primary mb-2">You are {isOwner ? 'the seller' : 'an admin'}</p>
                    <Link href={isOwner ? '/seller/prompts' : '/admin'}>
                      <button className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-sm text-sm hover:bg-primary/90 cursor-pointer">Manage</button>
                    </Link>
                  </div>
                ) : hasPurchased ? (
                  <div className="p-3 bg-brand-green/10 rounded-sm text-center">
                    <p className="text-sm font-medium text-brand-green mb-2">You own this prompt</p>
                    {((prompt as any).purchasedOrderId) && (
                      <Link href={`/invoice/${(prompt as any).purchasedOrderId}`}>
                        <button className="w-full bg-brand-green text-white font-medium py-2 rounded-sm text-sm hover:bg-brand-green/90 cursor-pointer">View Invoice</button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {isInCart ? (
                      <div className="w-full text-center text-sm font-medium text-brand-green bg-muted py-3 rounded-sm">
                        <Check className="h-4 w-4 inline mr-1" aria-hidden="true" /> Added to Cart
                      </div>
                    ) : (
                      <button onClick={handleAddToCart} disabled={submitting}
                        className="w-full bg-accent text-accent-foreground font-medium py-3 rounded-sm text-sm hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin inline" aria-hidden="true" /> : <><ShoppingCart className="h-4 w-4 inline mr-1.5" aria-hidden="true" /> Add to Cart</>}
                      </button>
                    )}
                    <button onClick={handleBuyNow} disabled={submitting}
                      className="w-full bg-brand-buy text-white font-medium py-3 rounded-sm text-sm hover:bg-brand-buy/90 transition-colors cursor-pointer disabled:opacity-50">
                      <Zap className="h-4 w-4 inline mr-1.5" aria-hidden="true" /> Buy Now
                    </button>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
                <button onClick={handleWishlist}
                  className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${isWishlisted ? 'text-brand-red' : 'text-muted-foreground hover:text-foreground'}`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-brand-red' : ''}`} aria-hidden="true" /> Save
                </button>
                <button onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-red transition-colors cursor-pointer"
                  aria-label="Report this product">
                  <Flag className="h-4 w-4" aria-hidden="true" /> Report
                </button>
              </div>

              {/* Features */}
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Lock className="h-3 w-3" aria-hidden="true" /> Secure transaction</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Eligible for refund</div>
                <div className="flex items-center gap-2"><Download className="h-3 w-3" aria-hidden="true" /> Instant digital access</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Related Prompts */}
      {relatedPrompts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="bg-white border border-[#F0F0F0] rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#212121]">Related Prompts</h2>
              <Link href={`/browse?category=${prompt.category?.slug}`} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedPrompts.map((rp: any) => (
                <Link key={rp.id} href={`/prompt/${rp.id}`} className="group">
                  <div className="border border-[#F0F0F0] rounded-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-28 bg-[#F1F3F6] flex items-center justify-center overflow-hidden">
                      {(() => {
                        let imgs: string[] = [];
                        try { imgs = typeof rp.sampleImages === 'string' ? JSON.parse(rp.sampleImages) : (rp.sampleImages || []); } catch {}
                        return imgs.length > 0 ? (
                          <img src={imgs[0]} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : <Sparkles className="h-10 w-10 text-[#C4C4C4]" />;
                      })()}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-[#212121] line-clamp-1 group-hover:text-primary transition-colors">{rp.title}</h3>
                      <p className="text-xs text-[#212121] font-semibold mt-1">{rp.isFree ? 'FREE' : formatPrice(rp.price, selectedCurrency)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <ReportModal promptId={prompt.id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
