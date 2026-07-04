'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, X, ChevronLeft, ChevronRight, Sparkles, Star, Filter, RotateCcw, Heart, ShoppingCart, Eye, Download } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const getCoverImage = (prompt: any) => {
  try {
    const images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : prompt.sampleImages;
    return images && images.length > 0 ? images[0] : null;
  } catch (e) {
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
    categories, fetchCategories, user,
    toggleLike, toggleWishlist, addToCart, cart,
    likedPromptIds, wishlistedPromptIds, searchQuery,
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
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const catParam = params.get('category')
    const sortParam = params.get('sort')
    const qParam = params.get('q')

    if (categories.length > 0 && catParam) {
      const match = categories.find(c => c.slug === catParam || c.id === catParam)
      if (match && selectedCategories.length === 0) {
        setSelectedCategories([match.id])
      }
    }

    if (sortParam && sortBy === 'relevance') {
      if (sortParam === 'popular') setSortBy('relevance')
      else if (sortParam === 'newest') setSortBy('newest')
    }

    if (qParam && !searchQuery) {
      useStore.getState().setSearchQuery(qParam)
    }
  }, [categories])

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
    } catch (e) {
      toast.error('Search failed')
    } finally {
      setLocalLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    performSearch(1)
  }, [searchQuery, sortBy, selectedCategories, selectedPriceRange, minRatingFilter])

  const goToPage = (p: number) => {
    if (p < 1 || p > localTotalPages) return
    performSearch(p)
  }

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    await toggleLike(id)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#0066CC]" /> Explore Prompts
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
            {localLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</>
            ) : (
              `Showing ${displayPrompts.length} of ${displayTotal} results in ecosystem`
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-red-500">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowMobileFilters(!showMobileFilters)}>
            <Filter className="h-4 w-4 mr-2" /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </div>
      </div>

      {/* Spelling suggestion banner */}
      {searchResults?.suggestion && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Did you mean: </span>
          <Link
            href={`/browse?q=${encodeURIComponent(searchResults.suggestion)}`}
            className="font-semibold underline underline-offset-2 hover:text-amber-900"
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
        <aside className={`${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'hidden'} lg:block lg:w-64 shrink-0`}>
          {showMobileFilters && (
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="font-bold text-lg">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-500">
                    <RotateCcw className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedCategories.map(catId => {
                const cat = categories.find(c => c.id === catId)
                return cat ? (
                  <Badge key={catId} variant="secondary" className="flex items-center gap-1 text-xs">
                    {cat.name}
                    <button onClick={() => toggleCategory(catId)}><X className="h-3 w-3" /></button>
                  </Badge>
                ) : null
              })}
              {selectedPriceRange && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  {selectedPriceRange}
                  <button onClick={() => setSelectedPriceRange('')}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {minRatingFilter > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  ⭐ {minRatingFilter}+
                  <button onClick={() => setMinRatingFilter(0)}><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Categories</h4>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {categories.map(cat => {
                  const facetCount = searchResults?.facets.categories.find(c => c.id === cat.id)?.count
                  return (
                    <label key={cat.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <span className="flex-1 text-slate-700">{cat.name}</span>
                      <span className="text-xs text-slate-400">({facetCount || 0})</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Price Range</h4>
              <div className="flex flex-col gap-1.5">
                {searchResults?.facets.priceRanges.map(range => (
                  <label key={range.label} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === range.label}
                      onChange={() => setSelectedPriceRange(range.label)}
                      className="text-[#0066CC]"
                    />
                    <span className="flex-1 text-slate-700">{range.label}</span>
                    <span className="text-xs text-slate-400">({range.count})</span>
                  </label>
                ))}
                {selectedPriceRange && (
                  <button onClick={() => setSelectedPriceRange('')} className="text-xs text-[#0066CC] text-left mt-1 hover:underline">
                    Clear price filter
                  </button>
                )}
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Minimum Rating</h4>
              <div className="flex items-center gap-2">
                <Slider
                  value={[minRatingFilter]}
                  onValueChange={([v]) => setMinRatingFilter(v)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-slate-700 w-10 text-right">
                  {minRatingFilter > 0 ? minRatingFilter.toFixed(1) : 'Any'}
                </span>
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setMinRatingFilter(star === minRatingFilter ? 0 : star)}>
                    <Star className={`h-4 w-4 ${star <= minRatingFilter ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Sort By</h4>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => { performSearch(1); setShowMobileFilters(false) }} className="w-full bg-[#0066CC] text-white">
              Apply Filters
            </Button>
          </div>
        </aside>

        {/* Prompt Grid */}
        <div className="flex-1">
          {localLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
            </div>
          ) : displayPrompts.length === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">No prompts found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayPrompts.map(prompt => (
                  <Link key={prompt.id} href={`/prompt/${prompt.id}`}>
                    <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full border-slate-100 flex flex-col">
                      <div className="relative h-48 bg-gradient-to-br from-[#0066CC]/5 to-[#FF6600]/5 flex items-center justify-center overflow-hidden">
                        {getCoverImage(prompt) ? (
                          <img src={getCoverImage(prompt)} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <Sparkles className="h-16 w-16 text-[#0066CC]/10 group-hover:scale-110 group-hover:text-[#0066CC]/20 transition-all duration-500" />
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          {prompt.isFree && <Badge className="bg-green-500 text-white border-0 shadow-sm">Free</Badge>}
                          {prompt.discount > 0 && <Badge variant="destructive" className="shadow-sm">-{prompt.discount}%</Badge>}
                        </div>
                        <button onClick={(e) => handleWishlist(prompt.id, e)}
                          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm transition-colors shadow-sm">
                          <Heart className={`h-4 w-4 ${wishlistedPromptIds.has(prompt.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600">{prompt.recommendedAI || 'General'}</Badge>
                          {prompt.qualityScore && <Badge className={`text-[10px] px-1.5 py-0 border-0 ${prompt.qualityScore >= 0.8 ? 'bg-emerald-100 text-emerald-700' : prompt.qualityScore >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>Q: {Math.round(prompt.qualityScore * 100)}</Badge>}
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto"><Eye className="h-3 w-3" /> {prompt.viewCount}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1 group-hover:text-[#0066CC] transition-colors">{prompt.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 flex-1">{prompt.description}</p>
                        
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />{prompt.rating?.toFixed(1)}</span>
                            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{prompt.downloadCount}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-slate-400 line-through h-3">
                              {prompt.originalPrice && prompt.originalPrice > prompt.price ? formatPrice(prompt.originalPrice) : ''}
                            </span>
                            {prompt.isFree ? (
                              <span className="text-green-600 font-extrabold text-sm">FREE</span>
                            ) : (
                              <span className="font-extrabold text-slate-900 text-base">{formatPrice(prompt.price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {isInCart(prompt.id) ? (
                            <Button size="sm" variant="secondary" className="flex-1 text-xs h-9 font-semibold bg-slate-100" disabled>
                              In Cart
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1 text-xs h-9 font-semibold bg-slate-900 hover:bg-[#0066CC] text-white transition-colors" onClick={(e) => handleAddToCart(prompt, e)}>
                              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Add
                            </Button>
                          )}
                          <button onClick={(e) => handleLike(prompt.id, e)}
                            className={`p-2 rounded-md border transition-colors ${likedPromptIds.has(prompt.id) ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}>
                            <Heart className={`h-4 w-4 ${likedPromptIds.has(prompt.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {displayTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(displayPage - 1)}
                    disabled={displayPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(displayTotalPages, 10) }).map((_, i) => {
                    let pageNum: number
                    if (displayTotalPages <= 10) {
                      pageNum = i + 1
                    } else if (displayPage <= 5) {
                      pageNum = i + 1
                    } else if (displayPage >= displayTotalPages - 4) {
                      pageNum = displayTotalPages - 9 + i
                    } else {
                      pageNum = displayPage - 5 + i
                    }
                    return (
                      <Button
                        key={i}
                        variant={displayPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={displayPage === pageNum ? 'bg-[#0066CC]' : ''}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(displayPage + 1)}
                    disabled={displayPage >= displayTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
