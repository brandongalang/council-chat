'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ModelSelector } from '@/components/model-selector';

export default function NewCouncilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    judgeModel: 'openai/gpt-4o',
    models: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        toast.error("Council name is required");
        return;
    }
    if (formData.models.length === 0) {
        toast.error("Select at least one council member");
        return;
    }

    setLoading(true);
    try {
        const payload = {
            ...formData,
            models: formData.models.map(id => ({ modelId: id }))
        };

        const res = await fetch('/api/councils', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create council');

        toast.success('Council established successfully');
        router.push('/councils');
        router.refresh();
    } catch (error) {
        console.error(error);
        toast.error('Failed to establish council');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <Button variant="link" asChild className="pl-0 text-muted-foreground font-mono text-xs">
            <Link href="/councils"><ArrowLeft className="mr-2 h-3 w-3" /> BACK TO REGISTRY</Link>
        </Button>
        <h1 className="text-3xl font-sans font-medium tracking-tight text-primary">Establish New Council</h1>
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          / Protocol Initialization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Council Manifesto</CardTitle>
                <CardDescription className="font-mono text-xs">Define the purpose and identity of this council.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="font-mono text-xs uppercase">Designation (Name)</Label>
                    <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Strategic Analysis Unit Alpha"
                        className="font-sans rounded-none"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description" className="font-mono text-xs uppercase">Mission Statement (Description)</Label>
                    <Textarea 
                        id="description" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Describe the specific goals of this council..."
                        className="font-sans rounded-none min-h-[100px]"
                    />
                </div>
            </CardContent>
        </Card>

        {/* Judge Selection */}
        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Presiding Judge</CardTitle>
                <CardDescription className="font-mono text-xs">Select the model responsible for synthesis and final verdicts.</CardDescription>
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

        {/* Council Members */}
        <Card className="border-border rounded-none">
            <CardHeader>
                <CardTitle className="font-sans">Council Members</CardTitle>
                <CardDescription className="font-mono text-xs">Select the agents participating in the council.</CardDescription>
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
            <Button type="submit" disabled={loading} className="rounded-none w-full md:w-auto font-mono">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                INITIALIZE PROTOCOL
            </Button>
        </div>
      </form>
    </div>
  );
}
