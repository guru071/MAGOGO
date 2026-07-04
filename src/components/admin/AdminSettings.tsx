'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Save, Plus, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const DEFAULT_SETTINGS = [
  { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number', default: '10' },
  { key: 'minWithdrawal', label: 'Min Withdrawal ($)', type: 'number', default: '10' },
  { key: 'platformName', label: 'Platform Name', type: 'text', default: 'MAGHGO' },
  { key: 'supportEmail', label: 'Support Email', type: 'text', default: 'support@maghgo.com' },
];

export default function AdminSettings({ token }: { token: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [dbSettings, setDbSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api(`/api/admin/settings?token=${token}`);
        if (!cancelled) {
          setDbSettings(data || {});
          // Initialize values from DB settings merged with defaults
          const merged: Record<string, string> = {};
          DEFAULT_SETTINGS.forEach(s => {
            merged[s.key] = (data || {})[s.key] ?? s.default;
          });
          Object.entries(data || {}).forEach(([k, v]) => {
            if (!DEFAULT_SETTINGS.find(s => s.key === k)) {
              merged[k] = String(v);
            }
          });
          setValues(merged);
        }
      } catch (e: any) { if (!cancelled) toast.error(e.message); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const saveSetting = async (key: string) => {
    const currentValue = values[key];
    if (currentValue === undefined) return;
    setSaving(key);
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ key, value: currentValue }),
      });
      setDbSettings(prev => ({ ...prev, [key]: currentValue }));
      toast.success(`Saved ${key}`);
    } catch (e: any) { toast.error(e.message); }
    setSaving(null);
  };

  const deleteSetting = async (key: string) => {
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ key, value: '' }),
      });
      setDbSettings(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success(`Deleted ${key}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const addSetting = async () => {
    if (!newKey.trim()) return;
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });
      setValues(prev => ({ ...prev, [newKey]: newValue }));
      setDbSettings(prev => ({ ...prev, [newKey]: newValue }));
      setNewKey('');
      setNewValue('');
      toast.success('Setting added');
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  const allKeys = Array.from(new Set([...DEFAULT_SETTINGS.map(s => s.key), ...Object.keys(dbSettings)]));
  const getLabel = (key: string) => DEFAULT_SETTINGS.find(s => s.key === key)?.label || key;
  const getType = (key: string) => DEFAULT_SETTINGS.find(s => s.key === key)?.type || 'text';
  const isDefault = (key: string) => DEFAULT_SETTINGS.some(s => s.key === key);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Settings className="h-4 w-4" /> Platform Settings</h3>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {allKeys.map(key => {
              const type = getType(key);
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-sm">{getLabel(key)}</Label>
                    <div className="text-[10px] text-muted-foreground font-mono">{key}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type={type}
                      value={values[key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full sm:w-48"
                    />
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => saveSetting(key)} disabled={saving === key}>
                      {saving === key ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    {!isDefault(key) && (
                      <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600" onClick={() => deleteSetting(key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      <Separator />

      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Plus className="h-4 w-4" /> Add New Setting</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Setting key" value={newKey} onChange={e => setNewKey(e.target.value)} className="flex-1" />
          <Input placeholder="Value" value={newValue} onChange={e => setNewValue(e.target.value)} className="flex-1" />
          <Button onClick={addSetting} disabled={!newKey.trim()}>Add</Button>
        </div>
      </Card>
    </motion.div>
  );
}