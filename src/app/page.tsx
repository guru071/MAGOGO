'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useStore, formatPrice } from '@/store/marketplace'
import FlashDealsBanner from '@/components/marketplace/FlashDealsBanner'
import {
  Sparkles, ArrowRight, Star, Shield, Zap, Users, TrendingUp,
  MessageSquare, Palette, Code, Megaphone, Pen, Briefcase, Camera,
  Film, Music, GraduationCap, Brain, Gem, Box, Video,
  Loader2, ShoppingCart, Flame
} from 'lucide-react'

const CATEGORY_STYLES: Record<string, { icon: any; color: string }> = {
  chatgpt: { icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  midjourney: { icon: Palette, color: 'bg-purple-100 text-purple-700' },
  dalle: { icon: Gem, color: 'bg-pink-100 text-pink-700' },
  'stable-diffusion': { icon: Sparkles, color: 'bg-amber-100 text-amber-700' },
  coding: { icon: Code, color: 'bg-slate-100 text-slate-700' },
  marketing: { icon: Megaphone, color: 'bg-orange-100 text-orange-700' },
  writing: { icon: Pen, color: 'bg-blue-100 text-blue-700' },
  business: { icon: Briefcase, color: 'bg-indigo-100 text-indigo-700' },
  photography: { icon: Camera, color: 'bg-rose-100 text-rose-700' },
  video: { icon: Film, color: 'bg-violet-100 text-violet-700' },
  music: { icon: Music, color: 'bg-cyan-100 text-cyan-700' },
  education: { icon: GraduationCap, color: 'bg-teal-100 text-teal-700' },
  claude: { icon: Brain, color: 'bg-emerald-100 text-emerald-700' },
  gemini: { icon: Sparkles, color: 'bg-sky-100 text-sky-700' },
  'open-source': { icon: Box, color: 'bg-gray-100 text-gray-700' },
  'video-creation': { icon: Video, color: 'bg-fuchsia-100 text-fuchsia-700' },
}

const FEATURES = [
  { icon: Zap, title: 'Instant Access', desc: 'Purchase and download prompts instantly. Start creating amazing AI content in seconds.' },
  { icon: Shield, title: 'Verified Quality', desc: 'Every prompt is reviewed for quality. Only the best prompts make it to the marketplace.' },
  { icon: Users, title: 'Creator Community', desc: 'Join thousands of prompt engineers. Sell your best prompts and earn passive income.' },
  { icon: TrendingUp, title: 'Grow Your Skills', desc: 'Learn from top prompt engineers. Discover techniques that produce stunning AI outputs.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
}

const getCoverImage = (prompt: any) => {
  try {
    const images = typeof prompt.sampleImages === 'string' ? JSON.parse(prompt.sampleImages) : prompt.sampleImages;
    return images && images.length > 0 ? images[0] : null;
  } catch { return null; }
};

export default function LandingPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [stats, setStats] = useState({ categories: 0, prompts: 0, sellers: 0 })
  const [loading, setLoading] = useState(true)
  const { prompts, fetchPrompts, selectedCurrency } = useStore();

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).then(d => { if (d.success && Array.isArray(d.data)) setCategories(d.data) }).catch(() => {}),
      fetch('/api/stats').then(r => r.json()).then(d => { if (d.success && d.data) setStats({ categories: d.data.totalCategories || 0, prompts: d.data.totalPrompts || 0, sellers: d.data.totalSellers || 0 }) }).catch(() => {}),
      fetchPrompts()
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F3F6]">
      {/* HERO */}
      <section className="relative overflow-hidden pt-8 pb-16 text-center bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2874F0]/30 text-[#2874F0] text-xs font-semibold mb-8 bg-[#2874F0]/5">
              <Star className="h-3.5 w-3.5 fill-[#2874F0]" /> The Ultimate AI Prompt Ecosystem
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#212121] max-w-5xl mx-auto leading-[1.15]">
              Premium AI Prompts for{' '}
              <span className="text-[#2874F0]">Every Tool</span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-[#878787] max-w-2xl mx-auto leading-relaxed">
              Discover, buy and sell expertly crafted prompts. The most advanced digital marketplace for AI prompts.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/browse">
                <Button size="lg" className="bg-[#2874F0] hover:bg-[#1a5dc7] text-white font-bold h-14 px-8 text-base rounded-sm transition-all">
                  Explore Ecosystem <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/seller">
                <Button variant="outline" size="lg" className="border-[#2874F0] text-[#2874F0] hover:bg-[#2874F0]/5 font-medium h-14 px-8 rounded-sm transition-all">
                  Become a Seller
                </Button>
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-10 sm:gap-20 text-center bg-white border border-[#F0F0F0] p-8 rounded-sm max-w-4xl mx-auto shadow-sm">
              {[
                { value: loading ? '-' : `${stats.categories}+`, label: 'Categories' },
                { value: loading ? '-' : `${stats.prompts}+`, label: 'Verified Prompts' },
                { value: loading ? '-' : `${stats.sellers}+`, label: 'Active Sellers' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#212121]">{s.value}</p>
                  <p className="text-sm text-[#878787] mt-1 uppercase tracking-widest font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRENDING PROMPTS */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#212121] flex items-center gap-2">
              <Flame className="h-6 w-6 text-[#FF9F00]" /> Trending Now
            </h2>
            <Link href="/browse?sort=popular" className="text-sm font-semibold text-[#2874F0] hover:text-[#1a5dc7]">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#2874F0] mx-auto" /></div>
            ) : prompts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white border border-[#F0F0F0] rounded-sm">
                <Sparkles className="h-12 w-12 text-[#C4C4C4] mx-auto mb-4" />
                <p className="text-[#878787] font-medium mb-2">No prompts listed yet</p>
                <Link href="/seller"><Button className="bg-[#FF9F00] text-white rounded-sm">Start Selling</Button></Link>
              </div>
            ) : prompts.slice(0, 4).map(prompt => (
              <Link key={prompt.id} href={`/prompt/${prompt.id}`}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-white border border-[#F0F0F0] overflow-hidden h-full flex flex-col group hover:shadow-md transition-shadow rounded-sm">
                    <div className="relative h-36 flex items-center justify-center overflow-hidden bg-[#F1F3F6]">
                      {getCoverImage(prompt) ? (
                        <img src={getCoverImage(prompt)} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Sparkles className="h-16 w-16 text-[#C4C4C4]" />
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {prompt.isFree && <Badge className="bg-[#388E3C] text-white font-bold border-0 rounded-sm text-xs">FREE</Badge>}
                        {prompt.discount > 0 && <Badge className="bg-[#FF9F00] text-white font-bold border-0 rounded-sm text-xs">-{prompt.discount}%</Badge>}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] bg-[#F1F3F6] text-[#878787] border-0">{prompt.recommendedAI || 'General'}</Badge>
                        <span className="text-[10px] text-[#878787] flex items-center gap-1"><Star className="h-3 w-3 text-[#FF9F00] fill-[#FF9F00]" /> {prompt.rating.toFixed(1)}</span>
                      </div>
                      <h3 className="font-bold text-[#212121] text-sm line-clamp-1 mb-1 group-hover:text-[#2874F0] transition-colors">{prompt.title}</h3>
                      <p className="text-xs text-[#878787] line-clamp-1">{prompt.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#F0F0F0]">
                        <div className="flex flex-col">
                          {prompt.originalPrice && prompt.originalPrice > prompt.price ? (
                            <span className="text-[10px] text-[#878787] line-through">{formatPrice(prompt.originalPrice, selectedCurrency)}</span>
                          ) : null}
                          <span className="font-bold text-[#212121] text-base">{prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}</span>
                        </div>
                        <Button size="icon" className="bg-[#FF9F00] hover:bg-[#FB641B] text-white rounded-sm h-8 w-8">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FlashDealsBanner />

      {/* CATEGORIES */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[#212121] text-center mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#2874F0] mx-auto" /></div>
            ) : categories.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[#878787]">No categories available</div>
            ) : categories.map((cat: any, i: number) => {
              const style = CATEGORY_STYLES[cat.slug] || { icon: Sparkles, color: 'bg-gray-100 text-gray-700' };
              const Icon = style.icon;
              return (
                <motion.div key={cat.id} variants={fadeUp} custom={i + 2}>
                  <Link href={`/browse?category=${cat.slug}`}
                    className="group w-full flex flex-col items-center justify-center p-6 bg-white border border-[#F0F0F0] hover:shadow-md transition-all duration-300 text-center rounded-sm">
                    <div className={`h-14 w-14 rounded-full mb-4 flex items-center justify-center ${style.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="font-semibold text-sm text-[#212121] group-hover:text-[#2874F0] transition-all">{cat.name}</p>
                    <p className="text-[10px] text-[#878787] mt-1 uppercase font-semibold tracking-widest">{cat.promptCount || 0} items</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 bg-[#F1F3F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[#212121] text-center mb-8">Why MAGHGO?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white border border-[#F0F0F0] p-6 rounded-sm hover:shadow-md transition-shadow">
                <f.icon className="h-8 w-8 text-[#2874F0] mb-3" />
                <h3 className="font-bold text-[#212121] mb-1">{f.title}</h3>
                <p className="text-sm text-[#878787] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#212121] mb-4">Unleash AI Potential</h2>
          <p className="text-[#878787] text-lg max-w-2xl mx-auto mb-8">
            Join the MAGHGO ecosystem today. Transform your workflow with world-class digital AI prompts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/browse">
              <Button size="lg" className="bg-[#2874F0] hover:bg-[#1a5dc7] text-white font-bold h-12 px-8 rounded-sm">
                Start Exploring <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/seller">
              <Button size="lg" variant="outline" className="h-12 px-8 border-[#2874F0] text-[#2874F0] hover:bg-[#2874F0]/5 rounded-sm">
                Seller Central
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
