#!/bin/bash

# Script de Migração para .NET Core
# Este script cria a estrutura básica do projeto .NET

echo "🚀 Iniciando migração para .NET Core..."

# Criar estrutura de pastas
mkdir -p backend/Pregiato.API
mkdir -p backend/Pregiato.Core/Entities
mkdir -p backend/Pregiato.Core/Interfaces
mkdir -p backend/Pregiato.Infrastructure/Data
mkdir -p backend/Pregiato.Infrastructure/Repositories
mkdir -p backend/Pregiato.Application/DTOs
mkdir -p backend/Pregiato.Application/Interfaces
mkdir -p backend/Pregiato.Application/Services
mkdir -p backend/Pregiato.Application/Validators

echo "✅ Estrutura de pastas criada"

# Verificar se .NET 8 está instalado
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET 8 não está instalado. Por favor, instale o .NET 8 SDK primeiro."
    echo "📥 Download: https://dotnet.microsoft.com/download/dotnet/8.0"
    exit 1
fi

echo "✅ .NET 8 encontrado"

# Criar projetos .NET
cd backend

echo "📦 Criando projetos .NET..."

# API Project
dotnet new webapi -n Pregiato.API --no-https

# Class Libraries
dotnet new classlib -n Pregiato.Core
dotnet new classlib -n Pregiato.Infrastructure
dotnet new classlib -n Pregiato.Application

echo "✅ Projetos .NET criados"

# Adicionar referências entre projetos
cd Pregiato.API
dotnet add reference ../Pregiato.Core/Pregiato.Core.csproj
dotnet add reference ../Pregiato.Infrastructure/Pregiato.Infrastructure.csproj
dotnet add reference ../Pregiato.Application/Pregiato.Application.csproj

cd ../Pregiato.Infrastructure
dotnet add reference ../Pregiato.Core/Pregiato.Core.csproj

cd ../Pregiato.Application
dotnet add reference ../Pregiato.Core/Pregiato.Core.csproj

echo "✅ Referências entre projetos configuradas"

# Adicionar pacotes NuGet necessários
cd ../Pregiato.API
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Swashbuckle.AspNetCore
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
dotnet add package FluentValidation.AspNetCore
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console

cd ../Pregiato.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer

cd ../Pregiato.Application
dotnet add package AutoMapper
dotnet add package FluentValidation

echo "✅ Pacotes NuGet instalados"

# Voltar ao diretório raiz
cd ../..

echo "🎉 Migração para .NET Core concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configurar connection string no appsettings.json"
echo "2. Implementar DbContext no Pregiato.Infrastructure"
echo "3. Implementar Services no Pregiato.Application"
echo "4. Configurar Dependency Injection"
echo "5. Executar migrations: dotnet ef migrations add InitialCreate"
echo "6. Atualizar frontend para usar nova API"
echo ""
echo "🔧 Para executar o projeto:"
echo "cd backend/Pregiato.API"
echo "dotnet run" 