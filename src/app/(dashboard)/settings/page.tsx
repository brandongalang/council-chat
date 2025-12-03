'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Check, Trash2, Key } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const checkKeyStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-key');
      if (res.ok) {
        const data = await res.json() as { hasKey: boolean };
        setHasKey(data.hasKey);
      }
    } catch (error) {
      console.error('Failed to check key status', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!res.ok) throw new Error('Failed to save key');

      setHasKey(true);
      setApiKey('');
      toast.success('API key saved securely');
    } catch (error) {
      console.error('Failed to save API key', error);
      toast.error('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your API key? Agents will stop working.')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete key');

      setHasKey(false);
      toast.success('API key removed');
    } catch (error) {
      console.error('Failed to remove API key', error);
      toast.error('Failed to remove API key');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-medium tracking-tight text-primary">Settings</h1>
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          / System Configuration
        </p>
      </div>

      {/* API Key Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-sans">OpenRouter API Key</CardTitle>
          <CardDescription className="font-mono text-xs">
            Required for council agents to function. Stored with AES-256-GCM encryption.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="api-key"
                  type="password"
                  placeholder={hasKey ? "••••••••••••••••" : "sk-or-..."}
                  className="pl-9 font-mono"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving || !apiKey}
                className="font-mono"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Key'}
              </Button>
            </div>
          </div>

          {hasKey && (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-none">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span className="text-sm font-mono">Active key configured</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
