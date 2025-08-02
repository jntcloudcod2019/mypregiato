import { SignInButton, SignUpButton, useSignIn, useSignUp } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User, Building2 } from "lucide-react"
import pregiatoLogo from "@/assets/pregiato-logo.png"

export default function CustomLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const { signIn, setActive } = useSignIn()
  const { signUp, setActive: setActiveSignUp } = useSignUp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (isLogin) {
        const result = await signIn?.create({
          identifier: email,
          password,
        })
        
        if (result?.status === "complete") {
          await setActive({ session: result.createdSessionId })
        }
      } else {
        const result = await signUp?.create({
          emailAddress: email,
          password,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || '',
        })
        
        if (result?.status === "complete") {
          await setActiveSignUp({ session: result.createdSessionId })
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJoc2wodjIxMCAxMSUgMjAlIC8gMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50"></div>
      
      <div className="relative w-full max-w-md">
        <Card className="backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <img 
                  src={pregiatoLogo} 
                  alt="Pregiato Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                My Pregiato
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isLogin ? "Entre na sua conta" : "Crie sua conta"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Custom Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">
                {isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">OU</span>
              </div>
            </div>

            {/* Clerk Social Buttons */}
            <div className="space-y-3">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full">
                  <Building2 className="w-4 h-4 mr-2" />
                  Entrar com Clerk
                </Button>
              </SignInButton>
            </div>

            {/* Toggle Login/Register */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  {isLogin ? "Criar conta" : "Fazer login"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            © 2024 Pregiato. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}