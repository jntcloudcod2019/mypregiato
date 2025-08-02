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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background: 'var(--gradient-background)'}}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      <div className="relative w-full max-w-md z-10">
        <Card className="backdrop-blur-xl border border-primary/20 shadow-2xl bg-card/80" style={{background: 'var(--gradient-card)'}}>
          <CardHeader className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30 light-wire overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
                <img 
                  src={pregiatoLogo} 
                  alt="Pregiato Logo" 
                  className="w-16 h-16 object-contain relative z-10 glow-primary"
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
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-glow transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">{isLogin ? "Entrar" : "Criar Conta"}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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