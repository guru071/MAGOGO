'use client'

import { Sparkles, Users, Globe, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 flex items-center justify-center gap-4 text-foreground">
          <Sparkles className="h-10 w-10 text-[#2874F0]" />
          About MAGHGO
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The world's premium marketplace for expert-crafted AI prompts, designed to unlock the true potential of artificial intelligence.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-card border-border p-8 rounded-sm text-center hover:shadow-md transition-shadow">
          <Users className="h-12 w-12 text-[#FF9F00] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Community Driven</h3>
          <p className="text-muted-foreground text-sm">Empowering creators to share their expertise and monetize their prompt engineering skills.</p>
        </div>
        <div className="bg-card border-border p-8 rounded-sm text-center hover:shadow-md transition-shadow">
          <Globe className="h-12 w-12 text-[#2874F0] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Global Reach</h3>
          <p className="text-muted-foreground text-sm">Connecting businesses and individuals worldwide with the exact AI instructions they need.</p>
        </div>
        <div className="bg-card border-border p-8 rounded-sm text-center hover:shadow-md transition-shadow">
          <ShieldCheck className="h-12 w-12 text-[#388E3C] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Quality Assured</h3>
          <p className="text-muted-foreground text-sm">Every prompt is rigorously tested by our AI quality engine to guarantee exceptional results.</p>
        </div>
      </div>

      <div className="bg-card border-border p-8 rounded-sm shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-[#2874F0]">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          At MAGHGO, we believe that the barrier to leveraging powerful AI shouldn't be the ability to write perfect instructions. Our platform bridges the gap between AI capabilities and human intent by curating the highest quality, professional-grade prompts.
        </p>
        <div className="flex justify-center">
          <Link href="/browse" className="bg-[#2874F0] text-white px-8 py-3 rounded-sm font-bold hover:bg-[#2874F0]/90 transition-colors">
            Explore the Marketplace
          </Link>
        </div>
      </div>
    </div>
  )
}
