'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, X, ChevronLeft, ChevronRight, Sparkles, Star, RotateCcw, Heart, ShoppingCart, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const getCoverImage = (prompt: { sampleImages?: string | string[] }) => {
  try {
    const images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : prompt.sampleImages;
    return images && images.length > 0 ? images[0] : null;
  } catch {
    return null;
  }
};

interface SearchFacets {
  categories: { id: string; name: string; count: number }[]
  priceRanges: { label: string; min: number; max: number; count: number }[]
  tags: { name: string; count: number }[]
}

interface SearchResult {
  prompts: any[]
  total: number
  page: number
  totalPages: number
  facets: SearchFacets
  suggestion: string | null
}

export default function BrowsePage() {
  const {
    categories, fetchCategories,
    toggleWishlist, addToCart, cart,
    wishlistedPromptIds, searchQuery, selectedCurrency,
  } = useStore()

  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('')
  const [minRatingFilter, setMinRatingFilter] = useState(0)
  const [sortBy, setSortBy] = useState('relevance')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [localPage, setLocalPage] = useState(1)
  const [localPrompts, setLocalPrompts] = useState<any[]>([])
  const [localTotal, setLocalTotal] = useState(0)
  const [localTotalPages, setLocalTotalPages] = useState(1)
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (categories.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const catParam = params.get('category')
    const sortParam = params.get('sort')
    const qParam = params.get('q')

    if (catParam) {
      const match = categories.find(c => c.slug === catParam || c.id === catParam)
      if (match && selectedCategories.length === 0) {
        queueMicrotask(() => setSelectedCategories([match.id]))
      }
    }

    if (sortParam && sortBy === 'relevance') {
      if (sortParam === 'popular') queueMicrotask(() => setSortBy('relevance'))
      else if (sortParam === 'newest') queueMicrotask(() => setSortBy('newest'))
    }

    if (qParam && !searchQuery) {
      queueMicrotask(() => useStore.getState().setSearchQuery(qParam))
    }
  }, [categories, searchQuery, selectedCategories, sortBy])

  const buildParams = useCallback((overridePage?: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (sortBy !== 'relevance') params.set('sortBy', sortBy)
    if (selectedCategories.length === 1) params.set('category', selectedCategories[0])
    if (selectedPriceRange) {
      const range = searchResults?.facets.priceRanges.find(r => r.label === selectedPriceRange)
      if (range) {
        if (range.min > 0) params.set('minPrice', String(range.min))
        if (isFinite(range.max)) params.set('maxPrice', String(range.max > 1000 ? '' : range.max))
      }
    }
    if (minRatingFilter > 0) params.set('rating', String(minRatingFilter))
    params.set('page', String(overridePage || localPage))
    params.set('limit', '24')
    return params
  }, [searchQuery, sortBy, selectedCategories, selectedPriceRange, minRatingFilter, localPage, searchResults])

  const performSearch = useCallback(async (overridePage?: number) => {
    setLocalLoading(true)
    try {
      const params = buildParams(overridePage)
      const res = await fetch(`/api/search?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data as SearchResult
        setSearchResults(d)
        setLocalPrompts(d.prompts)
        setLocalTotal(d.total)
        setLocalTotalPages(d.totalPages)
        if (overridePage) setLocalPage(overridePage)
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setLocalLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    queueMicrotask(() => performSearch(1))
  }, [searchQuery, sortBy, selectedCategories, selectedPriceRange, minRatingFilter, performSearch])

  const goToPage = (p: number) => {
    if (p < 1 || p > localTotalPages) return
    performSearch(p)
  }

  const handleWishlist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    await toggleWishlist(id)
  }

  const handleAddToCart = (prompt: any, e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(prompt)
  }

  const isInCart = (id: string) => cart.some(c => c.id === id)

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedPriceRange('')
    setMinRatingFilter(0)
    setSortBy('relevance')
  }

  const activeFilterCount = (selectedCategories.length > 0 ? 1 : 0) +
    (selectedPriceRange ? 1 : 0) +
    (minRatingFilter > 0 ? 1 : 0)

  const displayPrompts = localPrompts
  const displayTotal = localTotal
  const displayTotalPages = localTotalPages
  const displayPage = localPage

  return (
    <div className="bg-[#F1F3F6] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-[#878787]">
          <Link href="/" className="text-[#2874F0] hover:text-[#1a5dc7]">Home</Link>
          <span>/</span>
          <span className="text-[#212121]">Browse Prompts</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#212121]">Browse Prompts</h1>
            <p className="text-xs text-[#878787] mt-0.5">
              {localLoading ? 'Searching...' : `${displayTotal} results`}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-[#2874F0] hover:text-[#1a5dc7] font-medium flex items-center gap-1 cursor-pointer">
                <RotateCcw className="h-3 w-3" /> Clear All
              </button>
            )}
            <button onClick={() => setShowMobileFilters(true)} className="lg:hidden flex items-center gap-1.5 text-sm text-[#2874F0] font-medium cursor-pointer">
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
          </div>
        </div>

        {/* Spelling suggestion */}
        {searchResults?.suggestion && (
          <div className="mb-4 p-3 bg-[#FFF8E1] border border-[#FFE082] rounded-sm flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-[#FF9F00] shrink-0" />
            <span className="text-[#212121]">Did you mean: </span>
            <Link
              href={`/browse?q=${encodeURIComponent(searchResults.suggestion)}`}
              className="font-medium text-[#2874F0] hover:underline"
              onClick={(e) => {
                e.preventDefault()
                useStore.getState().setSearchQuery(searchResults.suggestion!)
                performSearch(1)
              }}
            >
              {searchResults.suggestion}
            </Link>
            ?
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="flipkart-filter-sidebar">
              {/* Active filter badges */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-[#F0F0F0]">
                  {selectedCategories.map(catId => {
                    const cat = categories.find(c => c.id === catId)
                    return cat ? (
                      <Badge key={catId} variant="outline" className="flex items-center gap-1 bg-[#F1F3F6] border-[#E0E0E0] text-[#212121] text-xs font-normal rounded-sm">
                        {cat.name}
                        <button onClick={() => toggleCategory(catId)} className="hover:text-[#FF6161] ml-1 cursor-pointer"><X className="h-3 w-3" /></button>
                      </Badge>
                    ) : null
                  })}
                  {selectedPriceRange && (
                    <Badge variant="outline" className="flex items-center gap-1 bg-[#F1F3F6] border-[#E0E0E0] text-[#212121] text-xs font-normal rounded-sm">
                      {selectedPriceRange}
                      <button onClick={() => setSelectedPriceRange('')} className="hover:text-[#FF6161] ml-1 cursor-pointer"><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {minRatingFilter > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 bg-[#F1F3F6] border-[#E0E0E0] text-[#212121] text-xs font-normal rounded-sm">
                      <Star className="h-3 w-3 fill-[#FF9F00] text-[#FF9F00]" /> {minRatingFilter}+
                      <button onClick={() => setMinRatingFilter(0)} className="hover:text-[#FF6161] ml-1 cursor-pointer"><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                </div>
              )}

              <div className="space-y-6">
                {/* Sort */}
                <div>
                  <h4 className="text-sm font-medium text-[#212121] mb-3">Sort By</h4>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white border-[#E0E0E0] text-[#212121] rounded-sm h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#F0F0F0] text-[#212121] rounded-sm">
                      <SelectItem value="relevance" className="cursor-pointer">Relevance</SelectItem>
                      <SelectItem value="price_asc" className="cursor-pointer">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc" className="cursor-pointer">Price: High to Low</SelectItem>
                      <SelectItem value="rating" className="cursor-pointer">Highest Rated</SelectItem>
                      <SelectItem value="newest" className="cursor-pointer">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-sm font-medium text-[#212121] mb-3">Categories</h4>
                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                    {categories.map(cat => {
                      const facetCount = searchResults?.facets.categories.find(c => c.id === cat.id)?.count
                      return (
                        <label key={cat.id} className="flex items-center gap-2.5 px-1 py-1.5 hover:bg-[#F1F3F6] rounded-sm cursor-pointer text-sm transition-colors group">
                          <Checkbox
                            checked={selectedCategories.includes(cat.id)}
                            onCheckedChange={() => toggleCategory(cat.id)}
                            className="border-[#C4C4C4] data-[state=checked]:bg-[#2874F0] data-[state=checked]:border-[#2874F0] h-4 w-4"
                          />
                          <span className="flex-1 text-[#212121] group-hover:text-[#2874F0] transition-colors">{cat.name}</span>
                          {facetCount !== undefined && (
                            <span className="text-[10px] text-[#878787]">{facetCount}</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-[#212121] mb-3">Price Range</h4>
                  <div className="flex flex-col gap-1">
                    {searchResults?.facets.priceRanges.map(range => (
                      <label key={range.label} className="flex items-center gap-2.5 px-1 py-1.5 hover:bg-[#F1F3F6] rounded-sm cursor-pointer text-sm transition-colors group">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={selectedPriceRange === range.label}
                          onChange={() => setSelectedPriceRange(range.label)}
                          className="text-[#2874F0] focus:ring-[#2874F0]"
                        />
                        <span className="flex-1 text-[#212121] group-hover:text-[#2874F0] transition-colors">{range.label}</span>
                        <span className="text-[10px] text-[#878787]">{range.count}</span>
                      </label>
                    ))}
                    {selectedPriceRange && (
                      <button onClick={() => setSelectedPriceRange('')} className="text-xs text-[#2874F0] text-left mt-1 hover:underline px-1 cursor-pointer">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Min Rating */}
                <div>
                  <h4 className="text-sm font-medium text-[#212121] mb-3">Minimum Rating</h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setMinRatingFilter(star === minRatingFilter ? 0 : star)}
                        className="hover:scale-110 transition-transform cursor-pointer">
                        <Star className={`h-5 w-5 ${star <= minRatingFilter ? 'fill-[#FF9F00] text-[#FF9F00]' : 'text-[#E0E0E0]'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-white overflow-auto lg:hidden" onClick={() => setShowMobileFilters(false)}>
              <div className="p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#F0F0F0]">
                  <h3 className="text-lg font-semibold text-[#212121]">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="text-[#878787] hover:text-[#212121] cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {/* Mobile filter content - same filter options */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-[#212121] mb-3">Sort By</h4>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-white border-[#E0E0E0] text-[#212121] rounded-sm h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#F0F0F0] text-[#212121] rounded-sm">
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#212121] mb-3">Categories</h4>
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2.5 py-2 cursor-pointer text-sm">
                        <Checkbox checked={selectedCategories.includes(cat.id)} onCheckedChange={() => toggleCategory(cat.id)}
                          className="border-[#C4C4C4] data-[state=checked]:bg-[#2874F0] data-[state=checked]:border-[#2874F0]" />
                        <span className="flex-1 text-[#212121]">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#212121] mb-3">Minimum Rating</h4>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => setMinRatingFilter(star === minRatingFilter ? 0 : star)}
                          className="hover:scale-110 transition-transform cursor-pointer">
                          <Star className={`h-6 w-6 ${star <= minRatingFilter ? 'fill-[#FF9F00] text-[#FF9F00]' : 'text-[#E0E0E0]'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { performSearch(1); setShowMobileFilters(false) }}
                    className="w-full bg-[#2874F0] text-white font-medium py-3 rounded-sm text-sm cursor-pointer">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {localLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#2874F0]" />
              </div>
            ) : displayPrompts.length === 0 ? (
              <div className="text-center py-24 bg-white border border-[#F0F0F0] rounded-sm">
                <Search className="h-12 w-12 text-[#C4C4C4] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#212121]">No prompts found</h3>
                <p className="text-sm text-[#878787] mt-1">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayPrompts.map(prompt => (
                    <Link key={prompt.id} href={`/prompt/${prompt.id}`}>
                      <Card className="flipkart-card overflow-hidden h-full flex flex-col group cursor-pointer">
                        <div className="relative h-36 bg-[#F1F3F6] flex items-center justify-center overflow-hidden">
                          {getCoverImage(prompt) ? (
                            <img src={getCoverImage(prompt)} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <Sparkles className="h-10 w-10 text-[#C4C4C4]" />
                          )}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {prompt.isFree && <span className="flipkart-badge-free">FREE</span>}
                            {prompt.discount > 0 && <span className="flipkart-badge-discount">-{prompt.discount}%</span>}
                          </div>
                          <button onClick={(e) => handleWishlist(prompt.id, e)}
                            className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-all cursor-pointer"
                            aria-label={wishlistedPromptIds.has(prompt.id) ? 'Remove from wishlist' : 'Add to wishlist'}>
                            <Heart className={`h-4 w-4 ${wishlistedPromptIds.has(prompt.id) ? 'fill-[#FF6161] text-[#FF6161]' : 'text-[#878787]'}`} />
                          </button>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <p className="text-[10px] font-medium text-[#878787] uppercase tracking-wide mb-1">{prompt.recommendedAI || 'General'}</p>
                          <h3 className="text-sm font-medium text-[#212121] line-clamp-1 mb-1 group-hover:text-[#2874F0] transition-colors">{prompt.title}</h3>
                          <p className="text-xs text-[#878787] line-clamp-1 mb-2 flex-1">{prompt.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flipkart-rating">
                              <Star className="h-3 w-3 fill-white" /> {prompt.rating?.toFixed(1)}
                            </span>
                            <span className="text-xs text-[#878787]">{prompt.reviewCount || 0} ratings</span>
                          </div>
                          <div className="flex items-center flex-wrap">
                            <span className="flipkart-price">{prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}</span>
                            {prompt.originalPrice && prompt.originalPrice > prompt.price && (
                              <>
                                <span className="flipkart-original-price">{formatPrice(prompt.originalPrice, selectedCurrency)}</span>
                                <span className="flipkart-discount">{Math.round((1 - prompt.price / prompt.originalPrice) * 100)}% off</span>
                              </>
                            )}
                          </div>
                          <div className="mt-3">
                            {isInCart(prompt.id) ? (
                              <div className="w-full text-center text-xs font-medium text-[#388E3C] bg-[#F1F3F6] py-2 rounded-sm cursor-not-allowed">
                                <ShoppingCart className="h-3.5 w-3.5 inline mr-1" /> In Cart
                              </div>
                            ) : (
                              <button onClick={(e) => handleAddToCart(prompt, e)}
                                className="w-full text-center text-xs font-medium text-white bg-[#FF9F00] hover:bg-[#FB641B] py-2 rounded-sm transition-colors cursor-pointer">
                                <ShoppingCart className="h-3.5 w-3.5 inline mr-1" /> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {displayTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => goToPage(displayPage - 1)}
                      disabled={displayPage <= 1}
                      className="px-3 py-1.5 text-sm border border-[#E0E0E0] bg-white text-[#212121] rounded-sm hover:bg-[#F1F3F6] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(displayTotalPages, 8) }).map((_, i) => {
                      let pageNum: number
                      if (displayTotalPages <= 8) pageNum = i + 1
                      else if (displayPage <= 4) pageNum = i + 1
                      else if (displayPage >= displayTotalPages - 3) pageNum = displayTotalPages - 7 + i
                      else pageNum = displayPage - 4 + i
                      return (
                        <button
                          key={i}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded-sm cursor-pointer ${
                            displayPage === pageNum
                              ? 'bg-[#2874F0] text-white font-medium'
                              : 'border border-[#E0E0E0] bg-white text-[#212121] hover:bg-[#F1F3F6]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => goToPage(displayPage + 1)}
                      disabled={displayPage >= displayTotalPages}
                      className="px-3 py-1.5 text-sm border border-[#E0E0E0] bg-white text-[#212121] rounded-sm hover:bg-[#F1F3F6] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
