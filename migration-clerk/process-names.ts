import * as fs from 'fs';
import * as path from 'path';

interface ProcessedUser {
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

// Função para limpar e separar nomes
function parseName(fullName: string): { firstName: string; lastName: string } {
  // Remove menores, barras extras, quebras de linha
  let cleaned = fullName
    .replace(/\(Menor\)/gi, '')
    .replace(/\(menor\)/gi, '')
    .replace(/-\s*menor/gi, '')
    .replace(/\n/g, ' ')
    .split('/')[0] // Pega só o primeiro nome antes da barra
    .trim();

  // Separar primeiro nome e sobrenome
  const parts = cleaned.split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) return { firstName: 'Usuario', lastName: 'Modelo' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Modelo' };
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

// Função para gerar email
function generateEmail(firstName: string, lastName: string): string {
  const firstPart = firstName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '');
  
  const lastPart = lastName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)[0] // Pega só primeiro sobrenome
    .replace(/[^a-z0-9]/g, '');
  
  return `${firstPart}_${lastPart}@pregiato.com.br`;
}

// Função para gerar external_id
function generateExternalId(firstName: string, index: number): string {
  const cleanFirst = firstName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  return `user_${cleanFirst}_${index}`;
}

// Função para hash bcrypt da senha
function hashPassword(password: string): string {
  // Bcrypt hash pré-gerado para "modelpregiato123"
  return '$2a$12$v83NUNkzXpd4w03jW.En.OVdUbvTtVhMYxOPy4TIhR3lRZ/jhIpLi';
}

// Entradas inválidas para ignorar
const INVALID_ENTRIES = [
  'Cod Operador',
  'VALOR TOTAL',
  'Valor total',
  'Contratos Fechados',
  'Cód. Tele',
  'TODOS COM DNA'
];

async function processNames() {
  console.log('🔄 Processando nomes_unicos.json...\n');
  
  // Ler arquivo original (na raiz do projeto)
  const inputPath = path.join(__dirname, '..', 'nomes_unicos.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Arquivo não encontrado: ${inputPath}`);
    console.log('💡 Certifique-se que nomes_unicos.json está na raiz do projeto\n');
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const names: string[] = JSON.parse(rawData);
  
  const processedUsers: ProcessedUser[] = [];
  const errors: any[] = [];
  const emailSet = new Set<string>();
  
  for (let i = 0; i < names.length; i++) {
    const fullName = names[i];
    
    try {
      // Validar entrada
      if (!fullName || typeof fullName !== 'string') {
        errors.push({ index: i, name: fullName, reason: 'Nome vazio ou inválido' });
        continue;
      }
      
      // Pular entradas especiais
      if (INVALID_ENTRIES.some(invalid => fullName.includes(invalid))) {
        console.log(`⏭️  Pulando: ${fullName}`);
        continue;
      }
      
      // Processar nome
      const { firstName, lastName } = parseName(fullName);
      
      if (!firstName || firstName.length < 2) {
        errors.push({ index: i, name: fullName, reason: 'Nome muito curto' });
        continue;
      }
      
      // Gerar email único
      let email = generateEmail(firstName, lastName);
      let counter = 1;
      while (emailSet.has(email)) {
        const [localPart, domain] = email.split('@');
        email = `${localPart}${counter}@${domain}`;
        counter++;
      }
      emailSet.add(email);
      
      // Criar usuário
      const user: ProcessedUser = {
        external_id: generateExternalId(firstName, i),
        email_address: [email],
        first_name: firstName,
        last_name: lastName,
        password_digest: hashPassword('modelpregiato123'),
        password_hasher: 'bcrypt',
        public_metadata: {
          systemRole: 'MODEL'
        },
        skip_password_checks: true,
        skip_password_requirement: false
      };
      
      processedUsers.push(user);
      console.log(`✅ ${i + 1}/${names.length}: ${firstName} ${lastName} → ${email}`);
      
    } catch (error: any) {
      errors.push({ index: i, name: fullName, reason: error.message });
      console.error(`❌ Erro ao processar "${fullName}": ${error.message}`);
    }
  }
  
  // Salvar resultados
  fs.writeFileSync(
    path.join(__dirname, 'users-processed.json'), 
    JSON.stringify(processedUsers, null, 2)
  );
  
  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, 'process-errors.json'), 
      JSON.stringify(errors, null, 2)
    );
  }
  
  console.log(`\n✅ Processamento concluído!`);
  console.log(`📊 Total processados: ${processedUsers.length}`);
  console.log(`❌ Total com erros: ${errors.length}`);
  console.log(`📁 Arquivo gerado: users-processed.json\n`);
}

processNames().catch(console.error);

