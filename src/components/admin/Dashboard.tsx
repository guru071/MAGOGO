'use client';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList } from 'recharts';
import { DollarSign, ShoppingBag, Users, Crown, Package, FileText, Clock, CheckCircle, Banknote, Megaphone, Flag, Zap, Trophy, ScrollText, TrendingUp, BarChart3, AlertTriangle, Repeat, Sun, Hash, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Activity, Download, Eye, AlertCircle, Target, GitCompare, TrendingDown, Brain, Shield } from 'lucide-react';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_COLORS = ['#0066CC','#FF6600','#10B981','#8B5CF6','#EC4899','#F59E0B','#06B6D4'];
const PIE_COLORS = ['#0066CC','#FF6600','#10B981','#8B5CF6','#EC4899','#F59E0B','#06B6D4','#14B8A6','#F97316','#6366F1'];
const FUNNEL_COLORS = ['#0066CC','#2563EB','#3B82F6','#60A5FA'];

const ACTION_COLORS: Record<string, string> = {
  PURCHASE: 'bg-blue-100 text-blue-700', UPLOAD: 'bg-blue-100 text-blue-700', LOGIN: 'bg-blue-100 text-blue-700',
  REGISTER: 'bg-orange-100 text-orange-700', REFUND: 'bg-amber-100 text-amber-700',
  BAN: 'bg-red-100 text-red-700', BROADCAST_NOTIFICATION: 'bg-violet-100 text-violet-700', SYSTEM: 'bg-gray-100 text-gray-700',
};

export default function Dashboard({ stats, analytics, activityLogs, loadTab }: { stats: any; analytics: any; activityLogs: any[]; loadTab: (t: string) => void }) {
  const [viewPeriod, setViewPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  if (!stats || !analytics) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Failed to Load Dashboard</h2>
        <p className="text-sm mt-2 max-w-md text-center">There was an error loading the analytics data. Please check your database connection or try refreshing the page.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  const s = stats || {};
  const a = analytics?.summary;

  // Mutate metric badges
  const MetricBadge = ({ value, positive = true }: { value: number; positive?: boolean }) => (
    <Badge className={`text-[10px] border-0 ml-2 ${value > 0 ? (positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-500'}`}>
      {value > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
      {Math.abs(value)}%
    </Badge>
  );

  // Alerts
  const alerts = analytics?.growthAlerts || [];
  const predictive = analytics?.predictiveInsights || {};
  const forecast = analytics?.forecast || {};
  const anomalies = analytics?.anomalies || {};
  const anomaliesAll = [...(anomalies.zScore || []), ...(anomalies.iqr || [])].slice(0, 12);
  const retention = analytics?.retention || [];
  const funnel = analytics?.funnel || [];
  const decomposition = analytics?.decomposition || {};
  const seasonPattern = decomposition.seasonalPattern || [];

  // Combine chart data
  const revenueData = analytics?.dailyRevenue?.some((d: any) => d.revenue > 0) ? analytics.dailyRevenue : [];
  const ordersData = analytics?.dailyOrders?.some((d: any) => d.count > 0) ? analytics.dailyOrders : [];
  const usersData = analytics?.dailyUsers?.some((d: any) => d.count > 0) ? analytics.dailyUsers : [];
  const sellData = analytics?.dailySellers?.some((d: any) => d.count > 0) ? analytics.dailySellers : [];

  const chartData = forecast?.forecast?.length
    ? [...revenueData, ...forecast.forecast.map((f: any) => ({ date: f.day, revenue: f.value, forecast: true }))]
    : revenueData;

  const kpis = [
    { label: 'Revenue', value: `$${(a?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]', delta: a?.revenueGrowth, badge: true },
    { label: 'Orders', value: a?.totalOrders || 0, icon: ShoppingBag, color: 'text-[#FF6600]', bg: 'bg-[#FF6600]', delta: a?.orderGrowth, badge: true },
    { label: 'New Users', value: a?.newUsers || 0, icon: Users, color: 'text-rose-600', bg: 'bg-rose-500', delta: a?.userGrowth, badge: true },
    { label: 'Avg Order', value: `$${a?.avgOrderValue?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500', delta: 0 },
    { label: 'Conversion', value: `${a?.conversionRate?.toFixed(1) || 0}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-500', delta: 0 },
    { label: 'Pending', value: a?.pendingPrompts || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-500', delta: 0 },
    { label: 'Prev Revenue', value: `$${(a?.prevRevenue || 0).toFixed(2)}`, icon: GitCompare, color: 'text-teal-600', bg: 'bg-teal-500', delta: 0 },
    { label: 'Predicted (30d)', value: `$${(predictive.predictedNextMonthRevenue || 0).toFixed(0)}`, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-500', delta: predictive.predictedGrowth },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {alerts.map((alert: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`p-3 border ${alert.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20' : alert.type === 'negative' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'} backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                  {alert.type === 'positive' ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : alert.type === 'negative' ? <ArrowDownRight className="h-4 w-4 text-red-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
                  <div>
                    <p className="text-xs font-semibold text-white">{alert.metric}</p>
                    <p className="text-[10px] text-white/60">{alert.message}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(item => (
          <motion.div key={item.label} whileHover={{ y: -3 }}>
            <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 font-medium">{item.label}</p>
                  <p className={`text-xl font-black ${item.color} drop-shadow-sm`}>{item.value}</p>
                </div>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${item.bg}/20 border border-${item.bg.replace('bg-', '')}/30`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
              {item.delta !== undefined && item.delta !== 0 && (
                <div className="mt-1">
                  <MetricBadge value={item.delta} positive={item.delta > 0} />
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Orders Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <TrendingUp className="h-4 w-4 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.8)]" /> Revenue Forecast
              {forecast?.forecast?.length > 0 && <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">{(forecast.forecast.length)}d forecast</Badge>}
            </h3>
            {forecast?.model?.alpha > 0 && (
              <span className="text-[10px] text-white/40">α={forecast.model.alpha}, MSE={forecast.model.mse}</span>
            )}
          </div>
          {chartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-white/40">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#ffffff66' }} interval={Math.max(1, Math.floor(chartData.length / 10))} />
                <YAxis tick={{ fontSize: 10, fill: '#ffffff66' }} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#00d2ff" fill="url(#revGrad)" strokeWidth={2} name="Actual" />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#fcGrad)" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          {predictive.predictedGrowth !== undefined && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Brain className="h-3 w-3 text-indigo-400" />
              <span className="text-white/60">Next 30d prediction:</span>
              <span className="font-bold text-indigo-400">${(predictive.predictedNextMonthRevenue || 0).toFixed(0)}</span>
              <span className={predictive.predictedGrowth > 0 ? 'text-emerald-400' : 'text-red-400'}>
                ({predictive.predictedGrowth > 0 ? '+' : ''}{predictive.predictedGrowth}%)
              </span>
            </div>
          )}
        </Card>
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
            <BarChart3 className="h-4 w-4 text-[#FF6600] drop-shadow-[0_0_5px_rgba(255,102,0,0.8)]" /> Orders & Users
          </h3>
          {ordersData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-white/40">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={ordersData.map((d: any, i: number) => ({ ...d, users: usersData[i]?.count || 0, sellers: sellData[i]?.count || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#ffffff66' }} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: '#ffffff66' }} />
                <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} />
                <Bar dataKey="count" fill="#FF6600" radius={[4, 4, 0, 0]} name="Orders" opacity={0.8} />
                <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} name="New Users" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Anomaly Banner */}
      {anomaliesAll.length > 0 && (
        <Card className="p-4 border-red-500/30 bg-red-950/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" /> Anomaly Detection
            </h3>
            <div className="flex gap-2">
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">Z-score: {anomalies.zScore?.length || 0}</Badge>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">IQR: {anomalies.iqr?.length || 0}</Badge>
            </div>
          </div>
          <ScrollArea className="max-h-24">
            <div className="flex gap-2">
              {anomaliesAll.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-red-500/20 text-sm shrink-0">
                  <div className={`h-2 w-2 rounded-full ${a.type === 'spike' || a.type === 'high' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'}`} />
                  <span className="text-xs text-white/60">{a.day}</span>
                  <span className="font-bold text-xs text-white">${a.value.toFixed(2)}</span>
                  {a.zScore && <span className="text-[10px] text-white/40">z={a.zScore}</span>}
                  {a.type === 'spike' && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">Spike</Badge>}
                  {a.type === 'drop' && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">Drop</Badge>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Seasonality + Retention + Funnel */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Seasonality: Day of Week + Hour + Monthly */}
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-white">
            <Sun className="h-4 w-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" /> Seasonality Patterns
          </h3>
          <div className="space-y-4">
            {analytics?.dowOrders?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/50 mb-1 font-bold uppercase tracking-wider">Day of Week</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={(analytics.dowOrders || []).map((d: any) => ({ ...d, label: DOW_LABELS[d.dow] }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#ffffff66' }} />
                    <RTooltip contentStyle={{ fontSize: 11, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {(analytics.dowOrders || []).map((_: any, i: number) => <Cell key={i} fill={DOW_COLORS[i % 7]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {seasonPattern.length > 0 && (
              <div>
                <p className="text-[10px] text-white/50 mb-1 font-bold uppercase tracking-wider">Weekly Seasonal Effect</p>
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={seasonPattern}>
                    <XAxis dataKey="period" tick={false} />
                    <RTooltip contentStyle={{ fontSize: 11, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}`]} />
                    <Area type="monotone" dataKey="effect" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {analytics?.monthlyOrders?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/50 mb-1 font-bold uppercase tracking-wider">Monthly</p>
                <ResponsiveContainer width="100%" height={60}>
                  <BarChart data={(analytics.monthlyOrders || []).map((d: any) => ({ ...d, label: MONTH_LABELS[d.month - 1] || d.month }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#ffffff66' }} />
                    <RTooltip contentStyle={{ fontSize: 11, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} />
                    <Bar dataKey="count" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>

        {/* Retention Cohorts */}
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-white">
            <Repeat className="h-4 w-4 text-[#FF6600] drop-shadow-[0_0_5px_rgba(255,102,0,0.8)]" /> Retention Cohorts (Weekly)
          </h3>
          {retention.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-white/40">Insufficient data for cohort analysis</div>
          ) : (
            <ScrollArea className="max-h-[260px]">
              <div className="space-y-2">
                {retention.map((cohort: any, ci: number) => (
                  <div key={cohort.cohort} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-white/80">{cohort.cohort.slice(5)}</span>
                      <span className="text-white/50">{cohort.totalUsers} users</span>
                    </div>
                    <div className="flex gap-0.5">
                      {cohort.sizes.filter((s: any) => s.week <= 8).map((s: any, wi: number) => (
                        <div key={wi} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className="w-full rounded-sm transition-all hover:opacity-80"
                            style={{
                              height: `${Math.max(4, s.retention * 1.5)}px`,
                              backgroundColor: s.retention > 50 ? '#00d2ff' : s.retention > 20 ? '#FF6600' : '#ffffff22',
                              opacity: wi === 0 ? 1 : s.retention / 100,
                            }}
                            title={`Week ${s.week}: ${s.retention}%`}
                          />
                          {wi % 2 === 0 && <span className="text-[8px] text-white/40">{s.week === 0 ? 'W0' : `W${s.week}`}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Sales Funnel */}
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-white">
            <Target className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> Sales Funnel
          </h3>
          {funnel.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-white/40">Insufficient data</div>
          ) : (
            <div className="space-y-3">
              <ResponsiveContainer width="100%" height={140}>
                <FunnelChart data={funnel.map((f: any) => ({ ...f, value: f.count }))}>
                  <RTooltip contentStyle={{ fontSize: 11, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} />
                  <Funnel dataKey="value" isAnimationActive>
                    {funnel.map((_: any, i: number) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
                    <LabelList position="right" fill="#ffffffb3" stroke="none" fontSize={11} dataKey="stage" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
              {funnel.map((f: any, i: number) => (
                <div key={f.stage} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs transition-colors">
                  <span className="font-bold text-white/80">{f.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-white">{f.count.toLocaleString()}</span>
                    {i > 0 && <span className="text-red-400 text-[10px] font-bold">-{f.dropRate}%</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top Categories + Payment Methods + Top Sellers */}
      <div className="grid lg:grid-cols-3 gap-4">
        {analytics?.topCategories?.length > 0 && (
          <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Package className="h-4 w-4 text-neon-blue" /> Top Categories</h3>
            <ScrollArea className="max-h-[300px] pr-2">
              <div className="space-y-2">
              {analytics.topCategories.map((cat: any, i: number) => {
                const maxRev = Math.max(...analytics.topCategories.map((c: any) => c.revenue));
                const pct = maxRev > 0 ? (cat.revenue / maxRev) * 100 : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-xs font-mono font-bold w-5 text-right text-white/40">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-sm font-bold text-white truncate">{cat.name}</span>
                        <span className="text-sm font-black text-neon-blue">${cat.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-pink" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.03 }} />
                        </div>
                      </div>
                      <div className="flex gap-2 text-[10px] text-white/50 mt-1 font-medium">
                        <span>{cat.orders} orders</span>
                        <span>·</span>
                        <span>{cat.prompts} prompts</span>
                        <span>·</span>
                        <span>{cat.sellers} sellers</span>
                        {cat.refunds > 0 && <><span>·</span><span className="text-red-400">${cat.refunds.toFixed(2)} refunds</span></>}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </ScrollArea>
          </Card>
        )}
        {analytics?.revenueByPaymentMethod?.length > 0 && (
          <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Banknote className="h-4 w-4 text-emerald-400" /> Payment Methods</h3>
            <ScrollArea className="max-h-[300px] pr-2">
              <ResponsiveContainer width="100%" height={140} className="mb-4">
                <PieChart>
                  <Pie data={analytics.revenueByPaymentMethod} dataKey="revenue" nameKey="method" cx="50%" cy="50%" outerRadius={55} innerRadius={35} stroke="rgba(255,255,255,0.1)">
                    {analytics.revenueByPaymentMethod.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <RTooltip contentStyle={{ fontSize: 11, backgroundColor: '#000000cc', borderColor: '#ffffff2a', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
              {analytics.revenueByPaymentMethod.map((pm: any) => (
                <div key={pm.method} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm">
                  <span className="font-bold text-white">{pm.method}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50">{pm.count} txns · ${pm.avgAmount.toFixed(2)} avg</span>
                    <span className="font-black text-emerald-400">${pm.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              </div>
            </ScrollArea>
          </Card>
        )}
        {analytics?.topSellers?.length > 0 && (
          <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Trophy className="h-4 w-4 text-[#FF6600]" /> Top Sellers</h3>
            <ScrollArea className="max-h-[300px] pr-2">
              <div className="space-y-2">
              {analytics.topSellers.map((seller: any, i: number) => {
                const maxRev = Math.max(...analytics.topSellers.map((s: any) => s.revenue));
                const pct = maxRev > 0 ? (seller.revenue / maxRev) * 100 : 0;
                return (
                  <motion.div key={seller.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-sm font-black w-5 text-center text-[#FF6600]">{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}</span>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-sm font-black shadow-lg border border-white/20">{seller.name?.[0]?.toUpperCase() || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-white truncate">{seller.name}</p>
                        <span className="font-black text-neon-blue text-sm ml-2">${seller.revenue?.toFixed(2)}</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden mt-1">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-blue to-[#FF6600]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.03 }} />
                      </div>
                      <div className="flex gap-2 text-[10px] text-white/50 mt-1 font-medium">
                        <span>{seller.sales} sales</span>
                        <span>·</span>
                        <span>{seller.promptCount} prompts</span>
                        <span>·</span>
                        <span className="text-amber-400">★ {seller.avgRating.toFixed(1)}</span>
                        {seller.refundRate > 0 && <><span>·</span><span className="text-red-400">{seller.refundRate}% refunds</span></>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="glass-panel p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-white"><Zap className="h-5 w-5 text-[#FF6600] drop-shadow-[0_0_5px_rgba(255,102,0,0.8)]" /> Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {s?.pendingPrompts > 0 && <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-neon-blue/30 hover:bg-neon-blue/20 hover:border-neon-blue hover:text-white text-white/80 transition-all rounded-2xl" onClick={() => loadTab('prompts')}><CheckCircle className="h-6 w-6 text-[#FF6600]" /><span className="text-xs font-bold">Approve Pending</span><Badge className="bg-[#FF6600] text-white text-[10px] border-0">{s.pendingPrompts}</Badge></Button>}
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white text-white/80 transition-all rounded-2xl" onClick={() => loadTab('payouts')}><Banknote className="h-6 w-6 text-emerald-400" /><span className="text-xs font-bold">Process Payouts</span></Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white text-white/80 transition-all rounded-2xl" onClick={() => loadTab('broadcasts')}><Megaphone className="h-6 w-6 text-[#FF6600]" /><span className="text-xs font-bold">Send Broadcast</span></Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-white/80 transition-all rounded-2xl" onClick={() => loadTab('reports')}><Flag className="h-6 w-6 text-red-500" /><span className="text-xs font-bold">View Reports</span></Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400 text-white/80 transition-all rounded-2xl" onClick={() => loadTab('security')}><Shield className="h-6 w-6 text-indigo-400" /><span className="text-xs font-bold">Security</span></Button>
        </div>
      </Card>

      {activityLogs.length > 0 && (
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Activity className="h-4 w-4 text-neon-blue" /> Recent Activity</h3>
          <ScrollArea className="max-h-48 pr-2">
            <div className="space-y-1">
            {activityLogs.map((log: any, i: number) => (
              <div key={log.id || i} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 hover:bg-white/10 transition-colors text-sm border border-white/5">
                <Badge className={`text-[10px] shrink-0 border-0 ${ACTION_COLORS[log.action] || 'bg-white/10 text-white/80'}`}>{log.action?.replace(/_/g, ' ')}</Badge>
                <span className="flex-1 truncate text-white/90">{log.details || log.action}</span>
                <span className="text-xs text-white/50 font-bold whitespace-nowrap">{log.user?.name || 'System'}</span>
                <span className="text-[10px] text-white/40 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </motion.div>
  );
}
