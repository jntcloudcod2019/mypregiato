#!/bin/bash

# Script de build para Zap Bot
echo "🚀 Iniciando build do Zap Bot..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Remover imagens antigas
echo "🗑️ Removendo imagens antigas..."
docker rmi zap-blaster-projeto_zap-bot 2>/dev/null || true

# Build da nova imagem
echo "🔨 Fazendo build da nova imagem..."
docker-compose build --no-cache

# Iniciar containers
echo "▶️ Iniciando containers..."
docker-compose up -d

# Mostrar logs
echo "📋 Logs do Zap Bot:"
docker-compose logs -f zap-bot
