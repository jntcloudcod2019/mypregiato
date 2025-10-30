# 📚 Módulo 4: Vite e Estrutura de Projeto para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender o que é Vite e como funciona
- Configurar um projeto React + TypeScript + Vite
- Conhecer a estrutura de pastas ideal
- Configurar Tailwind CSS
- Entender Hot Module Replacement (HMR)
- Ver exemplos práticos do projeto real

## 📖 O que é Vite?

Vite é um **build tool moderno** e **dev server ultra-rápido** criado por Evan You (criador do Vue.js). Diferente do Create React App, Vite é muito mais rápido e flexível.

### Vite vs Create React App

| Aspecto | Create React App | Vite | C# (dotnet) |
|---------|------------------|------|-------------|
| **Velocidade** | Lenta (webpack) | ⚡ Ultra-rápida | Rápida (dotnet build) |
| **HMR** | Médio | ⚡ Instantâneo | Rápida (dotnet watch) |
| **Configuração** | Zero config | Flexível | Configurável |
| **Bundle** | Sim | Sim (Rollup) | Sim (IL) |
| **Tree Shaking** | Parcial | ✅ Completo | ✅ Completo |

### Por que Vite?

```bash
# Create React App - tempo de inicialização
npm start  # 30-60 segundos

# Vite - tempo de inicialização
npm run dev  # 1-3 segundos ⚡
```

## 🚀 Criando um Projeto com Vite

### Passo 1: Instalar Vite

```bash
# Instalar Vite globalmente (opcional)
npm install -g create-vite

# Ou usar npx (recomendado)
npx create-vite@latest meu-projeto
```

### Passo 2: Configurar Template

```bash
# Selecionar template
? Select a framework: › React
? Select a variant: › TypeScript + SWC

# Instalar dependências
cd meu-projeto
npm install
```

### Passo 3: Executar

```bash
# Desenvolvimento
npm run dev     # Inicia em http://localhost:5173

# Build para produção
npm run build   # Gera arquivos em /dist

# Preview do build
npm run preview # Visualiza build em http://localhost:4173
```

## 📋 Estrutura de Pastas Recomendada

### Estrutura Básica

```
meu-projeto/
├── public/              # Arquivos estáticos
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
├── src/                 # Código fonte
│   ├── assets/         # Imagens, fontes, etc
│   ├── components/     # Componentes React
│   │   ├── ui/        # Componentes base/reutilizáveis
│   │   ├── forms/     # Componentes de formulário
│   │   └── layout/    # Layout e navegação
│   ├── pages/         # Páginas/routes
│   ├── hooks/         # Custom hooks
│   ├── services/      # API services
│   ├── types/         # TypeScript types
│   ├── utils/         # Funções utilitárias
│   ├── lib/           # Configurações e bibliotecas
│   ├── styles/        # CSS global e temas
│   ├── contexts/      # Context API
│   └── main.tsx       # Ponto de entrada
├── index.html         # Template HTML
├── package.json       # Dependências e scripts
├── vite.config.ts     # Configuração Vite
├── tailwind.config.ts # Configuração Tailwind
├── tsconfig.json      # Configuração TypeScript
└── components.json    # Configuração Shadcn/ui
```

## ⚙️ Configuração do Vite

### vite.config.ts Básico

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 3000,
    open: true, // Abre navegador automaticamente
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### Configuração Avançada (como no projeto)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
    ],
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5656',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
  },

  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    'import.meta.env.VITE_SIGNALR_URL': JSON.stringify(process.env.VITE_SIGNALR_URL),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
  },
});
```

## 🎨 Tailwind CSS

Tailwind CSS é um **framework CSS utility-first** que permite criar designs sem sair do HTML/JSX.

### Instalação do Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configuração Básica

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

### Configuração Avançada (do projeto)

```typescript
// tailwind.config.ts
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

## 📁 CSS com Tailwind

### index.css (arquivo principal)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

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

## 🏗️ Utility Classes do Tailwind

### Layout e Spacing

```jsx
// Container e layout
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

### Responsividade

```jsx
// Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)

// Mobile first
<div className="text-sm md:text-base lg:text-lg"> {/* Texto responsivo */}

// Esconder/mostrar
<div className="hidden md:block"> {/* Esconder em mobile, mostrar em desktop */}
<div className="block md:hidden"> {/* Mostrar em mobile, esconder em desktop */}

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> {/* 1 coluna mobile, 2 tablet, 3 desktop */}
```

## 🎯 Hot Module Replacement (HMR)

HMR permite que **mudanças no código sejam refletidas instantaneamente** no navegador sem recarregar a página.

### Como Funciona

```typescript
// arquivo: src/components/Botao.tsx
export function Botao({ texto }: { texto: string }) {
  return <button>{texto}</button>;
}

// Mudança no componente
export function Botao({ texto }: { texto: string }) {
  return <button className="bg-blue-500">{texto}</button>; // Adicionei classe
}

// ✅ HMR atualiza apenas o componente Botao
// ❌ Sem HMR, recarregaria toda a página
```

### Configurando HMR

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      port: 4321, // Porta específica para HMR
    }
  }
})
```

## 📦 Organização de Componentes

### Estrutura de Componentes (do projeto)

```
src/components/
├── ui/                    # Componentes base (Shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/               # Layout e navegação
│   ├── main-layout.tsx
│   ├── sidebar.tsx
│   └── header.tsx
├── forms/                # Componentes de formulário
│   ├── form-field.tsx
│   ├── select-field.tsx
│   └── ...
├── common/               # Componentes comuns
│   ├── error-boundary.tsx
│   ├── loading-spinner.tsx
│   └── ...
├── training/             # Módulo específico
│   ├── video-player.tsx
│   ├── progress-bar.tsx
│   └── ...
└── whatsapp/             # Integração WhatsApp
    ├── message-bubble.tsx
    ├── chat-window.tsx
    └── ...
```

### Padrão de Nomenclatura

```typescript
// ✅ Componentes
Button.tsx              // PascalCase
Card.tsx
VideoPlayer.tsx

// ✅ Hooks
useAuth.ts              // camelCase + "use"
useTrainingCourses.ts
useWhatsAppConnection.ts

// ✅ Services
apiClient.ts            // camelCase
trainingService.ts
authService.ts

// ✅ Types
User.ts                 // PascalCase
TrainingCourse.ts
ApiResponse.ts

// ✅ Utils
formatters.ts           // camelCase
validators.ts
dateUtils.ts
```

## 🔧 Scripts do Package.json

### Scripts Essenciais

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Scripts Avançados

```json
{
  "scripts": {
    "dev": "vite --host",
    "dev:network": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "build:dev": "vite build --mode development",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write src/**/*.{ts,tsx,css}",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## 🌐 Environment Variables

### .env.local

```bash
# API URLs
VITE_API_BASE_URL=http://localhost:5656/api
VITE_SIGNALR_URL=http://localhost:5656/signalr

# Autenticação
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_ENABLE_CLERK=true

# Configurações
VITE_APP_NAME=Meu App
VITE_APP_VERSION=1.0.0
```

### Usando Environment Variables

```tsx
// No componente
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Em vite.config.ts
define: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
}
```

## 🎯 Build e Otimização

### Configuração de Build

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015', // Target do build
    outDir: 'dist',   // Diretório de saída
    assetsDir: 'assets', // Diretório de assets
    sourcemap: true,  // Source maps para debug

    rollupOptions: {
      output: {
        // Code splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          utils: ['axios', 'date-fns']
        }
      }
    },

    // Minificação
    minify: 'esbuild', // ou 'terser'
    cssMinify: true,

    // Gzip
    reportCompressedSize: true,
  }
})
```

### Análise de Bundle

```bash
# Instalar plugin de análise
npm install --save-dev vite-bundle-analyzer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true
    })
  ]
})
```

## 📱 Responsividade e Mobile-First

### Breakpoints do Tailwind

```css
/* Tailwind breakpoints */
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
```

## 🎨 Tema e Design System

### Variáveis CSS Custom Properties

```css
/* CSS Variables para tema */
:root {
  /* Cores principais */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --primary-hover: 221.2 83.2% 48.3%;

  /* Espaçamento */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Border radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

### Dark Mode

```jsx
// Toggle dark mode
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

## 🚀 Performance e Otimização

### Lazy Loading

```tsx
// Componente lazy
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// Em routes
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

### Code Splitting

```typescript
// vite.config.ts - code splitting automático
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // Vendor chunks
        vendor: ['react', 'react-dom', 'react-router-dom'],

        // UI chunks
        ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],

        // Utils chunks
        utils: ['axios', 'date-fns', 'clsx']
      }
    }
  }
}
```

## 📋 Exemplos do Projeto Real

### 1. Configuração Vite Completa

```typescript
// front/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
    ],
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5656',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-label'],
        },
      },
    },
  },

  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    'import.meta.env.VITE_SIGNALR_URL': JSON.stringify(process.env.VITE_SIGNALR_URL),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
  },
});
```

### 2. Configuração TypeScript

```json
// front/tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}
```

### 3. Configuração Tailwind

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
	theme: {
		extend: {
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'roboto': ['Roboto', 'sans-serif'],
				'inter': ['Inter', 'sans-serif'],
			},
			colors: {
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				// ... mais cores
			},
			animation: {
				'float': 'float 6s ease-in-out infinite',
				'light-wire-flow': 'light-wire-flow 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 4. Estrutura de Componentes

```
front/src/
├── components/
│   ├── ui/                    # Componentes base (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/               # Layout
│   │   ├── main-layout.tsx
│   │   └── sidebar.tsx
│   ├── auth/                 # Autenticação
│   │   ├── auth-guard.tsx
│   │   └── protected-route.tsx
│   ├── training/             # Treinamentos
│   │   ├── video-player.tsx
│   │   └── progress-steps.tsx
│   └── whatsapp/             # WhatsApp
│       ├── chat-window.tsx
│       └── media-renderer.tsx
├── pages/                    # Páginas/routes
│   ├── dashboard/
│   ├── crm/
│   ├── treinamentos/
│   └── ...
├── hooks/                    # Custom hooks
├── services/                 # API services
├── types/                    # TypeScript types
├── lib/                      # Utilitários
└── utils/                    # Funções auxiliares
```

## 🧪 Exercícios Práticos

### Exercício 1: Configurar Projeto do Zero

```bash
# 1. Criar projeto
npm create vite@latest meu-app -- --template react-ts
cd meu-app
npm install

# 2. Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Configurar Tailwind
# tailwind.config.js
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

# 4. Adicionar Tailwind ao CSS
# src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

# 5. Executar
npm run dev
```

### Exercício 2: Componente Responsivo

```tsx
// Criar um componente Card responsivo
interface CardProps {
  titulo: string;
  descricao: string;
  imagem?: string;
  acao?: () => void;
}

function Card({ titulo, descricao, imagem, acao }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem */}
      {imagem && (
        <img
          src={imagem}
          alt={titulo}
          className="w-full h-48 object-cover"
        />
      )}

      {/* Conteúdo */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {titulo}
        </h3>
        <p className="text-gray-600 mb-4">
          {descricao}
        </p>

        {/* Botão */}
        {acao && (
          <button
            onClick={acao}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto"
          >
            Ver Mais
          </button>
        )}
      </div>
    </div>
  );
}

// Grid responsivo
function CardGrid({ cards }: { cards: CardProps[] }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </div>
  );
}
```

### Exercício 3: Sistema de Tema

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

// Componente de toggle
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

// CSS para tema
const themeClasses = {
  light: {
    background: 'bg-white',
    text: 'text-gray-900',
    card: 'bg-white border-gray-200',
  },
  dark: {
    background: 'bg-gray-900',
    text: 'text-gray-100',
    card: 'bg-gray-800 border-gray-700',
  }
};
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Build vs Development**

```bash
# Development (com HMR)
npm run dev      # ⚡ Rápido, HMR, source maps

# Build (produção)
npm run build    # Otimizado, minificado, tree-shaking

# Preview (visualizar build)
npm run preview  # Servir arquivos de /dist
```

### 2. **Path Aliases**

```typescript
// Sem alias (ruim)
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../hooks/use-auth';

// Com alias (bom)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
```

### 3. **Environment Variables**

```bash
# .env.local
VITE_API_URL=http://localhost:3001/api
VITE_DEBUG=true

# No código
const apiUrl = import.meta.env.VITE_API_URL; // ✅
const debug = import.meta.env.VITE_DEBUG;   // ✅

// ❌ NÃO funciona
console.log(process.env.VITE_API_URL);
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

Vite + React + TypeScript + Tailwind é uma **stack moderna e poderosa** que oferece:

1. **Velocidade extrema** no desenvolvimento
2. **TypeScript** para segurança de tipos
3. **Tailwind** para CSS utility-first
4. **Estrutura organizada** de projeto
5. **HMR** para desenvolvimento ágil

## 📚 Próximos Passos

Agora que você domina Vite e estrutura de projeto, está pronto para:

- **Módulo 5:** Aprofundar em componentes React avançados
- **Módulo 6:** Dominar hooks customizados
- **Módulo 7:** Gerenciar estado complexo

## 🎯 Resumo do que Aprendemos

✅ **Vite e sua configuração**
✅ **Estrutura de pastas ideal**
✅ **Tailwind CSS e utility classes**
✅ **Responsividade e mobile-first**
✅ **Hot Module Replacement**
✅ **Build e otimização**
✅ **Environment variables**
✅ **Tema e design system**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 4!**

**Continue para o [Módulo 5: Componentes React Avançados](Modulo-5-Componentes-React.md)**



