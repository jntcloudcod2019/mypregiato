# 📚 Módulo 2: React e JSX para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender o que é React e por que usar
- Aprender JSX vs TSX
- Compreender componentes funcionais vs classes
- Dominar Props e State
- Entender o ciclo de vida dos componentes
- Ver exemplos práticos do projeto

## 📖 O que é React?

React é uma **biblioteca JavaScript** para construir interfaces de usuário. Diferente do C# onde você tem Windows Forms ou WPF, React é focado em **componentes reutilizáveis** e **atualização eficiente** da UI.

### C# vs React

| C# (Windows Forms/WPF) | React | Exemplo |
|-------------------------|-------|---------|
| `Form` / `Window` | `Component` | Janela principal |
| `Button` / `TextBox` | `Button` / `Input` | Controles |
| `Click` event | `onClick` | Eventos |
| `DataBinding` | `State` + `Props` | Dados |
| `Designer` | **JSX** | Layout |

## 🚀 Instalando React

### Criando um Projeto React

```bash
# Com Vite (recomendado)
npm create vite@latest meu-projeto-react
cd meu-projeto-react
npm install
npm run dev

# Com Create React App (tradicional)
npx create-react-app meu-projeto-react
cd meu-projeto-react
npm start
```

## 📋 JSX - JavaScript XML

JSX é uma **sintaxe** que permite escrever HTML dentro do JavaScript. É como se fosse um "template" mas com poder total do JavaScript.

### JSX Básico

```jsx
// JSX simples
const elemento = <h1>Olá, mundo!</h1>;

// JSX com JavaScript
const nome = "João";
const elemento2 = <h1>Olá, {nome}!</h1>;

// JSX com atributos
const elemento3 = (
  <a href="https://google.com" target="_blank" className="link">
    Clique aqui
  </a>
);
```

**Equivalente em C#:**
```csharp
// C# - Razor (similar ao JSX)
<h1>Olá, @nome!</h1>
<a href="@url" target="_blank" class="@cssClass">Clique aqui</a>

// Ou XAML (WPF)
<TextBlock Text="Olá, mundo!" />
//<Button Content="Clique aqui" Click="Botao_Click" />
```

### JSX vs TSX

```jsx
// JSX (JavaScript)
function Saudacao(props) {
  return <h1>Olá, {props.nome}!</h1>;
}

// TSX (TypeScript)
interface SaudacaoProps {
  nome: string;
  idade?: number;
}

function Saudacao({ nome, idade }: SaudacaoProps) {
  return (
    <h1>
      Olá, {nome}! {idade && `Você tem ${idade} anos.`}
    </h1>
  );
}
```

## 🧩 Componentes React

### Componente Funcional (Recomendado)

```jsx
// Componente simples
function Botao(props) {
  return (
    <button className={props.classe}>
      {props.texto}
    </button>
  );
}

// Usando o componente
<Botao texto="Clique aqui" classe="btn-primary" />
```

### Componente com TypeScript

```tsx
// Definindo tipos
interface BotaoProps {
  texto: string;
  classe?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// Componente tipado
function Botao({ texto, classe = "btn", onClick, disabled }: BotaoProps) {
  return (
    <button
      className={classe}
      onClick={onClick}
      disabled={disabled}
    >
      {texto}
    </button>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - UserControl ou Custom Control
public class Botao : Button {
  public string Texto {
    get => Content?.ToString() ?? "";
    set => Content = value;
  }

  public string Classe {
    get => GetValue(ClasseProperty)?.ToString() ?? "btn";
    set => SetValue(ClasseProperty, value);
  }
}
```

## 📊 Props e State

### Props (Propriedades)

Props são **somente leitura** e vêm do componente pai. São como **parâmetros** de um método.

```jsx
// Componente pai
function App() {
  const usuario = {
    nome: "João",
    idade: 25,
    profissao: "Desenvolvedor"
  };

  return <Perfil usuario={usuario} />;
}

// Componente filho
function Perfil({ usuario }) {
  return (
    <div>
      <h1>{usuario.nome}</h1>
      <p>Idade: {usuario.idade}</p>
      <p>Profissão: {usuario.profissao}</p>
    </div>
  );
}
```

### State (Estado)

State é **mutável** e controlado pelo componente. É como **variáveis de instância** em C#.

```jsx
import { useState } from 'react';

function Contador() {
  // [valor, funçãoParaAtualizar] = useState(valorInicial)
  const [contador, setContador] = useState(0);

  return (
    <div>
      <h1>Contador: {contador}</h1>
      <button onClick={() => setContador(contador + 1)}>
        Incrementar
      </button>
      <button onClick={() => setContador(contador - 1)}>
        Decrementar
      </button>
    </div>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - propriedade com INotifyPropertyChanged
public class ContadorViewModel : INotifyPropertyChanged {
  private int _contador;

  public int Contador {
    get => _contador;
    set {
      _contador = value;
      OnPropertyChanged();
    }
  }

  public void Incrementar() => Contador++;
  public void Decrementar() => Contador--;
}
```

## 🔄 Eventos em React

### Eventos Básicos

```jsx
function Formulario() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault(); // Previne comportamento padrão
    console.log('Nome:', nome);
    console.log('Email:', email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - Windows Forms
private void Botao_Click(object sender, EventArgs e) {
  // Lógica do clique
}

private void TextBox_TextChanged(object sender, EventArgs e) {
  // Lógica da mudança
}
```

### Evento com Parâmetros

```jsx
function ListaTarefas() {
  const [tarefas, setTarefas] = useState([
    { id: 1, texto: "Estudar React", concluida: false },
    { id: 2, texto: "Fazer exercícios", concluida: true }
  ]);

  const alternarConcluida = (id) => {
    setTarefas(tarefas.map(tarefa =>
      tarefa.id === id
        ? { ...tarefa, concluida: !tarefa.concluida }
        : tarefa
    ));
  };

  return (
    <ul>
      {tarefas.map(tarefa => (
        <li key={tarefa.id}>
          <span style={{
            textDecoration: tarefa.concluida ? 'line-through' : 'none'
          }}>
            {tarefa.texto}
          </span>
          <button onClick={() => alternarConcluida(tarefa.id)}>
            {tarefa.concluida ? 'Desmarcar' : 'Marcar'}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## 🎨 Renderização Condicional

### If/Else em JSX

```jsx
function Mensagem({ usuario }) {
  if (!usuario) {
    return <div>Por favor, faça login</div>;
  }

  return (
    <div>
      <h1>Olá, {usuario.nome}!</h1>
      {usuario.isAdmin && <AdminPanel />}
    </div>
  );
}
```

### Operador Ternário

```jsx
function BotaoLogin({ isLogado }) {
  return (
    <button className={isLogado ? 'btn-logout' : 'btn-login'}>
      {isLogado ? 'Sair' : 'Entrar'}
    </button>
  );
}

// Ou inline
<div>
  {isLogado ? (
    <Dashboard />
  ) : (
    <LoginForm />
  )}
</div>
```

### Operador && (AND lógico)

```jsx
function Usuario({ usuario }) {
  return (
    <div>
      <h1>{usuario.nome}</h1>
      {usuario.email && <p>Email: {usuario.email}</p>}
      {usuario.isAdmin && (
        <AdminPanel>
          <AdminMenu />
        </AdminPanel>
      )}
    </div>
  );
}
```

## 📝 Listas e Keys

### Renderizando Listas

```jsx
function ListaProdutos({ produtos }) {
  return (
    <ul>
      {produtos.map(produto => (
        <li key={produto.id}>
          <h3>{produto.nome}</h3>
          <p>Preço: R$ {produto.preco}</p>
        </li>
      ))}
    </ul>
  );
}

// Dados de exemplo
const produtos = [
  { id: 1, nome: "Notebook", preco: 2500 },
  { id: 2, nome: "Mouse", preco: 50 },
  { id: 3, nome: "Teclado", preco: 120 }
];
```

### Keys Importantes

```jsx
// ❌ Ruim - sem key
produtos.map(produto => (
  <li>{produto.nome}</li>
));

// ❌ Ruim - key não estável
produtos.map((produto, index) => (
  <li key={index}>{produto.nome}</li>
));

// ✅ Bom - key estável e única
produtos.map(produto => (
  <li key={produto.id}>{produto.nome}</li>
));
```

## 🎯 Ciclo de Vida dos Componentes

### Componentes de Classe (Antigo)

```jsx
class MeuComponente extends React.Component {
  constructor(props) {
    super(props);
    this.state = { contador: 0 };
  }

  componentDidMount() {
    // Executa após o componente ser montado
    console.log('Componente montado!');
  }

  componentDidUpdate(prevProps, prevState) {
    // Executa quando props ou state mudam
    console.log('Componente atualizado!');
  }

  componentWillUnmount() {
    // Executa antes do componente ser desmontado
    console.log('Componente será removido!');
  }

  render() {
    return <div>{this.state.contador}</div>;
  }
}
```

### Hooks Modernos (Recomendado)

```jsx
function MeuComponente() {
  const [contador, setContador] = useState(0);

  useEffect(() => {
    // componentDidMount + componentDidUpdate
    console.log('Componente montado/atualizado!');

    // Cleanup (componentWillUnmount)
    return () => {
      console.log('Componente será removido!');
    };
  }, []); // [] = executa apenas no mount

  useEffect(() => {
    // Executa apenas quando contador muda
    console.log('Contador mudou:', contador);
  }, [contador]);

  return <div>{contador}</div>;
}
```

## 🏗️ Composição de Componentes

### Containment (Contenção)

```jsx
function Card({ children, titulo }) {
  return (
    <div className="card">
      <h2>{titulo}</h2>
      {children} {/* Conteúdo passado pelo pai */}
    </div>
  );
}

// Usando
<Card titulo="Meu Card">
  <p>Este é o conteúdo do card</p>
  <button>Botão</button>
</Card>
```

### Specialização (Herança)

```jsx
function Botao({ children, variante = 'primario', ...props }) {
  return (
    <button className={`btn-${variante}`} {...props}>
      {children}
    </button>
  );
}

// Especializações
function BotaoPrimario(props) {
  return <Botao variante="primario" {...props} />;
}

function BotaoSecundario(props) {
  return <Botao variante="secundario" {...props} />;
}
```

## 🎨 Estilos em React

### CSS Modules

```jsx
// Botao.module.css
.botao {
  background: blue;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}

.botao:hover {
  background: darkblue;
}

// Botao.jsx
import styles from './Botao.module.css';

function Botao({ texto }) {
  return <button className={styles.botao}>{texto}</button>;
}
```

### Styled Components

```jsx
import styled from 'styled-components';

const Botao = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;

  &:hover {
    background: ${props => props.primary ? 'darkblue' : 'darkgray'};
  }
`;

function App() {
  return (
    <div>
      <Botao primary>Primário</Botao>
      <Botao>Secundário</Botao>
    </div>
  );
}
```

### CSS-in-JS com Objetos

```jsx
function Botao({ texto, estilo }) {
  const estiloPadrao = {
    background: 'blue',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    ...estilo // merge com estilo personalizado
  };

  return <button style={estiloPadrao}>{texto}</button>;
}
```

## 🎯 Exemplos do Projeto Real

Vamos analisar componentes reais do projeto:

### 1. Componente de Botão (UI Base)

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

### 2. Componente de Card

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

### 3. VideoPlayer - Componente Complexo

```tsx
// front/src/components/training/VideoPlayer.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause, Maximize, RotateCcw, Settings } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  objectName: string;
  enrollmentId: string;
  lessonId: string;
  userId: string;
  onProgressUpdate?: (progress: number) => void;
  onVideoComplete?: () => void;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  objectName,
  enrollmentId,
  lessonId,
  userId,
  onProgressUpdate,
  onVideoComplete,
  className,
  autoPlay = false,
  showControls = true,
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout>();

  // Estados do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Renderização do componente
  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Vídeo */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto"
            preload="metadata"
            autoPlay={autoPlay}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="flex items-center space-x-2 text-white">
                <RotateCcw className="h-6 w-6 animate-spin" />
                <span>Carregando...</span>
              </div>
            </div>
          )}

          {/* Controles */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Controles principais */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>

                  {/* Tempo */}
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Componente de Lista de Tarefas

```jsx
// Criar um componente TodoList
function TodoList() {
  const [tarefas, setTarefas] = useState([
    { id: 1, texto: "Aprender React", concluida: false },
    { id: 2, texto: "Fazer exercícios", concluida: true }
  ]);

  const [novaTarefa, setNovaTarefa] = useState('');

  const adicionarTarefa = () => {
    if (novaTarefa.trim()) {
      setTarefas([
        ...tarefas,
        {
          id: Date.now(),
          texto: novaTarefa,
          concluida: false
        }
      ]);
      setNovaTarefa('');
    }
  };

  const alternarTarefa = (id) => {
    setTarefas(tarefas.map(tarefa =>
      tarefa.id === id
        ? { ...tarefa, concluida: !tarefa.concluida }
        : tarefa
    ));
  };

  const removerTarefa = (id) => {
    setTarefas(tarefas.filter(tarefa => tarefa.id !== id));
  };

  return (
    <div>
      <h1>Lista de Tarefas</h1>

      <div>
        <input
          type="text"
          value={novaTarefa}
          onChange={(e) => setNovaTarefa(e.target.value)}
          placeholder="Nova tarefa"
        />
        <button onClick={adicionarTarefa}>Adicionar</button>
      </div>

      <ul>
        {tarefas.map(tarefa => (
          <li key={tarefa.id}>
            <span style={{
              textDecoration: tarefa.concluida ? 'line-through' : 'none'
            }}>
              {tarefa.texto}
            </span>
            <button onClick={() => alternarTarefa(tarefa.id)}>
              {tarefa.concluida ? 'Desmarcar' : 'Marcar'}
            </button>
            <button onClick={() => removerTarefa(tarefa.id)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Exercício 2: Formulário com Validação

```jsx
function FormularioUsuario() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    idade: '',
    senha: ''
  });

  const [erros, setErros] = useState({});

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (!formData.email) {
      novosErros.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      novosErros.email = 'Email inválido';
    }

    if (!formData.idade || formData.idade < 18) {
      novosErros.idade = 'Deve ser maior de 18 anos';
    }

    if (!formData.senha || formData.senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validarFormulario()) {
      console.log('Dados válidos:', formData);
      // Enviar para API
    }
  };

  const handleChange = (campo) => (e) => {
    setFormData({
      ...formData,
      [campo]: e.target.value
    });

    // Limpar erro do campo
    if (erros[campo]) {
      setErros({
        ...erros,
        [campo]: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nome:</label>
        <input
          type="text"
          value={formData.nome}
          onChange={handleChange('nome')}
        />
        {erros.nome && <span style={{ color: 'red' }}>{erros.nome}</span>}
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
        />
        {erros.email && <span style={{ color: 'red' }}>{erros.email}</span>}
      </div>

      <div>
        <label>Idade:</label>
        <input
          type="number"
          value={formData.idade}
          onChange={handleChange('idade')}
        />
        {erros.idade && <span style={{ color: 'red' }}>{erros.idade}</span>}
      </div>

      <div>
        <label>Senha:</label>
        <input
          type="password"
          value={formData.senha}
          onChange={handleChange('senha')}
        />
        {erros.senha && <span style={{ color: 'red' }}>{erros.senha}</span>}
      </div>

      <button type="submit">Cadastrar</button>
    </form>
  );
}
```

### Exercício 3: Componente de Modal

```jsx
function Modal({ isOpen, onClose, titulo, children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2>{titulo}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {children}
      </div>
    </div>
  );
}

// Usando o modal
function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setModalOpen(true)}>
        Abrir Modal
      </button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        titulo="Confirmação"
      >
        <p>Tem certeza que deseja continuar?</p>
        <div>
          <button onClick={() => setModalOpen(false)}>
            Cancelar
          </button>
          <button onClick={() => {
            console.log('Confirmado!');
            setModalOpen(false);
          }}>
            Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Mutação vs Imutabilidade**

```jsx
// ❌ Ruim - mutando estado diretamente
const [lista, setLista] = useState([1, 2, 3]);

// Mutação direta (não funciona como esperado)
lista.push(4); // Isso não trigger re-render!

// ✅ Correto - criando novo array
setLista([...lista, 4]); // Trigger re-render
```

### 2. **Keys em Listas**

```jsx
// ❌ Ruim - sem key
{items.map(item => (
  <div>{item.nome}</div>
))}

// ❌ Ruim - key não estável
{items.map((item, index) => (
  <div key={index}>{item.nome}</div>
))}

// ✅ Bom - key estável
{items.map(item => (
  <div key={item.id}>{item.nome}</div>
))}
```

### 3. **Dependências em useEffect**

```jsx
// ❌ Ruim - sem dependências pode causar loops
useEffect(() => {
  fetchData();
});

// ✅ Correto - dependências vazias = executa apenas no mount
useEffect(() => {
  fetchData();
}, []);

// ✅ Correto - executa quando 'id' muda
useEffect(() => {
  fetchData(id);
}, [id]);
```

### 4. **Event Handlers**

```jsx
// ❌ Ruim - função inline em cada render
<button onClick={() => console.log('clicado')}>
  Botão
</button>

// ✅ Correto - useCallback para performance
const handleClick = useCallback(() => {
  console.log('clicado');
}, []);

<button onClick={handleClick}>Botão</button>
```

## 🏁 Conclusão

React e JSX podem parecer diferentes do C#, mas seguem os mesmos princípios de:

1. **Separação de responsabilidades** (componentes)
2. **Reutilização de código** (props e composição)
3. **Gerenciamento de estado** (state vs props)
4. **Eventos e interações** (event handlers)
5. **Ciclo de vida** (useEffect vs componentDidMount)

## 📚 Próximos Passos

Agora que você conhece React e JSX, está pronto para:

- **Módulo 3:** Dominar TypeScript para tipagem
- **Módulo 4:** Entender Vite e estrutura de projetos
- **Módulo 5:** Aprofundar em componentes avançados

## 🎯 Resumo do que Aprendemos

✅ **JSX e TSX**
✅ **Componentes funcionais**
✅ **Props e State**
✅ **Eventos e handlers**
✅ **Renderização condicional**
✅ **Listas e keys**
✅ **Ciclo de vida com hooks**
✅ **Composição de componentes**
✅ **Estilos em React**

---

**🎓 Parabéns! Você completou o Módulo 2!**

**Continue para o [Módulo 3: TypeScript](Modulo-3-TypeScript.md)**

