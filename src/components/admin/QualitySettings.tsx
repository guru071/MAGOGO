'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Beaker, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ALL_DIMENSIONS = [
  'clarity', 'specificity', 'creativity', 'usability',
  'engagement', 'originality', 'formatting', 'relevance',
];

export default function QualitySettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testText, setTestText] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/quality');
        const json = await res.json();
        if (!cancelled && json.success) setConfig(json.data);
      } catch {} finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/quality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const json = await res.json();
      if (json.success) toast.success('Quality settings saved');
      else toast.error(json.error || 'Failed to save');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const runTest = async () => {
    if (!testText.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch { setTestResult({ success: false, error: 'AI service unreachable' }); }
    setTesting(false);
  };

  const toggleDimension = (dim: string) => {
    setConfig((prev: any) => ({
      ...prev,
      dimensions: prev.dimensions.includes(dim)
        ? prev.dimensions.filter((d: string) => d !== dim)
        : [...prev.dimensions, dim],
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!config) {
    return <div className="text-center text-muted-foreground py-12">Failed to load quality settings</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Beaker className="h-4 w-4" /> Quality Scoring Configuration
        </h3>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Auto Quality Checks</Label>
              <p className="text-xs text-muted-foreground">Automatically score prompts on creation</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => setConfig((prev: any) => ({ ...prev, enabled: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Notify on Low Quality</Label>
              <p className="text-xs text-muted-foreground">Send alerts when quality score is below threshold</p>
            </div>
            <Switch
              checked={config.notifyOnLowQuality}
              onCheckedChange={(v) => setConfig((prev: any) => ({ ...prev, notifyOnLowQuality: v }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Auto-Approve Threshold</Label>
              <p className="text-xs text-muted-foreground">Score &ge; this value auto-approves (0-100)</p>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.autoApproveThreshold}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, autoApproveThreshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Auto-Reject Threshold</Label>
              <p className="text-xs text-muted-foreground">Score &lt; this value auto-rejects (0-100)</p>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.autoRejectThreshold}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, autoRejectThreshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dimensions</Label>
            <p className="text-xs text-muted-foreground">Enable/disable quality scoring dimensions</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_DIMENSIONS.map((dim) => (
                <div key={dim} className="flex items-center gap-2">
                  <Switch
                    checked={config.dimensions?.includes(dim)}
                    onCheckedChange={() => toggleDimension(dim)}
                  />
                  <span className="text-sm capitalize">{dim}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Beaker className="h-4 w-4" /> Test Quality Scoring
        </h3>
        <div className="space-y-3">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Enter prompt text to test quality scoring..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
          />
          <Button onClick={runTest} disabled={testing || !testText.trim()}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Beaker className="h-4 w-4 mr-2" />}
            Test Quality
          </Button>
        </div>
        {testResult && (
          <div className="mt-4 p-4 rounded-lg border">
            {testResult.success !== false && testResult.data ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={testResult.data.score >= 70 ? 'default' : testResult.data.score >= 40 ? 'secondary' : 'destructive'}>
                    Score: {testResult.data.score}
                  </Badge>
                  {testResult.data.grade && <Badge variant="outline">{testResult.data.grade}</Badge>}
                </div>
                {testResult.data.dimensions && (
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {Object.entries(testResult.data.dimensions).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize text-muted-foreground">{k}:</span>
                        <span className="font-medium">{typeof v === 'number' ? v.toFixed(1) : v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {testResult.data.summary && (
                  <p className="text-sm text-muted-foreground mt-2">{testResult.data.summary}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4" />
                {testResult.error || 'Scoring failed'}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
