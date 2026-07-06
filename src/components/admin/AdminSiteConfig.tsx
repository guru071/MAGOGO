'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Save, Plus, Trash2, ArrowUp, ArrowDown, Loader2,
  Palette, Megaphone, Layout, Settings,
} from 'lucide-react'

interface Banner { image: string; link: string; title: string; active: boolean }
interface Offer { badge: string; text: string; color: string; active: boolean }
interface SiteConfigCategory { id: string; name: string; icon: string; color: string; order: number }
interface SiteSettings { siteName: string; tagline: string; primaryColor: string; accentColor: string; announcement: string | null }
interface SiteConfig {
  banners: Banner[]
  offers: Offer[]
  featuredPromptIds: string[]
  categories: SiteConfigCategory[]
  siteSettings: SiteSettings
}

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Request failed')
  return json.data
}

const DEFAULT_CONFIG: SiteConfig = {
  banners: [],
  offers: [],
  featuredPromptIds: [],
  categories: [],
  siteSettings: {
    siteName: 'MAGHGO',
    tagline: 'Premium AI Prompts Marketplace',
    primaryColor: '#2874F0',
    accentColor: '#FF9F00',
    announcement: '',
  },
}

function BannerEditor({ banners, onChange }: { banners: Banner[]; onChange: (b: Banner[]) => void }) {
  const addBanner = () => onChange([...banners, { image: '', link: '', title: '', active: true }])
  const removeBanner = (i: number) => onChange(banners.filter((_, idx) => idx !== i))
  const moveBanner = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= banners.length) return
    const next = [...banners]; [next[i], next[j]] = [next[j], next[i]]; onChange(next)
  }
  const updateBanner = (i: number, field: keyof Banner, value: any) => {
    onChange(banners.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Layout className="h-4 w-4" /> Banners</h3>
        <Button size="sm" variant="outline" onClick={addBanner}><Plus className="h-4 w-4 mr-1" /> Add Banner</Button>
      </div>
      {banners.length === 0 && <p className="text-sm text-muted-foreground">No banners yet.</p>}
      <div className="space-y-3">
        {banners.map((banner, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">Banner {i + 1}</Badge>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveBanner(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => removeBanner(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Image URL</Label>
                <Input value={banner.image} onChange={e => updateBanner(i, 'image', e.target.value)} placeholder="https://..." className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Link</Label>
                <Input value={banner.link} onChange={e => updateBanner(i, 'link', e.target.value)} placeholder="/browse" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={banner.title} onChange={e => updateBanner(i, 'title', e.target.value)} placeholder="Summer Sale" className="text-sm" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={banner.active} onCheckedChange={v => updateBanner(i, 'active', v)} id={`ba-${i}`} />
                <Label htmlFor={`ba-${i}`} className="text-xs cursor-pointer">Active</Label>
              </div>
            </div>
            {banner.image && (
              <div className="relative h-24 rounded-md overflow-hidden bg-muted">
                <img src={banner.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function OfferEditor({ offers, onChange }: { offers: Offer[]; onChange: (o: Offer[]) => void }) {
  const addOffer = () => onChange([...offers, { badge: 'NEW', text: '', color: '#FF6161', active: true }])
  const removeOffer = (i: number) => onChange(offers.filter((_, idx) => idx !== i))
  const updateOffer = (i: number, field: keyof Offer, value: any) => {
    onChange(offers.map((o, idx) => idx === i ? { ...o, [field]: value } : o))
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4" /> Offers</h3>
        <Button size="sm" variant="outline" onClick={addOffer}><Plus className="h-4 w-4 mr-1" /> Add Offer</Button>
      </div>
      {offers.length === 0 && <p className="text-sm text-muted-foreground">No offers configured.</p>}
      <div className="space-y-3">
        {offers.map((offer, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: offer.color }} />
                <Badge variant="secondary" className="text-xs">{offer.badge}</Badge>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => removeOffer(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Badge</Label>
                <Input value={offer.badge} onChange={e => updateOffer(i, 'badge', e.target.value)} placeholder="SALE" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Offer Text</Label>
                <Input value={offer.text} onChange={e => updateOffer(i, 'text', e.target.value)} placeholder="Flat 30% OFF" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={offer.color} onChange={e => updateOffer(i, 'color', e.target.value)} className="w-10 h-9 p-0.5" />
                  <Input value={offer.color} onChange={e => updateOffer(i, 'color', e.target.value)} placeholder="#FF6161" className="text-sm flex-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={offer.active} onCheckedChange={v => updateOffer(i, 'active', v)} id={`oa-${i}`} />
              <Label htmlFor={`oa-${i}`} className="text-xs cursor-pointer">Active</Label>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function FeaturedPromptsEditor({ promptIds, onChange }: { promptIds: string[]; onChange: (ids: string[]) => void }) {
  const addId = () => onChange([...promptIds, ''])
  const removeId = (i: number) => onChange(promptIds.filter((_, idx) => idx !== i))
  const updateId = (i: number, val: string) => onChange(promptIds.map((id, idx) => idx === i ? val : id))

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> Featured Prompts</h3>
        <Button size="sm" variant="outline" onClick={addId}><Plus className="h-4 w-4 mr-1" /> Add ID</Button>
      </div>
      <p className="text-xs text-muted-foreground">Prompt IDs to feature on the homepage.</p>
      {promptIds.map((id, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={id} onChange={e => updateId(i, e.target.value)} placeholder="Prompt ID" className="text-sm font-mono flex-1" />
          <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 shrink-0" onClick={() => removeId(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </Card>
  )
}

function CategoryConfigEditor({ categories, onChange }: { categories: SiteConfigCategory[]; onChange: (c: SiteConfigCategory[]) => void }) {
  const addCategory = () => onChange([...categories, { id: '', name: '', icon: 'Sparkles', color: '#2874F0', order: categories.length }])
  const removeCategory = (i: number) => onChange(categories.filter((_, idx) => idx !== i))
  const updateCategory = (i: number, field: keyof SiteConfigCategory, value: any) => {
    onChange(categories.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }
  const moveCategory = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= categories.length) return
    const next = [...categories]; [next[i], next[j]] = [next[j], next[i]]
    onChange(next.map((c, idx) => ({ ...c, order: idx })))
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Layout className="h-4 w-4" /> Category Overrides</h3>
        <Button size="sm" variant="outline" onClick={addCategory}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <p className="text-xs text-muted-foreground">Optional: override category icons and colors.</p>
      {categories.map((cat, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">#{i}</Badge>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveCategory(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveCategory(i, 1)} disabled={i === categories.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeCategory(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Slug (id)</Label>
              <Input value={cat.id} onChange={e => updateCategory(i, 'id', e.target.value)} placeholder="chatgpt" className="text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={cat.name} onChange={e => updateCategory(i, 'name', e.target.value)} placeholder="ChatGPT" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Icon</Label>
              <Input value={cat.icon} onChange={e => updateCategory(i, 'icon', e.target.value)} placeholder="MessageSquare" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={cat.color} onChange={e => updateCategory(i, 'color', e.target.value)} className="w-10 h-9 p-0.5" />
                <Input value={cat.color} onChange={e => updateCategory(i, 'color', e.target.value)} placeholder="#2874F0" className="text-sm flex-1" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </Card>
  )
}

function SiteSettingsEditor({ settings, onChange }: { settings: SiteSettings; onChange: (s: SiteSettings) => void }) {
  const update = (field: keyof SiteSettings, value: any) => onChange({ ...settings, [field]: value })

  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><Settings className="h-4 w-4" /> Site Settings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Site Name</Label>
          <Input value={settings.siteName} onChange={e => update('siteName', e.target.value)} placeholder="MAGHGO" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tagline</Label>
          <Input value={settings.tagline} onChange={e => update('tagline', e.target.value)} placeholder="Premium AI Prompts Marketplace" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Primary Color</Label>
          <div className="flex gap-2">
            <Input type="color" value={settings.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="w-10 h-9 p-0.5" />
            <Input value={settings.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="flex-1 font-mono text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Accent Color</Label>
          <div className="flex gap-2">
            <Input type="color" value={settings.accentColor} onChange={e => update('accentColor', e.target.value)} className="w-10 h-9 p-0.5" />
            <Input value={settings.accentColor} onChange={e => update('accentColor', e.target.value)} className="flex-1 font-mono text-sm" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Announcement</Label>
        <Textarea value={settings.announcement || ''} onChange={e => update('announcement', e.target.value)} placeholder="Flat 30% OFF..." rows={2} />
        <p className="text-[10px] text-muted-foreground">Leave empty to hide.</p>
      </div>
    </Card>
  )
}

export default function AdminSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api('/api/site-config')
        if (!cancelled) {
          setConfig({
            banners: data.banners || [],
            offers: data.offers || [],
            featuredPromptIds: data.featuredPromptIds || [],
            categories: data.categories || [],
            siteSettings: { ...DEFAULT_CONFIG.siteSettings, ...(data.siteSettings || {}) },
          })
        }
      } catch (e: any) { 
        if (!cancelled) toast.error(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api('/api/site-config', { method: 'POST', body: JSON.stringify(config) })
      toast.success('Site configuration saved!')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Site Configuration</h2>
          <p className="text-sm text-muted-foreground">Update banners, offers, featured prompts, and site settings without deploying.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>
      <Separator />
      <SiteSettingsEditor settings={config.siteSettings} onChange={s => setConfig(prev => ({ ...prev, siteSettings: s }))} />
      <BannerEditor banners={config.banners} onChange={b => setConfig(prev => ({ ...prev, banners: b }))} />
      <OfferEditor offers={config.offers} onChange={o => setConfig(prev => ({ ...prev, offers: o }))} />
      <FeaturedPromptsEditor promptIds={config.featuredPromptIds} onChange={ids => setConfig(prev => ({ ...prev, featuredPromptIds: ids }))} />
      <CategoryConfigEditor categories={config.categories} onChange={c => setConfig(prev => ({ ...prev, categories: c }))} />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </motion.div>
  )
}
