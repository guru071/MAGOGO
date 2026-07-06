import { useState, useEffect, useCallback } from 'react'

export interface Banner {
  image: string
  link: string
  title: string
  active: boolean
}

export interface Offer {
  badge: string
  text: string
  color: string
  active: boolean
}

export interface SiteConfigCategory {
  id: string
  name: string
  icon: string
  color: string
  order: number
}

export interface SiteSettings {
  siteName: string
  tagline: string
  primaryColor: string
  accentColor: string
  announcement: string | null
}

export interface SiteConfig {
  banners: Banner[]
  offers: Offer[]
  featuredPromptIds: string[]
  categories: SiteConfigCategory[]
  siteSettings: SiteSettings
}

const DEFAULTS: SiteConfig = {
  banners: [],
  offers: [],
  featuredPromptIds: [],
  categories: [],
  siteSettings: {
    siteName: 'MAGHGO',
    tagline: 'Premium AI Prompts Marketplace',
    primaryColor: '#2874F0',
    accentColor: '#FF9F00',
    announcement: null,
  },
}

let cachedConfig: SiteConfig | null = null
let fetchPromise: Promise<SiteConfig> | null = null

async function fetchConfig(): Promise<SiteConfig> {
  try {
    const res = await fetch('/api/site-config')
    const json = await res.json()
    if (json.success) {
      const merged = { ...DEFAULTS, ...json.data, siteSettings: { ...DEFAULTS.siteSettings, ...(json.data.siteSettings || {}) } }
      cachedConfig = merged
      if (typeof window !== 'undefined') {
        localStorage.setItem('maghgo_site_config', JSON.stringify(merged))
      }
      return merged
    }
    throw new Error(json.error || 'Failed to fetch config')
  } catch {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('maghgo_site_config') : null
    if (stored) {
      try { return JSON.parse(stored) } catch {}
    }
    return DEFAULTS
  }
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    cachedConfig = null
    fetchPromise = null
    const data = await fetchConfig()
    setConfig(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (cachedConfig) {
      queueMicrotask(() => setConfig(cachedConfig!))
      queueMicrotask(() => setLoading(false))
      return
    }
    if (!fetchPromise) {
      fetchPromise = fetchConfig()
    }
    fetchPromise.then(data => {
      if (!cancelled) {
        setConfig(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return { config, loading, refresh }
}
