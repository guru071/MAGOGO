import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[#0066CC] flex items-center justify-center overflow-hidden relative">
                <Image src="/logo.jpeg" alt="MAGHGO" fill className="object-contain" sizes="32px" />
              </div>
              <span className="font-bold text-slate-900">MAGHGO</span>
            </div>
            <p className="text-sm text-slate-500">Premium AI prompt marketplace. Buy and sell expert-crafted prompts.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Marketplace</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <Link href="/browse" className="hover:text-[#0066CC]">Browse Prompts</Link>
              <Link href="/browse?isFree=true" className="hover:text-[#0066CC]">Free Prompts</Link>
              <Link href="/cart" className="hover:text-[#0066CC]">Cart</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Support</h4>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <a href="mailto:support@maghgo.com" className="hover:text-[#0066CC]">Contact</a>
              <Link href="/" className="hover:text-[#0066CC]">About</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} MAGHGO. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
