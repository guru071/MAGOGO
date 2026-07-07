import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, Copy, ExternalLink, DownloadCloud } from "lucide-react";

export default async function BuyerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
  });

  if (!dbUser) {
    return <div>Error loading user data.</div>;
  }

  // Fetch orders with their linked prompts
  const orders = await prisma.order.findMany({
    where: { userId: dbUser.id, status: "COMPLETED" },
    include: {
      prompt: {
        include: {
          seller: { select: { name: true, avatarUrl: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Purchases</h1>
        <p className="text-muted-foreground mt-1">Access the prompts you've purchased below.</p>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <DownloadCloud className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Your Unlocked Prompts</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            You haven't purchased any prompts yet. Browse the marketplace to find something amazing!
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {orders.map((order) => (
              <div key={order.id} className="p-6 space-y-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-xl">{order.prompt.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purchased on {new Date(order.createdAt).toLocaleDateString()} for ${order.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-xs px-3 py-1 bg-green-500/20 text-green-400 font-bold rounded-full">
                    PURCHASED
                  </div>
                </div>
                
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative group">
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button 
                      className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                      // Note: Next.js server components can't run onClick without a client wrapper.
                      // We will use a simple inline script or just rely on CSS selection for now.
                    >
                      Secret Prompt Below
                    </button>
                  </div>
                  <p className="text-sm font-medium text-white/50 mb-2">PROMPT TEXT:</p>
                  <pre className="text-sm whitespace-pre-wrap font-mono text-green-400">
                    {order.prompt.promptText}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
