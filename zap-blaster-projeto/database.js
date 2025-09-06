// database.js - Gerenciador de conexão MySQL para o Bot Zap
require('dotenv').config();

const mysql = require('mysql2/promise');

// Configuração do banco (mesma da API)
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'pregiato_dev',
  charset: 'utf8mb4'
};

// Pool de conexões
let connectionPool = null;

// Cache para OperatorLeads
let operatorLeadsCache = [];
let lastCacheUpdate = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para conectar ao banco
async function connectDatabase() {
  try {
    connectionPool = mysql.createPool(dbConfig);
    console.log('✅ Conectado ao banco MySQL');
    
    // Carregar cache inicial
    await loadOperatorLeadsCache();
    
    return connectionPool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    throw error;
  }
}

// Função para carregar cache de OperatorLeads
async function loadOperatorLeadsCache() {
  try {
    if (!connectionPool) {
      await connectDatabase();
    }
    
    const [rows] = await connectionPool.execute(`
      SELECT OperatorId, EmailOperator, NameLead, PhoneLead 
      FROM OperatorLeads
    `);
    
    operatorLeadsCache = rows;
    lastCacheUpdate = Date.now();
    
    console.log(`📊 Cache carregado: ${rows.length} leads alocados`);
    return rows;
  } catch (error) {
    console.error('❌ Erro ao carregar cache:', error.message);
    throw error;
  }
}

// Função para atualizar cache (se expirou)
async function refreshCacheIfNeeded() {
  if (!lastCacheUpdate || (Date.now() - lastCacheUpdate) > CACHE_TTL) {
    console.log('🔄 Cache expirado, atualizando...');
    await loadOperatorLeadsCache();
  }
}

// Função para validar se um número está na lista de leads
async function isNumberInLeads(phoneNumber) {
  await refreshCacheIfNeeded();
  
  // Normalizar número (remover +, espaços, etc)
  const normalizedNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Verificar se está no cache
  const found = operatorLeadsCache.find(lead => {
    const leadPhone = lead.PhoneLead.replace(/[^0-9]/g, '');
    return leadPhone.includes(normalizedNumber) || normalizedNumber.includes(leadPhone);
  });
  
  return found ? found : null;
}

// Função para obter conexão
async function getConnection() {
  if (!connectionPool) {
    await connectDatabase();
  }
  return connectionPool;
}

// Função para fechar conexão
async function closeDatabase() {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
    console.log('🔌 Conexão com banco fechada');
  }
}

module.exports = {
  connectDatabase,
  getConnection,
  closeDatabase,
  loadOperatorLeadsCache,
  refreshCacheIfNeeded,
  isNumberInLeads
};
