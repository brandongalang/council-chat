'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Council {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function CouncilsPage() {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouncils();
  }, []);

  const fetchCouncils = async () => {
    try {
      const res = await fetch('/api/councils');
      if (res.ok) {
        const data = await res.json();
        setCouncils(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dissolve this council? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/councils/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCouncils(councils.filter(c => c.id !== id));
        toast.success('Council dissolved.');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
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
        <div className="text-center py-12 border border-dashed border-border bg-card">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-sans font-medium">No Saved Councils</h3>
          <p className="text-sm text-muted-foreground font-mono mt-2 mb-6 max-w-md mx-auto">
            You can save custom council configurations here for quick access.
            <br />
            Start a chat to experiment with different models and judge templates.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild className="rounded-none font-mono text-xs">
              <Link href="/chat">
                Start New Chat
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {councils.map((council) => (
            <Card key={council.id} className="group border-border hover:border-primary transition-colors rounded-none">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="font-sans text-lg leading-none">{council.name}</CardTitle>
                  <CardDescription className="font-mono text-xs truncate max-w-[200px]">
                    ID: {council.id.slice(0, 8)}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-none">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none">
                    <DropdownMenuItem asChild className="rounded-none font-mono text-xs cursor-pointer">
                      <Link href={`/councils/${council.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(council.id)} className="rounded-none font-mono text-xs text-destructive focus:text-destructive cursor-pointer">
                      Dissolve Council
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3 font-serif italic">
                  {council.description || "No manifesto provided."}
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
