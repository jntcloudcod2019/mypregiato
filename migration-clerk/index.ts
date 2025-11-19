import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID!;
const DELAY_MS = parseInt(process.env.DELAY_MS || '1000');
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS || '10000');
const OFFSET = parseInt(process.env.OFFSET || '0');

interface User {
  external_id: string;
  email_address: string[];
  first_name: string;
  last_name: string;
  password_digest: string;
  password_hasher: 'bcrypt';
  public_metadata: {
    systemRole: string;
  };
  skip_password_checks: boolean;
  skip_password_requirement: boolean;
}

// Criar usuário no Clerk via Backend API
async function createClerkUser(user: User, index: number): Promise<any> {
  try {
    console.log(`\n🔄 [${index}] Criando: ${user.first_name} ${user.last_name} (${user.email_address[0]})`);
    
    const response = await axios.post(
      'https://api.clerk.com/v1/users',
      user,
      {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ [${index}] Criado com sucesso! Clerk ID: ${response.data.id}`);
    
    // Adicionar à organização
    try {
      await axios.post(
        `https://api.clerk.com/v1/organizations/${ORGANIZATION_ID}/memberships`,
        {
          user_id: response.data.id,
          role: 'org:member'
        },
        {
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`🏢 [${index}] Adicionado à organização`);
    } catch (orgError: any) {
      console.warn(`⚠️  [${index}] Não foi possível adicionar à org: ${orgError.message}`);
    }
    
    return { success: true, user, clerkId: response.data.id };
    
  } catch (error: any) {
    if (error.response?.status === 422 && error.response?.data?.errors?.[0]?.message?.includes('already exists')) {
      console.log(`⏭️  [${index}] Usuário já existe, pulando...`);
      return { success: true, user, skipped: true };
    }
    
    if (error.response?.status === 429) {
      console.warn(`⏸️  [${index}] Rate limit atingido! Aguardando ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
      return createClerkUser(user, index); // Retry
    }
    
    console.error(`❌ [${index}] Erro: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    return { success: false, user, error: error.response?.data || error.message };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrate() {
  console.log('🚀 ==================== MIGRAÇÃO EM MASSA CLERK ====================\n');
  
  const usersPath = path.join(__dirname, 'users-processed.json');
  console.log(`📁 Lendo ${usersPath}...`);
  
  if (!fs.existsSync(usersPath)) {
    console.error('❌ Arquivo users-processed.json não encontrado!');
    console.log('💡 Execute primeiro: npm run process\n');
    process.exit(1);
  }
  
  const users: User[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  
  console.log(`📊 Total de usuários: ${users.length}`);
  console.log(`⏩ Offset: ${OFFSET}`);
  console.log(`⏱️  Delay entre requisições: ${DELAY_MS}ms\n`);
  
  const results: any[] = [];
  const errors: any[] = [];
  
  for (let i = OFFSET; i < users.length; i++) {
    const result = await createClerkUser(users[i], i + 1);
    
    if (result.success) {
      results.push(result);
    } else {
      errors.push(result);
    }
    
    // Delay para respeitar rate limit
    if (i < users.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  // Salvar logs
  fs.writeFileSync(
    path.join(__dirname, 'migration-success.json'), 
    JSON.stringify(results, null, 2)
  );
  
  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, 'migration-errors.json'), 
      JSON.stringify(errors, null, 2)
    );
  }
  
  console.log(`\n✅ ==================== MIGRAÇÃO CONCLUÍDA ====================`);
  console.log(`📊 Total processados: ${results.length}`);
  console.log(`❌ Total com erros: ${errors.length}`);
  console.log(`📁 Logs salvos: migration-success.json e migration-errors.json\n`);
}

migrate().catch(console.error);

