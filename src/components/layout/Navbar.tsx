"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartSidebar } from '@/components/layout/CartSidebar';

export function Navbar() {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q');
    if (q) {
      router.push(`/prompts?q=${encodeURIComponent(q.toString())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">MAGHGO</span>
        </Link>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            name="q"
            type="text"
            className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/70 text-foreground"
            placeholder="Search for AI prompts..."
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <CartSidebar />
          <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground hover:text-white">
            <Search className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex hover:text-primary transition-colors asChild">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 asChild">
              <Link href="/login">Sign Up</Link>
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
