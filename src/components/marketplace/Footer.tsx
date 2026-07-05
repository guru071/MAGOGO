import Link from 'next/link'

export function Footer() {
  return (
    <footer className="hidden md:block bg-white border-t border-[#F0F0F0] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-[#2874F0] flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-[#212121]">MAGHGO</span>
            </div>
            <p className="text-sm text-[#878787]">Premium AI prompt marketplace. Buy and sell expert-crafted prompts.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#212121] text-sm mb-3">Marketplace</h4>
            <div className="flex flex-col gap-2 text-sm text-[#878787]">
              <Link href="/browse" className="hover:text-[#2874F0] transition-colors">Browse Prompts</Link>
              <Link href="/browse?isFree=true" className="hover:text-[#2874F0] transition-colors">Free Prompts</Link>
              <Link href="/categories" className="hover:text-[#2874F0] transition-colors">Categories</Link>
              <Link href="/cart" className="hover:text-[#2874F0] transition-colors">Cart</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#212121] text-sm mb-3">Support</h4>
            <div className="flex flex-col gap-2 text-sm text-[#878787]">
              <Link href="/support" className="hover:text-[#2874F0] transition-colors">Help Center</Link>
              <Link href="/contact" className="hover:text-[#2874F0] transition-colors">Contact Us</Link>
              <Link href="/about" className="hover:text-[#2874F0] transition-colors">About</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#212121] text-sm mb-3">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-[#878787]">
              <Link href="/terms" className="hover:text-[#2874F0] transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-[#2874F0] transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#F0F0F0] text-center text-xs text-[#C4C4C4]">
          &copy; {new Date().getFullYear()} MAGHGO. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
