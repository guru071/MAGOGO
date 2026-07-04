'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Database, Cloud, CreditCard, CheckCircle, AlertTriangle, FileText, HardDrive, RefreshCw, TableIcon } from 'lucide-react';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

interface ServiceStatus {
  name: string;
  icon: typeof Database;
  color: string;
  bg: string;
  description: string;
  envVars: string[];
  configured: boolean;
  connected?: boolean;
  error?: string;
  extra?: { label: string; value: string }[];
}

export default function AdminInfrastructure({ token }: { token: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api(`/api/admin/infrastructure?token=${token}`);
        if (!cancelled) setStatus(data);
      } catch (e) { console.error('[admin] AdminInfrastructure:', e); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, refresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefresh(r => r + 1);
    setTimeout(() => setRefreshing(false), 500);
  };

  const services: ServiceStatus[] = [
    {
      name: 'Database (SQLite)',
      icon: Database,
      color: 'text-[#0066CC]',
      bg: 'bg-[#0066CC]',
      description: 'Local SQLite database via Prisma ORM',
      envVars: ['DATABASE_URL'],
      configured: true,
      connected: status?.database?.connected ?? false,
      error: status?.database?.error,
      extra: status?.database ? [
        { label: 'File Size', value: status.database.size },
        { label: 'Tables', value: String(status.database.tables) },
        { label: 'Provider', value: 'SQLite' },
      ] : [],
    },
    {
      name: 'Cloudinary',
      icon: Cloud,
      color: 'text-sky-600',
      bg: 'bg-sky-500',
      description: 'Cloud media storage & image transformation',
      envVars: ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
      configured: status?.cloudinary?.configured ?? false,
      extra: [
        { label: 'Upload Endpoint', value: '/api/upload' },
        { label: 'Storage', value: 'Cloud' },
      ],
    },
    {
      name: 'Razorpay',
      icon: CreditCard,
      color: 'text-violet-600',
      bg: 'bg-violet-500',
      description: 'Payment gateway for Indian market',
      envVars: ['NEXT_PUBLIC_RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
      configured: status?.razorpay?.configured ?? false,
      extra: [
        { label: 'Gateway', value: status?.razorpay?.configured ? 'Ready' : 'Not Configured' },
        { label: 'Webhook', value: '/api/payments/webhook' },
      ],
    },
    {
      name: 'Supabase',
      icon: TableIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-500',
      description: 'PostgreSQL database & authentication (optional)',
      envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
      configured: status?.supabase?.configured ?? false,
      connected: status?.supabase?.connected ?? false,
      error: status?.supabase?.error,
      extra: [
        { label: 'Connection', value: status?.supabase?.connected ? 'Pool' : 'N/A' },
      ],
    },
  ];

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-gray-500" /> Infrastructure</h2>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-gray-500" /> Infrastructure</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Check Status
        </Button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map((svc, i) => (
          <motion.div key={svc.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="p-5 h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${svc.bg}/10`}>
                    <svc.icon className={`h-5 w-5 ${svc.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{svc.name}</p>
                    {svc.configured
                      ? (svc.connected !== undefined
                        ? (svc.connected
                          ? <Badge className="bg-green-100 text-green-700 gap-1 text-[10px] mt-0.5"><CheckCircle className="h-3 w-3" /> Connected</Badge>
                          : <Badge className="bg-red-100 text-red-700 gap-1 text-[10px] mt-0.5"><AlertTriangle className="h-3 w-3" /> Error</Badge>)
                        : <Badge className="bg-green-100 text-green-700 gap-1 text-[10px] mt-0.5"><CheckCircle className="h-3 w-3" /> Configured</Badge>)
                      : <Badge className="bg-amber-100 text-amber-700 gap-1 text-[10px] mt-0.5"><AlertTriangle className="h-3 w-3" /> Not Configured</Badge>
                    }
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{svc.description}</p>
              <Separator className="mb-3" />
              <div className="space-y-1.5 flex-1">
                {(svc.extra || []).map(m => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
              {svc.error && (
                <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-[10px] text-red-600 break-all">{svc.error}</div>
              )}
              <div className="mt-3 pt-3 border-t">
                <p className="text-[10px] text-muted-foreground mb-1.5">Required env vars:</p>
                <div className="flex flex-wrap gap-1">
                  {svc.envVars.map(c => {
                    const isSet = c.includes('CLOUDINARY_CLOUD_NAME')
                      ? !!(status?.cloudinary?.configured)
                      : c.includes('RAZORPAY')
                        ? !!(status?.razorpay?.configured)
                        : c.includes('SUPABASE')
                          ? !!(status?.supabase?.configured)
                          : true;
                    return (
                      <Badge key={c} variant="outline" className={`text-[9px] font-mono ${isSet ? 'border-green-300 text-green-700' : 'border-red-300 text-red-500'}`}>
                        {c.split('_').slice(-1)[0]}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}