#!/bin/bash

# Script de Setup do Backend .NET com MySQL e PuppeteerSharp
echo "🚀 Configurando Backend .NET para Pregiato..."

# Verificar se .NET 8 está instalado
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET 8 não está instalado. Por favor, instale o .NET 8 SDK primeiro."
    echo "📥 Download: https://dotnet.microsoft.com/download/dotnet/8.0"
    exit 1
fi

echo "✅ .NET 8 encontrado"

# Verificar se MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL não encontrado. Por favor, instale o MySQL primeiro."
    echo "📥 Download: https://dev.mysql.com/downloads/mysql/"
    echo "💡 Ou use Docker: docker run --name mysql-pregiato -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=pregiato -p 3306:3306 -d mysql:8.0"
fi

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
mkdir -p backend/Pregiato.Application/Mappings

echo "✅ Estrutura de pastas criada"

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
dotnet add package Pomelo.EntityFrameworkCore.MySql
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Swashbuckle.AspNetCore
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
dotnet add package FluentValidation.AspNetCore
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package PuppeteerSharp

cd ../Pregiato.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Pomelo.EntityFrameworkCore.MySql

cd ../Pregiato.Application
dotnet add package AutoMapper
dotnet add package FluentValidation

echo "✅ Pacotes NuGet instalados"

# Voltar ao diretório raiz
cd ../..

# Criar arquivo de configuração do MySQL
echo "📝 Configurando MySQL..."

# Verificar se MySQL está rodando
if mysql -u root -ppassword -e "SELECT 1;" 2>/dev/null; then
    echo "✅ MySQL está rodando"
    
    # Criar banco de dados
    mysql -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS pregiato CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "✅ Banco de dados 'pregiato' criado"
else
    echo "⚠️  MySQL não está rodando ou credenciais incorretas"
    echo "💡 Execute: mysql -u root -ppassword -e 'CREATE DATABASE IF NOT EXISTS pregiato;'"
fi

# Criar arquivo .env para configurações
cat > backend/Pregiato.API/.env << EOF
# Configurações do Banco de Dados
ConnectionStrings__DefaultConnection=Server=localhost;Database=pregiato;Uid=root;Pwd=password;Port=3306;CharSet=utf8mb4;

# Configurações de Arquivo
FileStorage__BasePath=uploads
FileStorage__MaxFileSize=10485760
FileStorage__AllowedExtensions__0=.jpg
FileStorage__AllowedExtensions__1=.jpeg
FileStorage__AllowedExtensions__2=.png
FileStorage__AllowedExtensions__3=.pdf
FileStorage__AllowedExtensions__4=.doc
FileStorage__AllowedExtensions__5=.docx

# Configurações do Puppeteer
Puppeteer__ExecutablePath=
Puppeteer__Args__0=--no-sandbox
Puppeteer__Args__1=--disable-setuid-sandbox
Puppeteer__Args__2=--disable-dev-shm-usage
EOF

echo "✅ Arquivo .env criado"

# Criar diretórios para uploads
mkdir -p uploads/contracts
mkdir -p uploads/talents
mkdir -p uploads/temp
mkdir -p logs

echo "✅ Diretórios de upload criados"

# Instalar dependências do PuppeteerSharp
echo "📦 Instalando dependências do PuppeteerSharp..."
cd backend/Pregiato.API
dotnet add package PuppeteerSharp
dotnet restore

echo "✅ Dependências do PuppeteerSharp instaladas"

# Voltar ao diretório raiz
cd ../..

echo ""
echo "🎉 Setup do Backend .NET concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configurar connection string no appsettings.json se necessário"
echo "2. Executar migrations: cd backend/Pregiato.API && dotnet ef migrations add InitialCreate"
echo "3. Executar o projeto: cd backend/Pregiato.API && dotnet run"
echo "4. Acessar Swagger: http://localhost:5000/swagger"
echo ""
echo "🔧 Comandos úteis:"
echo "- Executar projeto: cd backend/Pregiato.API && dotnet run"
echo "- Gerar migration: dotnet ef migrations add NomeDaMigration"
echo "- Aplicar migrations: dotnet ef database update"
echo "- Limpar build: dotnet clean"
echo ""
echo "📚 Documentação:"
echo "- Entity Framework: https://docs.microsoft.com/en-us/ef/core/"
echo "- PuppeteerSharp: https://www.puppeteersharp.com/"
echo "- MySQL: https://dev.mysql.com/doc/" 