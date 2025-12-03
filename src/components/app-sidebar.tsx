"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Command,
  Plus,
  Settings2,
  MessageSquare,
  Users,
  FileText,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentChatId = searchParams.get('id')

  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch chats on mount and when chat ID changes
  useEffect(() => {
    fetchChats()
  }, [currentChatId])

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats')
      if (res.ok) {
        const data = await res.json()
        setChats(data)
      }
    } catch (error) {
      console.error('Failed to load chats', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    router.push('/chat')
  }

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat?id=${chatId}`)
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border bg-sidebar">
      <SidebarHeader className="h-16 border-b border-border flex items-center px-4 justify-center">
        <div className="flex items-center gap-2 w-full overflow-hidden transition-all">
          <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-primary text-primary-foreground">
            <Command className="size-4" />
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-sans font-bold tracking-tight text-xl">COUNCIL</span>
            <span className="truncate text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">v0.1.0-alpha</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 flex flex-col">
        {/* Top Actions */}
        <SidebarMenu className="gap-1 p-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="New Chat"
              className="rounded-none h-10 bg-[hsl(var(--action))] text-[hsl(var(--action-foreground))] hover:bg-[hsl(var(--action)/0.85)] transition-colors shadow-sm"
            >
              <button onClick={handleNewChat} className="w-full">
                <Plus className="size-4" />
                <span className="font-mono text-sm font-bold">New Chat</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/settings'}
              tooltip="Settings"
              className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
            >
              <Link href="/settings">
                <Settings2 className="size-4 text-muted-foreground" />
                <span className="font-sans text-sm">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/analytics'}
              tooltip="Analytics"
              className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
            >
              <Link href="/analytics">
                <span className="size-4 text-muted-foreground text-xs font-bold flex items-center justify-center font-mono">$</span>
                <span className="font-sans text-sm">Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup className="bg-[hsl(var(--section-secondary))] px-2 py-2 border-t border-foreground/20">
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--action))]">Council Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/councils' || pathname.startsWith('/councils/')}
                  tooltip="Councils"
                  className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-[hsl(var(--action)/0.15)] data-[active=true]:text-[hsl(var(--action))] data-[active=true]:border-l-2 data-[active=true]:border-[hsl(var(--action))] transition-colors"
                >
                  <Link href="/councils">
                    <Users className="size-4 text-[hsl(var(--action)/0.7)]" />
                    <span className="font-sans text-sm font-medium">Councils</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/prompts' || pathname.startsWith('/prompts/')}
                  tooltip="Prompts"
                  className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-[hsl(var(--action)/0.15)] data-[active=true]:text-[hsl(var(--action))] data-[active=true]:border-l-2 data-[active=true]:border-[hsl(var(--action))] transition-colors"
                >
                  <Link href="/prompts">
                    <FileText className="size-4 text-[hsl(var(--action)/0.7)]" />
                    <span className="font-sans text-sm font-medium">Prompts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0 my-0 hidden" />

        {/* Session History */}
        <div className="flex-1 flex flex-col min-h-0 group-data-[collapsible=icon]:hidden bg-[hsl(var(--section-tertiary))] px-2 border-t border-foreground/20">
          <div className="px-2 py-2">
            <span className="text-[10px] font-mono text-[hsl(var(--action)/0.8)] uppercase tracking-widest">Session History</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 px-2 pb-2">
              {isLoading ? (
                <div className="text-xs text-center text-muted-foreground p-4 font-sans">Loading...</div>
              ) : chats.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-4 font-sans">No past sessions.</div>
              ) : (
                chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant={currentChatId === chat.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left font-sans text-sm truncate h-auto py-2 px-2 rounded-none",
                      currentChatId === chat.id && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    )}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
