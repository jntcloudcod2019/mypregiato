# 📚 Módulo 3: TypeScript para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender por que TypeScript é importante
- Aprender tipos básicos e avançados
- Dominar interfaces e types
- Conhecer generics e utility types
- Configurar TypeScript no projeto
- Ver exemplos práticos do projeto real

## 📖 Por que TypeScript?

TypeScript é um **supersete do JavaScript** que adiciona **tipagem estática**. É como se o JavaScript tivesse a segurança de tipos do C#!

### JavaScript vs TypeScript

| Problema | JavaScript | TypeScript | C# |
|----------|------------|------------|----|
| **Tipagem** | Dinâmica | Estática | Estática |
| **Erros** | Runtime | Compile time | Compile time |
| **IDE** | Autocomplete básico | IntelliSense completo | IntelliSense completo |
| **Refatoring** | Perigoso | Seguro | Seguro |

### Exemplo Prático

```javascript
// JavaScript - erro só em runtime
function somar(a, b) {
  return a + b; // Funciona com números, strings, etc
}

somar(5, "10"); // "510" - erro só quando executar!
```

```typescript
// TypeScript - erro em compile time
function somar(a: number, b: number): number {
  return a + b;
}

somar(5, "10"); // ❌ Erro: Argument of type 'string' is not assignable to parameter of type 'number'
```

## 🚀 Instalando e Configurando TypeScript

### Instalação

```bash
# Instalar TypeScript globalmente
npm install -g typescript

# Ou como dependência do projeto
npm install typescript --save-dev
```

### Configuração Inicial

```bash
# Inicializar projeto TypeScript
tsc --init

# Compilar
tsc

# Compilar e assistir mudanças
tsc --watch
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## 📊 Tipos Básicos

### Tipos Primitivos

```typescript
// String
const nome: string = "João";

// Number
const idade: number = 25;
const altura: number = 1.75;
const salario: number = 5000.50;

// Boolean
const isAtivo: boolean = true;

// Undefined e Null
const valor: undefined = undefined;
const nulo: null = null;

// Any (evite usar!)
const qualquer: any = "pode ser qualquer coisa";
```

**Equivalente em C#:**
```csharp
string nome = "João";
int idade = 25;
double altura = 1.75;
decimal salario = 5000.50m;
bool isAtivo = true;
object qualquer = "qualquer coisa";
```

### Arrays e Tuplas

```typescript
// Arrays
const numeros: number[] = [1, 2, 3, 4, 5];
const nomes: string[] = ["Ana", "João", "Maria"];
const misto: (string | number)[] = ["texto", 42, "outro"];

// Array genérico
const lista: Array<string> = ["item1", "item2"];

// Tuplas (arrays com tipos fixos)
const pessoa: [string, number, boolean] = ["João", 25, true];
const coordenadas: [number, number] = [10, 20];
```

**Equivalente em C#:**
```csharp
int[] numeros = {1, 2, 3, 4, 5};
List<string> nomes = new() {"Ana", "João", "Maria"};
(string, int, bool) pessoa = ("João", 25, true);
```

### Enums

```typescript
// Numeric enum
enum DiasDaSemana {
  Segunda = 1,
  Terca,
  Quarta,
  Quinta,
  Sexta,
  Sabado,
  Domingo
}

// String enum
enum Cores {
  Vermelho = "RED",
  Verde = "GREEN",
  Azul = "BLUE"
}

// Usando
const hoje: DiasDaSemana = DiasDaSemana.Segunda;
const cor: Cores = Cores.Vermelho;
```

**Equivalente em C#:**
```csharp
enum DiasDaSemana {
  Segunda = 1,
  Terca,
  Quarta,
  Quinta,
  Sexta,
  Sabado,
  Domingo
}

enum Cores {
  Vermelho = "RED",
  Verde = "GREEN",
  Azul = "BLUE"
}
```

## 🏗️ Interfaces e Types

### Interfaces

```typescript
interface Usuario {
  id: number;
  nome: string;
  email: string;
  idade?: number; // opcional
  ativo: boolean;
}

// Usando interface
const usuario: Usuario = {
  id: 1,
  nome: "João",
  email: "joao@email.com",
  ativo: true
  // idade é opcional
};

// Interface para funções
interface Calculadora {
  (a: number, b: number): number;
}

const soma: Calculadora = (a, b) => a + b;
```

### Types (Type Aliases)

```typescript
// Type alias simples
type Idade = number;
type NomeCompleto = string;

// Type alias para união
type Status = "ativo" | "inativo" | "pendente";

// Type alias para objetos
type Endereco = {
  rua: string;
  numero: number;
  cidade: string;
  cep: string;
};

// Type alias para função
type Callback = (erro: Error | null, resultado?: string) => void;
```

**Equivalente em C#:**
```csharp
// Interface
public interface IUsuario {
  int Id { get; set; }
  string Nome { get; set; }
  string Email { get; set; }
  int? Idade { get; set; } // opcional
  bool Ativo { get; set; }
}

// Delegate para função
public delegate int Calculadora(int a, int b);
```

### Diferença entre Interface e Type

```typescript
// Interface - pode ser estendida
interface Animal {
  nome: string;
  idade: number;
}

interface Cachorro extends Animal {
  raca: string;
  late(): void;
}

// Type - união de tipos
type Status = "ativo" | "inativo";
type Resultado<T> = T | Error;

// Type não pode ser estendida, mas pode ser intersectada
type Funcionario = Usuario & {
  salario: number;
  departamento: string;
};
```

## 🎯 Funções e Tipos

### Tipos de Parâmetros e Retorno

```typescript
// Função simples
function saudar(nome: string): string {
  return `Olá, ${nome}!`;
}

// Função com parâmetros opcionais
function criarUsuario(
  nome: string,
  idade?: number,
  ativo: boolean = true
): { nome: string; idade?: number; ativo: boolean } {
  return { nome, idade, ativo };
}

// Função com rest parameters
function soma(...numeros: number[]): number {
  return numeros.reduce((acc, num) => acc + num, 0);
}
```

### Arrow Functions com Tipos

```typescript
// Arrow function tipada
const multiplicar: (a: number, b: number) => number = (a, b) => a * b;

// Callback tipado
const processar = (
  dados: string[],
  callback: (item: string) => boolean
): string[] => {
  return dados.filter(callback);
};
```

## 🌟 Generics (Tipos Genéricos)

Generics permitem criar **componentes reutilizáveis** que funcionam com **múltiplos tipos**.

```typescript
// Função genérica
function primeiroElemento<T>(array: T[]): T | undefined {
  return array[0];
}

// Usando
const primeiroNumero = primeiroElemento([1, 2, 3]); // number
const primeiroTexto = primeiroElemento(["a", "b", "c"]); // string

// Interface genérica
interface Resposta<T> {
  sucesso: boolean;
  dados: T;
  erro?: string;
}

// Usando interface genérica
const respostaUsuario: Resposta<Usuario> = {
  sucesso: true,
  dados: { id: 1, nome: "João", email: "joao@email.com" }
};
```

**Equivalente em C#:**
```csharp
// C# Generics
public T PrimeiroElemento<T>(T[] array) {
  return array.Length > 0 ? array[0] : default(T);
}

public class Resposta<T> {
  public bool Sucesso { get; set; }
  public T Dados { get; set; }
  public string? Erro { get; set; }
}
```

### Constraints (Restrições)

```typescript
// Restringindo tipo genérico
function imprimirId<T extends { id: number }>(obj: T): void {
  console.log(obj.id);
}

// Só funciona com objetos que têm 'id'
imprimirId({ id: 1, nome: "João" }); // ✅
imprimirId("texto"); // ❌ Error: string não tem 'id'
```

## 🛠️ Utility Types

TypeScript tem vários tipos utilitários built-in:

```typescript
interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  idade?: number;
}

// Partial - torna todas as propriedades opcionais
type UsuarioParcial = Partial<Usuario>;

// Required - torna todas as propriedades obrigatórias
type UsuarioCompleto = Required<Usuario>;

// Pick - seleciona propriedades específicas
type UsuarioBasico = Pick<Usuario, "id" | "nome" | "email">;

// Omit - remove propriedades específicas
type UsuarioSemSenha = Omit<Usuario, "senha">;

// Readonly - propriedades somente leitura
type UsuarioReadonly = Readonly<Usuario>;

// Record - cria tipo com chaves e valores
type Cache = Record<string, Usuario>;
```

## 📦 Classes e Herança

### Classes em TypeScript

```typescript
class Pessoa {
  // Propriedades
  protected nome: string;
  private idade: number;
  public ativo: boolean;

  // Construtor
  constructor(nome: string, idade: number, ativo: boolean = true) {
    this.nome = nome;
    this.idade = idade;
    this.ativo = ativo;
  }

  // Métodos
  public apresentar(): string {
    return `Olá, sou ${this.nome} e tenho ${this.idade} anos`;
  }

  // Getter e Setter
  get Nome(): string {
    return this.nome;
  }

  set Nome(valor: string) {
    if (valor.length > 0) {
      this.nome = valor;
    }
  }

  // Método estático
  static criarAdulto(nome: string): Pessoa {
    return new Pessoa(nome, 18);
  }
}

// Herança
class Funcionario extends Pessoa {
  private salario: number;
  private departamento: string;

  constructor(nome: string, idade: number, salario: number, departamento: string) {
    super(nome, idade);
    this.salario = salario;
    this.departamento = departamento;
  }

  public getInfoFuncionario(): string {
    return `${this.apresentar()}. Salário: R$ ${this.salario}, Depto: ${this.departamento}`;
  }
}
```

**Equivalente em C#:**
```csharp
public class Pessoa {
  protected string Nome { get; set; }
  private int Idade { get; set; }
  public bool Ativo { get; set; }

  public Pessoa(string nome, int idade, bool ativo = true) {
    Nome = nome;
    Idade = idade;
    Ativo = ativo;
  }

  public string Apresentar() => $"Olá, sou {Nome} e tenho {Idade} anos";

  public static Pessoa CriarAdulto(string nome) => new(nome, 18);
}

public class Funcionario : Pessoa {
  private decimal Salario { get; set; }
  private string Departamento { get; set; }

  public Funcionario(string nome, int idade, decimal salario, string departamento)
    : base(nome, idade) {
    Salario = salario;
    Departamento = departamento;
  }
}
```

## 🎨 TypeScript no React

### Props com TypeScript

```tsx
interface BotaoProps {
  texto: string;
  onClick?: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  disabled?: boolean;
  children?: React.ReactNode;
}

function Botao({
  texto,
  onClick,
  variante = 'primario',
  disabled = false,
  children
}: BotaoProps) {
  const classes = `btn btn-${variante} ${disabled ? 'disabled' : ''}`;

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {texto}
      {children}
    </button>
  );
}
```

### Hooks com TypeScript

```tsx
import { useState, useEffect, useCallback } from 'react';

// Hook useState tipado
function useContador(valorInicial: number = 0) {
  const [contador, setContador] = useState<number>(valorInicial);

  const incrementar = useCallback(() => {
    setContador(prev => prev + 1);
  }, []);

  const decrementar = useCallback(() => {
    setContador(prev => prev - 1);
  }, []);

  const resetar = useCallback(() => {
    setContador(valorInicial);
  }, [valorInicial]);

  return { contador, incrementar, decrementar, resetar };
}

// Hook useEffect com tipos
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(interval); // cleanup
}, []); // dependências
```

## 📋 Configuração no Projeto

### tsconfig.json do Projeto

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noFallthroughCasesInSwitch": false,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "src/**/*"],
  "exclude": ["node_modules"]
}
```

### Path Mapping (Aliases)

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

```tsx
// Agora pode importar assim:
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Usuario } from '@/types/usuario';
```

## 🎯 Exemplos do Projeto Real

### 1. Types - Interfaces Complexas

```typescript
// front/src/types/training.ts
export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  thumbnailObjectName?: string;
  category?: string;
  difficulty?: string;
  isActive: boolean;
  totalLessons: number;
  totalDurationMinutes: number;
  totalLikes: number;
  totalDislikes: number;
  averageRating: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lessons?: TrainingLesson[];
  enrollments?: TrainingEnrollment[];
  ratings?: TrainingRating[];
}

export interface TrainingLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  videoUrl?: string;
  videoObjectName?: string;
  videoSize?: number;
  videoDurationSeconds?: number;
  videoMimeType?: string;
  attachmentsJson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: TrainingCourse;
  progressRecords?: TrainingLessonProgress[];
}
```

### 2. DTOs para API

```typescript
// DTOs para criação e atualização
export interface CreateTrainingCourseDto {
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  isActive?: boolean;
  createdBy: string;
  lessons?: CreateTrainingLessonDto[];
  videoUrl?: string;
  videoObjectName?: string;
}

export interface UpdateTrainingCourseDto {
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  isActive: boolean;
}

export interface CreateTrainingLessonDto {
  title: string;
  description: string;
  orderIndex: number;
  videoUrl?: string;
  videoObjectName?: string;
  videoSize?: number;
  videoDurationSeconds?: number;
  videoDurationMinutes?: number;
  videoMimeType?: string;
  attachmentsJson?: string;
  isActive?: boolean;
}
```

### 3. Hooks com TypeScript

```typescript
// front/src/hooks/use-training-courses.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/training-service';
import {
  TrainingCourse,
  CreateTrainingCourseDto,
  UpdateTrainingCourseDto,
  TrainingCourseFilters,
  TrainingCourseStats,
} from '../types/training';
import { useToast } from '../hooks/use-toast';

export const useTrainingCourses = (filters?: TrainingCourseFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar cursos
  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-courses', filters],
    queryFn: () => trainingService.getCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: (course: CreateTrainingCourseDto) => trainingService.createCourse(course),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      const responseData = response as { course?: TrainingCourse; message?: string };
      const courseData = responseData.course || response;
      const message = responseData.message || `O curso "${courseData.title}" foi criado com sucesso.`;

      toast({
        title: 'Curso criado!',
        description: message,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao criar curso.';
      toast({
        title: 'Erro ao criar curso',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    courses,
    isLoading,
    error,
    refetch,
    createCourse: createCourseMutation.mutate,
    isCreating: createCourseMutation.isPending,
  };
};
```

### 4. Context com TypeScript

```typescript
// front/src/contexts/AuthPermissionsContext.tsx
export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  role: string; // API retorna como string, não como enum
  createdAt: string;
  updatedAt: string;
}

export interface AuthPermissionsContextType {
  user: UserData | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;

  // Funções de verificação de permissão
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;

  // Helpers de role
  isAdmin: boolean;
  isInstructor: boolean;
  isOperator: boolean;
  isProducer: boolean;
  isModel: boolean;
  isStudent: boolean;

  // Função para recarregar dados do usuário
  refetch: () => Promise<void>;
}
```

### 5. Componente com Props Complexas

```tsx
// front/src/components/training/VideoPlayer.tsx
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
  // Implementação do componente...
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Sistema de Tipos para E-commerce

```typescript
// Defina os tipos para um sistema de e-commerce
interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: Categoria;
  estoque: number;
  imagens: string[];
  avaliacao: number;
  disponivel: boolean;
}

interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  produtos?: Produto[];
}

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  endereco: Endereco;
  pedidos: Pedido[];
}

interface Endereco {
  rua: string;
  numero: number;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
  estado: string;
}

interface Pedido {
  id: number;
  clienteId: number;
  itens: ItemPedido[];
  total: number;
  status: StatusPedido;
  dataCriacao: Date;
  dataEntrega?: Date;
}

interface ItemPedido {
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  produto?: Produto;
}

type StatusPedido = 'pendente' | 'processando' | 'enviado' | 'entregue' | 'cancelado';

// Funções utilitárias
function calcularTotalPedido(pedido: Pedido): number {
  return pedido.itens.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
}

function filtrarProdutosPorCategoria(produtos: Produto[], categoriaId: number): Produto[] {
  return produtos.filter(produto => produto.categoria.id === categoriaId);
}

function validarEstoque(pedido: Pedido): boolean {
  return pedido.itens.every(item => {
    const produto = item.produto;
    return produto ? produto.estoque >= item.quantidade : false;
  });
}
```

### Exercício 2: API Service com TypeScript

```typescript
// Crie um service para API com tipagem completa
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString());
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

// Service específico para produtos
class ProdutoService extends ApiService {
  async listarProdutos(params?: PaginationParams): Promise<PaginatedResponse<Produto>> {
    return this.get<PaginatedResponse<Produto>>('/produtos', params);
  }

  async buscarProduto(id: number): Promise<ApiResponse<Produto>> {
    return this.get<ApiResponse<Produto>>(`/produtos/${id}`);
  }

  async criarProduto(produto: Omit<Produto, 'id' | 'categoria'> & { categoriaId: number }): Promise<ApiResponse<Produto>> {
    return this.post<ApiResponse<Produto>>('/produtos', produto);
  }

  async atualizarProduto(id: number, produto: Partial<Produto>): Promise<ApiResponse<Produto>> {
    return this.put<ApiResponse<Produto>>(`/produtos/${id}`, produto);
  }

  async deletarProduto(id: number): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/produtos/${id}`);
  }
}
```

### Exercício 3: Custom Hook com Generics

```typescript
// Crie um custom hook genérico para API
import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

function useApi<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & {
  refetch: () => Promise<void>;
} {
  const { immediate = true, dependencies = [] } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    ...state,
    refetch: execute,
  };
}

// Hook específico para produtos
function useProdutos() {
  const produtoService = new ProdutoService();

  return useApi(
    () => produtoService.listarProdutos().then(response => response.data),
    { immediate: true }
  );
}

// Hook para produto específico
function useProduto(id: number) {
  const produtoService = new ProdutoService();

  return useApi(
    () => produtoService.buscarProduto(id).then(response => response.data),
    { immediate: true, dependencies: [id] }
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Strict Mode**

```typescript
// tsconfig.json - modo estrito
{
  "compilerOptions": {
    "strict": true, // Ative isso!
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 2. **Null vs Undefined**

```typescript
// TypeScript - null e undefined são diferentes
let valor: string | null = null;
let outro: string | undefined = undefined;

// Verificação de null
if (valor !== null) {
  console.log(valor.toUpperCase()); // ✅
}

// Verificação de undefined
if (outro !== undefined) {
  console.log(outro.toUpperCase()); // ✅
}
```

### 3. **Type Assertion**

```typescript
// Type assertion (cuidado!)
const input = document.getElementById('meu-input') as HTMLInputElement;
const valor = input.value;

// Ou usando angle bracket (menos comum)
const input2 = <HTMLInputElement>document.getElementById('meu-input');
```

### 4. **Index Signature**

```typescript
// Para objetos dinâmicos
interface Configuracao {
  [key: string]: string | number | boolean;
}

const config: Configuracao = {
  tema: 'dark',
  timeout: 5000,
  debug: true,
  versao: '1.0'
};
```

## 🏁 Conclusão

TypeScript traz a **segurança de tipos** do C# para o JavaScript, mas com algumas diferenças importantes:

1. **Compilação vs Transpilação** - TS → JS (não IL)
2. **Tipagem Estrutural** - "duck typing" vs nominal no C#
3. **Inference Inteligente** - TypeScript infere tipos automaticamente
4. **Utility Types** - Ferramentas poderosas para manipular tipos

## 📚 Próximos Passos

Agora que você domina TypeScript, está pronto para:

- **Módulo 4:** Entender Vite e estrutura de projetos
- **Módulo 5:** Aprofundar em componentes React avançados
- **Módulo 6:** Dominar hooks customizados

## 🎯 Resumo do que Aprendemos

✅ **Por que TypeScript?**
✅ **Tipos básicos e avançados**
✅ **Interfaces e Types**
✅ **Generics e Utility Types**
✅ **Classes e herança**
✅ **TypeScript no React**
✅ **Configuração de projeto**
✅ **Exemplos práticos do projeto**

---

**🎓 Parabéns! Você completou o Módulo 3!**

**Continue para o [Módulo 4: Vite e Estrutura de Projeto](Modulo-4-Vite-Estrutura-Projeto.md)**










