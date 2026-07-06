'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Eye, BarChart3, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart as RPie, Pie, Cell, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'];

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

export default function QualityDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/admin/stats');
        if (!cancelled) setStats(data);
      } catch (e: any) { 
        if (!cancelled) setError(e.message);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const scoreData = useMemo(() => {
    if (!stats?.prompts) return [];
    const prompts = stats.prompts || [];
    const scored = prompts.filter((p: any) => p.qualityScore != null);
    const byDate: Record<string, number[]> = {};
    scored.forEach((p: any) => {
      const d = p.createdAt?.slice(0, 10);
      if (d) {
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(p.qualityScore);
      }
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, scores]) => ({
        date: date.slice(5),
        avgScore: +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      }));
  }, [stats]);

  const gradeData = useMemo(() => {
    if (!stats?.prompts) return [];
    const prompts = stats.prompts || [];
    const grades: Record<string, number> = { Excellent: 0, Good: 0, Average: 0, Poor: 0, VeryPoor: 0 };
    prompts.forEach((p: any) => {
      const s = p.qualityScore;
      if (s == null) return;
      if (s >= 90) grades.Excellent++;
      else if (s >= 70) grades.Good++;
      else if (s >= 50) grades.Average++;
      else if (s >= 30) grades.Poor++;
      else grades.VeryPoor++;
    });
    return Object.entries(grades).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const lowQualityPrompts = useMemo(() => {
    if (!stats?.prompts) return [];
    return (stats.prompts || [])
      .filter((p: any) => p.qualityScore != null && p.qualityScore < 50)
      .sort((a: any, b: any) => (a.qualityScore || 0) - (b.qualityScore || 0))
      .slice(0, 20);
  }, [stats]);

  const trend = useMemo(() => {
    if (scoreData.length < 7) return { direction: 'flat', change: 0 };
    const recent = scoreData.slice(-7).reduce((sum, d) => sum + d.avgScore, 0) / 7;
    const previous = scoreData.slice(-14, -7).reduce((sum, d) => sum + d.avgScore, 0) / 7;
    if (previous === 0) return { direction: 'flat', change: 0 };
    const change = +((recent - previous) / previous * 100).toFixed(1);
    return { direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat', change: Math.abs(change) };
  }, [scoreData]);

  const handleApproveAnyway = async (promptId: string) => {
    try {
      await api(`/api/admin/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      toast.success('Prompt approved');
      setStats((prev: any) => ({
        ...prev,
        prompts: prev.prompts?.map((p: any) => p.id === promptId ? { ...p, status: 'APPROVED' } : p),
      }));
    } catch (e: any) {  toast.error(e.message); }
  };

  const handleRequestRevision = async (promptId: string) => {
    try {
      await api(`/api/admin/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVISION' }),
      });
      toast.success('Revision requested');
      setStats((prev: any) => ({
        ...prev,
        prompts: prev.prompts?.map((p: any) => p.id === promptId ? { ...p, status: 'REVISION' } : p),
      }));
    } catch (e: any) {  toast.error(e.message); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Trend */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Quality Score Trend
          </h3>
          <div className="flex items-center gap-1 text-sm">
            {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend.direction === 'flat' && <span className="text-muted-foreground">&mdash;</span>}
            <span className={trend.direction === 'up' ? 'text-green-500' : trend.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
              {trend.change}% {trend.direction === 'flat' ? '' : trend.direction === 'up' ? 'increase' : 'decrease'}
            </span>
            <span className="text-muted-foreground text-xs ml-1">vs last week</span>
          </div>
        </div>
      </Card>

      {/* Bar Chart */}
      <Card className="p-5">
        <h4 className="text-sm font-medium mb-4">Average Quality Score (Last 30 Days)</h4>
        {scoreData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <RTooltip />
              <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No quality score data available
          </div>
        )}
      </Card>

      {/* Pie + Table */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="p-5">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Quality Grade Distribution
          </h4>
          {gradeData.some((g) => g.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <RPie>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gradeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip />
                <Legend />
              </RPie>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              No scored prompts yet
            </div>
          )}
        </Card>

        {/* Low Quality Table */}
        <Card className="p-5">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Low Quality Prompts (Score &lt; 50)
          </h4>
          {lowQualityPrompts.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {lowQualityPrompts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.seller?.name || 'Unknown'} &middot; {p.createdAt?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant={p.qualityScore < 20 ? 'destructive' : 'secondary'}>
                      {p.qualityScore?.toFixed(0)}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleApproveAnyway(p.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-amber-500" onClick={() => handleRequestRevision(p.id)}>
                      <XCircle className="h-3 w-3 mr-1" /> Revise
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                      <a href={`/prompts/${p.id}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              No low quality prompts found
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
