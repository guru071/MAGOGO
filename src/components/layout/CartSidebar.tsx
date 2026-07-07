"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplaceStore } from "@/store/marketplace";
import Image from "next/image";

export function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { cart, removeFromCart, clearCart } = useMarketplaceStore();

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsCheckingOut(false);
      return;
    }

    try {
      const orderRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      
      if (orderRes.status === 401) {
        alert("Please log in to purchase these prompts.");
        window.location.href = "/login";
        return;
      }
      
      const orderData = await orderRes.json();

      if (!orderData.orderId) throw new Error("Failed to create order");

      const promptIds = cart.map(item => item.id);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(total * 100),
        currency: "USD",
        name: "MAGHGO",
        description: "Premium AI Prompts",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, promptIds }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            clearCart();
            setIsOpen(false);
            alert("Payment successful! Your prompts are now available.");
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: "John Doe",
          email: "john@example.com",
        },
        theme: {
          color: "#8B5CF6", // primary purple
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="hidden sm:inline-flex text-muted-foreground hover:text-white relative"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        {cart.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1 -translate-y-1">
            {cart.length}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#1a103c]/90 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Your Cart
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <ShoppingCart className="w-16 h-16" />
                    <p>Your cart is empty.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsOpen(false)}>
                      Keep Browsing
                    </Button>
                  </div>
                ) : (
                  cart.map((item) => {
                    let imageUrl = "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000&auto=format&fit=crop";
                    try {
                      const images = JSON.parse(item.sampleImages);
                      if (images && images.length > 0) imageUrl = images[0];
                    } catch(e) {}
                    
                    return (
                      <motion.div layout key={item.id} className="flex gap-4 bg-white/5 border border-white/5 p-3 rounded-xl">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={imageUrl} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2 -mt-1" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="font-bold text-primary">${item.price.toFixed(2)}</div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                  </div>
                  <Button 
                    onClick={handleCheckout} 
                    disabled={isCheckingOut}
                    className="w-full h-12 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90"
                  >
                    {isCheckingOut ? "Processing..." : (
                      <>Checkout <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
