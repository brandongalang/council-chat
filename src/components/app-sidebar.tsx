"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  History,
  Users,
  FileText
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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

const data = {
  user: {
    name: "Council Admin",
    email: "admin@council.ai",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Sessions",
      url: "/chat",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Councils",
      url: "/councils",
      icon: Users,
    },
    {
      title: "Analytics",
      url: "/dashboard",
      icon: PieChart,
    },

    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

      <SidebarContent className="p-2 gap-4">
        {/* Main Navigation */}
        <SidebarMenu>
          <div className="px-2 py-2">
            <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">Protocols</span>
          </div>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title} className="rounded-none h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors">
                <a href={item.url}>
                  <item.icon className="size-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>


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
                    <AvatarImage src={data.user.avatar} alt={data.user.name} />
                    <AvatarFallback className="rounded-none bg-secondary text-secondary-foreground font-mono">CA</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold font-sans">{data.user.name}</span>
                    <span className="truncate text-xs text-muted-foreground font-mono">{data.user.email}</span>
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
