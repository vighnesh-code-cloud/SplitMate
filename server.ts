import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processAssistantChat } from './src/server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // SplitMate AI Assistant endpoint
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await processAssistantChat(payload);
      return res.json(response);
    } catch (err: any) {
      console.error('Error handling assistant request:', err);
      return res.status(500).json({
        error: 'Failed to process AI assistant request',
        details: err?.message || String(err),
      });
    }
  });

  // Health and Provider Info endpoint
  app.get('/api/health', (req, res) => {
    const geminiAvailable = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    const provider = process.env.LLM_PROVIDER || (geminiAvailable ? 'gemini' : 'local_verified');

    res.json({
      status: 'ok',
      service: 'SplitMate AI Server',
      provider,
      geminiConfigured: geminiAvailable,
      ollamaConfigured: Boolean(process.env.OLLAMA_BASE_URL),
    });
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
    console.log(`SplitMate application running with AI Assistant at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize SplitMate server:', err);
  process.exit(1);
});
