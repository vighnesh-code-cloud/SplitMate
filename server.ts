import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkOllamaHealth, processAssistantChat } from './src/server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listenWithPortFallback(
  app: express.Express,
  initialPort: number,
  host: string
): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    let currentPort = initialPort;
    const maxRetries = 10;
    let attempts = 0;

    function tryListen() {
      const server = http.createServer(app);

      server.once('listening', () => {
        resolve({ server, port: currentPort });
      });

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          if (attempts < maxRetries) {
            attempts++;
            const nextPort = currentPort + 1;
            console.warn(`[SplitMate] Port ${currentPort} is in use. Retrying on port ${nextPort}...`);
            currentPort = nextPort;
            tryListen();
          } else {
            reject(
              new Error(
                `Ports ${initialPort} through ${currentPort} are all currently occupied. Please free up a port or configure PORT in your environment.`
              )
            );
          }
        } else {
          reject(err);
        }
      });

      server.listen(currentPort, host);
    }

    tryListen();
  });
}

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

  try {
    const { port: boundPort } = await listenWithPortFallback(app, PORT, '0.0.0.0');

    const localUrl = `http://localhost:${boundPort}`;
    const apiUrl = `http://localhost:${boundPort}/api`;
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'gemma3:4b';

    console.log('\n');
    console.log('  ==============================================================');
    console.log('   SplitMate — Expense Splitting & AI Assistant Development Server');
    console.log('  ==============================================================');
    console.log('');
    console.log(`   ➜  Frontend (Web App):   ${localUrl}`);
    console.log(`   ➜  Backend API Base:     ${apiUrl}`);
    console.log(`   ➜  API Health Check:     ${apiUrl}/health`);
    console.log(`   ➜  AI Assistant Status:  ${apiUrl}/assistant/status`);
    console.log('');
    console.log(`   AI Engine: Gemma 3 4B via Ollama (${ollamaModel} @ ${ollamaUrl})`);
    console.log('   (Note: Ollama is optional for core features; runs locally if active)');
    console.log('  ==============================================================\n');
  } catch (err: any) {
    console.error('\n[SplitMate] Fatal error starting development server:');
    console.error(err?.message || err);
    console.error('\nTroubleshooting tips:');
    console.error(' 1. Check if another instance of SplitMate is already running.');
    console.error(' 2. Verify that you have permissions to bind to network interfaces.');
    console.error(' 3. Run with PORT=3001 npm run dev to force a different port.\n');
    process.exit(1);
  }
}

startServer().catch((err) => {
  console.error('[SplitMate] Fatal initialization failure:', err);
  process.exit(1);
});
