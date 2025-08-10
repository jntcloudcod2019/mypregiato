# Pregiato - Sistema de Comunicação WhatsApp

Sistema integrado para gerenciamento e automação de comunicações via WhatsApp, composto por três componentes principais.

## Estrutura do Projeto

O projeto é dividido em três partes principais:

### 1. Back-end (API .NET Core)

API REST desenvolvida em .NET Core com arquitetura em camadas:
- `Pregiato.API`: Camada de apresentação e endpoints
- `Pregiato.Application`: Camada de aplicação e regras de negócio
- `Pregiato.Core`: Camada de domínio
- `Pregiato.Infrastructure`: Camada de infraestrutura e acesso a dados

### 2. ZapBot (Servidor WhatsApp)

Servidor Node.js para integração com WhatsApp:
- Utiliza whatsapp-web.js para comunicação
- Integração com RabbitMQ para mensageria
- Sistema de QR Code para autenticação
- Gerenciamento de sessões WhatsApp

### 3. Front-end (React + Vite)

Interface web moderna desenvolvida com:
- React + TypeScript
- Vite como bundler
- NextUI e Radix UI para componentes
- Tailwind CSS para estilização

## Requisitos

### Back-end
- .NET Core SDK 7.0 ou superior
- SQL Server (ou outro banco configurado)

### ZapBot
- Node.js 18.0 ou superior
- RabbitMQ
- Chrome/Chromium (para WhatsApp Web)

### Front-end
- Node.js 18.0 ou superior
- NPM ou Yarn

## Configuração e Execução

### Back-end

1. Navegue até a pasta `back`
2. Execute:
```bash
dotnet restore
dotnet run --urls="http://localhost:5000"
```

### ZapBot

1. Navegue até a pasta `zap-blaster-projeto`
2. Execute:
```bash
npm install
BOT_STATUS_PORT=3030 npm run dev
```

### Front-end

1. Navegue até a pasta `front`
2. Execute:
```bash
npm install
VITE_PORT=8080 npm run dev
```

## Portas Padrão

- Back-end API: http://localhost:5000
- ZapBot: http://localhost:3030
- Front-end: http://localhost:8080

## Funcionalidades Principais

- Envio e recebimento de mensagens WhatsApp
- Interface administrativa para gerenciamento
- Sistema de templates de mensagens
- Integração com RabbitMQ para processamento assíncrono
- Autenticação via QR Code do WhatsApp
- Monitoramento de status de conexão

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
