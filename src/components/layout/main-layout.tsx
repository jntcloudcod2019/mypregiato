import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { UserButton, SignedIn, SignedOut, SignInButton, useClerk } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { LogOut, RotateCcw } from "lucide-react"

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
            <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur">
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted">
            <div className="text-center space-y-6 p-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Sistema Pregiato
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gerencie seus contratos de forma profissional
                </p>
              </div>
              
              <SignInButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                  Entrar no Sistema
                </Button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
      </div>
    </SidebarProvider>
  )
}