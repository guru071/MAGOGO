'use client'

import { useState } from 'react'
import { HelpCircle, MessageCircle, ChevronDown, ChevronUp, Search, ShieldCheck, CreditCard, Package, UserCog } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const FAQ_SECTIONS = [
  {
    icon: Package,
    title: 'Buying Prompts',
    items: [
      { q: 'How do I purchase a prompt?', a: 'Browse our marketplace, add prompts to your cart, and complete checkout using UPI, cards, or your wallet balance. After payment, the prompt text is instantly available in your Orders page.' },
      { q: 'Can I get a refund?', a: 'Yes. If a prompt does not work as described, contact our support team within 7 days of purchase. We will review and process your refund.' },
      { q: 'How do I use a purchased prompt?', a: 'Go to Account → Orders, click on the prompt, and copy the full prompt text. Paste it directly into the AI tool it was designed for (ChatGPT, Midjourney, etc.).' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments & Billing',
    items: [
      { q: 'What payment methods are supported?', a: 'We support UPI (Google Pay, PhonePe, Paytm), debit/credit cards, net banking, and wallet balance — all powered by Razorpay with 256-bit encryption.' },
      { q: 'Is my payment information secure?', a: 'Absolutely. We never store your card or UPI details. All payments are processed by Razorpay (PCI-DSS Level 1 certified) using bank-grade HMAC-SHA256 cryptographic signatures.' },
      { q: 'Why was my payment declined?', a: 'Common reasons include insufficient funds, bank OTP timeout, or network issues. Please try again or use a different payment method.' },
    ],
  },
  {
    icon: UserCog,
    title: 'Selling Prompts',
    items: [
      { q: 'How do I become a seller?', a: 'Go to your Account page and click "Become a Seller". You can then upload prompts with descriptions, sample images, and pricing from the Seller Dashboard.' },
      { q: 'What is the platform commission?', a: 'We charge a transparent commission (visible during upload) which includes platform fees, GST, and payment processing. Your net earnings are shown clearly before you publish.' },
      { q: 'When do I receive my earnings?', a: 'Payouts are processed automatically every 10 days to your registered bank account via RazorpayX IMPS transfer.' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Account & Security',
    items: [
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login screen. You will receive a password reset link on your registered email address.' },
      { q: 'My account was suspended. What do I do?', a: 'Accounts are flagged by our AI fraud detection system. If you believe this is an error, please contact support@maghgo.com with your account details.' },
      { q: 'Is two-factor authentication available?', a: 'Yes, you can enable 2FA from Account → Security. We support authenticator apps and email-based verification.' },
    ],
  },
]

export default function SupportPage() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const toggle = (key: string) => setOpenMap(prev => ({ ...prev, [key]: !prev[key] }))

  const filteredSections = FAQ_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(section => section.items.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground flex items-center justify-center gap-3">
          <HelpCircle className="inline h-10 w-10 text-[#2874F0]" />
          Help Center
        </h1>
        <p className="text-muted-foreground mb-8">Find answers to your questions or get in touch with our support team.</p>

        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for help..."
            className="pl-12 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] rounded-sm h-14 text-base"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredSections.map((section, si) => (
          <div key={si} className="bg-card border-border rounded-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted">
              <section.icon className="h-5 w-5 text-[#2874F0]" />
              <h2 className="font-bold text-foreground text-lg">{section.title}</h2>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item, qi) => {
                const key = `${si}-${qi}`
                const isOpen = openMap[key]
                return (
                  <div key={qi}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
                    >
                      <span className="font-medium text-sm text-foreground pr-4">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-[#2874F0] shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 duration-200">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold text-foreground">No results found</p>
          <p className="text-sm text-muted-foreground mt-2">Try different keywords or contact our support team.</p>
        </div>
      )}

      <div className="mt-16 bg-card border-border p-8 rounded-sm text-center shadow-sm">
        <MessageCircle className="h-10 w-10 text-[#2874F0] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Still need help?</h3>
        <p className="text-muted-foreground text-sm mb-6">Our support team is available 24/7 via live chat or email.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="bg-[#2874F0] text-white px-8 py-3 rounded-sm font-bold hover:bg-[#2874F0]/90 transition-colors">
            Contact Us
          </Link>
          <Link href="/qna" className="bg-card text-foreground px-8 py-3 rounded-sm font-bold hover:bg-muted transition-colors border border-border">
            Community Q&A
          </Link>
        </div>
      </div>
    </div>
  )
}
