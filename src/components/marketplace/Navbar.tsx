'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/marketplace'
import { ShoppingCart, Heart, User, Search, LogOut, Menu, X, Package, Settings, Briefcase, PlusCircle, Wallet, MessageCircle, TrendingUp, Command, Folder, Tag, Clock } from 'lucide-react'
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
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#0066CC] flex items-center justify-center overflow-hidden shadow-sm relative">
              <Image src="/logo.jpeg" alt="MAGHGO" fill className="object-contain" sizes="36px" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">MAGHGO</span>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (hasSuggestions && searchValue.trim().length >= 2) setShowSuggestions(true) }}
              placeholder="Search prompts..."
              className="pl-9 h-10 bg-slate-50 border-slate-200 text-sm pr-12"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-400">
                <Command className="h-2.5 w-2.5" />/
              </kbd>
            </div>
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {suggestLoading && <div className="p-3 text-xs text-slate-400 text-center">Loading...</div>}
                {!suggestLoading && suggestions.map((group, gi) => (
                  <div key={gi}>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50">
                      {group.label}
                    </div>
                    {group.items.map((item, ii) => (
                      <button
                        key={`${gi}-${ii}`}
                        type="button"
                        onClick={() => selectSuggestion(item.text)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-[#0066CC] flex items-center gap-2 transition-colors"
                      >
                        {item.type === 'category' ? <Folder className="h-3 w-3 text-slate-400" /> :
                         item.type === 'tag' ? <Tag className="h-3 w-3 text-slate-400" /> :
                         <TrendingUp className="h-3 w-3 text-slate-400" />}
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                ))}
                {!suggestLoading && recentSearches.length > 0 && searchValue.trim().length < 2 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 flex items-center justify-between">
                      <span>Recent Searches</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }}
                        className="text-[10px] text-slate-400 hover:text-red-500"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/browse">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-[#0066CC]">
              Browse
            </Button>
          </Link>

          <NotificationBell />

          <Link href="/account/wishlist" className="relative">
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-red-500">
              <Heart className="h-5 w-5" />
            </Button>
            {useStore.getState().wishlistedPromptIds.size > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {useStore.getState().wishlistedPromptIds.size}
              </span>
            )}
          </Link>

          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-[#0066CC]">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF6600] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-[#0066CC]">
                  <div className="h-7 w-7 rounded-full bg-[#0066CC]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0066CC]">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium truncate max-w-[100px]">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer"><User className="h-4 w-4 mr-2" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="cursor-pointer"><Package className="h-4 w-4 mr-2" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/wishlist" className="cursor-pointer"><Heart className="h-4 w-4 mr-2" /> Wishlist</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="cursor-pointer"><Wallet className="h-4 w-4 mr-2" /> Wallet</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/qna" className="cursor-pointer"><MessageCircle className="h-4 w-4 mr-2" /> Q&A</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/settings" className="cursor-pointer"><Settings className="h-4 w-4 mr-2" /> Settings</Link>
                </DropdownMenuItem>
                {(user.isSeller || user.role === 'ADMIN') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/seller" className="cursor-pointer text-[#0066CC]"><Briefcase className="h-4 w-4 mr-2" /> Seller Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/seller/upload" className="cursor-pointer text-[#0066CC]"><PlusCircle className="h-4 w-4 mr-2" /> Sell New Prompt</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-[#0066CC]" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                Sign In
              </Button>
              <Button size="sm" className="bg-[#0066CC] hover:bg-[#0055AA] text-white font-semibold shadow-sm" onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}>
                Sign Up
              </Button>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search prompts..."
                className="pl-9 h-10 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
          </form>
          <div className="flex flex-col gap-2">
            <Link href="/browse" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
            <Link href="/cart" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              Cart {cart.length > 0 && <span className="bg-[#FF6600] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{cart.length}</span>}
            </Link>
            {user ? (
              <>
                <Link href="/account" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <Link href="/account/orders" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link href="/account/wishlist" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
                <Link href="/wallet" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Wallet</Link>
                <Link href="/qna" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Q&A</Link>
                <Link href="/account/settings" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
                {(user.isSeller || user.role === 'ADMIN') && (
                  <>
                    <Link href="/seller" className="px-3 py-2 text-sm text-[#0066CC] hover:bg-blue-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>
                    <Link href="/seller/upload" className="px-3 py-2 text-sm text-[#0066CC] hover:bg-blue-50 rounded-md" onClick={() => setMobileMenuOpen(false)}>Sell New Prompt</Link>
                  </>
                )}

                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md text-left">Sign Out</button>
              </>
            ) : (
              <Button size="sm" className="bg-[#0066CC] hover:bg-[#0055AA] text-white w-full" onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}>
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
