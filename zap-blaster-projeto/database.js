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
    console.error('⚠️ Continuando sem conexão com banco - Zap Bot funcionará em modo limitado');
    console.error('⚠️ Funcionalidades que dependem do banco serão desabilitadas');
    
    // Não lançar erro - continuar sem banco
    connectionPool = null;
    return null;
  }
}

// Função para carregar cache de OperatorLeads
async function loadOperatorLeadsCache() {
  try {
    if (!connectionPool) {
      console.log('⚠️ Sem conexão com banco - cache de leads não será carregado');
      operatorLeadsCache = [];
      lastCacheUpdate = Date.now();
      return [];
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
    console.error('⚠️ Continuando sem cache de leads');
    operatorLeadsCache = [];
    lastCacheUpdate = Date.now();
    return [];
  }
}

// Função para atualizar cache (se expirou)
async function refreshCacheIfNeeded() {
  if (!connectionPool) {
    console.log('⚠️ Sem conexão com banco - cache não será atualizado');
    return;
  }
  
  if (!lastCacheUpdate || (Date.now() - lastCacheUpdate) > CACHE_TTL) {
    console.log('🔄 Cache expirado, atualizando...');
    await loadOperatorLeadsCache();
  }
}

// Função para validar se um número está na lista de leads
async function isNumberInLeads(phoneNumber) {
  try {
    await refreshCacheIfNeeded();
    
    // Se não há conexão com banco, permitir todos os números
    if (!connectionPool) {
      console.log('⚠️ Sem conexão com banco - permitindo todos os números');
      return { 
        OperatorId: 'default', 
        EmailOperator: 'system@default.com', 
        NameLead: 'Sistema', 
        PhoneLead: phoneNumber 
      };
    }
    
    // Normalizar número (remover +, espaços, etc)
    const normalizedNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Verificar se está no cache
    const found = operatorLeadsCache.find(lead => {
      const leadPhone = lead.PhoneLead.replace(/[^0-9]/g, '');
      return leadPhone.includes(normalizedNumber) || normalizedNumber.includes(leadPhone);
    });
    
    return found ? found : null;
  } catch (error) {
    console.error('❌ Erro ao validar número nos leads:', error.message);
    console.log('⚠️ Permitindo número por padrão devido ao erro');
    return { 
      OperatorId: 'default', 
      EmailOperator: 'system@default.com', 
      NameLead: 'Sistema', 
      PhoneLead: phoneNumber 
    };
  }
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
    try {
      await connectionPool.end();
      connectionPool = null;
      console.log('🔌 Conexão com banco fechada');
    } catch (error) {
      console.error('❌ Erro ao fechar conexão com banco:', error.message);
      connectionPool = null;
    }
  } else {
    console.log('⚠️ Nenhuma conexão com banco para fechar');
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
