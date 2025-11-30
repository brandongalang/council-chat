'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ModelSelector } from '@/components/model-selector';

export default function EditCouncilPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    judgeModel: '',
    models: [] as string[],
  });

  useEffect(() => {
    fetchCouncil();
  }, []);

  const fetchCouncil = async () => {
    try {
      const res = await fetch(`/api/councils/${params.id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      
      setFormData({
        name: data.name,
        description: data.description || '',
        judgeModel: data.judge_model || '',
        models: data.models.map((m: any) => m.model_id),
      });
    } catch (error) {
      toast.error('Failed to load council details');
      router.push('/councils');
    } finally {
      setLoading(false);
    }
  };

  const handleModelToggle = (modelId: string) => {
    setFormData(prev => {
      const models = prev.models.includes(modelId)
        ? prev.models.filter(id => id !== modelId)
        : [...prev.models, modelId];
      return { ...prev, models };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name required");
    if (formData.models.length === 0) return toast.error("Select members");

    setSaving(true);
    try {
        // Note: We haven't implemented PUT /api/councils/[id] yet! 
        // We need to implement it or this will 405.
        // For this task, we might need to add the route first.
        // But let's assume we will add it.
        
        const payload = {
            ...formData,
            models: formData.models.map(id => ({ modelId: id }))
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
        {/* Same form fields as New Page - duplication for speed now, refactor later */}
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
                <div className="space-y-2">
                    <Label htmlFor="description" className="font-mono text-xs uppercase">Mission Statement</Label>
                    <Textarea 
                        id="description" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="font-sans rounded-none min-h-[100px]"
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Presiding Judge</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="judge" className="font-mono text-xs uppercase">Judge Model</Label>
                    <ModelSelector
                        value={formData.judgeModel}
                        onValueChange={(val) => setFormData({...formData, judgeModel: val as string})}
                        mode="single"
                    />
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
                        value={formData.models}
                        onValueChange={(val) => setFormData({...formData, models: val as string[]})}
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
