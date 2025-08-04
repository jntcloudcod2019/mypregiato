const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});