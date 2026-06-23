const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Get all generations
app.get('/api/generations', async (req, res) => {
  try {
    const generations = await prisma.generation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Parse the JSON strings back to objects
    const parsedGenerations = generations.map(g => ({
      ...g,
      request: JSON.parse(g.request),
      payload: JSON.parse(g.payload),
    }));
    res.json(parsedGenerations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch generations' });
  }
});

// Create a new generation
app.post('/api/generations', async (req, res) => {
  try {
    const { id, title, category, createdAt, request, payload } = req.body;
    const newGeneration = await prisma.generation.create({
      data: {
        id,
        title,
        category,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        request: JSON.stringify(request),
        payload: JSON.stringify(payload),
      },
    });
    res.json({
      ...newGeneration,
      request: JSON.parse(newGeneration.request),
      payload: JSON.parse(newGeneration.payload),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save generation' });
  }
});

// Delete a generation
app.delete('/api/generations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.generation.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete generation' });
  }
});

// ── Pipeline repair logs ──────────────────────────────────────────────────────

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'repair_pipeline.log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// Append a JSON-lines entry to the log file
app.post('/api/repair-logs', (req, res) => {
  try {
    const entry = { ...req.body, serverTimestamp: new Date().toISOString() };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
    res.json({ ok: true });
  } catch (error) {
    console.error('[repair-logs]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Read the full log file (for download)
app.get('/api/repair-logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) return res.json([]);
    const lines = fs.readFileSync(LOG_FILE, 'utf8')
      .split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear the log file
app.delete('/api/repair-logs', (req, res) => {
  try {
    fs.writeFileSync(LOG_FILE, '', 'utf8');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
