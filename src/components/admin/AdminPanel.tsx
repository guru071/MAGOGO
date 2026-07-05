'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingBag,
  Layers,
  Tag,
  Flag,
  Wallet,
  Activity,
  Megaphone,
  Settings,
  Server,
  LogOut,
  Menu,
  Loader2,
  ShieldCheck,
  Beaker,
  DollarSign,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Zap,
  Layout,
} from 'lucide-react';

import Dashboard from './Dashboard';
import AdminUsers from './AdminUsers';
import AdminPrompts from './AdminPrompts';
import AdminOrders from './AdminOrders';
import AdminCategories from './AdminCategories';
import AdminCoupons from './AdminCoupons';
import AdminReports from './AdminReports';
import AdminPayouts from './AdminPayouts';
import AdminActivity from './AdminActivity';
import AdminBroadcasts from './AdminBroadcasts';
import AdminSettings from './AdminSettings';
import AdminInfrastructure from './AdminInfrastructure';
import AdminSecurity from './AdminSecurity';
import QualitySettings from './QualitySettings';
import QualityDashboard from './QualityDashboard';
import FeeSettings from './FeeSettings';
import RevenueDashboard from './RevenueDashboard';
import FraudDashboard from './FraudDashboard';
import FraudSettings from './FraudSettings';
import AdminComments from './AdminComments';

import AdminSupportChat from './AdminSupportChat';
import AdminFlashDeals from './AdminFlashDeals';
import AdminSiteConfig from './AdminSiteConfig';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'prompts', label: 'Prompts', icon: FileText },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'categories', label: 'Categories', icon: Layers },
  { key: 'coupons', label: 'Coupons', icon: Tag },
  { key: 'reports', label: 'Reports', icon: Flag },
  { key: 'comments', label: 'Comments', icon: MessageSquare },
  { key: 'support', label: 'Support', icon: MessageCircle },
  { key: 'flash', label: 'Flash Deals', icon: Zap },
  { key: 'payouts', label: 'Payouts', icon: Wallet },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'infrastructure', label: 'Infrastructure', icon: Server },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'fraud', label: 'Fraud Detection', icon: ShieldCheck },
  { key: 'quality', label: 'Quality', icon: Beaker },
  { key: 'fees', label: 'Fees', icon: DollarSign },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'site-config', label: 'Site Config', icon: Layout },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Dashboard wrapper – fetches stats then renders <Dashboard />
// ---------------------------------------------------------------------------

function DashboardWrapper({ token, loadTab }: { token: string; loadTab: (t: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [statsRes, analyticsRes, logsRes] = await Promise.all([
          fetch(`/api/admin/stats`).then((r) => r.json()),
          fetch(`/api/admin/analytics`).then((r) => r.json()),
          fetch(`/api/admin/activity-logs?limit=10`).then((r) => r.json()),
        ]);
        if (!cancelled) {
          if (statsRes.success) setStats(statsRes.data);
          if (analyticsRes.success) setAnalytics(analyticsRes.data);
          if (logsRes.success) setActivityLogs(logsRes.data?.logs || []);
        }
      } catch (e) { console.error('[admin] DashboardWrapper:', e); } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return <Dashboard stats={stats} analytics={analytics} activityLogs={activityLogs} loadTab={loadTab} />;
}

// ---------------------------------------------------------------------------
// Shared sidebar nav content (used by both desktop & mobile)
// ---------------------------------------------------------------------------

function SidebarNav({
  activeTab,
  onTabChange,
  user,
  onLogout,
  onMobileClose,
}: {
  activeTab: string;
  onTabChange: (key: string) => void;
  user: any;
  onLogout: () => void;
  onMobileClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
            <Image
              src="/logo.jpeg"
              alt="MAGHGO"
              fill
              className="object-contain"
              sizes="36px"
            />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight leading-none">MAGHGO</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  onTabChange(tab.key);
                  onMobileClose?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-neon-pink flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 justify-start"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminPanel component
// ---------------------------------------------------------------------------

interface AdminPanelProps {
  token: string;
  user: any;
  onLogout: () => void;
}

export default function AdminPanel({ token, user, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);
  const [activityUserName, setActivityUserName] = useState<string | null>(null);

  const handleLogout = () => {
    onLogout();
  };

  const handleViewActivity = (userId: string, userName: string) => {
    setActivityUserId(userId);
    setActivityUserName(userName);
    setActiveTab('activity');
  };

  const clearActivityFilter = () => {
    setActivityUserId(null);
    setActivityUserName(null);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardWrapper token={token} loadTab={(t: string) => setActiveTab(t as TabKey)} />;
      case 'users':
        return <AdminUsers token={token} onViewActivity={handleViewActivity} />;
      case 'prompts':
        return <AdminPrompts token={token} />;
      case 'orders':
        return <AdminOrders token={token} />;
      case 'categories':
        return <AdminCategories token={token} />;
      case 'coupons':
        return <AdminCoupons token={token} />;
      case 'reports':
        return <AdminReports token={token} />;
      case 'comments':
        return <AdminComments token={token} />;

      case 'support':
        return <AdminSupportChat token={token} adminId={user?.id} />;
      case 'flash':
        return <AdminFlashDeals token={token} />;
      case 'payouts':
        return <AdminPayouts token={token} />;
      case 'activity':
        return <AdminActivity token={token} preFilterUserId={activityUserId || undefined} preFilterUserName={activityUserName || undefined} onClearFilter={clearActivityFilter} />;
      case 'broadcasts':
        return <AdminBroadcasts token={token} />;
      case 'settings':
        return <AdminSettings token={token} />;
      case 'infrastructure':
        return <AdminInfrastructure token={token} />;
      case 'security':
        return <AdminSecurity token={token} />;
      case 'fraud':
        return (
          <div className="space-y-8">
            <FraudDashboard token={token} />
            <FraudSettings token={token} />
          </div>
        );
      case 'quality':
        return (
          <div className="space-y-8">
            <QualitySettings />
            <QualityDashboard />
          </div>
        );
      case 'fees':
        return <FeeSettings />;
      case 'revenue':
        return <RevenueDashboard />;
      case 'site-config':
        return <AdminSiteConfig />;
      default:
        return null;
    }
  };

  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen flex bg-background">
      {/* ----------------------------------------------------------------- */}
      {/* Desktop sidebar                                                    */}
      {/* ----------------------------------------------------------------- */}
      <aside className="hidden lg:flex w-64 bg-[#0B1120] text-white flex-col fixed inset-y-0 z-30 border-r border-slate-800/50">
        <SidebarNav
          activeTab={activeTab}
          onTabChange={(tab: string) => setActiveTab(tab as TabKey)}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* ----------------------------------------------------------------- */}
      {/* Mobile sidebar (Sheet)                                             */}
      {/* ----------------------------------------------------------------- */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-[#0B1120] text-white border-slate-800/50 sm:!max-w-none"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarNav
            activeTab={activeTab}
            onTabChange={(tab: string) => setActiveTab(tab as TabKey)}
            user={user}
            onLogout={handleLogout}
            onMobileClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ----------------------------------------------------------------- */}
      {/* Main content area                                                  */}
      {/* ----------------------------------------------------------------- */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b px-4 h-14 flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md overflow-hidden lg:hidden relative">
              <Image src="/logo.jpeg" alt="MAGHGO" fill className="object-contain" sizes="24px" />
            </div>
            <h2 className="font-semibold text-lg">{activeLabel}</h2>
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}