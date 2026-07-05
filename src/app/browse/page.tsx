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
import Image from 'next/image'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Sparkles className="h-8 w-8 text-neon-blue animate-pulse" /> Explore Prompts
          </h1>
          <p className="text-sm font-medium text-white/60 mt-2 flex items-center gap-2">
            {localLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin text-neon-blue" /> Searching universe...</>
            ) : (
              `Showing ${displayPrompts.length} of ${displayTotal} results in ecosystem`
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/60 hover:text-neon-pink hover:bg-white/5 rounded-full">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="lg:hidden glass-panel border-white/20 text-white hover:bg-white/10 rounded-full" onClick={() => setShowMobileFilters(!showMobileFilters)}>
            <Filter className="h-4 w-4 mr-2" /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </div>
      </div>

      {/* Spelling suggestion banner */}
      {searchResults?.suggestion && (
        <div className="mb-6 p-4 glass-panel border-neon-blue/30 rounded-2xl flex items-center gap-3 text-sm text-neon-blue shadow-[0_0_15px_rgba(0,210,255,0.1)]">
          <Sparkles className="h-5 w-5 animate-pulse shrink-0" />
          <span>Did you mean: </span>
          <Link
            href={`/browse?q=${encodeURIComponent(searchResults.suggestion)}`}
            className="font-bold underline underline-offset-4 hover:text-white transition-colors"
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
        <aside className={`${showMobileFilters ? 'fixed inset-0 z-50 glass-panel-heavy bg-black/80 p-6 overflow-auto backdrop-blur-2xl' : 'hidden'} lg:block lg:w-64 shrink-0`}>
          {showMobileFilters && (
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="font-extrabold text-xl text-white">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-neon-pink hover:bg-neon-pink/10 rounded-full">
                    <RotateCcw className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)} className="text-white hover:bg-white/10 rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategories.map(catId => {
                const cat = categories.find(c => c.id === catId)
                return cat ? (
                  <Badge key={catId} variant="outline" className="flex items-center gap-1.5 text-xs bg-white/5 border-white/20 text-white backdrop-blur-md rounded-full py-1">
                    {cat.name}
                    <button onClick={() => toggleCategory(catId)} className="hover:text-neon-pink transition-colors"><X className="h-3 w-3" /></button>
                  </Badge>
                ) : null
              })}
              {selectedPriceRange && (
                <Badge variant="outline" className="flex items-center gap-1.5 text-xs bg-white/5 border-white/20 text-white backdrop-blur-md rounded-full py-1">
                  {selectedPriceRange}
                  <button onClick={() => setSelectedPriceRange('')} className="hover:text-neon-pink transition-colors"><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {minRatingFilter > 0 && (
                <Badge variant="outline" className="flex items-center gap-1.5 text-xs bg-white/5 border-white/20 text-white backdrop-blur-md rounded-full py-1">
                  <Star className="h-3 w-3 text-neon-blue fill-neon-blue" /> {minRatingFilter}+
                  <button onClick={() => setMinRatingFilter(0)} className="hover:text-neon-pink transition-colors"><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h4 className="font-semibold text-white mb-4">Categories</h4>
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => {
                  const facetCount = searchResults?.facets.categories.find(c => c.id === cat.id)?.count
                  return (
                    <label key={cat.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-sm transition-colors group">
                      <Checkbox
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                        className="border-white/30 data-[state=checked]:bg-neon-blue data-[state=checked]:border-neon-blue"
                      />
                      <span className="flex-1 text-white/80 group-hover:text-white transition-colors">{cat.name}</span>
                      <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full">{facetCount || 0}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-semibold text-white mb-4">Price Range</h4>
              <div className="flex flex-col gap-2">
                {searchResults?.facets.priceRanges.map(range => (
                  <label key={range.label} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-sm transition-colors group">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === range.label}
                      onChange={() => setSelectedPriceRange(range.label)}
                      className="text-neon-blue bg-white/5 border-white/20 focus:ring-neon-blue focus:ring-offset-black"
                    />
                    <span className="flex-1 text-white/80 group-hover:text-white transition-colors">{range.label}</span>
                    <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full">{range.count}</span>
                  </label>
                ))}
                {selectedPriceRange && (
                  <button onClick={() => setSelectedPriceRange('')} className="text-xs text-neon-pink text-left mt-2 hover:underline px-2">
                    Clear price filter
                  </button>
                )}
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <h4 className="font-semibold text-white mb-4">Minimum Rating</h4>
              <div className="flex items-center gap-3 px-2">
                <Slider
                  value={[minRatingFilter]}
                  onValueChange={([v]) => setMinRatingFilter(v)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-neon-blue w-10 text-right">
                  {minRatingFilter > 0 ? minRatingFilter.toFixed(1) : 'Any'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-3 px-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setMinRatingFilter(star === minRatingFilter ? 0 : star)} className="hover:scale-110 transition-transform">
                    <Star className={`h-5 w-5 ${star <= minRatingFilter ? 'fill-neon-blue text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.8)]' : 'text-white/20'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h4 className="font-semibold text-white mb-4">Sort By</h4>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-neon-blue focus:border-neon-blue h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel-heavy bg-black/80 border-white/10 text-white rounded-xl">
                  <SelectItem value="relevance" className="focus:bg-white/10 focus:text-white cursor-pointer">Relevance</SelectItem>
                  <SelectItem value="price_asc" className="focus:bg-white/10 focus:text-white cursor-pointer">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc" className="focus:bg-white/10 focus:text-white cursor-pointer">Price: High to Low</SelectItem>
                  <SelectItem value="rating" className="focus:bg-white/10 focus:text-white cursor-pointer">Highest Rated</SelectItem>
                  <SelectItem value="newest" className="focus:bg-white/10 focus:text-white cursor-pointer">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => { performSearch(1); setShowMobileFilters(false) }} className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-full h-12 shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:shadow-[0_0_25px_rgba(0,210,255,0.5)] transition-all">
              Apply Filters
            </Button>
          </div>
        </aside>

        {/* Prompt Grid */}
        <div className="flex-1">
          {localLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-neon-blue drop-shadow-[0_0_10px_rgba(0,210,255,0.8)]" />
            </div>
          ) : displayPrompts.length === 0 ? (
            <div className="text-center py-24 glass-panel rounded-3xl mx-2">
              <Search className="h-16 w-16 text-white/20 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white/80">No prompts found in this sector</h3>
              <p className="text-sm text-white/50 mt-2">Try adjusting your filters or expanding your search</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayPrompts.map(prompt => (
                  <Link key={prompt.id} href={`/prompt/${prompt.id}`}>
                    <Card className="neon-border glass-panel overflow-hidden h-full flex flex-col border-white/10 rounded-3xl group bg-black/40">
                      <div className="relative h-48 bg-black/40 flex items-center justify-center overflow-hidden">
                        {getCoverImage(prompt) ? (
                          <img src={getCoverImage(prompt)} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                        ) : (
                          <Sparkles className="h-16 w-16 text-white/10 group-hover:scale-110 transition-transform duration-700 group-hover:text-neon-blue/50" />
                        )}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {prompt.isFree && <Badge className="bg-neon-blue text-black font-bold border-0 shadow-[0_0_10px_rgba(0,210,255,0.8)] backdrop-blur-md">FREE</Badge>}
                          {prompt.discount > 0 && <Badge className="bg-neon-pink text-white font-bold border-0 shadow-[0_0_10px_rgba(255,0,128,0.8)] backdrop-blur-md">-{prompt.discount}%</Badge>}
                        </div>
                        <button onClick={(e) => handleWishlist(prompt.id, e)}
                          className="absolute top-3 left-3 p-2 rounded-full bg-black/40 border border-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
                          <Heart className={`h-4 w-4 ${wishlistedPromptIds.has(prompt.id) ? 'fill-neon-pink text-neon-pink shadow-[0_0_10px_rgba(255,0,128,0.8)]' : 'text-white/70'}`} />
                        </button>
                      </div>
                      <div className="p-5 flex flex-col flex-1 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-white/5 border-white/10 text-white/70 backdrop-blur-md">{prompt.recommendedAI || 'General'}</Badge>
                          {prompt.qualityScore && <Badge className={`text-[10px] px-2 py-0.5 border-0 ${prompt.qualityScore >= 0.8 ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' : 'bg-white/5 text-white/70'}`}>Q: {Math.round(prompt.qualityScore * 100)}</Badge>}
                          <span className="text-[10px] text-white/50 flex items-center gap-1 ml-auto"><Eye className="h-3 w-3" /> {prompt.viewCount}</span>
                        </div>
                        <h3 className="font-bold text-white text-base line-clamp-2 mb-2 group-hover:text-neon-blue transition-colors">{prompt.title}</h3>
                        <p className="text-xs text-white/50 line-clamp-2 flex-1">{prompt.description}</p>
                        
                        <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-4 text-xs text-white/60 font-medium">
                            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-neon-blue fill-neon-blue shadow-[0_0_5px_rgba(0,210,255,0.8)]" />{prompt.rating?.toFixed(1)}</span>
                            <span className="flex items-center gap-1.5"><Download className="h-4 w-4" />{prompt.downloadCount}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-white/30 line-through h-3">
                              {prompt.originalPrice && prompt.originalPrice > prompt.price ? formatPrice(prompt.originalPrice) : ''}
                            </span>
                            {prompt.isFree ? (
                              <span className="text-neon-blue font-extrabold text-lg drop-shadow-[0_0_8px_rgba(0,210,255,0.5)]">FREE</span>
                            ) : (
                              <span className="font-extrabold text-white text-lg drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{formatPrice(prompt.price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          {isInCart(prompt.id) ? (
                            <Button size="sm" className="flex-1 text-xs h-10 font-bold bg-white/10 text-white/50 border border-white/5 cursor-not-allowed rounded-full">
                              In Cart
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1 text-xs h-10 font-bold bg-white text-black hover:bg-neon-blue hover:text-black hover:shadow-[0_0_15px_rgba(0,210,255,0.6)] rounded-full transition-all" onClick={(e) => handleAddToCart(prompt, e)}>
                              <ShoppingCart className="h-4 w-4 mr-2" /> Add
                            </Button>
                          )}
                          <button onClick={(e) => handleLike(prompt.id, e)}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${likedPromptIds.has(prompt.id) ? 'bg-neon-pink/20 border-neon-pink/50 text-neon-pink shadow-[0_0_10px_rgba(255,0,128,0.3)]' : 'border-white/20 text-white/60 hover:bg-white/10 hover:border-white/30 bg-white/5'}`}>
                            <Heart className={`h-4 w-4 ${likedPromptIds.has(prompt.id) ? 'fill-neon-pink text-neon-pink' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {displayTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(displayPage - 1)}
                    disabled={displayPage <= 1}
                    className="glass-panel border-white/20 text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
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
                        className={`rounded-full h-10 w-10 p-0 font-bold ${displayPage === pageNum ? 'bg-gradient-to-tr from-neon-blue to-neon-purple text-white shadow-[0_0_15px_rgba(0,210,255,0.4)] border-0' : 'glass-panel border-white/20 text-white/70 hover:bg-white/10 hover:text-white'}`}
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
                    className="glass-panel border-white/20 text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
                  >
                    <ChevronRight className="h-5 w-5" />
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
