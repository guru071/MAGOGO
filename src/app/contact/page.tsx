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
    <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground">Contact Us</h1>
        <p className="text-muted-foreground">We'd love to hear from you. Please fill out the form below or reach out directly.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-card border-border p-6 rounded-sm flex items-start gap-4 hover:border-[#2874F0]/50 transition-colors">
            <div className="p-3 bg-[#2874F0]/10 rounded-sm text-[#2874F0]">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground mb-1">Email Support</h3>
              <p className="text-muted-foreground text-sm mb-2">Our team usually responds within 2 hours.</p>
              <a href="mailto:support@maghgo.com" className="text-[#2874F0] font-medium hover:underline">support@maghgo.com</a>
            </div>
          </div>

          <div className="bg-card border-border p-6 rounded-sm flex items-start gap-4 hover:border-[#FF9F00]/50 transition-colors">
            <div className="p-3 bg-[#FF9F00]/10 rounded-sm text-[#FF9F00]">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground mb-1">Phone Support</h3>
              <p className="text-muted-foreground text-sm mb-2">Mon-Fri from 8am to 5pm (PST).</p>
              <a href="tel:+1234567890" className="text-[#FF9F00] font-medium hover:underline">+1 (234) 567-890</a>
            </div>
          </div>

          <div className="bg-card border-border p-6 rounded-sm flex items-start gap-4 hover:border-[#388E3C]/50 transition-colors">
            <div className="p-3 bg-[#388E3C]/10 rounded-sm text-[#388E3C]">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground mb-1">Office Location</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                123 Innovation Drive<br />
                Tech Hub, CA 94043<br />
                United States
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border-border p-8 rounded-sm shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-6">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
              <Input required placeholder="Your full name" className="bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] rounded-sm h-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <Input required type="email" placeholder="you@example.com" className="bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] rounded-sm h-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
              <Input required placeholder="How can we help?" className="bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] rounded-sm h-12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
              <Textarea required placeholder="Write your message here..." className="bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] rounded-sm min-h-[120px]" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-12 rounded-sm mt-2">
              {loading ? 'Sending...' : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
