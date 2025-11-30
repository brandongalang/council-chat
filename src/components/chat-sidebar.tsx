import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chat {
    id: string;
    title: string;
    updated_at: string;
}

interface ChatSidebarProps {
    currentChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
}

export function ChatSidebar({ currentChatId, onSelectChat, onNewChat, className }: ChatSidebarProps & { className?: string }) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchChats();
    }, [currentChatId]); // Refetch when chat changes (to update titles/order)

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chats');
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (error) {
            console.error('Failed to load chats', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("w-64 border-r bg-muted/10 flex flex-col h-full", className)}>
            <div className="p-4 border-b">
                <Button onClick={onNewChat} className="w-full justify-start gap-2" variant="outline">
                    <Plus className="h-4 w-4" />
                    New Council
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-xs text-center text-muted-foreground p-4">Loading...</div>
                    ) : chats.length === 0 ? (
                        <div className="text-xs text-center text-muted-foreground p-4">No past councils.</div>
                    ) : (
                        chats.map((chat) => (
                            <Button
                                key={chat.id}
                                variant={currentChatId === chat.id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start text-left font-normal truncate h-auto py-3",
                                    currentChatId === chat.id && "bg-secondary"
                                )}
                                onClick={() => onSelectChat(chat.id)}
                            >
                                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                                <span className="truncate w-full">{chat.title}</span>
                            </Button>
                        ))
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                    <a href="/dashboard">
                        <BarChart2 className="h-4 w-4" />
                        Usage Dashboard
                    </a>
                </Button>
            </div>
        </div>
    );
}
