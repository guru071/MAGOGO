import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Package, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SellerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from our database using authUserId
  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    include: {
      prompts: {
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!dbUser) {
    return <div>Error loading user data.</div>;
  }

  const prompts = dbUser.prompts;
  const totalEarned = prompts.reduce((sum, p) => sum + (p.price * p.downloadCount), 0);

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your prompts and track your sales.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl asChild">
          <Link href="/dashboard/seller/new">
            <Plus className="w-4 h-4 mr-2" /> Create New Prompt
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium mb-4">
            <Package className="w-5 h-5 text-indigo-400" /> Active Prompts
          </div>
          <div className="text-4xl font-bold">{prompts.length}</div>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium mb-4">
            <DollarSign className="w-5 h-5 text-green-400" /> Total Earnings
          </div>
          <div className="text-4xl font-bold">${totalEarned.toFixed(2)}</div>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium mb-4">
            <TrendingUp className="w-5 h-5 text-pink-400" /> Total Sales
          </div>
          <div className="text-4xl font-bold">{prompts.reduce((sum, p) => sum + p.downloadCount, 0)}</div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Your Prompts</h2>
        </div>
        {prompts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            You haven't created any prompts yet. Click "Create New Prompt" to get started!
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <h3 className="font-medium text-lg">{prompt.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{prompt.description}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold">${prompt.price.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{prompt.downloadCount} sales</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${prompt.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {prompt.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
