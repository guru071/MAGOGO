'use client'

import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Message sent! We will get back to you shortly.')
      ;(e.target as HTMLFormElement).reset()
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 relative z-10 text-white">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Contact Us</h1>
        <p className="text-white/60">We'd love to hear from you. Please fill out the form below or reach out directly.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex items-start gap-4 hover:border-neon-blue/50 transition-colors">
            <div className="p-3 bg-neon-blue/10 rounded-full text-neon-blue">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Email Support</h3>
              <p className="text-white/60 text-sm mb-2">Our team usually responds within 2 hours.</p>
              <a href="mailto:support@maghgo.com" className="text-neon-blue font-medium hover:underline">support@maghgo.com</a>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex items-start gap-4 hover:border-neon-pink/50 transition-colors">
            <div className="p-3 bg-neon-pink/10 rounded-full text-neon-pink">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Phone Support</h3>
              <p className="text-white/60 text-sm mb-2">Mon-Fri from 8am to 5pm (PST).</p>
              <a href="tel:+1234567890" className="text-neon-pink font-medium hover:underline">+1 (234) 567-890</a>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex items-start gap-4 hover:border-emerald-400/50 transition-colors">
            <div className="p-3 bg-emerald-400/10 rounded-full text-emerald-400">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Office Location</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                123 Innovation Drive<br />
                Tech Hub, CA 94043<br />
                United States
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel-heavy p-8 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Name</label>
              <Input required placeholder="Your full name" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-neon-blue rounded-xl h-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <Input required type="email" placeholder="you@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-neon-blue rounded-xl h-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Subject</label>
              <Input required placeholder="How can we help?" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-neon-blue rounded-xl h-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Message</label>
              <Textarea required placeholder="Write your message here..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-neon-blue rounded-xl min-h-[120px]" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)] mt-2">
              {loading ? 'Sending...' : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
