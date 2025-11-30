'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading, stop }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-4xl mx-auto">
        <Textarea
          tabIndex={0}
          onKeyDown={handleKeyDown}
          rows={1}
          value={input}
          onChange={handleInputChange}
          placeholder="Enter transmission..."
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-background px-4 py-[1.3rem] focus-within:outline-none sm:text-sm font-mono rounded-none border-border focus:border-primary transition-colors"
        />
        <div className="absolute right-4 bottom-4">
          {isLoading ? (
            <Button
              type="button"
              onClick={stop}
              size="icon"
              className="h-8 w-8 rounded-none bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Square className="h-4 w-4 fill-current" />
              <span className="sr-only">Stop generation</span>
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={input === ''}
              className="h-8 w-8 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>
      </form>
      <div className="text-center mt-2">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Encrypted Channel / Council Protocol Active
        </p>
      </div>
    </div>
  );
}
