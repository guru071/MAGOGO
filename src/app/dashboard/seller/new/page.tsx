"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import Link from "next/link";

export default function NewPromptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // We should fetch categories on mount, but for now we'll fetch them from the API
  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(data => setCategories(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      promptText: formData.get("promptText"),
      price: parseFloat(formData.get("price") as string),
      recommendedAI: formData.get("recommendedAI"),
      categoryId: formData.get("categoryId"),
    };

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        router.push("/dashboard/seller");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      alert("Failed to submit prompt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      <Button variant="ghost" className="hover:text-primary transition-colors asChild -ml-4">
        <Link href="/dashboard/seller">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sell a New Prompt</h1>
        <p className="text-muted-foreground mt-1">Share your expertise and earn money from your AI prompts.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Prompt Title</label>
            <input required name="title" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Hyper-Realistic Cyberpunk Cityscape" />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Short Description</label>
            <textarea required name="description" rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Describe what this prompt generates..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">The Actual Prompt Text (Hidden until purchased)</label>
            <textarea required name="promptText" rows={5} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm" placeholder="/imagine prompt: A sprawling cyberpunk city at night..." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Price (USD)</label>
              <input required name="price" type="number" step="0.01" min="0.99" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="4.99" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">AI Model</label>
              <select required name="recommendedAI" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="Midjourney">Midjourney</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Claude">Claude</option>
                <option value="DALL-E">DALL-E</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
              <select required name="categoryId" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Button disabled={loading} type="submit" className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5 mr-2" /> Publish Prompt</>}
        </Button>
      </form>
    </div>
  );
}
