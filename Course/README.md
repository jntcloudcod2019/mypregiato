# 🚀 Curso de Node.js/React para Desenvolvedores C#

## Bem-vindo ao Curso!

Este curso foi especialmente criado para **engenheiros de software** que já programam em **C#** e querem aprender o **ecossistema Node.js/JavaScript/React**. Usaremos como base um projeto real de uma aplicação de gestão de talentos e treinamentos para ilustrar todos os conceitos.

## 🎯 Sobre Este Curso

Este é um curso **prático e completo** que vai te levar do zero ao nível avançado no desenvolvimento web moderno com JavaScript. Vamos analisar um projeto real e aprender todos os conceitos através de exemplos práticos.

## 📋 Pré-requisitos

- Conhecimento básico de programação (que você já tem do C#)
- Familiaridade com conceitos de orientação a objetos
- Vontade de aprender novas tecnologias!

## 🏗️ Projeto Base Analisado

O projeto que vamos usar como referência é uma **aplicação completa** com:

- **Frontend React + TypeScript + Vite**
- **Backend .NET 8 (C#) com arquitetura hexagonal**
- **Sistema de autenticação com Clerk**
- **WhatsApp Bot integrado**
- **Banco de dados PostgreSQL**
- **Armazenamento de arquivos (MinIO)**
- **Sistema de filas (RabbitMQ)**

## 📚 Módulos do Curso

### **Módulo 1: Fundamentos do JavaScript**
- Sintaxe básica do JavaScript
- Tipos de variáveis e escopo
- Funções e arrow functions
- Objetos e arrays
- Assincronismo (Promises, async/await)
- Diferenças e similaridades com C#

### **Módulo 2: React e JSX**
- O que é React e por que usar
- JSX vs TSX
- Componentes funcionais vs classes
- Props e State
- Ciclo de vida dos componentes

### **Módulo 3: TypeScript**
- Por que TypeScript?
- Tipos básicos e avançados
- Interfaces e Types
- Generics
- Configuração do TypeScript no projeto

### **Módulo 4: Vite e Estrutura de Projeto**
- O que é Vite e como funciona
- Configuração de projeto
- Sistema de módulos ES6
- Build e desenvolvimento
- Hot Module Replacement (HMR)

### **Módulo 5: Componentes React**
- Componentes funcionais
- Props e children
- Componentes controlados vs não controlados
- Composição de componentes
- Padrões de design (Container/Presentational)

### **Módulo 6: Hooks do React**
- useState - gerenciamento de estado
- useEffect - efeitos colaterais
- useContext - contexto
- useMemo e useCallback - performance
- Custom Hooks

### **Módulo 7: Gerenciamento de Estado**
- React Query (TanStack Query)
- Zustand
- Context API
- Quando usar cada um

### **Módulo 8: Roteamento**
- React Router DOM
- Rotas dinâmicas
- Proteção de rotas
- Lazy loading
- Navegação programática

### **Módulo 9: Estilização com Tailwind CSS**
- Utility-first CSS
- Classes responsivas
- Customização do Tailwind
- Integração com componentes

### **Módulo 10: Sistema de UI (Shadcn/ui + Radix)**
- Componentes acessíveis
- Radix UI primitives
- Shadcn/ui
- Personalização de temas

### **Módulo 11: Autenticação com Clerk**
- Integração com Clerk
- Proteção de rotas
- Gerenciamento de usuários
- JWT e segurança

### **Módulo 12: Consumo de APIs**
- Fetch API vs Axios
- REST APIs
- GraphQL (se aplicável)
- Tratamento de erros
- Loading states

### **Módulo 13: Padrões e Boas Práticas**
- Clean Code em JavaScript
- SOLID principles adaptados
- Design Patterns em React
- Performance e otimização

### **Módulo 14: Projetos Práticos**
- Refatoração de código C# para JavaScript
- Implementação de features completas
- Debugging e troubleshooting

## 🛠️ Stack Tecnológica

### **Frontend**
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes UI
- **Radix UI** - Primitives acessíveis
- **React Router DOM** - Roteamento
- **React Hook Form** - Formulários
- **Zod** - Validação
- **React Query** - Data fetching
- **Zustand** - State management
- **Lucide React** - Ícones
- **Axios** - HTTP client

### **Backend (Contexto)**
- **.NET 8** - C# backend
- **PostgreSQL** - Banco de dados
- **MinIO** - Armazenamento
- **RabbitMQ** - Message queue

## 📁 Estrutura do Projeto Analisado

```
front/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes base (Shadcn)
│   │   ├── auth/           # Autenticação
│   │   ├── training/       # Treinamentos
│   │   └── whatsapp/       # WhatsApp integration
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas/routes
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── lib/                # Utilitários
│   └── utils/              # Funções auxiliares
├── package.json            # Dependências
├── vite.config.ts          # Configuração Vite
└── tailwind.config.ts      # Configuração Tailwind
```

## 🚀 Como Começar

1. **Instale o Node.js** (versão LTS recomendada)
2. **Clone o projeto** ou crie um novo com Vite
3. **Instale as dependências**: `npm install`
4. **Configure o ambiente**: copie `.env.example` para `.env`
5. **Execute em desenvolvimento**: `npm run dev`

## 💡 Dicas para Desenvolvedores C#

| C# | JavaScript/TypeScript | Exemplo |
|----|----------------------|---------|
| `string nome = "João"` | `const nome: string = "João"` | Declaração de variáveis |
| `List<string> lista` | `const lista: string[] = []` | Arrays/Lists |
| `public class Pessoa` | `interface Pessoa` | Interfaces |
| `async Task Metodo()` | `async function metodo()` | Assincronismo |
| `var resultado = await` | `const resultado = await` | Await |
| `Console.WriteLine()` | `console.log()` | Output |
| `try/catch` | `try/catch` | Tratamento de erro |

## 📖 Recursos Adicionais

- [Documentação React](https://react.dev)
- [Documentação TypeScript](https://www.typescriptlang.org)
- [Documentação Vite](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Clerk Documentation](https://clerk.com/docs)

## 🎯 Objetivos de Aprendizado

Ao final deste curso, você será capaz de:

1. ✅ Desenvolver aplicações React modernas
2. ✅ Usar TypeScript com confiança
3. ✅ Implementar sistemas de autenticação
4. ✅ Consumir APIs REST
5. ✅ Gerenciar estado complexo
6. ✅ Criar interfaces responsivas
7. ✅ Aplicar boas práticas de desenvolvimento
8. ✅ Fazer a transição do C# para JavaScript

## 📂 Navegação do Curso

Cada módulo está em um arquivo README separado para facilitar a navegação:

- [Modulo-1-Fundamentos-JavaScript.md](Modulo-1-Fundamentos-JavaScript.md)
- [Modulo-2-React-JSX.md](Modulo-2-React-JSX.md)
- [Modulo-3-TypeScript.md](Modulo-3-TypeScript.md)
- E assim por diante...

---

**🎓 Vamos começar? Vá para o [Módulo 1](Modulo-1-Fundamentos-JavaScript.md) para começar sua jornada no mundo JavaScript!**



