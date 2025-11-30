'use client';

import { UIMessage as Message } from '@ai-sdk/react';
import { ChatMessage } from './chat-message';
import { useEffect, useRef } from 'react';

interface ChatListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatList({ messages, isLoading }: ChatListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm p-12">
        <div className="text-center space-y-2 opacity-50">
            <p>NO TRANSMISSIONS RECORDED.</p>
            <p className="text-xs">Initiate protocol to begin session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="flex flex-col min-h-full pb-4">
        {messages.map((message, i) => (
            <ChatMessage key={i} message={message} />
        ))}
        {isLoading && (
            <div className="p-6 flex gap-2 items-center text-xs font-mono text-muted-foreground animate-pulse">
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75" />
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150" />
                <span>PROCESSING STREAM...</span>
            </div>
        )}
        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </div>
  );
}
