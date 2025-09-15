// database.js - Gerenciador de conexão MySQL para o Bot Zap
require('dotenv').config();

const mysql = require('mysql2/promise');

// Configuração do banco baseada no ambiente
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;

// Debug das variáveis de ambiente
console.log('🔍 Debug das variáveis de ambiente:');
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔍 RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT}`);
console.log(`🔍 RAILWAY_PRIVATE_DOMAIN: ${process.env.RAILWAY_PRIVATE_DOMAIN}`);
console.log(`🔍 MYSQLHOST: ${process.env.MYSQLHOST}`);
console.log(`🔍 MYSQLPORT: ${process.env.MYSQLPORT}`);
console.log(`🔍 MYSQLDATABASE: ${process.env.MYSQLDATABASE}`);
console.log(`🔍 MYSQLUSER: ${process.env.MYSQLUSER}`);
console.log(`🔍 MYSQLPASSWORD: ${process.env.MYSQLPASSWORD ? '***DEFINIDA***' : 'NÃO DEFINIDA'}`);
console.log(`🔍 MYSQL_ROOT_PASSWORD: ${process.env.MYSQL_ROOT_PASSWORD ? '***DEFINIDA***' : 'NÃO DEFINIDA'}`);

const dbConfig = isProduction ? {
  // ✅ PRODUÇÃO: Usar URL de conexão direta do Railway
  uri: 'mysql://root:nmZKnTmDpQIwmvRBYIoIbFjYyaiZPoEq@gondola.proxy.rlwy.net:23254/railway',
  charset: 'utf8mb4'
} : {
  // ✅ DESENVOLVIMENTO: Usar configuração local
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'pregiato_dev',
  charset: 'utf8mb4'
};

// Log da configuração de banco (sem senha)
console.log(`🔧 Configuração de banco: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
if (isProduction) {
  console.log(`🔧 URL de conexão: mysql://root:***@gondola.proxy.rlwy.net:23254/railway`);
} else {
  console.log(`🔧 Host: ${dbConfig.host}, Database: ${dbConfig.database}, User: ${dbConfig.user}`);
  console.log(`🔧 Port: ${dbConfig.port}`);
}

// Pool de conexões
let connectionPool = null;

// Cache para OperatorLeads
let operatorLeadsCache = [];
let lastCacheUpdate = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para conectar ao banco
async function connectDatabase() {
  try {
    console.log('🔌 Tentando conectar ao banco MySQL...');
    
    if (isProduction) {
      console.log('🔌 Usando URL de conexão direta para produção');
      connectionPool = mysql.createPool(dbConfig.uri);
    } else {
      console.log('🔌 Configuração local:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
        charset: dbConfig.charset
      });
      connectionPool = mysql.createPool(dbConfig);
    }
    
    // Testar conexão
    const connection = await connectionPool.getConnection();
    console.log('✅ Conectado ao banco MySQL com sucesso!');
    connection.release();
    
    // Carregar cache inicial
    await loadOperatorLeadsCache();
    
    return connectionPool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    console.error('❌ Stack trace:', error.stack);
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
