'use client';

import { useState, useEffect } from 'react';
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

  // Saved Models State
  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [newModelId, setNewModelId] = useState('');
  const [savingModel, setSavingModel] = useState(false);

  useEffect(() => {
    checkKeyStatus();
    fetchSavedModels();
  }, []);

  const fetchSavedModels = async () => {
    try {
      const res = await fetch('/api/settings/models');
      if (res.ok) {
        const data = await res.json();
        setSavedModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch saved models', error);
    }
  };

  const handleSaveModel = async () => {
    if (!newModelId.trim()) return;
    setSavingModel(true);
    try {
      const res = await fetch('/api/settings/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: newModelId.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save model');
      }

      const newModel = await res.json();
      setSavedModels([...savedModels, newModel]);
      setNewModelId('');
      toast.success('Model saved successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingModel(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/models?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete model');

      setSavedModels(savedModels.filter(m => m.id !== id));
      toast.success('Model removed');
    } catch (error) {
      toast.error('Failed to remove model');
    }
  };

  const checkKeyStatus = async () => {
    try {
      const res = await fetch('/api/settings/api-key');
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.hasKey);
      }
    } catch (error) {
      console.error('Failed to check key status', error);
    } finally {
      setLoading(false);
    }
  };

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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-sans">Saved Models</CardTitle>
          <CardDescription className="font-mono text-xs">
            Save frequently used model IDs for quick access in the selector.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-model">Add Model ID</Label>
            <div className="flex gap-2">
              <Input
                id="new-model"
                placeholder="e.g. anthropic/claude-3-opus"
                className="font-mono"
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveModel()}
              />
              <Button
                onClick={handleSaveModel}
                disabled={savingModel || !newModelId}
                className="font-mono"
              >
                {savingModel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Saved Models</Label>
            {savedModels.length === 0 ? (
              <div className="text-sm text-muted-foreground font-mono italic">No saved models yet.</div>
            ) : (
              <div className="grid gap-2">
                {savedModels.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-md">
                    <span className="font-mono text-sm">{model.model_id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteModel(model.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
