# ---------------------------------------
# Etapa 1: Build
# ---------------------------------------
FROM node:18-alpine AS build

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ---------------------------------------
# Etapa 2: Production
# ---------------------------------------
FROM node:18-alpine AS production

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar arquivos buildados da etapa anterior
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/server ./server

# Criar diretórios necessários
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 8080

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Comando para servir a aplicação
CMD ["node", "server/index.cjs"]
