'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Shield, Beaker, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FraudConfig {
  userRiskThreshold: number;
  promptRiskThreshold: number;
  reviewRiskThreshold: number;
  transactionRiskThreshold: number;
  autoBlockThreshold: number;
  enabled: boolean;
  notifyOnFlag: boolean;
}

const defaultConfig: FraudConfig = {
  userRiskThreshold: 70,
  promptRiskThreshold: 60,
  reviewRiskThreshold: 65,
  transactionRiskThreshold: 75,
  autoBlockThreshold: 90,
  enabled: true,
  notifyOnFlag: true,
};

export default function FraudSettings({ token }: { token: string }) {
  const [config, setConfig] = useState<FraudConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/fraud/settings', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setConfig(json.data);
        else toast.error(json.error || 'Failed to load settings');
      })
      .catch(() => toast.error('Failed to load fraud settings'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/fraud/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const json = await res.json();
      if (json.success) toast.success('Fraud settings saved');
      else toast.error(json.error || 'Failed to save');
    } catch (e: any) { 
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/ai/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'check-user',
          user: { id: 'test', email: 'test@example.com', name: 'Test User', createdAt: new Date().toISOString(), role: 'BUYER', isVerified: false, isSeller: false },
        }),
      });
      const json = await res.json();
      if (json.success) toast.success('AI fraud check returned: ' + JSON.stringify(json.data));
      else toast.error('Test failed: ' + (json.error || 'Unknown'));
    } catch (e: any) { 
      toast.error('AI service unreachable: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const thresholds = [
    { key: 'userRiskThreshold', label: 'User Risk Threshold', desc: 'Minimum risk score to flag a user registration' },
    { key: 'promptRiskThreshold', label: 'Prompt Risk Threshold', desc: 'Minimum risk score to flag a prompt submission' },
    { key: 'reviewRiskThreshold', label: 'Review Risk Threshold', desc: 'Minimum risk score to flag a review' },
    { key: 'transactionRiskThreshold', label: 'Transaction Risk Threshold', desc: 'Minimum risk score to flag a transaction' },
    { key: 'autoBlockThreshold', label: 'Auto-Block Threshold', desc: 'Scores above this auto-block the user' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-neon-blue" />
            Fraud Detection Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure AI fraud detection thresholds and behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Beaker className="h-4 w-4 mr-1.5" />}
            Test AI
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save
          </Button>
        </div>
      </div>

      {/* Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="font-medium">Enable Fraud Detection</Label>
            <p className="text-xs text-muted-foreground">Globally enable or disable AI fraud detection</p>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifyOnFlag" className="font-medium">Notify on Flag</Label>
            <p className="text-xs text-muted-foreground">Send admin notifications when fraud is detected</p>
          </div>
          <Switch
            id="notifyOnFlag"
            checked={config.notifyOnFlag}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, notifyOnFlag: v }))}
          />
        </div>
      </Card>

      {/* Thresholds */}
      <Card className="p-4 space-y-6">
        <h3 className="text-sm font-semibold">Risk Thresholds (0-100)</h3>
        {thresholds.map(({ key, label, desc }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <Label className="font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Badge variant={config[key] >= 80 ? 'destructive' : config[key] >= 60 ? 'secondary' : 'outline'}>
                {config[key]}
              </Badge>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={config[key]}
              onChange={(e) => setConfig((c) => ({ ...c, [key]: parseInt(e.target.value) }))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-neon-blue"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0 (Safe)</span>
              <span>100 (Critical)</span>
            </div>
          </div>
        ))}
      </Card>

      {!config.enabled && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            Fraud detection is currently disabled. No AI fraud checks will be performed.
          </p>
        </div>
      )}
    </div>
  );
}
