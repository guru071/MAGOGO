'use client'

import { Sparkles, Users, Globe, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 relative z-10 text-white">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 flex items-center justify-center gap-4">
          <Sparkles className="h-10 w-10 text-neon-blue animate-pulse" />
          About MAGHGO
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          The world's premium marketplace for expert-crafted AI prompts, designed to unlock the true potential of artificial intelligence.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="glass-panel p-8 rounded-3xl text-center hover:scale-105 transition-transform duration-300 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <Users className="h-12 w-12 text-neon-pink mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Community Driven</h3>
          <p className="text-white/50 text-sm">Empowering creators to share their expertise and monetize their prompt engineering skills.</p>
        </div>
        <div className="glass-panel p-8 rounded-3xl text-center hover:scale-105 transition-transform duration-300 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <Globe className="h-12 w-12 text-neon-blue mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Global Reach</h3>
          <p className="text-white/50 text-sm">Connecting businesses and individuals worldwide with the exact AI instructions they need.</p>
        </div>
        <div className="glass-panel p-8 rounded-3xl text-center hover:scale-105 transition-transform duration-300 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <ShieldCheck className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Quality Assured</h3>
          <p className="text-white/50 text-sm">Every prompt is rigorously tested by our AI quality engine to guarantee exceptional results.</p>
        </div>
      </div>

      <div className="glass-panel-heavy p-8 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-bold mb-4 text-neon-blue">Our Mission</h2>
        <p className="text-white/70 leading-relaxed mb-6">
          At MAGHGO, we believe that the barrier to leveraging powerful AI shouldn't be the ability to write perfect instructions. Our platform bridges the gap between AI capabilities and human intent by curating the highest quality, professional-grade prompts.
        </p>
        <div className="flex justify-center">
          <Link href="/browse" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neon-blue transition-colors shadow-[0_0_15px_rgba(0,210,255,0.4)]">
            Explore the Marketplace
          </Link>
        </div>
      </div>
    </div>
  )
}
