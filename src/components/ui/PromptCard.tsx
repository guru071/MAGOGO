"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MessageSquare, Image as ImageIcon, ShoppingCart, Heart } from "lucide-react";
import { useMarketplaceStore } from "@/store/marketplace";
import { Button } from "@/components/ui/button";

interface PromptCardProps {
  prompt: any;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const { addToCart, removeFromCart, isInCart, addToWishlist, removeFromWishlist, isInWishlist } = useMarketplaceStore();

  let imageUrl = "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000&auto=format&fit=crop";
  try {
    const images = JSON.parse(prompt.sampleImages);
    if (images && images.length > 0) imageUrl = images[0];
  } catch(e) {}

  const inCart = isInCart(prompt.id);
  const inWishlist = isInWishlist(prompt.id);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      removeFromCart(prompt.id);
    } else {
      addToCart({
        id: prompt.id,
        title: prompt.title,
        price: prompt.price,
        sampleImages: prompt.sampleImages,
        seller: {
          name: prompt.seller?.name || "Unknown",
          avatar: prompt.seller?.avatar || null,
        }
      });
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(prompt.id);
    } else {
      addToWishlist({
        id: prompt.id,
        title: prompt.title,
        price: prompt.price,
        sampleImages: prompt.sampleImages,
        seller: {
          name: prompt.seller?.name || "Unknown",
          avatar: prompt.seller?.avatar || null,
        }
      });
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass rounded-2xl overflow-hidden group border border-white/5 cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative overflow-hidden">
        <Image 
          src={imageUrl}
          alt={prompt.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium text-white flex items-center gap-1 border border-white/10">
            {prompt.recommendedAI?.toLowerCase().includes("midjourney") ? <ImageIcon className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
            {prompt.recommendedAI || "ChatGPT"}
          </div>
        </div>

        {prompt.isTrending && (
          <div className="absolute top-3 right-3 bg-primary rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg shadow-primary/50">
            Trending
          </div>
        )}
        
        {/* Quick Actions (Hover) */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border border-white/10"
            onClick={handleWishlistClick}
          >
            <Heart className={`w-5 h-5 ${inWishlist ? "fill-pink-500 text-pink-500" : ""}`} />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className={`rounded-full backdrop-blur-md border border-white/10 ${inCart ? "bg-primary text-white" : "bg-white/20 hover:bg-white/40 text-white"}`}
            onClick={handleCartClick}
          >
            <ShoppingCart className={`w-5 h-5 ${inCart ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
      
      <div className="p-5 space-y-3 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 flex-grow">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {prompt.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 relative">
            {prompt.seller?.avatar && (
              <Image src={prompt.seller.avatar} alt="Avatar" fill className="object-cover" />
            )}
          </div>
          <span className="truncate">By {prompt.seller?.name || "Unknown"}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-yellow-500 text-sm">
            ★ {(prompt.rating || 4.9).toFixed(1)} <span className="text-muted-foreground">({prompt.reviewCount || 128})</span>
          </div>
          <div className="font-bold text-lg text-white">
            ${prompt.price.toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
