'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, MessageSquare, Palette, Gem, Code, Megaphone, Pen, Briefcase, Camera, Film, Music, GraduationCap, Brain, Box, Video, ArrowRight } from 'lucide-react'

const CATEGORY_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  chatgpt: { icon: MessageSquare, desc: 'ChatGPT, GPT-4, GPT-4o prompts' },
  midjourney: { icon: Palette, desc: 'Midjourney v6 image generation' },
  dalle: { icon: Gem, desc: 'DALL-E 3 image creation' },
  'stable-diffusion': { icon: Sparkles, desc: 'Stable Diffusion XL & SD3' },
  coding: { icon: Code, desc: 'Programming & development prompts' },
  marketing: { icon: Megaphone, desc: 'Marketing & copywriting' },
  writing: { icon: Pen, desc: 'Creative & professional writing' },
  business: { icon: Briefcase, desc: 'Business & strategy' },
  photography: { icon: Camera, desc: 'Photography & editing' },
  video: { icon: Film, desc: 'Video generation & editing' },
  music: { icon: Music, desc: 'Music & audio generation' },
  education: { icon: GraduationCap, desc: 'Learning & research' },
  claude: { icon: Brain, desc: 'Claude 3.5 Sonnet, Opus, Haiku' },
  gemini: { icon: Sparkles, desc: 'Google Gemini Pro & Ultra' },
  'open-source': { icon: Box, desc: 'Llama, Mistral, Qwen, DeepSeek' },
  'video-creation': { icon: Video, desc: 'Synthesia & animation prompts' },
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
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">All Categories</h1>
        <p className="text-muted-foreground mt-2">Browse prompts by category to find exactly what you need</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat: any, i: number) => {
          const style = CATEGORY_STYLES[cat.slug] || { icon: Sparkles, desc: cat.description || '' }
          const Icon = style.icon
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/browse?category=${cat.slug}`}>
                <Card className="group p-6 bg-card border-border h-full relative overflow-hidden transition-all duration-300 hover:bg-muted">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-muted border border-border">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{style.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-0">{cat.promptCount || 0} prompts</Badge>
                        <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
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
        <div className="text-center py-20 text-muted-foreground">No categories available</div>
      )}
    </div>
  )
}