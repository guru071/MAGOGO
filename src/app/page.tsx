import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedGrid } from "@/components/home/FeaturedGrid";
import { Code, Image as ImageIcon, MessageSquare, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Next.js config to revalidate data frequently for a live marketplace feel
export const revalidate = 60; // revalidate every 60 seconds

export default async function Home() {
  // Fetch real trending prompts from the database
  const prompts = await prisma.prompt.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      seller: {
        select: {
          name: true,
          avatar: true,
        }
      }
    }
  });

  return (
    <div className="flex flex-col items-center w-full">
      <HeroSection />

      {/* Stats/Logos Strip */}
      <section className="w-full border-y border-white/5 bg-black/40 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60">
          {[
            { name: "ChatGPT", icon: MessageSquare },
            { name: "Midjourney", icon: ImageIcon },
            { name: "Claude 3", icon: Zap },
            { name: "GitHub Copilot", icon: Code },
          ].map((tool, i) => (
            <div key={i} className="flex items-center gap-3 text-lg font-semibold tracking-wider uppercase text-white/70">
              <tool.icon className="w-6 h-6" /> {tool.name}
            </div>
          ))}
        </div>
      </section>

      <FeaturedGrid prompts={prompts} />
    </div>
  );
}
