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
  SidebarFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

const userData = {
  name: "Council Admin",
  avatar: "/avatars/shadcn.jpg",
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
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-sans font-bold tracking-tight text-lg">COUNCIL</span>
            <span className="truncate text-xs text-muted-foreground font-mono">v0.1.0-ALPHA</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 gap-0 flex flex-col">
        {/* Top Actions */}
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="New Chat"
              className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <button onClick={handleNewChat} className="w-full">
                <Plus className="size-4 text-muted-foreground" />
                <span className="font-mono text-sm">New Chat</span>
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
                <span className="font-mono text-sm">Settings</span>
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
                <span className="size-4 text-muted-foreground text-xs font-bold flex items-center justify-center">$</span>
                <span className="font-mono text-sm">Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Council Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/councils' || pathname.startsWith('/councils/')}
                  tooltip="Councils"
                  className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
                >
                  <Link href="/councils">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="font-mono text-sm">Councils</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/prompts' || pathname.startsWith('/prompts/')}
                  tooltip="Prompts"
                  className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
                >
                  <Link href="/prompts">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-mono text-sm">Prompts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2 my-2" />

        {/* Session History */}
        <div className="flex-1 flex flex-col min-h-0 group-data-[collapsible=icon]:hidden">
          <div className="px-2 py-2">
            <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">Session History</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 px-2 pb-2">
              {isLoading ? (
                <div className="text-xs text-center text-muted-foreground p-4">Loading...</div>
              ) : chats.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-4">No past sessions.</div>
              ) : (
                chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant={currentChatId === chat.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left font-mono text-sm truncate h-auto py-2 px-2 rounded-none",
                      currentChatId === chat.id && "bg-sidebar-accent text-sidebar-accent-foreground"
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

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-none hover:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-none border border-border">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="rounded-none bg-secondary text-secondary-foreground font-mono">CA</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold font-sans">{userData.name}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none border-border bg-sidebar"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="rounded-none focus:bg-sidebar-accent">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
