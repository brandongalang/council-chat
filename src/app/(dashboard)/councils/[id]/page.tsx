'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CouncilMember, ModelSelector } from '@/components/model-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CouncilModelRecord {
  id: string;
  model_id: string;
  system_prompt_override?: string | null;
}

interface CouncilDetail {
  name: string;
  judge_model?: string | null;
  judge_prompt_id?: string | null;
  models: CouncilModelRecord[];
}

export default function EditCouncilPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    judgeModel: '',
    judgePromptId: '',
    members: [] as CouncilMember[],
  });
  const [judgePrompts, setJudgePrompts] = useState<Array<{ id: string; name: string }>>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);

  const fetchCouncil = useCallback(async () => {
    try {
      const res = await fetch(`/api/councils/${params.id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json() as CouncilDetail;
      const members: CouncilMember[] = data.models.map((m, index) => ({
        instanceId: `${m.model_id}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        modelId: m.model_id,
        persona: m.system_prompt_override || undefined,
      }));

      setFormData({
        name: data.name,
        judgeModel: data.judge_model || '',
        judgePromptId: data.judge_prompt_id || '',
        members,
      });
    } catch (error) {
      console.error('Failed to load council details', error);
      toast.error('Failed to load council details');
      router.push('/councils');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchCouncil();
  }, [fetchCouncil]);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch('/api/prompts?type=judge');
        if (res.ok) {
          const data = await res.json();
          setJudgePrompts(data);
        }
      } catch (error) {
        console.error('Failed to load judge prompts', error);
      } finally {
        setPromptsLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name required");
    if (formData.members.length === 0) return toast.error("Select members");

    setSaving(true);
    try {
        const payload = {
            name: formData.name,
            judgeModel: formData.judgeModel,
            judgePromptId: formData.judgePromptId || null,
            members: formData.members.map(member => ({
                modelId: member.modelId,
                persona: member.persona
            }))
        };

        const res = await fetch(`/api/councils/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to update');

        toast.success('Council updated');
        router.refresh();
    } catch (error) {
        console.error('Failed to update council', error);
        toast.error('Failed to update council');
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <Button variant="link" asChild className="pl-0 text-muted-foreground font-mono text-xs">
            <Link href="/councils"><ArrowLeft className="mr-2 h-3 w-3" /> BACK TO REGISTRY</Link>
        </Button>
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-sans font-medium tracking-tight text-primary">Edit Protocol: {formData.name}</h1>
            <div className="font-mono text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-none">ID: {params.id.slice(0,8)}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Council Manifesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="font-mono text-xs uppercase">Designation</Label>
                    <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="font-sans rounded-none"
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Presiding Judge</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="judge" className="font-mono text-xs uppercase">Judge Model</Label>
                        <ModelSelector
                            value={formData.judgeModel}
                            onValueChange={(val) => setFormData({...formData, judgeModel: val as string})}
                            mode="single"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase">Judge Prompt</Label>
                        <Select
                            value={formData.judgePromptId}
                            onValueChange={(value) => setFormData({ ...formData, judgePromptId: value })}
                            disabled={promptsLoading || judgePrompts.length === 0}
                        >
                            <SelectTrigger className="rounded-none font-mono text-xs h-10">
                                <SelectValue placeholder={promptsLoading ? "Loading prompts..." : "No prompt (default)"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">No prompt (use default)</SelectItem>
                                {judgePrompts.map((prompt) => (
                                    <SelectItem key={prompt.id} value={prompt.id}>
                                        {prompt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {judgePrompts.length === 0 && !promptsLoading && (
                            <p className="text-[11px] text-muted-foreground font-mono">
                                Create judge prompts under /prompts to customize synthesis behavior.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Council Members</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase">Selected Agents</Label>
                    <ModelSelector
                        value={formData.members}
                        onValueChange={(val) => setFormData({...formData, members: val as CouncilMember[]})}
                        mode="multiple"
                    />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} className="rounded-none w-full md:w-auto font-mono">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                UPDATE CONFIGURATION
            </Button>
        </div>
      </form>
    </div>
  );
}
