'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/marketplace'
import {
  ShoppingCart, Heart, User, Search, LogOut, Menu, X, Package, Settings,
  Briefcase, PlusCircle, Wallet, MessageCircle, TrendingUp, Command, Folder,
  Tag, Clock, List, History, Palette, ChevronDown, Store, HelpCircle
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const RECENT_SEARCHES_KEY = 'pb_recent_searches'
const MAX_RECENT = 5

interface SuggestionGroup {
  label: string
  items: { text: string; type: 'prompt' | 'category' | 'tag' }[]
}

export function Navbar() {
  const router = useRouter()
  const { user, logout, cart, setSearchQuery, searchPrompts, setShowAuthModal, setAuthMode } = useStore()
  const [searchValue, setSearchValue] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)) } catch (e) { console.error('[Navbar] parse recent searches error', e) }
    }
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, MAX_RECENT)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }

  const trackSearchAnalytics = (query: string, resultsCount = 0) => {
    fetch('/api/analytics/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, resultsCount }),
    }).catch(e => { console.error('[Navbar] track search analytics error', e) })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true)
      try {
        const res = await fetch(`/api/ai/search/suggest?q=${encodeURIComponent(value)}`)
        const d = await res.json()
        if (d.success && d.data) {
          const grouped: SuggestionGroup[] = [
            { label: 'Prompts', items: d.data.slice(0, 4).map((s: string) => ({ text: s, type: 'prompt' as const })) },
          ]
          if (d.categories?.length) {
            grouped.push({ label: 'Categories', items: d.categories.map((s: string) => ({ text: s, type: 'category' as const })) })
          }
          if (d.tags?.length) {
            grouped.push({ label: 'Tags', items: d.tags.map((s: string) => ({ text: s, type: 'tag' as const })) })
          }
          const hasItems = grouped.some(g => g.items.length > 0)
          setSuggestions(hasItems ? grouped : [])
          setShowSuggestions(hasItems)
        }
      } catch (e) { console.error('[Navbar] search suggestions error', e) } finally { setSuggestLoading(false) }
    }, 300)
  }

  const selectSuggestion = (s: string) => {
    setSearchValue(s)
    setShowSuggestions(false)
    saveRecentSearch(s)
    setSearchQuery(s)
    searchPrompts(s)
    router.push('/browse')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      setShowSuggestions(false)
      saveRecentSearch(searchValue)
      setSearchQuery(searchValue)
      searchPrompts(searchValue)
      trackSearchAnalytics(searchValue)
      router.push('/browse')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const hasSuggestions = suggestions.some(g => g.items.length > 0) || recentSearches.length > 0

  const cartCount = cart.length
  const wishlistCount = useStore.getState().wishlistedPromptIds.size

  return (
    <header className="sticky top-0 z-50 bg-[#2874F0] shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="relative h-8 w-8">
            <Image src="/logo.jpeg" alt="MAGHGO" fill className="object-contain rounded-full" sizes="32px" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight hidden sm:block" style={{ fontStyle: 'italic' }}>MAGHGO</span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2874F0]" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (hasSuggestions && searchValue.trim().length >= 2) setShowSuggestions(true) }}
              placeholder="Search for prompts, categories and more"
              className="w-full h-9 pl-9 pr-3 rounded-sm border-none text-sm text-[#212121] bg-white placeholder:text-[#878787] focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Search prompts"
            />
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#F0F0F0] rounded-sm shadow-lg z-50 max-h-80 overflow-y-auto">
                {suggestLoading && <div className="p-3 text-xs text-[#878787] text-center">Loading...</div>}
                {!suggestLoading && suggestions.map((group, gi) => (
                  <div key={gi}>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#878787] bg-[#F1F3F6]">{group.label}</div>
                    {group.items.map((item, ii) => (
                      <button
                        key={`${gi}-${ii}`}
                        type="button"
                        onClick={() => selectSuggestion(item.text)}
                        className="w-full text-left px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        {item.type === 'category' ? <Folder className="h-3 w-3 text-[#2874F0]" /> :
                         item.type === 'tag' ? <Tag className="h-3 w-3 text-[#FF9F00]" /> :
                         <TrendingUp className="h-3 w-3 text-[#2874F0]" />}
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                ))}
                {!suggestLoading && recentSearches.length > 0 && searchValue.trim().length < 2 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#878787] bg-[#F1F3F6] flex items-center justify-between">
                      <span>Recent Searches</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }}
                        className="text-[10px] text-[#2874F0] hover:text-[#FF9F00] cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Clock className="h-3 w-3 text-[#878787]" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Right section */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/browse" className="flipkart-nav-link px-2">
            Browse
          </Link>

          <Link href="/cart" className="relative p-2 text-white hover:opacity-80 transition-opacity">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="flipkart-badge-count absolute -top-0.5 -right-0.5">{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-white hover:opacity-80 transition-opacity px-2 cursor-pointer">
                  <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <span className="text-sm font-medium max-w-[80px] truncate hidden lg:block">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white border border-[#F0F0F0] rounded-sm shadow-lg text-[#212121]">
                <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                  <Link href="/account"><User className="h-4 w-4 mr-2 text-[#2874F0]" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                  <Link href="/account/orders"><Package className="h-4 w-4 mr-2 text-[#2874F0]" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                  <Link href="/account/wishlist"><Heart className="h-4 w-4 mr-2 text-[#FF9F00]" /> Wishlist</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                  <Link href="/account/settings"><Settings className="h-4 w-4 mr-2 text-[#878787]" /> Settings</Link>
                </DropdownMenuItem>
                {(user.isSeller || user.role === 'ADMIN') && (
                  <>
                    <DropdownMenuSeparator className="bg-[#F0F0F0]" />
                    <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                      <Link href="/seller"><Briefcase className="h-4 w-4 mr-2 text-[#2874F0]" /> Seller Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                      <Link href="/seller/prompts"><List className="h-4 w-4 mr-2" /> My Prompts</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-[#F1F3F6] cursor-pointer">
                      <Link href="/seller/upload"><PlusCircle className="h-4 w-4 mr-2 text-[#FF9F00]" /> Sell New Prompt</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-[#F0F0F0]" />
                <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-50 text-red-500 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="bg-white text-[#2874F0] font-semibold text-sm px-4 py-1.5 rounded-sm hover:bg-white/90 transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                className="text-white font-semibold text-sm px-4 py-1.5 rounded-sm border border-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-1 cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#F0F0F0] shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link href="/browse" className="block px-3 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] rounded-sm" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
            <Link href="/cart" className="block px-3 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] rounded-sm flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              Cart {cartCount > 0 && <span className="flipkart-badge-count inline-flex">{cartCount}</span>}
            </Link>
            <Link href="/account/wishlist" className="block px-3 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] rounded-sm" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
            {user ? (
              <>
                <Link href="/account" className="block px-3 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] rounded-sm" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <Link href="/account/orders" className="block px-3 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] rounded-sm" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                {(user.isSeller || user.role === 'ADMIN') && (
                  <>
                    <Link href="/seller" className="block px-3 py-2 text-sm text-[#2874F0] hover:bg-[#F1F3F6] rounded-sm" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>
                    <Link href="/seller/upload" className="block px-3 py-2 text-sm text-[#FF9F00] hover:bg-[#F1F3F6] rounded-sm" onClick={() => setMobileMenuOpen(false)}>Sell New Prompt</Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-sm cursor-pointer">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="flex-1 bg-[#2874F0] text-white font-semibold text-sm py-2 rounded-sm cursor-pointer">Login</button>
                <button onClick={() => { setAuthMode('register'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="flex-1 border border-[#2874F0] text-[#2874F0] font-semibold text-sm py-2 rounded-sm cursor-pointer">Sign Up</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
