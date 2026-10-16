import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { Rcon } from 'rcon-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

interface RconConfig {
  host: string;
  port: number;
  password?: string;
  connected: boolean;
}

let activeRcon: Rcon | null = null;
let currentConfig: RconConfig = {
  host: 'play.scalacube.net',
  port: 25575,
  connected: false,
};

// WebSocket clients
const clients = new Set<WebSocket>();

function broadcast(data: object) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Helper to sanitize command
function cleanCommand(cmd: string): string {
  let cleaned = cmd.trim();
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1).trim();
  }
  return cleaned;
}

// REST Endpoints
app.get('/api/rcon/status', (_req, res) => {
  res.json({
    connected: activeRcon !== null && currentConfig.connected,
    host: currentConfig.host,
    port: currentConfig.port,
  });
});

app.post('/api/rcon/connect', async (req, res) => {
  const { host, port, password } = req.body;
  if (!host || !port || !password) {
    return res.status(400).json({ error: 'Missing host, port, or password' });
  }

  try {
    if (activeRcon) {
      try {
        await activeRcon.end();
      } catch {
        // ignore
      }
      activeRcon = null;
    }

    const rcon = new Rcon({
      host: String(host).trim(),
      port: Number(port),
      password: String(password),
      timeout: 5000,
    });

    await rcon.connect();
    activeRcon = rcon;
    currentConfig = {
      host: String(host).trim(),
      port: Number(port),
      connected: true,
    };

    broadcast({
      type: 'status',
      connected: true,
      host: currentConfig.host,
      port: currentConfig.port,
    });

    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        message: `[RCON Bridge] Connected successfully to ${currentConfig.host}:${currentConfig.port}`,
        source: 'BRIDGE',
      },
    });

    return res.json({ success: true, message: 'Connected to RCON server' });
  } catch (err: any) {
    activeRcon = null;
    currentConfig.connected = false;
    broadcast({
      type: 'status',
      connected: false,
      host: String(host),
      port: Number(port),
    });

    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        message: `[RCON Bridge] Connection failed: ${err.message || 'Unknown socket error'}`,
        source: 'BRIDGE',
      },
    });

    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to connect to RCON server',
    });
  }
});

app.post('/api/rcon/disconnect', async (_req, res) => {
  if (activeRcon) {
    try {
      await activeRcon.end();
    } catch {
      // ignore
    }
    activeRcon = null;
  }
  currentConfig.connected = false;
  broadcast({
    type: 'status',
    connected: false,
    host: currentConfig.host,
    port: currentConfig.port,
  });
  broadcast({
    type: 'log',
    log: {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'WARN',
      message: `[RCON Bridge] Disconnected from server`,
      source: 'BRIDGE',
    },
  });
  res.json({ success: true, message: 'Disconnected' });
});

app.post('/api/rcon/command', async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  const sanitized = cleanCommand(command);

  // Broadcast command sent
  broadcast({
    type: 'log',
    log: {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'RCON',
      message: `> ${sanitized}`,
      source: 'OPERATOR',
    },
  });

  if (!activeRcon) {
    // If not connected, return friendly message so caller knows to use simulated mode or connect
    return res.status(503).json({
      success: false,
      error: 'Not connected to RCON server. Connect via Settings or switch to Simulated Server mode.',
    });
  }

  try {
    const response = await activeRcon.send(sanitized);
    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now() + '-resp',
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        message: response || '[Command executed without output]',
        source: 'SERVER',
      },
    });

    return res.json({ success: true, output: response });
  } catch (err: any) {
    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now() + '-err',
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        message: `Command execution failed: ${err.message}`,
        source: 'SERVER',
      },
    });

    return res.status(500).json({ success: false, error: err.message });
  }
});

// WebSocket Handling
wss.on('connection', (ws) => {
  clients.add(ws);

  // Send initial status
  ws.send(
    JSON.stringify({
      type: 'status',
      connected: activeRcon !== null && currentConfig.connected,
      host: currentConfig.host,
      port: currentConfig.port,
    })
  );

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'command') {
        const cmd = cleanCommand(msg.command || '');
        if (!cmd) return;

        broadcast({
          type: 'log',
          log: {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'RCON',
            message: `> ${cmd}`,
            source: 'OPERATOR',
          },
        });

        if (activeRcon) {
          try {
            const response = await activeRcon.send(cmd);
            broadcast({
              type: 'log',
              log: {
                id: 'log-' + Date.now() + '-resp',
                timestamp: new Date().toLocaleTimeString(),
                level: 'INFO',
                message: response || '[Command executed successfully]',
                source: 'SERVER',
              },
            });
            ws.send(JSON.stringify({ type: 'command_result', success: true, output: response }));
          } catch (err: any) {
            broadcast({
              type: 'log',
              log: {
                id: 'log-' + Date.now() + '-err',
                timestamp: new Date().toLocaleTimeString(),
                level: 'ERROR',
                message: `RCON Error: ${err.message}`,
                source: 'SERVER',
              },
            });
            ws.send(JSON.stringify({ type: 'command_result', success: false, error: err.message }));
          }
        } else {
          ws.send(
            JSON.stringify({
              type: 'command_result',
              success: false,
              error: 'Not connected to RCON. Enable Simulated Mode or connect to your ScalaCube server.',
            })
          );
        }
      }
    } catch {
      // ignore invalid json
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Mount Vite or static server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[RCON Bridge] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
