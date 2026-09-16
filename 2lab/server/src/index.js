import app from './app.js';
import { config } from './config.js';
import { initDatabase } from './db/index.js';
import { initBlobStorage } from './services/blobStorage.js';

async function startServer() {
  try {
    console.log('--- Initializing Book Catalog API ---');
    await initDatabase();
    await initBlobStorage();

    app.listen(config.port, () => {
      console.log(`[Server] API running at http://localhost:${config.port}`);
      console.log(`[Server] Health check: http://localhost:${config.port}/health`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
