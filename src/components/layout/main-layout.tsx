import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { UserButton, SignedIn, SignedOut, useClerk } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { LogOut, RotateCcw } from "lucide-react"
import CustomLogin from "@/components/auth/custom-login"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { signOut } = useClerk()

  const handleLogout = () => {
    signOut()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SignedIn>
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur light-wire light-wire-border-top">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <h1 className="font-semibold text-foreground">Sistema Pregiato</h1>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9"
                    }
                  }}
                />
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </SignedIn>

        <SignedOut>
          <CustomLogin />
        </SignedOut>
      </div>
    </SidebarProvider>
  )
}