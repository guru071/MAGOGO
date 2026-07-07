import Link from 'next/link';
import { Globe as Github, MessageCircle as Twitter, DiscIcon as Discord } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/20 backdrop-blur-md mt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-xl tracking-tight">MAGHGO</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The premier marketplace for AI prompts. Discover, buy, and sell expertly crafted instructions for ChatGPT, Midjourney, and more.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="text-muted-foreground hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-white transition-colors">
                <Discord className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white">Marketplace</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/browse" className="hover:text-white transition-colors">All Prompts</Link></li>
              <li><Link href="/categories/chatgpt" className="hover:text-white transition-colors">ChatGPT</Link></li>
              <li><Link href="/categories/midjourney" className="hover:text-white transition-colors">Midjourney</Link></li>
              <li><Link href="/categories/claude" className="hover:text-white transition-colors">Claude</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/seller" className="hover:text-white transition-colors">Become a Seller</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Prompt Engineering Blog</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MAGHGO. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Made for AI Creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
