"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/ui/PromptCard";

export function FeaturedGrid({ prompts }: { prompts: any[] }) {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-24 container mx-auto px-4">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Trending Right Now</h2>
          <p className="text-muted-foreground">The most popular prompts this week.</p>
        </div>
        <Button variant="link" className="text-primary hidden sm:flex">
          View All Trending <ArrowRight className="ml-1 w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
      <div className="mt-8 flex justify-center sm:hidden">
        <Button variant="outline" className="w-full rounded-full border-white/10 bg-white/5">
          View All Trending
        </Button>
      </div>
    </section>
  );
}
