# 🎓 CURSO COMPLETO - SISTEMA PREGIATO

## 📚 Bem-vindo ao Curso de Desenvolvimento Full Stack para Atendimento WhatsApp

Este curso cobre a construção completa de um sistema profissional de atendimento via WhatsApp, integrando múltiplas tecnologias modernas e práticas de desenvolvimento de software de nível enterprise.

---

## 🎯 OBJETIVO DO CURSO

Ao final deste curso, você será capaz de:

- ✅ Desenvolver aplicações full stack com .NET Core e React
- ✅ Integrar WhatsApp Business API (Meta Cloud API)
- ✅ Implementar arquiteturas de mensageria com RabbitMQ
- ✅ Construir sistemas real-time com SignalR
- ✅ Gerenciar mídia com MinIO (S3-compatible)
- ✅ Implementar padrões de resiliência (Circuit Breaker, Retry, DLQ)
- ✅ Desenvolver sistemas escaláveis e production-ready
- ✅ Aplicar Clean Architecture e SOLID
- ✅ Implementar autenticação e autorização
- ✅ Deploy em ambientes cloud (Railway)

---

## 👥 PÚBLICO-ALVO

- **Desenvolvedores Full Stack** (2+ anos de experiência)
- **Desenvolvedores Backend** (.NET ou Node.js)
- **Desenvolvedores Frontend** (React/TypeScript)
- **Arquitetos de Software** (interessados em sistemas de mensageria)
- **Tech Leads** (buscando referências de arquitetura)

---

## 📋 PRÉ-REQUISITOS

### **Conhecimentos Necessários:**

**Essenciais:**
- ✅ C# básico (.NET Core)
- ✅ JavaScript/TypeScript básico
- ✅ React básico (componentes, hooks)
- ✅ SQL básico (MySQL)
- ✅ HTTP/REST APIs
- ✅ Git básico

**Desejáveis:**
- 🔸 Docker básico
- 🔸 Design Patterns
- 🔸 Async/Await
- 🔸 Mensageria básica

### **Ferramentas Necessárias:**

- Visual Studio Code ou Visual Studio
- .NET SDK 8.0+
- Node.js 18+
- MySQL 8.0+
- Docker Desktop (opcional)
- Postman ou similar
- Git

---

## 📚 ESTRUTURA DO CURSO

### **MÓDULO 1: FUNDAMENTOS E ARQUITETURA** (8 horas)
📁 `01-fundamentos-arquitetura/`

- Visão geral do sistema
- Arquitetura Clean Architecture
- Padrões de projeto utilizados
- Setup do ambiente de desenvolvimento
- Estrutura de pastas e organização

### **MÓDULO 2: BACKEND - API REST COM .NET CORE** (20 horas)
📁 `02-backend-dotnet/`

- ASP.NET Core Web API
- Entity Framework Core + MySQL
- Repository Pattern e UoW
- DTOs e AutoMapper
- Validação com FluentValidation
- Dependency Injection
- Middleware customizados

### **MÓDULO 3: FRONTEND - REACT + TYPESCRIPT** (16 horas)
📁 `03-frontend-react/`

- Setup com Vite
- TypeScript avançado
- Context API e Custom Hooks
- TanStack Query (React Query)
- Shadcn/UI + Tailwind CSS
- Gestão de estado
- Otimização de performance

### **MÓDULO 4: AUTENTICAÇÃO E AUTORIZAÇÃO** (8 horas)
📁 `04-autenticacao-autorizacao/`

- Clerk Authentication
- JWT Tokens
- Role-Based Access Control (RBAC)
- Middleware de autenticação
- Proteção de rotas no frontend

### **MÓDULO 5: INTEGRAÇÃO WHATSAPP (ZAP-BLASTER)** (12 horas)
📁 `05-integracao-whatsapp-zapblaster/`

- whatsapp-web.js
- QR Code authentication
- Eventos de mensagens
- Download e envio de mídia
- Conversão de áudio (FFmpeg)
- Gestão de sessão

### **MÓDULO 6: MENSAGERIA COM RABBITMQ** (10 horas)
📁 `06-mensageria-rabbitmq/`

- Conceitos de mensageria
- Instalação e configuração
- Exchanges, Queues e Bindings
- Publisher e Consumer
- Padrões de mensageria
- Tratamento de erros

### **MÓDULO 7: REAL-TIME COM SIGNALR** (8 horas)
📁 `07-realtime-signalr/`

- Conceitos de WebSockets
- SignalR Hubs
- Conexão cliente-servidor
- Broadcasting e grupos
- Integração com React
- Tratamento de reconexão

### **MÓDULO 8: MICROSERVIÇO DE ATENDIMENTO** (16 horas) ⭐ NOVO!
📁 `08-microservico-atendimento/`

**Arquitetura em Camadas com DUAS Opções de Implementação**

- Clean Architecture em microserviços
- Separação de responsabilidades
- Domain, Application, Infrastructure, Presentation Layers

**Opção 1: WhatsApp Web Client** (para alunos sem Meta Business)
- whatsapp-web.js implementation
- QR Code authentication
- LocalAuth strategy
- ✅ Sem custo, setup rápido

**Opção 2: Meta Cloud API** (para alunos com Meta Business)
- Meta Cloud API official
- Webhooks integration
- OAuth authentication
- ✅ Production-ready, escalável

### **MÓDULO 9: ARMAZENAMENTO DE MÍDIA (MINIO)** (6 horas)
📁 `09-armazenamento-minio/`

- S3-compatible storage
- MinIO setup e configuração
- Upload e download de arquivos
- Presigned URLs
- Integração com .NET
- Fallback para storage local

### **MÓDULO 10: SISTEMA DE CHATLOG E PAYLOADJSON** (8 horas)
📁 `10-sistema-chatlog/`

- Estrutura de dados ChatLog
- PayloadJson architecture
- Incremento de mensagens
- Busca e filtros
- Histórico de conversas
- Otimizações de performance

### **MÓDULO 11: GERENCIAMENTO DE LEADS** (6 horas)
📁 `11-gerenciamento-leads/`

- Modelo de dados Lead
- CRUD completo
- Filtros avançados
- Distribuição de leads
- Cache de leads por operador
- Métricas e dashboards

### **MÓDULO 12: SISTEMA DE TREINAMENTOS** (8 horas)
📁 `12-sistema-treinamentos/`

- Cursos e lições
- Upload de vídeos
- Progresso do aluno
- Certificados
- Integração com MinIO

### **MÓDULO 13: PADRÕES DE RESILIÊNCIA** (10 horas)
📁 `13-padroes-resiliencia/`

- Circuit Breaker Pattern
- Retry com Exponential Backoff
- Dead Letter Queue (DLQ)
- Health Checks
- Timeout e Fallback
- Monitoramento

### **MÓDULO 14: MIGRAÇÃO PARA META CLOUD API** (12 horas)
📁 `14-migracao-meta-api/`

- Meta Business Manager setup
- OAuth authentication
- Envio de mensagens via Meta API
- Webhooks
- Upload e download de mídia
- Dual Mode implementation
- Migração gradual

### **MÓDULO 15: TESTES AUTOMATIZADOS** (10 horas)
📁 `15-testes-automatizados/`

- xUnit para backend
- Jest + React Testing Library
- Testes de integração
- Mocks e Stubs
- Coverage reports
- CI/CD com testes

### **MÓDULO 16: DEPLOY E DEVOPS** (8 horas)
📁 `16-deploy-devops/`

- Docker e Docker Compose
- Railway deployment
- Variáveis de ambiente
- Logs e monitoramento
- CI/CD pipelines
- Rollback strategies

### **MÓDULO 17: OTIMIZAÇÃO E PERFORMANCE** (8 horas)
📁 `17-otimizacao-performance/`

- Database indexing
- Query optimization
- Caching strategies
- Frontend bundle optimization
- Lazy loading
- CDN e assets

### **MÓDULO 18: SEGURANÇA** (6 horas)
📁 `18-seguranca/`

- OWASP Top 10
- SQL Injection prevention
- XSS e CSRF protection
- Rate limiting
- Secrets management
- HTTPS e certificados

### **MÓDULO 19: PROJETO FINAL** (20 horas)
📁 `19-projeto-final/`

- Implementação completa
- Integração de todos os módulos
- Deploy em produção
- Documentação
- Apresentação

---

## ⏱️ CARGA HORÁRIA TOTAL

**Total:** ~200 horas (~25 dias úteis em 8h/dia)

**Distribuição:**
- **Teoria:** 30% (~55h)
- **Prática:** 60% (~110h)
- **Projeto Final:** 10% (~20h)

---

## 🎓 METODOLOGIA

### **Aprendizado Baseado em Projetos:**

Cada módulo segue a estrutura:

1. **📖 Teoria** (20-30 min)
   - Conceitos fundamentais
   - Diagramas e exemplos
   
2. **💻 Prática Guiada** (1-2 horas)
   - Código passo a passo
   - Explicação detalhada
   
3. **🔨 Exercícios** (30-60 min)
   - Desafios práticos
   - Soluções comentadas
   
4. **🎯 Projeto Incremental** (30-60 min)
   - Construir parte do sistema
   - Integração com módulos anteriores
   
5. **✅ Quiz/Revisão** (15 min)
   - Fixação de conceitos
   - Identificação de gaps

---

## 🛠️ STACK TECNOLÓGICA COMPLETA

### **Backend:**
- .NET Core 8.0
- ASP.NET Core Web API
- Entity Framework Core
- MySQL 8.0
- AutoMapper
- FluentValidation
- Serilog

### **Frontend:**
- React 18
- TypeScript 5
- Vite
- TanStack Query
- Tailwind CSS
- Shadcn/UI
- Zustand

### **Integrações:**
- WhatsApp Web.js
- Meta Cloud API
- Clerk Auth
- RabbitMQ
- SignalR
- MinIO

### **DevOps:**
- Docker
- Docker Compose
- Railway
- GitHub Actions

### **Ferramentas:**
- Postman
- DBeaver
- Git
- VS Code

---

## 📖 MATERIAL DE APOIO

Cada módulo inclui:

- ✅ **README.md** - Conteúdo teórico
- ✅ **EXEMPLOS.md** - Código comentado
- ✅ **EXERCICIOS.md** - Desafios práticos
- ✅ **SOLUCOES.md** - Respostas dos exercícios
- ✅ **REFERENCIAS.md** - Links e docs externas
- ✅ **FAQ.md** - Perguntas frequentes
- ✅ Código fonte completo do módulo
- ✅ Diagramas e imagens

---

## 🎯 RESULTADOS ESPERADOS

Ao final do curso, você terá:

- ✅ **Portfolio:** Sistema completo funcionando
- ✅ **Conhecimento:** 18 módulos de conteúdo enterprise
- ✅ **Experiência:** Projeto real de produção
- ✅ **Código:** Repository completo no GitHub
- ✅ **Deploy:** Aplicação publicada e funcionando
- ✅ **Certificado:** Documento de conclusão

---

## 🚀 COMO USAR ESTE CURSO

### **Modo Sequencial (Recomendado):**

```
Módulo 1 → Módulo 2 → ... → Módulo 18
```

**Vantagens:**
- Aprendizado progressivo
- Cada módulo prepara para o próximo
- Projeto evolui gradualmente

### **Modo Modular (Avançado):**

Se você já tem experiência em alguma área:

```
Backend Developer:
→ Módulos 1, 2, 4, 6, 8, 9, 12, 13, 15

Frontend Developer:
→ Módulos 1, 3, 4, 7, 16

Full Stack:
→ Todos os módulos
```

---

## 📊 AVALIAÇÃO

### **Aprovação:**

- ✅ Conclusão de 80% dos exercícios
- ✅ Projeto final funcionando
- ✅ Deploy realizado
- ✅ Documentação completa

### **Certificado:**

Ao completar todos os requisitos, você receberá:

**Certificado de Conclusão:**
"Desenvolvimento Full Stack - Sistema de Atendimento WhatsApp Enterprise"

---

## 🤝 SUPORTE E COMUNIDADE

- 💬 **Discord:** Comunidade ativa
- 📧 **Email:** Suporte técnico
- 🐛 **GitHub Issues:** Reporte de bugs
- 📹 **YouTube:** Vídeo-aulas complementares
- 📝 **Blog:** Artigos e tutoriais

---

## 📅 CRONOGRAMA SUGERIDO

### **Intensivo (1 mês):**
- 8 horas/dia, 5 dias/semana
- 1 módulo a cada 1-2 dias

### **Regular (3 meses):**
- 3 horas/dia, 5 dias/semana
- 1 módulo por semana

### **Flexível (6 meses):**
- 1-2 horas/dia
- No seu ritmo

---

## 🎬 COMEÇAR AGORA

### **Passo 1: Setup Inicial**

```bash
# Clone o repositório
git clone https://github.com/seu-repo/pregiato.git

# Instale dependências
cd back/Pregiato.API
dotnet restore

cd ../../front
npm install
```

### **Passo 2: Acesse o Módulo 1**

```bash
cd curso/01-fundamentos-arquitetura
cat README.md
```

### **Passo 3: Siga as Instruções**

Cada módulo tem um README com:
- Objetivos de aprendizado
- Teoria
- Prática guiada
- Exercícios
- Recursos

---

## 🏆 PROJETOS REAIS QUE VOCÊ VAI CONSTRUIR

Ao longo do curso, você construirá:

1. **Sistema de Autenticação** com Clerk
2. **API REST completa** com .NET Core
3. **Interface React moderna** com Tailwind
4. **Integração WhatsApp** (Web.js + Meta API)
5. **Sistema de mensageria** com RabbitMQ
6. **Chat em tempo real** com SignalR
7. **Upload de arquivos** com MinIO
8. **Gerenciamento de leads** com cache
9. **Sistema de treinamentos** com vídeos
10. **Padrões de resiliência** production-ready

---

## 📚 PRÓXIMOS PASSOS

1. ✅ Leia este README completamente
2. ✅ Verifique os pré-requisitos
3. ✅ Instale as ferramentas necessárias
4. ✅ Faça o setup do ambiente
5. ✅ Comece pelo Módulo 1

---

## 🌟 FEEDBACK E CONTRIBUIÇÕES

Este curso é vivo e evolui constantemente!

- 🐛 **Encontrou um erro?** Abra uma issue
- 💡 **Tem uma sugestão?** Envie um PR
- ⭐ **Gostou?** Dê uma estrela no GitHub
- 📢 **Compartilhe** com outros desenvolvedores

---

## 📞 CONTATO

- **GitHub:** [@seu-usuario](https://github.com/seu-usuario)
- **Email:** contato@pregiato.com
- **LinkedIn:** [Seu Nome](https://linkedin.com)
- **Discord:** [Servidor da Comunidade](https://discord.gg)

---

## 📜 LICENÇA

Este curso é fornecido para fins educacionais.

**Copyright © 2025 - Todos os direitos reservados**

---

## 🎯 MOTIVAÇÃO FINAL

> "A melhor forma de aprender desenvolvimento de software é construindo sistemas reais que resolvem problemas reais."

Este curso não é teórico. Você vai construir um sistema profissional, pronto para produção, usado por empresas reais.

**Você está pronto para essa jornada?**

**Vamos começar! 🚀**

---

**Última atualização:** 2025-10-17  
**Versão do curso:** 1.0  
**Próxima revisão:** 2025-11-01

