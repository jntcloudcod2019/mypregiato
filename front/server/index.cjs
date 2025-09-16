const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ CORREÇÃO: Serve os arquivos estáticos da pasta 'dist' (React SPA)
const frontEndPath = path.join(__dirname, '../dist');
app.use(express.static(frontEndPath));

// Routes
app.get('/api/talents', async (req, res) => {
  try {
    const talents = await prisma.talent.findMany({
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(talents);
  } catch (error) {
    console.error('Error fetching talents:', error);
    res.status(500).json({ error: 'Failed to fetch talents' });
  }
});

app.get('/api/talents/:id', async (req, res) => {
  try {
    const talent = await prisma.talent.findUnique({
      where: { id: req.params.id },
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      }
    });
    
    if (!talent) {
      return res.status(404).json({ error: 'Talent not found' });
    }
    
    res.json(talent);
  } catch (error) {
    console.error('Error fetching talent:', error);
    res.status(500).json({ error: 'Failed to fetch talent' });
  }
});

app.post('/api/talents', async (req, res) => {
  try {
    const talent = await prisma.talent.create({
      data: {
        ...req.body,
        inviteSent: false,
        status: true,
        dnaStatus: 'UNDEFINED'
      },
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      }
    });
    res.status(201).json(talent);
  } catch (error) {
    console.error('Error creating talent:', error);
    console.error('Error meta:', error.meta);
    
    // Tratar erros específicos do Prisma
    if (error.code === 'P2002') {
      // Como o target pode não estar funcionando corretamente, vamos usar uma mensagem genérica
      return res.status(400).json({ 
        error: 'Já existe um talento com este email ou documento',
        field: 'email/documento'
      });
    }
    
    res.status(500).json({ error: 'Failed to create talent' });
  }
});

app.put('/api/talents/:id', async (req, res) => {
  try {
    const talent = await prisma.talent.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      }
    });
    res.json(talent);
  } catch (error) {
    console.error('Error updating talent:', error);
    res.status(500).json({ error: 'Failed to update talent' });
  }
});

app.get('/api/talents/check-exists', async (req, res) => {
  try {
    const { email, document } = req.query;
    
    const existingTalent = await prisma.talent.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          document ? { document } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });
    
    res.json({ exists: !!existingTalent });
  } catch (error) {
    console.error('Error checking talent existence:', error);
    res.status(500).json({ error: 'Failed to check talent existence' });
  }
});

app.get('/api/producers', async (req, res) => {
  try {
    const producers = await prisma.user.findMany({
      where: {
        role: {
          in: ['PRODUCER', 'ADMIN']
        }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        clerk_id: true
      }
    });
    
    const producersWithCode = producers.map(producer => ({
      ...producer,
      code: `PM-${producer.id.slice(-3).toUpperCase()}`
    }));
    
    res.json(producersWithCode);
  } catch (error) {
    console.error('Error fetching producers:', error);
    res.status(500).json({ error: 'Failed to fetch producers' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'frontend', timestamp: new Date().toISOString() });
});

// ✅ CORREÇÃO: Rota "catch-all" para servir o index.html em qualquer rota não-API
// Esta rota DEVE vir por último, após todas as rotas de API
// Permite que o React Router gerencie todas as rotas da SPA (/login, /dashboard, /crm/*, etc.)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontEndPath, 'index.html'));
});

// ✅ CORREÇÃO: Configurar servidor para escutar em todas as interfaces (necessário para Railway)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${frontEndPath}`);
  console.log(`🌐 Accessible at: http://0.0.0.0:${PORT}`);
  console.log(`✅ SPA routing configured - all non-API routes will serve index.html`);
  console.log(`📋 Available routes: /login, /dashboard, /crm/*, /talentos/*, /atendimento/*, etc.`);
}); 