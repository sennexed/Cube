/**
 * ScalaCube Minecraft RCON Web Console Backend Bridge
 * Connects frontend WebSockets / HTTP to Minecraft Java Server RCON port.
 *
 * Requirements:
 *   npm install express ws rcon-client
 * Run:
 *   node server.js
 */

const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const { Rcon } = require('rcon-client');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());
// Serve the standalone index.html
app.use(express.static(__dirname));

// Configuration (configure via environment variables or settings API)
const RCON_CONFIG = {
  host: process.env.RCON_HOST || 'play.scalacube.net',
  port: parseInt(process.env.RCON_PORT, 10) || 25575,
  password: process.env.RCON_PASSWORD || 'your_rcon_password',
};

let activeRcon = null;
let isConnected = false;

// Broadcast to all connected web clients
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function stripLeadingSlash(cmd) {
  let cleaned = String(cmd || '').trim();
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1).trim();
  }
  return cleaned;
}

// Connect to RCON
async function connectRcon(host, port, password) {
  if (activeRcon) {
    try {
      await activeRcon.end();
    } catch (e) {
      // ignore
    }
    activeRcon = null;
  }

  try {
    console.log(`[RCON Bridge] Connecting to ${host}:${port}...`);
    const rcon = new Rcon({
      host,
      port: Number(port),
      password,
      timeout: 5000,
    });

    await rcon.connect();
    activeRcon = rcon;
    isConnected = true;
    RCON_CONFIG.host = host;
    RCON_CONFIG.port = Number(port);
    RCON_CONFIG.password = password;

    console.log(`[RCON Bridge] Connected to Minecraft Server at ${host}:${port}`);
    broadcast({
      type: 'status',
      connected: true,
      host,
      port: Number(port),
    });
    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        message: `[RCON Bridge] Connected successfully to ${host}:${port}`,
      },
    });
    return true;
  } catch (err) {
    isConnected = false;
    activeRcon = null;
    console.error(`[RCON Bridge] Connection error:`, err.message);
    broadcast({
      type: 'status',
      connected: false,
      host,
      port: Number(port),
    });
    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        message: `[RCON Bridge] Connection failed: ${err.message}`,
      },
    });
    return false;
  }
}

// REST APIs
app.get('/api/rcon/status', (req, res) => {
  res.json({
    connected: isConnected && activeRcon !== null,
    host: RCON_CONFIG.host,
    port: RCON_CONFIG.port,
  });
});

app.post('/api/rcon/connect', async (req, res) => {
  const { host, port, password } = req.body;
  const ok = await connectRcon(host, port, password);
  if (ok) {
    res.json({ success: true, message: 'Connected to RCON' });
  } else {
    res.status(500).json({ success: false, error: 'Could not connect to Minecraft RCON server' });
  }
});

app.post('/api/rcon/command', async (req, res) => {
  const cmd = stripLeadingSlash(req.body.command);
  if (!cmd) return res.status(400).json({ error: 'Command missing' });

  broadcast({
    type: 'log',
    log: {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'RCON',
      message: `> ${cmd}`,
    },
  });

  if (!activeRcon) {
    return res.status(503).json({ error: 'RCON Bridge not connected to server' });
  }

  try {
    const output = await activeRcon.send(cmd);
    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now() + '-res',
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        message: output || '[Executed without output]',
      },
    });
    res.json({ success: true, output });
  } catch (err) {
    broadcast({
      type: 'log',
      log: {
        id: 'log-' + Date.now() + '-err',
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        message: `Execution failed: ${err.message}`,
      },
    });
    res.status(500).json({ success: false, error: err.message });
  }
});

// WebSocket Handling
wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      type: 'status',
      connected: isConnected && activeRcon !== null,
      host: RCON_CONFIG.host,
      port: RCON_CONFIG.port,
    })
  );

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'command') {
        const cmd = stripLeadingSlash(msg.command);
        if (!cmd) return;

        broadcast({
          type: 'log',
          log: {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'RCON',
            message: `> ${cmd}`,
          },
        });

        if (activeRcon) {
          try {
            const output = await activeRcon.send(cmd);
            broadcast({
              type: 'log',
              log: {
                id: 'log-' + Date.now() + '-res',
                timestamp: new Date().toLocaleTimeString(),
                level: 'INFO',
                message: output || '[Executed successfully]',
              },
            });
          } catch (err) {
            broadcast({
              type: 'log',
              log: {
                id: 'log-' + Date.now() + '-err',
                timestamp: new Date().toLocaleTimeString(),
                level: 'ERROR',
                message: `RCON Error: ${err.message}`,
              },
            });
          }
        }
      }
    } catch (e) {
      // ignore invalid json
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` ScalaCube Minecraft RCON Bridge Server Running!`);
  console.log(` Web Interface: http://localhost:${PORT}`);
  console.log(` WebSocket URL: ws://localhost:${PORT}/ws`);
  console.log(`=======================================================`);
});
