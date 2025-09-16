# ---------------------------------------
# Etapa 1: Build
# ---------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia os arquivos de projeto
COPY Pregiato.API/Pregiato.API.csproj Pregiato.API/
COPY Pregiato.Core/Pregiato.Core.csproj Pregiato.Core/
COPY Pregiato.Application/Pregiato.Application.csproj Pregiato.Application/
COPY Pregiato.Infrastructure/Pregiato.Infrastructure.csproj Pregiato.Infrastructure/
COPY Directory.Build.props .

# Restaura dependências
WORKDIR /src/Pregiato.API
RUN dotnet restore "Pregiato.API.csproj"

# Copia todo o código fonte
COPY . .

# Publica a aplicação
RUN dotnet publish "Pregiato.API.csproj" -c Release --no-self-contained -o /app/publish

# ---------------------------------------
# Etapa 2: Runtime
# ---------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Instala dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    libgdiplus \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Cria links simbólicos necessários para compatibilidade
RUN ln -s /usr/lib/libgdiplus.so /usr/lib/gdiplus.dll && \
    ln -s /lib/x86_64-linux-gnu/libdl.so.2 /usr/lib/libdl.so

# Copia os arquivos publicados da etapa de build
COPY --from=build /app/publish ./

# Cria diretórios necessários
RUN mkdir -p /app/logs /app/wwwroot/media

# Define a porta de exposição
EXPOSE 5656

# Variáveis de ambiente
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:${PORT:-5656}

# Executa a aplicação
ENTRYPOINT ["dotnet", "Pregiato.API.dll"]
