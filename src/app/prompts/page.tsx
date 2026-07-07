import { prisma } from "@/lib/prisma";
import { PromptCard } from "@/components/ui/PromptCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 60; // revalidate every 60 seconds

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await the search parameters to fix the Next.js 15+ synchronous access warning
  const params = await searchParams;
  
  const q = typeof params.q === 'string' ? params.q : undefined;
  const categoryId = typeof params.category === 'string' ? params.category : undefined;

  // Build the Prisma query
  const where: any = {
    status: 'APPROVED',
  };

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Fetch prompts
  // Fetch prompts without the secret promptText!
  const prompts = await prisma.prompt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      price: true,
      sampleImages: true,
      tags: true,
      status: true,
      downloadCount: true,
      categoryId: true,
      createdAt: true,
      seller: {
        select: {
          name: true,
          avatar: true,
        }
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-6 sticky top-24">
          <div className="flex items-center gap-2 font-semibold text-lg border-b border-white/10 pb-4">
            <SlidersHorizontal className="w-5 h-5" /> Filters
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI Model</h3>
            <div className="space-y-2">
              {['Midjourney', 'ChatGPT', 'Claude', 'DALL-E'].map((model) => (
                <label key={model} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" className="rounded border-white/20 bg-black/20 text-primary focus:ring-primary/50" />
                  {model}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Price Range</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                <input type="radio" name="price" className="border-white/20 bg-black/20 text-primary focus:ring-primary/50" defaultChecked />
                Any Price
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                <input type="radio" name="price" className="border-white/20 bg-black/20 text-primary focus:ring-primary/50" />
                Under $5
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                <input type="radio" name="price" className="border-white/20 bg-black/20 text-primary focus:ring-primary/50" />
                $5 to $10
              </label>
            </div>
          </div>
          
          <Button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {q ? `Search Results for "${q}"` : 'Browse All Prompts'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Found {prompts.length} prompt{prompts.length === 1 ? '' : 's'}.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select className="bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Most Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {prompts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 border-dashed border-2 border-white/10">
            <Search className="w-12 h-12 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold">No prompts found</h2>
            <p className="text-muted-foreground max-w-md">
              We couldn't find any prompts matching your search criteria. Try adjusting your filters or using different keywords.
            </p>
            <Button variant="outline" className="mt-4 rounded-xl border-white/10">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
