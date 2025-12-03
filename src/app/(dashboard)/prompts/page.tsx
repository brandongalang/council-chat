'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Edit, Loader2, X, Gavel, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Prompt {
  id: string;
  name: string;
  content: string;
  type: 'judge' | 'member';
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'judge' | 'member'>('member');
  const [description, setDescription] = useState('');

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts');
      if (res.ok) {
        const data = await res.json() as Prompt[];
        setPrompts(data);
      }
    } catch (error) {
      console.error('Failed to fetch prompts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const resetForm = () => {
    setName('');
    setContent('');
    setType('member');
    setDescription('');
    setEditingPrompt(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setName(prompt.name);
    setContent(prompt.content);
    setType(prompt.type);
    setDescription(prompt.description || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error('Name and content are required');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, content, type, description: description || null };

      if (editingPrompt) {
        // Update existing
        const res = await fetch(`/api/prompts/${editingPrompt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to update prompt');
        toast.success('Prompt updated');
      } else {
        // Create new
        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create prompt');
        toast.success('Prompt created');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPrompts();
    } catch (error) {
      console.error('Failed to save prompt', error);
      toast.error(editingPrompt ? 'Failed to update prompt' : 'Failed to create prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt? Councils using it will have their prompt reference removed.')) return;

    try {
      const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPrompts(prev => prev.filter(p => p.id !== id));
        toast.success('Prompt deleted');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete prompt', error);
      toast.error('Failed to delete prompt');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  const judgePrompts = prompts.filter(p => p.type === 'judge');
  const memberPrompts = prompts.filter(p => p.type === 'member');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-sans font-medium tracking-tight text-primary">Prompt Library</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
            / Reusable Instructions
          </p>
        </div>
        <Button onClick={openCreateDialog} className="rounded-none font-mono">
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border bg-card/50">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-sans font-medium">No Prompts Created</h3>
          <p className="text-sm text-muted-foreground font-mono mt-2 mb-6">
            Create prompts to reuse across councils.
          </p>
          <Button onClick={openCreateDialog} className="rounded-none font-mono text-xs">
            Create Your First Prompt
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Judge Prompts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-sans font-medium">Judge Prompts</h2>
              <Badge variant="secondary" className="font-mono text-xs">{judgePrompts.length}</Badge>
            </div>
            {judgePrompts.length === 0 ? (
              <p className="text-sm text-muted-foreground font-mono pl-7">No judge prompts yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {judgePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={() => openEditDialog(prompt)}
                    onDelete={() => handleDelete(prompt.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Member Prompts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-sans font-medium">Member Prompts</h2>
              <Badge variant="secondary" className="font-mono text-xs">{memberPrompts.length}</Badge>
            </div>
            {memberPrompts.length === 0 ? (
              <p className="text-sm text-muted-foreground font-mono pl-7">No member prompts yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {memberPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={() => openEditDialog(prompt)}
                    onDelete={() => handleDelete(prompt.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans">
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {editingPrompt
                ? 'Modify this prompt. Changes will apply to all councils using it.'
                : 'Create a reusable prompt for judges or council members.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Analytical Thinker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-none font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'judge' | 'member')}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="member">Member (Council Member)</SelectItem>
                    <SelectItem value="judge">Judge (Synthesizer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of what this prompt does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the system prompt instructions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="rounded-none font-mono min-h-[200px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-none">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingPrompt ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromptCard({
  prompt,
  onEdit,
  onDelete,
}: {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group border-border hover:border-primary/50 transition-colors rounded-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1 min-w-0">
          <CardTitle className="font-sans text-base leading-none truncate">{prompt.name}</CardTitle>
          <CardDescription className="font-mono text-xs truncate">
            {prompt.description || 'No description'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Edit</span>
          </Button>
          {!prompt.is_system && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground font-mono line-clamp-3 bg-muted/30 p-2 border border-border/50">
          {prompt.content.slice(0, 150)}{prompt.content.length > 150 ? '...' : ''}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
          {prompt.is_system && (
            <Badge variant="outline" className="text-[10px]">System</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
