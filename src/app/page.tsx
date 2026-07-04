'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { useStore, formatPrice } from '@/store/marketplace'
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#0066CC]/[0.04] blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-[#FF6600]/[0.04] blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0066CC]/[0.07] text-[#0066CC] text-xs font-semibold mb-6">
              <Star className="h-3.5 w-3.5 fill-[#0066CC]" /> The Ultimate AI Prompt Ecosystem
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
              Premium AI Prompts for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066CC] to-[#FF6600]">Every Tool</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Discover, buy and sell expertly crafted prompts. Experience the world's most advanced digital marketplace for ChatGPT, Midjourney, Claude, Gemini and more.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/browse">
                <Button size="lg" className="bg-[#0066CC] hover:bg-[#0055AA] text-white font-semibold h-12 px-8 text-base shadow-lg shadow-[#0066CC]/20 hover:shadow-xl hover:shadow-[#0066CC]/25 transition-all">
                  Explore Ecosystem <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/seller">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
                  Become a Seller
                </Button>
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center">
              {[
                { value: loading ? '-' : `${stats.categories}+`, label: 'Categories' },
                { value: loading ? '-' : `${stats.prompts}+`, label: 'Verified Prompts' },
                { value: loading ? '-' : `${stats.sellers}+`, label: 'Active Sellers' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#0066CC]">{s.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRENDING PROMPTS - E-Commerce Style */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="h-6 w-6 text-red-500" /> Trending Prompts
            </h2>
            <Link href="/browse?sort=popular" className="text-sm font-semibold text-[#0066CC] hover:underline">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-[#0066CC] mx-auto" /></div>
            ) : prompts.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <Sparkles className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium mb-2">No prompts listed yet</p>
                <p className="text-sm text-slate-400 mb-6">Be the first to sell a prompt on MAGHGO!</p>
                <Link href="/seller">
                  <Button className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-semibold">Start Selling</Button>
                </Link>
              </div>
            ) : prompts.slice(0, 4).map(prompt => (
              <Link key={prompt.id} href={`/prompt/${prompt.id}`}>
                <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full border-slate-100 flex flex-col">
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden">
                    {getCoverImage(prompt) ? (
                      <img src={getCoverImage(prompt)} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Sparkles className="h-16 w-16 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {prompt.isFree && <Badge className="bg-green-500 text-white border-0 shadow-sm">Free</Badge>}
                      {prompt.discount > 0 && <Badge variant="destructive" className="shadow-sm">-{prompt.discount}%</Badge>}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{prompt.recommendedAI || 'General'}</Badge>
                      {(prompt as any).qualityScore && <Badge className={`text-[10px] border-0 ${(prompt as any).qualityScore >= 0.8 ? 'bg-emerald-100 text-emerald-700' : (prompt as any).qualityScore >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>Q: {Math.round((prompt as any).qualityScore * 100)}</Badge>}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {prompt.rating.toFixed(1)}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1 group-hover:text-[#0066CC] transition-colors">{prompt.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 flex-1">{prompt.description}</p>
                    
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 line-through">
                          {prompt.originalPrice && prompt.originalPrice > prompt.price ? formatPrice(prompt.originalPrice, selectedCurrency) : ''}
                        </span>
                        <span className="font-extrabold text-slate-900 text-lg">
                          {prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}
                        </span>
                      </div>
                      <Button size="sm" className="bg-slate-900 text-white hover:bg-[#0066CC] rounded-full h-8 w-8 p-0 shrink-0">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-10">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Browse by Category</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-[#0066CC] mx-auto" /></div>
            ) : categories.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">No categories available</div>
            ) : categories.slice(0, 12).map((cat: any, i: number) => {
              const style = CATEGORY_STYLES[cat.slug] || { icon: Sparkles, color: 'bg-slate-100 text-slate-700' };
              const Icon = style.icon;
              return (
                <motion.div key={cat.id} variants={fadeUp} custom={i + 2}>
                  <Link href={`/browse?category=${cat.slug}`}
                    className="group w-full flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#0066CC]/20 hover:shadow-lg hover:shadow-[#0066CC]/10 transition-all duration-300 text-center">
                    <div className={`h-12 w-12 rounded-full mb-3 flex items-center justify-center ${style.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-sm text-slate-800 group-hover:text-[#0066CC] transition-colors">{cat.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium tracking-wider">{cat.promptCount || 0} items</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 sm:p-20 text-center shadow-2xl">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-[#0066CC]/20 to-[#FF6600]/20 blur-3xl opacity-50" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">Unleash AI Potential</h2>
              <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-light">
                Join the MAGHGO ecosystem today. Transform your workflow with world-class digital AI prompts, or start monetizing your prompt engineering skills.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/browse">
                  <Button size="lg" className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold h-14 px-10 text-lg rounded-full shadow-lg shadow-[#FF6600]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                    Start Exploring <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/seller">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/20 text-white hover:bg-white/10 font-medium rounded-full w-full sm:w-auto">
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
