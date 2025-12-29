"use client"

import { Calendar, CheckSquare, StickyNote, Tag, Home, BarChart3, Wallet } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const coreItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Calendario",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Notas",
    url: "/notes",
    icon: StickyNote,
  },
  {
    title: "Tareas",
    url: "/todos",
    icon: CheckSquare,
  },
  {
    title: "Tags",
    url: "/tags",
    icon: Tag,
  },
  {
    title: "Estadísticas",
    url: "/stats",
    icon: BarChart3,
  },
]

const moduleItems = [
  {
    title: "Finanzas",
    url: "/finance",
    icon: Wallet,
    enabledKey: "financeEnabled" as const,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setEnabledModules({
          financeEnabled: data.financeEnabled ?? false,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const items = [
    ...coreItems,
    ...moduleItems.filter((module) => enabledModules[module.enabledKey]),
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="relative flex-shrink-0">
            <Image
              src="/panel-logo-dark.svg"
              alt="Derkyu Management Logo"
              width={40}
              height={40}
              className="rounded-lg dark:invert"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold leading-tight">Derkyu</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={0}>
                {items.map((item) => (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          tooltip={item.title}
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}