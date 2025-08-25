import { useState } from "react"
import { FileText, Home, Users, Settings, ChevronDown, Star, DollarSign, BarChart3, Headphones, BookOpen, Clock } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { ThemeToggle } from "../../components/theme-toggle"
import { AuroraText } from "../../components/magicui/aurora-text"

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
} from "../ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "CRM", url: "/crm", icon: BarChart3 },
  { title: "Atendimento", url: "/atendimento", icon: Headphones },
  { title: "Treinamentos", url: "/treinamentos", icon: BookOpen },
  { title: "Ponto Eletrônico", url: "/ponto", icon: Clock },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Talentos", url: "/talentos", icon: Users },
  { title: "Finanças", url: "/financas", icon: DollarSign },
  { title: "Usuários", url: "/usuarios", icon: Settings },
  { title: "Configurações", url: "/configuracoes", icon: Star },
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
      className={`${collapsed ? "w-14" : "w-64"} border-r border-border transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center">
              <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Poppins, ui-sans-serif, system-ui' }}>
                <span className="text-foreground">MY </span>
                <AuroraText colors={["#0ea5e9","#38bdf8","#22d3ee","#60a5fa","#93c5fd"]}>PREGIATO</AuroraText>
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!collapsed && <ThemeToggle />}
            <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
          </div>
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