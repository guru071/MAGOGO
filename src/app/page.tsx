'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { useStore, formatPrice } from '@/store/marketplace'
import FlashDealsBanner from '@/components/marketplace/FlashDealsBanner'
import {
  Sparkles, ArrowRight, Star, Shield, Zap, Users, TrendingUp,
  MessageSquare, Palette, Code, Megaphone, Pen, Briefcase, Camera,
  Film, Music, GraduationCap, Brain, Gem, Box, Video,
  ChevronRight, Loader2, ShoppingCart, Heart, Flame
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
  } catch (e) {
    return null;
  }
};

export default function LandingPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [stats, setStats] = useState({ categories: 0, prompts: 0, sellers: 0 })
  const [loading, setLoading] = useState(true)
  
  const { prompts, fetchPrompts, selectedCurrency } = useStore();

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).then(d => {
        if (d.success && Array.isArray(d.data)) setCategories(d.data)
      }).catch(e => console.error('[fetch]', e)),
      fetch('/api/stats').then(r => r.json()).then(d => {
        if (d.success && d.data) setStats({ categories: d.data.totalCategories || 0, prompts: d.data.totalPrompts || 0, sellers: d.data.totalSellers || 0 })
      }).catch(e => console.error('[fetch]', e)),
      fetchPrompts()
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* HERO */}
      <section className="relative overflow-hidden pt-4 pb-24 sm:pt-12 sm:pb-32 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-neon-blue/30 text-neon-blue text-xs font-semibold mb-8 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
              <Star className="h-3.5 w-3.5 fill-neon-blue animate-pulse" /> The Ultimate AI Prompt Ecosystem
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
              Premium AI Prompts for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink animate-gradient-x">Every Tool</span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Discover, buy and sell expertly crafted prompts. Experience the world's most advanced digital marketplace built on the dark universe aesthetic.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/browse">
                <Button size="lg" className="bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold h-14 px-8 text-base rounded-full shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:shadow-[0_0_30px_rgba(0,210,255,0.6)] hover:scale-105 transition-all">
                  Explore Ecosystem <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/seller">
                <Button variant="outline" size="lg" className="glass-panel text-foreground hover:bg-accent font-medium h-14 px-8 rounded-full border-border transition-all hover:scale-105">
                  Become a Seller
                </Button>
              </Link>
            </div>
            <div className="mt-20 flex flex-wrap items-center justify-center gap-10 sm:gap-20 text-center glass-panel-heavy p-8 rounded-[3rem] max-w-4xl mx-auto border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-pink/10 opacity-50 blur-xl"></div>
              {[
                { value: loading ? '-' : `${stats.categories}+`, label: 'Categories' },
                { value: loading ? '-' : `${stats.prompts}+`, label: 'Verified Prompts' },
                { value: loading ? '-' : `${stats.sellers}+`, label: 'Active Sellers' },
              ].map((s) => (
                <div key={s.label} className="relative z-10">
                  <p className="text-3xl sm:text-4xl font-extrabold text-foreground">{s.value}</p>
                  <p className="text-sm text-neon-blue mt-1 uppercase tracking-widest font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRENDING PROMPTS */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Flame className="h-8 w-8 text-neon-pink animate-pulse" /> Trending Now
            </h2>
            <Link href="/browse?sort=popular" className="text-sm font-semibold text-neon-blue hover:text-white transition-colors">
              View all &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-neon-blue mx-auto" /></div>
            ) : prompts.length === 0 ? (
              <div className="col-span-full py-16 text-center glass-panel rounded-3xl">
                <Sparkles className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 font-medium mb-2">No prompts listed yet</p>
                <Link href="/seller">
                  <Button className="bg-neon-pink text-white rounded-full">Start Selling</Button>
                </Link>
              </div>
            ) : prompts.slice(0, 4).map(prompt => (
              <Link key={prompt.id} href={`/prompt/${prompt.id}`}>
                <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="neon-border glass-panel overflow-hidden h-full flex flex-col border-white/10 rounded-3xl group bg-black/40">
                    <div className="relative h-36 flex items-center justify-center overflow-hidden bg-black/40">
                      {getCoverImage(prompt) ? (
                        <img src={getCoverImage(prompt)} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                      ) : (
                        <Sparkles className="h-16 w-16 text-white/10 group-hover:scale-110 transition-transform duration-700 group-hover:text-neon-blue/50" />
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {prompt.isFree && <Badge className="bg-neon-blue text-black font-bold border-0 shadow-[0_0_10px_rgba(0,210,255,0.8)] backdrop-blur-md">FREE</Badge>}
                        {prompt.discount > 0 && <Badge className="bg-neon-pink text-white font-bold border-0 shadow-[0_0_10px_rgba(255,0,128,0.8)] backdrop-blur-md">-{prompt.discount}%</Badge>}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] bg-card border-border text-muted-foreground">{prompt.recommendedAI || 'General'}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3 text-neon-blue fill-neon-blue" /> {prompt.rating.toFixed(1)}</span>
                      </div>
                      <h3 className="font-bold text-white text-base line-clamp-1 mb-1 group-hover:text-neon-blue transition-colors h-[24px]">{prompt.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 h-[16px]">{prompt.description}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground line-through">
                            {prompt.originalPrice && prompt.originalPrice > prompt.price ? formatPrice(prompt.originalPrice, selectedCurrency) : ''}
                          </span>
                          <span className="font-extrabold text-foreground text-xl">
                            {prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}
                          </span>
                        </div>
                        <Button size="icon" className="bg-muted text-muted-foreground hover:bg-neon-blue hover:text-white rounded-full h-10 w-10 shrink-0 transition-all">
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
      <section id="categories" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Browse by Category</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-neon-purple mx-auto" /></div>
            ) : categories.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">No categories available</div>
            ) : categories.map((cat: any, i: number) => {
              const style = CATEGORY_STYLES[cat.slug] || { icon: Sparkles, color: 'text-white' };
              const Icon = style.icon;
              return (
                <motion.div key={cat.id} variants={fadeUp} custom={i + 2}>
                  <Link href={`/browse?category=${cat.slug}`}
                    className="neon-border group w-full flex flex-col items-center justify-center p-6 rounded-3xl glass-panel hover:bg-white/10 transition-all duration-300 text-center relative overflow-hidden bg-black/40">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className={`h-14 w-14 rounded-full mb-4 flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${style.color}`}>
                      <Icon className="h-7 w-7 drop-shadow-md group-hover:drop-shadow-[0_0_10px_currentColor]" />
                    </div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-neon-blue transition-all">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold tracking-widest">{cat.promptCount || 0} items</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-[3rem] glass-panel-heavy p-12 sm:p-24 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] border-white/10">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-neon-blue/40 via-neon-purple/40 to-neon-pink/40 blur-3xl opacity-30 animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight mb-6">Unleash AI Potential</h2>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-light">
                Join the MAGHGO ecosystem today. Transform your workflow with world-class digital AI prompts, or start monetizing your prompt engineering skills.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/browse">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-14 px-10 text-lg rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all w-full sm:w-auto">
                    Start Exploring <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/seller">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-border text-foreground hover:bg-accent/10 glass-panel font-medium rounded-full w-full sm:w-auto hover:scale-105 transition-all">
                    Seller Central
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
