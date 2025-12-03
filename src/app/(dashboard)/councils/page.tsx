'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Edit, Loader2, X, Gavel } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Council {
  id: string;
  name: string;
  judge_model: string | null;
  judgePrompt?: { id: string; name: string } | null;
  models: Array<{ id: string; model_id: string }>;
  created_at: string;
}

const getModelShortName = (modelId?: string | null) => {
  if (!modelId) return 'Unassigned';
  const parts = modelId.split('/');
  return parts[parts.length - 1] || modelId;
};

const formatMembers = (models: Council['models']) => {
  if (!models?.length) return 'No members configured';
  return models
    .map((m) => getModelShortName(m.model_id))
    .join(', ');
};

export default function CouncilsPage() {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCouncils = useCallback(async () => {
    try {
      const res = await fetch('/api/councils');
      if (res.ok) {
        const data = await res.json() as Council[];
        setCouncils(data);
      }
    } catch (error) {
      console.error('Failed to load councils', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouncils();
  }, [fetchCouncils]);

  const handleCreateDefault = async () => {
    if (!confirm('Initialize the default "Balanced Council"?')) return;
    setLoading(true);
    try {
        const payload = {
            name: 'Balanced Council',
            judgeModel: 'openai/gpt-4o',
            members: [
                { modelId: 'anthropic/claude-3.5-sonnet' },
                { modelId: 'openai/gpt-4o' },
                { modelId: 'google/gemini-pro-1.5' }
            ]
        };

        const res = await fetch('/api/councils', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create default');
        
        toast.success('Balanced Council initialized');
        fetchCouncils();
    } catch (error) {
        console.error('Failed to initialize default council', error);
        toast.error('Failed to initialize default council');
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dissolve this council? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/councils/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCouncils(prev => prev.filter(c => c.id !== id));
        toast.success('Council dissolved.');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to dissolve council', error);
      toast.error('Failed to dissolve council.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-sans font-medium tracking-tight text-primary">Council Registry</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
            / Authorized Configurations
          </p>
        </div>
        <Button asChild className="rounded-none font-mono">
          <Link href="/councils/new">
            <Plus className="mr-2 h-4 w-4" />
            Establish Council
          </Link>
        </Button>
      </div>

      {councils.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border bg-card/50">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-sans font-medium">No Councils Established</h3>
          <p className="text-sm text-muted-foreground font-mono mt-2 mb-6">
            Initialize a new council to begin deliberations.
          </p>
          <div className="flex justify-center gap-4">
              <Button onClick={handleCreateDefault} variant="outline" className="rounded-none font-mono text-xs">
                Initialize Default Protocol
              </Button>
              <Button asChild className="rounded-none font-mono text-xs">
                <Link href="/councils/new">
                    Create Custom Council
                </Link>
              </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {councils.map((council) => (
            <Card key={council.id} className="group border-border hover:border-primary/50 transition-colors rounded-none">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="font-sans text-lg leading-none">{council.name}</CardTitle>
                    <CardDescription className="font-mono text-xs truncate max-w-[200px]">
                        ID: {council.id.slice(0, 8)}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" asChild>
                    <Link href={`/councils/${council.id}`}>
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="sr-only">Edit Council</span>
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-none text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(council.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove Council</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Gavel className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-mono text-[11px] uppercase text-muted-foreground tracking-wide">
                        Presiding Judge
                      </div>
                      <div className="font-sans text-base">
                        {getModelShortName(council.judge_model)}
                      </div>
                      {council.judgePrompt && (
                        <Badge variant="outline" className="mt-1 text-[10px] font-mono uppercase">
                          Prompt: {council.judgePrompt.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-mono text-[11px] uppercase text-muted-foreground tracking-wide">
                        Members
                      </div>
                      <div className="font-sans text-sm text-muted-foreground">
                        {formatMembers(council.models)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="text-xs font-mono text-muted-foreground">
                        STATUS: ACTIVE
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                        {new Date(council.created_at).toLocaleDateString()}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
