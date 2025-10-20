# ---------------------------------------
# Etapa 1: Build com Node + npm
# ---------------------------------------
FROM mirror.gcr.io/library/node:18-alpine AS build

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências com npm
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ---------------------------------------
# Etapa 2: Production - Servidor Node
# ---------------------------------------
FROM mirror.gcr.io/library/node:18-alpine AS production

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar apenas dependências de produção (npm ainda é usado aqui por ser menor)
RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

# Copiar arquivos necessários da etapa de build
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/public ./public
COPY --chown=nodejs:nodejs server ./server

# Criar diretórios necessários
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 8080

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Comando para servir a aplicação
CMD ["node", "server/index.cjs"]
