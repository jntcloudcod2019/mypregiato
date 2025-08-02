import { useState } from "react"
import { FileText, Home, Users, Settings, ChevronDown, Star, DollarSign, BarChart3, Headphones, BookOpen, Clock } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "CRM", url: "/crm", icon: BarChart3 },
  { title: "Atendimento", url: "/atendimento", icon: Headphones },
  { title: "Treinamentos", url: "/treinamentos", icon: BookOpen },
  { title: "Ponto Eletrônico", url: "/ponto", icon: Clock },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Talentos", url: "/talentos", icon: Star },
  { title: "Finanças", url: "/financas", icon: DollarSign },
  { title: "Usuários", url: "/usuarios", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path)
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary border-r-2 border-primary" : "hover:bg-accent hover:text-accent-foreground"

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} border-r border-border transition-all duration-300 light-wire light-wire-border-right`}
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center">
              <h1 className="font-merriweather text-xl font-bold shiny-text tracking-wider">
                MY PREGIATO 
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
          )}
          {!collapsed && <ThemeToggle />}
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-foreground hover:text-foreground ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}