'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, MessageSquare, Palette, Gem, Code, Megaphone, Pen, Briefcase, Camera, Film, Music, GraduationCap, Brain, Box, Video, ArrowRight } from 'lucide-react'

const CATEGORY_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; desc: string }> = {
  chatgpt: { icon: MessageSquare, color: 'bg-green-100 text-green-700', desc: 'ChatGPT, GPT-4, GPT-4o prompts' },
  midjourney: { icon: Palette, color: 'bg-purple-100 text-purple-700', desc: 'Midjourney v6 image generation' },
  dalle: { icon: Gem, color: 'bg-pink-100 text-pink-700', desc: 'DALL-E 3 image creation' },
  'stable-diffusion': { icon: Sparkles, color: 'bg-amber-100 text-amber-700', desc: 'Stable Diffusion XL & SD3' },
  coding: { icon: Code, color: 'bg-slate-100 text-slate-700', desc: 'Programming & development prompts' },
  marketing: { icon: Megaphone, color: 'bg-orange-100 text-orange-700', desc: 'Marketing & copywriting' },
  writing: { icon: Pen, color: 'bg-blue-100 text-blue-700', desc: 'Creative & professional writing' },
  business: { icon: Briefcase, color: 'bg-indigo-100 text-indigo-700', desc: 'Business & strategy' },
  photography: { icon: Camera, color: 'bg-rose-100 text-rose-700', desc: 'Photography & editing' },
  video: { icon: Film, color: 'bg-violet-100 text-violet-700', desc: 'Video generation & editing' },
  music: { icon: Music, color: 'bg-cyan-100 text-cyan-700', desc: 'Music & audio generation' },
  education: { icon: GraduationCap, color: 'bg-teal-100 text-teal-700', desc: 'Learning & research' },
  claude: { icon: Brain, color: 'bg-emerald-100 text-emerald-700', desc: 'Claude 3.5 Sonnet, Opus, Haiku' },
  gemini: { icon: Sparkles, color: 'bg-sky-100 text-sky-700', desc: 'Google Gemini Pro & Ultra' },
  'open-source': { icon: Box, color: 'bg-gray-100 text-gray-700', desc: 'Llama, Mistral, Qwen, DeepSeek' },
  'video-creation': { icon: Video, color: 'bg-fuchsia-100 text-fuchsia-700', desc: 'Synthesia & animation prompts' },
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data) })
      .catch(e => console.error('[categories]', e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-neon-blue mx-auto" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">All Categories</h1>
        <p className="text-white/60 mt-2">Browse prompts by category to find exactly what you need</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat: any, i: number) => {
          const style = CATEGORY_STYLES[cat.slug] || { icon: Sparkles, color: 'bg-slate-100 text-slate-700', desc: cat.description || '' }
          const Icon = style.icon
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/browse?category=${cat.slug}`}>
                <Card className="neon-border group p-6 glass-panel hover:bg-white/10 transition-all duration-300 border-white/10 bg-black/40 h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10 ${style.color.replace(/bg-[a-z]+-100/, '')}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white group-hover:text-neon-blue transition-colors">{cat.name}</h3>
                      <p className="text-xs text-white/50 mt-0.5">{style.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-white/10 text-white/70 hover:bg-white/20 border-0 backdrop-blur-md">{cat.promptCount || 0} prompts</Badge>
                        <span className="text-[10px] text-neon-pink opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Browse <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {categories.length === 0 && !loading && (
        <div className="text-center py-20 text-slate-400">No categories available</div>
      )}
    </div>
  )
}