# 📚 Módulo 1: Fundamentos do JavaScript para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender a sintaxe básica do JavaScript
- Compreender os tipos de dados e variáveis
- Aprender sobre funções e assincronismo
- Conhecer as diferenças e similaridades com C#
- Praticar com exemplos do projeto real

## 📖 Introdução ao JavaScript

JavaScript é uma **linguagem de programação interpretada**, **dinamicamente tipada** que roda no navegador e no servidor (Node.js). Diferente do C# que é **compilada** e **estaticamente tipada**.

### C# vs JavaScript

| Aspecto | C# | JavaScript |
|---------|----|------------|
| **Compilação** | Compilada → IL → Runtime | Interpretada → Runtime |
| **Tipagem** | Estática e Forte | Dinâmica e Fraca |
| **Execução** | Servidor (principalmente) | Cliente + Servidor |
| **Paradigma** | OO, Funcional | Multi-paradigma |

## 🚀 Primeiros Passos

### Instalando Node.js

1. **Baixe o Node.js** em [nodejs.org](https://nodejs.org)
2. **Verifique a instalação:**
```bash
node --version
npm --version
```

3. **Crie seu primeiro projeto:**
```bash
npm init -y
```

### Hello World em JavaScript

```javascript
// arquivo: hello.js
console.log("Olá, mundo!");

// Executar:
node hello.js
```

**Equivalente em C#:**
```csharp
// C#
Console.WriteLine("Olá, mundo!");
```

## 📊 Variáveis e Tipos de Dados

### Declaração de Variáveis

JavaScript tem 3 formas de declarar variáveis:

```javascript
// var (antigo, evite usar)
var nome = "João";

// let (recomendado para variáveis mutáveis)
let idade = 25;

// const (recomendado para constantes)
const PI = 3.14159;
```

**Equivalente em C#:**
```csharp
// C#
var nome = "João";        // inferência de tipo
string nome2 = "João";    // explícito
let idade = 25;          // não existe no C#
const double PI = 3.14159;
```

### Tipos de Dados Primitivos

| JavaScript | C# | Exemplo |
|------------|----|---------|
| `string` | `string` | `"texto"` |
| `number` | `int`, `double`, `decimal` | `42`, `3.14` |
| `boolean` | `bool` | `true`, `false` |
| `undefined` | `null` (parcialmente) | `undefined` |
| `null` | `null` | `null` |
| `symbol` | ❌ Não existe | `Symbol('id')` |
| `bigint` | ❌ Não existe | `123n` |

### Tipos de Referência

```javascript
// Arrays
const numeros = [1, 2, 3, 4, 5];
const nomes = ["Ana", "João", "Maria"];

// Objetos
const pessoa = {
  nome: "João",
  idade: 25,
  profissao: "Desenvolvedor"
};

// Funções
const saudacao = function(nome) {
  return `Olá, ${nome}!`;
};
```

**Equivalente em C#:**
```csharp
// Arrays
int[] numeros = {1, 2, 3, 4, 5};
List<string> nomes = new() {"Ana", "João", "Maria"};

// Objetos/Classes
public class Pessoa {
  public string Nome { get; set; }
  public int Idade { get; set; }
  public string Profissao { get; set; }
}

// Delegates/Func
Func<string, string> saudacao = nome => $"Olá, {nome}!";
```

## 🔧 Operadores

### Operadores Aritméticos
```javascript
const a = 10;
const b = 3;

console.log(a + b);  // 13 (soma)
console.log(a - b);  // 7 (subtração)
console.log(a * b);  // 30 (multiplicação)
console.log(a / b);  // 3.333... (divisão)
console.log(a % b);  // 1 (módulo/resto)
console.log(a ** b); // 1000 (exponenciação)
```

### Operadores de Comparação
```javascript
console.log(5 == "5");   // true (comparação solta)
console.log(5 === "5");  // false (comparação estrita)
console.log(5 != "5");   // false (diferente solto)
console.log(5 !== "5");  // true (diferente estrito)
```

**Dica:** Use sempre `===` e `!==` (comparação estrita)!

## 🎯 Funções

### Declaração de Funções

```javascript
// Function Declaration
function saudar(nome) {
  return `Olá, ${nome}!`;
}

// Function Expression
const saudar2 = function(nome) {
  return `Olá, ${nome}!`;
};

// Arrow Function (recomendada)
const saudar3 = (nome) => {
  return `Olá, ${nome}!`;
};

// Arrow Function (forma curta)
const saudar4 = nome => `Olá, ${nome}!`;
```

**Equivalente em C#:**
```csharp
// Método tradicional
string Saudar(string nome) {
  return $"Olá, {nome}!";
}

// Lambda/Func
Func<string, string> saudar = nome => $"Olá, {nome}!";
```

### Parâmetros e Valores Padrão

```javascript
function criarUsuario(nome, idade = 18, ativo = true) {
  return {
    nome,
    idade,
    ativo
  };
}

console.log(criarUsuario("João"));        // { nome: "João", idade: 18, ativo: true }
console.log(criarUsuario("Maria", 25));   // { nome: "Maria", idade: 25, ativo: true }
console.log(criarUsuario("Pedro", 30, false)); // { nome: "Pedro", idade: 30, ativo: false }
```

## 📦 Objetos e Arrays

### Objetos

```javascript
// Criando objetos
const pessoa = {
  nome: "João",
  idade: 25,
  profissao: "Desenvolvedor",
  hobbies: ["futebol", "programação"]
};

// Acessando propriedades
console.log(pessoa.nome);        // "João"
console.log(pessoa["idade"]);    // 25

// Adicionando propriedades
pessoa.email = "joao@email.com";
pessoa["telefone"] = "123456789";

// Destructuring
const { nome, idade, profissao } = pessoa;
console.log(nome, idade, profissao); // "João" 25 "Desenvolvedor"
```

**Equivalente em C#:**
```csharp
public class Pessoa {
  public string Nome { get; set; }
  public int Idade { get; set; }
  public string Profissao { get; set; }
  public List<string> Hobbies { get; set; }
}

// Usando
var pessoa = new Pessoa {
  Nome = "João",
  Idade = 25,
  Profissao = "Desenvolvedor",
  Hobbies = new() { "futebol", "programação" }
};
```

### Arrays

```javascript
// Criando arrays
const numeros = [1, 2, 3, 4, 5];
const nomes = ["Ana", "João", "Maria"];

// Métodos de array
numeros.push(6);        // adiciona no final
numeros.pop();          // remove do final
numeros.unshift(0);     // adiciona no início
numeros.shift();        // remove do início

// Map, Filter, Reduce
const dobrados = numeros.map(n => n * 2);
const pares = numeros.filter(n => n % 2 === 0);
const soma = numeros.reduce((acc, n) => acc + n, 0);

// Destructuring
const [primeiro, segundo, ...resto] = numeros;
```

## ⚡ Assincronismo

JavaScript é **single-threaded** mas **non-blocking** através de assincronismo.

### Promises

```javascript
// Criando uma Promise
const buscarDados = () => {
  return new Promise((resolve, reject) => {
    // Simulando uma operação assíncrona
    setTimeout(() => {
      const sucesso = true;

      if (sucesso) {
        resolve("Dados encontrados!");
      } else {
        reject("Erro ao buscar dados");
      }
    }, 2000);
  });
};

// Usando Promise
buscarDados()
  .then(resultado => console.log(resultado))
  .catch(erro => console.error(erro));
```

### Async/Await

```javascript
// Função assíncrona
async function processarDados() {
  try {
    console.log("Iniciando...");

    const resultado = await buscarDados();
    console.log("Resultado:", resultado);

    return "Processamento concluído";
  } catch (erro) {
    console.error("Erro:", erro);
    throw erro;
  }
}

// Executando
processarDados()
  .then(resultado => console.log("Final:", resultado))
  .catch(erro => console.error("Erro final:", erro));
```

**Equivalente em C#:**
```csharp
// C# - async/await
public async Task<string> ProcessarDados() {
  try {
    Console.WriteLine("Iniciando...");

    var resultado = await BuscarDados();
    Console.WriteLine("Resultado:", resultado);

    return "Processamento concluído";
  } catch (Exception ex) {
    Console.WriteLine("Erro:", ex.Message);
    throw;
  }
}
```

## 🔄 Loops e Condicionais

### Condicionais

```javascript
// if/else
const idade = 20;

if (idade >= 18) {
  console.log("Maior de idade");
} else if (idade >= 16) {
  console.log("Menor de idade, pode votar");
} else {
  console.log("Menor de idade");
}

// Switch
const dia = "segunda";

switch (dia) {
  case "segunda":
    console.log("Início da semana");
    break;
  case "sexta":
    console.log("Quase fim de semana");
    break;
  default:
    console.log("Dia normal");
}
```

### Loops

```javascript
// For tradicional
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// For...of (para arrays)
const nomes = ["Ana", "João", "Maria"];
for (const nome of nomes) {
  console.log(nome);
}

// For...in (para objetos)
const pessoa = { nome: "João", idade: 25 };
for (const chave in pessoa) {
  console.log(`${chave}: ${pessoa[chave]}`);
}

// While
let contador = 0;
while (contador < 3) {
  console.log(contador);
  contador++;
}
```

## 🏗️ Módulos ES6

JavaScript moderno usa **módulos ES6** para organizar código.

```javascript
// arquivo: math.js
export const soma = (a, b) => a + b;
export const PI = 3.14159;

export default function multiplicar(a, b) {
  return a * b;
}

// arquivo: main.js
import { soma, PI } from './math.js';
import multiplicar from './math.js';

console.log(soma(2, 3));      // 5
console.log(PI);              // 3.14159
console.log(multiplicar(2, 3)); // 6
```

**Equivalente em C#:**
```csharp
// C# - usando namespaces
using System;

namespace MathUtils {
  public static class Math {
    public static int Soma(int a, int b) => a + b;
    public const double PI = 3.14159;
  }
}

// Usando
using MathUtils;
Console.WriteLine(Math.Soma(2, 3)); // 5
```

## 🎯 Exemplos do Projeto Real

Vamos ver como esses conceitos são aplicados no projeto que analisamos:

### 1. Services - API Client
```javascript
// front/src/services/api-client.ts
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 2. Hooks - Custom Hook
```javascript
// front/src/hooks/use-training-courses.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useTrainingCourses = (filters) => {
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['training-courses', filters],
    queryFn: () => trainingService.getCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return { courses, isLoading, error };
};
```

### 3. Componente React
```javascript
// front/src/components/ui/button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
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
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

## 🧪 Exercícios Práticos

### Exercício 1: Calculadora Simples
```javascript
// Crie uma calculadora que some, subtraia, multiplique e divida
function calculadora(a, b, operacao) {
  switch (operacao) {
    case 'soma':
      return a + b;
    case 'subtracao':
      return a - b;
    case 'multiplicacao':
      return a * b;
    case 'divisao':
      return b !== 0 ? a / b : 'Divisão por zero!';
    default:
      return 'Operação inválida';
  }
}

console.log(calculadora(10, 5, 'soma'));        // 15
console.log(calculadora(10, 5, 'divisao'));     // 2
console.log(calculadora(10, 0, 'divisao'));     // 'Divisão por zero!'
```

### Exercício 2: Sistema de Usuários
```javascript
// Crie um sistema simples de cadastro de usuários
const usuarios = [];

function cadastrarUsuario(nome, email, idade) {
  // Validação básica
  if (!nome || !email || !idade) {
    return { sucesso: false, erro: 'Todos os campos são obrigatórios' };
  }

  if (idade < 18) {
    return { sucesso: false, erro: 'Usuário deve ser maior de idade' };
  }

  // Verificar se email já existe
  const usuarioExistente = usuarios.find(u => u.email === email);
  if (usuarioExistente) {
    return { sucesso: false, erro: 'Email já cadastrado' };
  }

  // Cadastrar usuário
  const novoUsuario = {
    id: usuarios.length + 1,
    nome,
    email,
    idade,
    dataCadastro: new Date().toISOString()
  };

  usuarios.push(novoUsuario);

  return { sucesso: true, usuario: novoUsuario };
}

// Testando
console.log(cadastrarUsuario('João', 'joao@email.com', 25));
console.log(cadastrarUsuario('Maria', 'joao@email.com', 30)); // Email duplicado
console.log(cadastrarUsuario('Pedro', 'pedro@email.com', 16)); // Menor de idade
```

### Exercício 3: API Simulada
```javascript
// Simule uma API com Promises
function simularAPI(dados, delay = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 80% de chance de sucesso
      if (Math.random() > 0.2) {
        resolve(dados);
      } else {
        reject(new Error('Erro na API'));
      }
    }, delay);
  });
}

// Função para buscar usuários
async function buscarUsuarios() {
  try {
    console.log('Buscando usuários...');
    const usuarios = await simularAPI(['Ana', 'João', 'Maria']);
    console.log('Usuários encontrados:', usuarios);
    return usuarios;
  } catch (erro) {
    console.error('Erro ao buscar usuários:', erro.message);
    throw erro;
  }
}

// Usando
buscarUsuarios()
  .then(usuarios => console.log('Sucesso:', usuarios))
  .catch(erro => console.log('Erro capturado:', erro.message));
```

## 📋 Conceitos Avançados (Preview)

### Closures
```javascript
function criarContador() {
  let contador = 0;

  return function() {
    contador++;
    return contador;
  };
}

const contador1 = criarContador();
console.log(contador1()); // 1
console.log(contador1()); // 2

const contador2 = criarContador();
console.log(contador2()); // 1 (contador independente)
```

### Prototipos (vs Classes do C#)
```javascript
// JavaScript - usando protótipos
function Pessoa(nome, idade) {
  this.nome = nome;
  this.idade = idade;
}

Pessoa.prototype.apresentar = function() {
  return `Olá, sou ${this.nome} e tenho ${this.idade} anos`;
};

const joao = new Pessoa('João', 25);
console.log(joao.apresentar());
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Tipagem Dinâmica**
```javascript
let valor = "texto";  // string
valor = 42;           // number (válido!)
valor = true;         // boolean (válido!)

// Em C#: isso daria erro de compilação
```

### 2. **Comparação Solta vs Estrita**
```javascript
console.log(5 == "5");   // true (converte tipos)
console.log(5 === "5");  // false (compara tipos também)
console.log(0 == false); // true (valores falsy)
console.log(0 === false); // false (tipos diferentes)
```

### 3. **Truthy vs Falsy**
```javascript
// Valores "falsy" em JavaScript
if (false) console.log("false");
if (0) console.log("0");
if ("") console.log("string vazia");
if (null) console.log("null");
if (undefined) console.log("undefined");
if (NaN) console.log("NaN");

// Todos os outros valores são "truthy"
if (true) console.log("true");
if (1) console.log("1");
if ("texto") console.log("texto");
if ({}) console.log("objeto vazio");
```

### 4. **Hoisting**
```javascript
// JavaScript move declarações para o topo
console.log(minhaVariavel); // undefined (não erro!)
var minhaVariavel = "valor";

// Equivalente ao que realmente acontece:
var minhaVariavel;
console.log(minhaVariavel); // undefined
minhaVariavel = "valor";

// let e const NÃO são hoisted
console.log(outraVariavel); // ReferenceError
let outraVariavel = "valor";
```

## 🏁 Conclusão

JavaScript pode parecer "simples" no início, mas tem profundidade e conceitos poderosos. A transição do C# para JavaScript envolve:

1. **Aceitar a tipagem dinâmica** (TypeScript vai ajudar!)
2. **Entender o assincronismo** (Promises, async/await)
3. **Aprender os padrões funcionais** (map, filter, reduce)
4. **Dominar o sistema de módulos** (ES6 modules)
5. **Compreender o DOM** (quando for frontend)

## 📚 Próximos Passos

Agora que você conhece os fundamentos do JavaScript, está pronto para:

- **Módulo 2:** Aprender React e JSX
- **Módulo 3:** Dominar TypeScript para ter tipagem estática
- **Módulo 4:** Entender Vite e estrutura de projetos modernos

## 🎯 Resumo do que Aprendemos

✅ **Variáveis e tipos de dados**
✅ **Funções e arrow functions**
✅ **Objetos e arrays**
✅ **Operadores e condicionais**
✅ **Loops e estruturas de controle**
✅ **Assincronismo com Promises e async/await**
✅ **Módulos ES6**
✅ **Diferenças críticas com C#**

---

**🎓 Parabéns! Você completou o Módulo 1!**

**Continue para o [Módulo 2: React e JSX](Modulo-2-React-JSX.md)**

