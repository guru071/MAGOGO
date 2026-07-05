'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, ShieldAlert, ShieldCheck, UserX, AlertTriangle, CheckCircle, Eye, Ban, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface FraudCase {
  id: string;
  userId: string;
  type: string;
  entityType: string;
  entityId: string | null;
  riskScore: number;
  signals: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface FraudData {
  cases: FraudCase[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FraudDashboard({ token }: { token: string }) {
  const [data, setData] = useState<FraudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchCases = async (status: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fraud?status=${status}&page=${p}&limit=20`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.error || 'Failed to load fraud cases');
    } catch (e: any) { 
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases(activeTab, page);
  }, [token, activeTab, page]);

  const handleAction = async (caseId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/fraud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, action, resolution: action === 'dismiss' ? 'Dismissed - false positive' : undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === 'block_user' ? 'User blocked and case resolved' : 'Case resolved');
        fetchCases(activeTab, page);
        setReviewModalOpen(false);
      } else {
        toast.error(json.error || 'Action failed');
      }
    } catch (e: any) { 
      toast.error(e.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (score >= 60) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    if (score >= 30) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'USER': return <UserX className="h-4 w-4" />;
      case 'PROMPT': return <Shield className="h-4 w-4" />;
      case 'REVIEW': return <ShieldAlert className="h-4 w-4" />;
      case 'TRANSACTION': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const avgRiskScore = data?.cases?.length
    ? Math.round(data.cases.reduce((sum, c) => sum + c.riskScore, 0) / data.cases.length)
    : 0;

  const openCount = data?.cases?.filter((c) => c.status === 'OPEN').length ?? 0;
  const blockedCount = data?.cases?.filter((c) => c.resolution?.includes('blocked')).length ?? 0;
  const falsePositiveCount = data?.cases?.filter((c) => c.resolution?.includes('false positive')).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500 drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{data?.total ?? 0}</p>
              <p className="text-xs font-bold text-white/50">Total Flagged</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{openCount}</p>
              <p className="text-xs font-bold text-white/50">Open Cases</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-500 drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{blockedCount}</p>
              <p className="text-xs font-bold text-white/50">Blocked Users</p>
            </div>
          </div>
        </Card>
        <Card className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_currentColor]" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{falsePositiveCount}</p>
              <p className="text-xs font-bold text-white/50">False Positives</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk score gauge */}
      <Card className="glass-panel p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Average Risk Score</h3>
          <span className={`text-2xl font-black ${avgRiskScore >= 80 ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : avgRiskScore >= 60 ? 'text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]' : avgRiskScore >= 30 ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]'}`}>
            {avgRiskScore}/100
          </span>
        </div>
        <div className="h-4 bg-white/5 rounded-full overflow-hidden relative border border-white/10">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '30%' }} />
            <div className="h-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: '30%' }} />
            <div className="h-full bg-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: '20%' }} />
            <div className="h-full bg-red-600/80 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: '20%' }} />
          </div>
          <div
            className="absolute top-0 h-full w-1.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-500 rounded-full"
            style={{ left: `${avgRiskScore}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/50 font-bold mt-2 px-1">
          <span>Low (0-30)</span>
          <span>Medium (30-60)</span>
          <span>High (60-80)</span>
          <span>Critical (80-100)</span>
        </div>
      </Card>

      {/* Cases table */}
      <Card className="glass-panel shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/40">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black data-[state=active]:font-bold text-white/70">All</TabsTrigger>
              <TabsTrigger value="OPEN" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black data-[state=active]:font-bold text-white/70">Open</TabsTrigger>
              <TabsTrigger value="RESOLVED" className="data-[state=active]:bg-neon-blue data-[state=active]:text-black data-[state=active]:font-bold text-white/70">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
          </div>
        ) : !data?.cases?.length ? (
          <div className="p-8 text-center text-sm text-white/50 font-medium">
            <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            No fraud cases found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30">
                    <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider text-white/50">Date</th>
                    <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider text-white/50">User</th>
                    <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider text-white/50">Type</th>
                    <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider text-white/50">Score</th>
                    <th className="text-left p-4 font-bold text-[10px] uppercase tracking-wider text-white/50">Status</th>
                    <th className="text-right p-4 font-bold text-[10px] uppercase tracking-wider text-white/50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.cases.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white/60 whitespace-nowrap font-medium text-xs">{formatDate(c.createdAt)}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-white">{c.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-white/50 font-medium">{c.user?.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="flex items-center gap-1.5 w-fit bg-white/5 border-white/20 text-white">
                          <span className="text-white/60">{getEntityIcon(c.entityType)}</span>
                          {c.entityType}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getScoreColor(c.riskScore)} border-0 font-bold`}>{c.riskScore}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={c.status === 'OPEN' ? 'destructive' : 'secondary'} className={c.status === 'OPEN' ? 'bg-red-500/20 text-red-400 border-0' : 'bg-white/10 text-white/70 border-0'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                            onClick={() => { setSelectedCase(c); setReviewModalOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {c.status === 'OPEN' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                onClick={() => handleAction(c.id, 'block_user')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                onClick={() => handleAction(c.id, 'dismiss')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/40">
                <p className="text-xs text-white/50 font-bold">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)} className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-50">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Review modal */}
      {reviewModalOpen && selectedCase && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReviewModalOpen(false)}>
          <div className="glass-panel rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black flex items-center gap-2 text-white">
                <ShieldAlert className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_currentColor]" />
                Case Review
              </h3>
              <Badge variant={selectedCase.status === 'OPEN' ? 'destructive' : 'secondary'} className={selectedCase.status === 'OPEN' ? 'bg-red-500/20 text-red-400 border-0' : 'bg-white/10 text-white/70 border-0'}>
                {selectedCase.status}
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">User</p>
                  <p className="text-sm font-bold text-white">{selectedCase.user?.name || 'Unknown'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-white/80 font-medium truncate">{selectedCase.user?.email || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Entity Type</p>
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white font-medium">{selectedCase.entityType}</Badge>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Risk Score</p>
                  <Badge className={`${getScoreColor(selectedCase.riskScore)} border-0 font-bold`}>{selectedCase.riskScore}/100</Badge>
                </div>
              </div>
              {selectedCase.signals && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2">Fraud Signals</p>
                  <pre className="text-xs bg-black/40 text-white/80 p-3 rounded-lg overflow-auto max-h-40 border border-white/10 font-mono">
                    {JSON.stringify(JSON.parse(selectedCase.signals), null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Created</p>
                  <p className="text-xs font-medium text-white/80">{formatDate(selectedCase.createdAt)}</p>
                </div>
                {selectedCase.resolution && (
                  <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Resolution</p>
                    <p className="text-xs font-bold text-emerald-400">{selectedCase.resolution}</p>
                  </div>
                )}
              </div>
            </div>
            {selectedCase.status === 'OPEN' && (
              <div className="flex gap-3 pt-2">
                <Button variant="destructive" className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold" onClick={() => handleAction(selectedCase.id, 'block_user')}>
                  <Ban className="h-4 w-4 mr-2" /> Block User
                </Button>
                <Button variant="outline" className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold hover:text-emerald-300" onClick={() => handleAction(selectedCase.id, 'dismiss')}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Dismiss
                </Button>
              </div>
            )}
            <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10 font-bold mt-2" onClick={() => setReviewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
