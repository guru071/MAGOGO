"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Search } from "lucide-react";

export function HeroSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section className="relative w-full overflow-hidden flex flex-col items-center pt-24 pb-32 px-4">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] opacity-30 pointer-events-none" />
      
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-white/80">Introducing MAGHGO v2.0 - The New Standard</span>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
        >
          Supercharge Your AI with <br className="hidden md:block" />
          <span className="text-gradient">Premium Prompts</span>
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Discover, buy, and sell expertly crafted instructions for ChatGPT, Midjourney, Claude, and more. Stop guessing, start generating.
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white px-8 h-14 text-lg w-full sm:w-auto shadow-[0_0_40px_-10px_var(--tw-shadow-color)] shadow-primary/50 transition-all hover:scale-105">
            Explore Prompts <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg w-full sm:w-auto border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:text-white transition-all">
            Become a Seller
          </Button>
        </motion.div>
        
        {/* Search Bar overlay on Hero */}
        <motion.div variants={itemVariants} className="pt-12 max-w-2xl mx-auto w-full">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="w-full glass rounded-full py-5 pl-16 pr-8 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground shadow-2xl"
              placeholder="Search for 'Midjourney hyper-realistic portrait'..."
            />
            <Button className="absolute right-2 top-2 bottom-2 rounded-full px-6 bg-white/10 hover:bg-white/20 text-white">
              Search
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
