'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, MessageSquare, Palette, Gem, Code, Megaphone, Pen, Briefcase, Camera, Film, Music, GraduationCap, Brain, Box, Video, ArrowRight } from 'lucide-react'

const CATEGORY_STYLES: Record<string, { icon: any; color: string; desc: string }> = {
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
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#0066CC] mx-auto" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">All Categories</h1>
        <p className="text-slate-500 mt-2">Browse prompts by category to find exactly what you need</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat: any, i: number) => {
          const style = CATEGORY_STYLES[cat.slug] || { icon: Sparkles, color: 'bg-slate-100 text-slate-700', desc: cat.description || '' }
          const Icon = style.icon
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/browse?category=${cat.slug}`}>
                <Card className="group p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-slate-100 h-full">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${style.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 group-hover:text-[#0066CC] transition-colors">{cat.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{style.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">{cat.promptCount || 0} prompts</Badge>
                        <span className="text-[10px] text-[#0066CC] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
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