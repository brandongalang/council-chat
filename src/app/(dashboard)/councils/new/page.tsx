'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ModelSelector, CouncilMember } from '@/components/model-selector';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Force dynamic rendering to avoid Next.js 16 static generation bug
export const dynamic = 'force-dynamic';

interface PromptOption {
    id: string;
    name: string;
    content: string;
}

export default function NewCouncilPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        judgeModel: 'openai/gpt-4o',
        judgePromptId: '',
        models: [] as CouncilMember[],
    });
    const [judgePrompts, setJudgePrompts] = useState<PromptOption[]>([]);
    const [promptsLoading, setPromptsLoading] = useState(true);

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
                name: formData.name,
                judgeModel: formData.judgeModel,
                judgePromptId: formData.judgePromptId || null,
                members: formData.models.map(m => ({
                    modelId: m.modelId,
                    persona: m.persona
                })),
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
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Strategic Analysis Unit Alpha"
                                className="font-sans rounded-none"
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
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="judge" className="font-mono text-xs uppercase">Judge Model</Label>
                                <ModelSelector
                                    value={formData.judgeModel}
                                    onValueChange={(val) => setFormData({ ...formData, judgeModel: val as string })}
                                    mode="single"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-mono text-xs uppercase">Judge Prompt</Label>
                                <Select
                                    value={formData.judgePromptId || '__none__'}
                                    onValueChange={(value) => setFormData({ ...formData, judgePromptId: value === '__none__' ? '' : value })}
                                    disabled={promptsLoading || judgePrompts.length === 0}
                                >
                                    <SelectTrigger className="rounded-none font-mono text-xs h-10">
                                        <SelectValue placeholder={promptsLoading ? "Loading prompts..." : "No prompt (default)"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No prompt (use default)</SelectItem>
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
                                onValueChange={(val) => setFormData({ ...formData, models: val as CouncilMember[] })}
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
