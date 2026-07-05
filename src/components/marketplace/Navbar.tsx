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
  Tag, Clock, List, History, Palette 
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

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="glass-panel-heavy rounded-full flex items-center justify-between px-4 sm:px-6 h-16 w-full max-w-6xl transition-all duration-300">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image 
              src="/logo.jpeg" 
              alt="MAGHGO Logo" 
              width={36} 
              height={36} 
              className="h-9 w-9 rounded-full object-cover shadow-lg group-hover:shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all" 
            />
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-neon-blue group-hover:to-neon-purple transition-all hidden sm:block">MAGHGO</span>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-6" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (hasSuggestions && searchValue.trim().length >= 2) setShowSuggestions(true) }}
              placeholder="Search universe..."
              className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-neon-blue focus:border-neon-blue rounded-full transition-all hover:bg-white/10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-full border border-white/20 bg-white/5 px-1.5 text-[10px] font-medium text-white/50">
                <Command className="h-2.5 w-2.5" />/
              </kbd>
            </div>
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-3 glass-panel-heavy border border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                {suggestLoading && <div className="p-3 text-xs text-white/40 text-center">Loading...</div>}
                {!suggestLoading && suggestions.map((group, gi) => (
                  <div key={gi}>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neon-blue bg-white/5">
                      {group.label}
                    </div>
                    {group.items.map((item, ii) => (
                      <button
                        key={`${gi}-${ii}`}
                        type="button"
                        onClick={() => selectSuggestion(item.text)}
                        className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        {item.type === 'category' ? <Folder className="h-3 w-3 text-neon-purple" /> :
                         item.type === 'tag' ? <Tag className="h-3 w-3 text-neon-pink" /> :
                         <TrendingUp className="h-3 w-3 text-neon-blue" />}
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                ))}
                {!suggestLoading && recentSearches.length > 0 && searchValue.trim().length < 2 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neon-blue bg-white/5 flex items-center justify-between">
                      <span>Recent Searches</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }}
                        className="text-[10px] text-white/50 hover:text-neon-pink"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Clock className="h-3 w-3 text-white/50" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/browse">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
              Browse
            </Button>
          </Link>

          <button 
            onClick={() => useStore.getState().setThemeStyle(useStore.getState().themeStyle === 'universe' ? 'normal' : 'universe')}
            className="p-2 rounded-full text-white/70 hover:text-neon-purple hover:bg-white/10 transition-colors"
            title="Toggle Universe Theme"
          >
            <Palette className="h-5 w-5" />
          </button>

          <NotificationBell />

          <Link href="/account/wishlist" className="relative">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-neon-pink hover:bg-white/10 rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
            {useStore.getState().wishlistedPromptIds.size > 0 && (
              <span className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,128,0.5)]">
                {useStore.getState().wishlistedPromptIds.size}
              </span>
            )}
          </Link>

          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-neon-blue hover:bg-white/10 rounded-full">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-neon-blue text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-[0_0_10px_rgba(0,210,255,0.5)]">
                {cart.length}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-white hover:bg-white/10 rounded-full ml-2 border border-white/5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center shadow-inner">
                    <span className="text-xs font-bold text-white mix-blend-overlay">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium truncate max-w-[100px]">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-panel border-white/10 text-white bg-black/60">
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/account"><User className="h-4 w-4 mr-2 text-neon-blue" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/account/orders"><Package className="h-4 w-4 mr-2 text-neon-blue" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/account/wishlist"><Heart className="h-4 w-4 mr-2 text-neon-pink" /> Wishlist</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/wallet"><Wallet className="h-4 w-4 mr-2 text-neon-purple" /> Wallet</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/qna"><MessageCircle className="h-4 w-4 mr-2 text-neon-blue" /> Q&A</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/account/settings"><Settings className="h-4 w-4 mr-2 text-white/70" /> Settings</Link>
                </DropdownMenuItem>
                {(user.isSeller || user.role === 'ADMIN') && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <Link href="/seller" className="text-neon-blue"><Briefcase className="h-4 w-4 mr-2" /> Seller Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <Link href="/seller/prompts" className="text-white hover:text-neon-blue"><List className="h-4 w-4 mr-2" /> My Prompts</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <Link href="/seller/sales" className="text-white hover:text-emerald-400"><History className="h-4 w-4 mr-2" /> Sales History</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <Link href="/seller/upload" className="text-neon-pink"><PlusCircle className="h-4 w-4 mr-2" /> Sell New Prompt</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-full" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                Sign In
              </Button>
              <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all" onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}>
                Sign Up
              </Button>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10 rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="absolute top-[80px] left-4 right-4 md:hidden glass-panel-heavy border border-white/10 rounded-3xl p-4 space-y-3 z-40 shadow-2xl">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search universe..."
                className="pl-9 h-10 bg-white/5 border-white/10 text-white rounded-full"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <Link href="/browse" className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
            <Link href="/cart" className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-xl flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              Cart {cart.length > 0 && <span className="bg-neon-blue text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{cart.length}</span>}
            </Link>
            {user ? (
              <>
                <Link href="/account" className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <Link href="/account/orders" className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link href="/account/wishlist" className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
                <Link href="/wallet" className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Wallet</Link>
                {(user.isSeller || user.role === 'ADMIN') && (
                  <>
                    <Link href="/seller" className="px-4 py-2.5 text-sm text-neon-blue hover:bg-neon-blue/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>
                    <Link href="/seller/prompts" className="px-4 py-2.5 text-sm text-white hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>My Prompts</Link>
                    <Link href="/seller/sales" className="px-4 py-2.5 text-sm text-white hover:bg-white/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Sales History</Link>
                    <Link href="/seller/upload" className="px-4 py-2.5 text-sm text-neon-pink hover:bg-neon-pink/10 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Sell New Prompt</Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 rounded-xl text-left">Sign Out</button>
              </>
            ) : (
              <Button size="sm" className="bg-neon-blue hover:bg-neon-blue/80 text-white w-full rounded-xl mt-2" onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}>
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
