# 📚 Módulo 9: Tailwind CSS e Estilização para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Dominar Tailwind CSS utility-first
- Entender responsive design e breakpoints
- Criar animações e transições
- Configurar temas personalizados
- Usar CSS custom properties
- Ver exemplos do projeto real

## 📖 Tailwind CSS - Utility-First CSS

Tailwind CSS é um **framework CSS utility-first** que permite criar designs sem sair do HTML/JSX. Diferente do Bootstrap que usa classes pré-definidas, Tailwind usa **classes utilitárias** que você combina.

### Tailwind vs Bootstrap vs CSS Puro

| Abordagem | Tailwind | Bootstrap | CSS Puro |
|-----------|----------|-----------|----------|
| **Classes** | Utility-first | Componentes | Manual |
| **Bundle** | Pequeno | Grande | Manual |
| **Customização** | Fácil | Limitada | Total |
| **Performance** | ✅ Otimizada | ⚠️ Pesado | ✅ Controlada |
| **Curva de aprendizado** | Média | Baixa | Alta |

## 🚀 Instalação e Configuração

### Passo 1: Instalar

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Passo 2: Configurar

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 📋 Classes Básicas do Tailwind

### Layout e Spacing

```jsx
// Container
<div className="container mx-auto px-4"> {/* Container centralizado */}

<div className="flex justify-center items-center"> {/* Flexbox */}
<div className="grid grid-cols-3 gap-4"> {/* Grid */}
<div className="space-y-4"> {/* Espaçamento vertical */}

// Padding e margin
<div className="p-4"> {/* Padding: 1rem */}
<div className="px-6 py-3"> {/* Padding horizontal/vertical */}
<div className="m-2"> {/* Margin: 0.5rem */}
<div className="mx-auto"> {/* Margin horizontal auto */}
```

### Cores e Background

```jsx
// Background
<div className="bg-blue-500"> {/* Background azul */}
<div className="bg-white dark:bg-gray-800"> {/* Background condicional */}

// Text colors
<h1 className="text-gray-900 dark:text-white"> {/* Texto condicional */}
<p className="text-red-500"> {/* Texto vermelho */}

// Borders
<div className="border border-gray-300 rounded-lg"> {/* Borda arredondada */}
```

### Typography

```jsx
// Font size
<h1 className="text-4xl font-bold"> {/* Título grande */}
<p className="text-sm text-gray-600"> {/* Texto pequeno */}

// Font weight
<span className="font-light"> {/* Leve */}
<span className="font-medium"> {/* Médio */}
<span className="font-semibold"> {/* Semi-bold */}
<span className="font-bold"> {/* Bold */}

// Line height
<p className="leading-tight"> {/* Linha apertada */}
<p className="leading-relaxed"> {/* Linha relaxada */}
```

## 📱 Responsividade - Mobile First

### Breakpoints do Tailwind

```css
/* Breakpoints padrão */
sm: '640px',   /* Mobile landscape */
md: '768px',   /* Tablet */
lg: '1024px',  /* Desktop */
xl: '1280px',  /* Large desktop */
2xl: '1536px'  /* Extra large */
```

### Padrão Mobile-First

```jsx
// ❌ Não mobile-first
<div className="w-96 lg:w-80 xl:w-72">

// ✅ Mobile-first
<div className="w-full sm:w-80 md:w-96 lg:w-[400px]">

// Container responsivo
<div className="container mx-auto px-4 sm:px-6 lg:px-8">

// Grid responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

// Esconder/mostrar
<div className="hidden md:block"> {/* Esconder em mobile, mostrar em desktop */}
<div className="block md:hidden"> {/* Mostrar em mobile, esconder em desktop */}
```

### Exemplo Completo Responsivo

```jsx
function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem responsiva */}
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover sm:h-56 md:h-64"
      />

      {/* Conteúdo */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {product.description}
        </p>

        {/* Preço e botão */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            R$ {product.price.toFixed(2)}
          </span>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 Configuração Avançada do Tailwind

### Cores Personalizadas

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        brand: {
          light: '#f0f9ff',
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
        }
      }
    }
  }
}

// Usando cores personalizadas
<div className="bg-primary-500 text-primary-900">
<div className="bg-brand text-brand-light">
```

### Espaçamento Personalizado

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.875rem',
      }
    }
  }
}
```

### Animações Personalizadas

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'bounce-slow': 'bounce-slow 1s infinite',
      }
    }
  }
}

// Usando animações
<div className="animate-fade-in">
<div className="animate-slide-up">
<div className="animate-bounce-slow">
```

## 🎯 Configuração do Projeto Real

### tailwind.config.ts Completo

```typescript
// front/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'roboto': ['Roboto', 'sans-serif'],
				'inter': ['Inter', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-background': 'var(--gradient-background)'
			},
			boxShadow: {
				'glow': 'var(--shadow-glow)',
				'elegant': 'var(--shadow-elegant)',
				'card': 'var(--shadow-card)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px) rotate(0deg)'
					},
					'33%': {
						transform: 'translateY(-10px) rotate(120deg)'
					},
					'66%': {
						transform: 'translateY(-5px) rotate(240deg)'
					}
				},
				'light-wire-flow': {
					'0%': {
						transform: 'translateX(-100%)',
						opacity: '0'
					},
					'50%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(200%)',
						opacity: '0'
					}
				}
			},
			animation: {
				'float': 'float 6s ease-in-out infinite',
				'light-wire-flow': 'light-wire-flow 3s ease-in-out infinite',
				'light-wire-pulse': 'light-wire-pulse 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### CSS Custom Properties (Variables)

```css
/* front/src/index.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --primary-hover: 221.2 83.2% 48.3%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --primary-hover: 217.2 91.2% 64.8%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 🎨 Componentes com Tailwind

### Botão com Variações

```tsx
// front/src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        contained: "bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm hover:bg-primary/20 hover:border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Card Component

```tsx
// front/src/components/ui/card.tsx
import * as React from "react"

import { cn } from "../../lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## 🎭 Animações e Transições

### Transições Básicas

```jsx
// Transição de hover
<button className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
  Botão
</button>

// Transição de transform
<div className="hover:scale-105 transition-transform duration-300">
  Card
</div>

// Transição de opacidade
<div className="opacity-0 animate-fade-in">
  Conteúdo
</div>
```

### Animações Complexas

```jsx
// Loading spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>

// Bounce animation
<div className="animate-bounce">Bouncing</div>

// Pulse animation
<div className="animate-pulse bg-gray-300 rounded">Pulse</div>

// Custom animation
<div className="animate-[wiggle_1s_ease-in-out_infinite]">
  Wiggle
</div>
```

### Keyframes Personalizados

```css
/* CSS personalizado */
@keyframes wiggle {
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

.animate-wiggle {
  animation: wiggle 1s ease-in-out infinite;
}
```

## 🌙 Dark Mode

### Toggle Dark Mode

```tsx
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={`p-2 rounded-lg transition-colors ${
        isDark
          ? 'bg-gray-800 text-yellow-400'
          : 'bg-white text-gray-800'
      }`}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}

// Classes condicionais para dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

### Sistema de Tema Completo

```tsx
// Hook para tema
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}

// Componente
function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={theme}>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <MainContent />
    </div>
  );
}
```

## 🎨 Shadcn/ui Integration

### Instalação do Shadcn/ui

```bash
npx shadcn-ui@latest init
```

### Configuração do Components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Componentes Shadcn/ui

```tsx
// Exemplo de componente shadcn/ui
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function UserProfile() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome completo" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancelar</Button>
        <Button>Salvar</Button>
      </CardFooter>
    </Card>
  );
}
```

## 🧩 Layouts Responsivos

### Grid System

```jsx
// Grid básico
<div className="grid grid-cols-1 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 coluna mobile, 2 tablet, 3 desktop */}
</div>

// Grid com diferentes tamanhos
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-8"> {/* 8/12 colunas */}
    Conteúdo principal
  </div>
  <div className="col-span-12 md:col-span-4"> {/* 4/12 colunas */}
    Sidebar
  </div>
</div>
```

### Flexbox Utilities

```jsx
// Layout flexível
<div className="flex flex-col md:flex-row">
  <div className="flex-1">Conteúdo</div>
  <div className="w-full md:w-64">Sidebar</div>
</div>

// Alinhamento
<div className="flex items-center justify-center h-64">
  <div>Conteúdo centralizado</div>
</div>

// Espaçamento entre itens
<div className="flex justify-between space-x-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## 🎯 Exemplos do Projeto Real

### 1. Layout Principal

```tsx
// front/src/components/layout/main-layout.tsx
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <ErrorBoundary fallback={<ClerkErrorFallback />}>
        <div className="min-h-screen flex w-full">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-4">
                  <SignedIn>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/perfil')}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </SidebarProvider>
  );
}
```

### 2. Dashboard Responsivo

```tsx
// front/src/pages/dashboard/index.tsx
function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo das suas atividades.
          </p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +19% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">
              +201 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% em relação à semana passada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Você fez 265 vendas este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 3. Formulário Responsivo

```tsx
// front/src/pages/treinamentos/criar/index.tsx
const CriarTreinamentoPage = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/treinamentos')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Treinamentos
        </Button>

        <h1 className="text-3xl font-bold">Criar Novo Curso</h1>
        <p className="text-muted-foreground">
          Crie um curso completo com aulas em vídeo
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          {[
            { key: 'course', label: 'Informações do Curso' },
            { key: 'lessons', label: 'Adicionar Aulas' },
            { key: 'videos', label: 'Upload de Vídeos' },
            { key: 'preview', label: 'Preview' }
          ].map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => setActiveStep(step.key as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeStep === step.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {step.label}
              </button>
              {index < 3 && <div className="w-8 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Formulário */}
      {activeStep === 'course' && (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Digite o título do curso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Ex: Desenvolvimento, Design..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o conteúdo do curso..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({...formData, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isActive">Curso ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setActiveStep('lessons')}
                disabled={!formData.title.trim()}
              >
                Próximo: Adicionar Aulas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Componente Responsivo Completo

```tsx
// Criar um componente de produto responsivo
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
}

function ProductCard({ product, onAddToCart, onToggleFavorite, isFavorite }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagem com loading skeleton */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Badge de categoria */}
        <Badge
          className="absolute top-2 left-2"
          variant={product.inStock ? "default" : "destructive"}
        >
          {product.category}
        </Badge>

        {/* Botão de favorito */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product);
          }}
        >
          {isFavorite ? '❤️' : '🤍'}
        </Button>

        {/* Overlay de hover */}
        <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 ${
          isHovered ? 'backdrop-blur-sm' : ''
        }`} />
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= product.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ⭐
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.rating})
            </span>
          </div>

          {/* Preço e disponibilidade */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-green-600">
              R$ {product.price.toFixed(2)}
            </span>
            <span className={`text-sm px-2 py-1 rounded-full ${
              product.inStock
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {product.inStock ? 'Em estoque' : 'Fora de estoque'}
            </span>
          </div>

          {/* Botão de ação */}
          <Button
            className="w-full mt-4"
            disabled={!product.inStock}
            onClick={() => onAddToCart?.(product)}
          >
            {product.inStock ? 'Adicionar ao Carrinho' : 'Indisponível'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid responsivo de produtos
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(product) => console.log('Add to cart:', product)}
            onToggleFavorite={(product) => console.log('Toggle favorite:', product)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Exercício 2: Sistema de Tema Avançado

```tsx
// Criar um sistema de tema completo com Tailwind
import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Resolver tema baseado na preferência
    let newResolvedTheme: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newResolvedTheme = theme;
    }

    setResolvedTheme(newResolvedTheme);

    // Aplicar tema
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newResolvedTheme);

    // Salvar tema
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listener para mudança de preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// Componente de seletor de tema
function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Escuro', icon: '🌙' },
    { value: 'system', label: 'Sistema', icon: '🖥️' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {themes.map((themeOption) => (
        <button
          key={themeOption.value}
          onClick={() => setTheme(themeOption.value as Theme)}
          className={`p-2 rounded-lg transition-colors ${
            theme === themeOption.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          title={themeOption.label}
        >
          {themeOption.icon}
        </button>
      ))}
    </div>
  );
}

// Layout com tema
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Meu App</h1>
            <ThemeSelector />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="border-t bg-card mt-16">
          <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
            <p>© 2024 Meu App. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
```

### Exercício 3: Dashboard Responsivo

```tsx
// Criar um dashboard responsivo completo
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, icon, trend = 'neutral' }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${trendColors[trend]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const metrics = [
    {
      title: 'Total de Usuários',
      value: '1,234',
      change: '+20.1% em relação ao mês passado',
      icon: <Users className="h-4 w-4" />,
      trend: 'up' as const
    },
    {
      title: 'Receita',
      value: 'R$ 45,231.89',
      change: '+19% em relação ao mês passado',
      icon: <DollarSign className="h-4 w-4" />,
      trend: 'up' as const
    },
    {
      title: 'Vendas',
      value: '12,234',
      change: '+201 desde ontem',
      icon: <CreditCard className="h-4 w-4" />,
      trend: 'up' as const
    },
    {
      title: 'Taxa de Conversão',
      value: '3.2%',
      change: '+0.5% em relação à semana passada',
      icon: <Activity className="h-4 w-4" />,
      trend: 'up' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo das suas atividades.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>
              Gráfico de vendas dos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Gráfico de vendas seria renderizado aqui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Você fez 265 vendas este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'João Silva', email: 'joao@email.com', amount: 'R$ 299.00' },
                { name: 'Maria Santos', email: 'maria@email.com', amount: 'R$ 99.00' },
                { name: 'Pedro Costa', email: 'pedro@email.com', amount: 'R$ 39.00' },
              ].map((sale, index) => (
                <div key={index} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.name}</p>
                    <p className="text-sm text-muted-foreground">{sale.email}</p>
                  </div>
                  <div className="ml-auto font-medium">{sale.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela responsiva */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Uma lista das suas transações mais recentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2 hidden sm:table-cell">Email</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2 hidden md:table-cell">Data</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'João Silva', email: 'joao@email.com', amount: 'R$ 299.00', date: '2024-01-15', status: 'completed' },
                  { name: 'Maria Santos', email: 'maria@email.com', amount: 'R$ 99.00', date: '2024-01-14', status: 'pending' },
                ].map((transaction, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{transaction.name}</td>
                    <td className="p-2 hidden sm:table-cell text-muted-foreground">{transaction.email}</td>
                    <td className="p-2">{transaction.amount}</td>
                    <td className="p-2 hidden md:table-cell text-muted-foreground">{transaction.date}</td>
                    <td className="p-2">
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Mobile-First vs Desktop-First**

```jsx
// ❌ Desktop-first (ruim para mobile)
<div className="w-96 lg:w-80 xl:w-72">

// ✅ Mobile-first (recomendado)
<div className="w-full sm:w-80 md:w-96 lg:w-[400px]">
```

### 2. **Arbitrary Values**

```jsx
// Valores arbitrários
<div className="w-[350px] h-[200px]">
<div className="text-[14px] leading-[1.2]">
<div className="bg-[#f0f9ff]">
```

### 3. **Important Modifier**

```jsx
// Quando Tailwind não é suficiente
<div className="bg-blue-500 !bg-red-500"> {/* ! força a aplicação */}
```

### 4. **CSS-in-JS vs Tailwind**

```jsx
// ❌ CSS-in-JS (verboso)
const styles = {
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }
};

// ✅ Tailwind (conciso)
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
```

## 🏁 Conclusão

Tailwind CSS oferece uma **abordagem utility-first** que:

1. **Acelera o desenvolvimento** com classes prontas
2. **Mantém consistência** no design
3. **Facilita responsividade** com breakpoints
4. **Permite customização** profunda
5. **Integra perfeitamente** com React

## 📚 Próximos Passos

Agora que você domina Tailwind, está pronto para:

- **Módulo 10:** Sistema de UI profissional (Shadcn/Radix)
- **Módulo 11:** Autenticação completa com Clerk
- **Módulo 12:** Consumo de APIs REST e GraphQL

## 🎯 Resumo do que Aprendemos

✅ **Utility-first CSS**
✅ **Responsividade e breakpoints**
✅ **Animações e transições**
✅ **Configuração avançada**
✅ **Sistema de tema**
✅ **Shadcn/ui integration**
✅ **Layouts responsivos**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 9!**

**Continue para o [Módulo 10: Sistema de UI (Shadcn/Radix)](Modulo-10-Sistema-UI-Shadcn.md)**
