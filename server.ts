import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkOllamaHealth, processAssistantChat } from './src/server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SplitMate Server',
    });
  });

  // Assistant status endpoint (checks Ollama & Gemma 3 4B health)
  app.get('/api/assistant/status', async (req, res) => {
    try {
      const status = await checkOllamaHealth();
      res.json(status);
    } catch (err: any) {
      res.status(503).json({
        available: false,
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'gemma3:4b',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
        error: err?.message || 'Failed to check Ollama health',
      });
    }
  });

  // Assistant chat endpoint
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { messages, userId, workspaceData } = req.body;
      if (!messages || !Array.isArray(messages) || !userId || !workspaceData) {
        return res.status(400).json({
          error: 'Missing required parameters: messages, userId, or workspaceData',
        });
      }

      const response = await processAssistantChat({
        messages,
        userId,
        workspaceData,
      });

      res.json(response);
    } catch (err: any) {
      console.error('Error in /api/assistant/chat:', err?.message);
      res.status(503).json({
        error: err?.message || 'Gemma 3 4B via Ollama is unavailable.',
      });
    }
  });

  // Serve with Vite in development or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SplitMate application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize SplitMate server:', err);
  process.exit(1);
});
