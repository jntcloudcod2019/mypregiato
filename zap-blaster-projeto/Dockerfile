# Dockerfile para Zap Bot - Deploy no Railway
FROM node:18-alpine

# Instalar dependências do sistema necessárias para WhatsApp Web.js
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json primeiro (para cache de layers)
COPY package*.json ./

# Instalar dependências Node.js
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários com permissões corretas
RUN mkdir -p /app/session /app/logs /app/temp /app/downloads /app/whatsapp_data && \
    chown -R appuser:appuser /app

# Mudar para usuário não-root
USER appuser

# Expor porta (Railway usa PORT dinâmico)
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    INSTANCE_ID=zap-prod \
    API_BASE=https://pregiato-api-production.up.railway.app \
    DEBUG=false

# Comando padrão
CMD ["node", "zap.js"]
