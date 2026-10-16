import React, { useState } from 'react';
import {
  X,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  BookOpen,
  Server,
  Layers,
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface StandaloneExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneExportModal: React.FC<StandaloneExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend' | 'guide' | 'txt_guide'>('frontend');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // We can provide direct copy of the standalone code
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    playSound('pop');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('success');
  };

  const frontendSnippet = `<!-- Complete Single-File Standalone Minecraft Web Console -->
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>Minecraft Server Web Console - ScalaCube RCON</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body class="bg-[#0d1117] text-[#c9d1d9] font-sans">
  <!-- Features:
       1. Top Bar & Telemetry (CPU, RAM, 20.0 TPS, Player Slots)
       2. Center Live Terminal with Color Logs & Slash-Stripping Prompt
       3. Right Panel Targeted Player Matrix (OP, Gamemodes, Heal, Give Item, Moderation)
       4. Left Panel World Controls (Day/Night, Weather, Gamerules)
       5. Toggle between Simulated Server & Live RCON Bridge (ws://localhost:3001)
  -->
  <!-- See full standalone/index.html in repository root -->
</body>
</html>`;

  const backendSnippet = `/**
 * ScalaCube Minecraft RCON Web Console Backend Bridge
 * Node.js + Express + ws + rcon-client
 *
 * Install:
 *   npm install express ws rcon-client
 * Run:
 *   node server.js
 */

const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { Rcon } = require('rcon-client');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());
app.use(express.static(__dirname));

let activeRcon = null;
let isConnected = false;

// Connect to ScalaCube Minecraft RCON port
async function connectRcon(host, port, password) {
  try {
    const rcon = new Rcon({ host, port: Number(port), password, timeout: 5000 });
    await rcon.connect();
    activeRcon = rcon;
    isConnected = true;
    console.log(\`[RCON Bridge] Connected to \${host}:\${port}\`);
    return true;
  } catch (err) {
    console.error(\`[RCON Bridge] Connection error:\`, err.message);
    return false;
  }
}

// See full standalone/server.js in repository root
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Bridge running on http://localhost:\${PORT}\`);
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between bg-[#1b212c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Standalone Deliverables & Setup</h3>
              <p className="text-xs text-slate-400 font-mono">
                Single-File Frontend (`index.html`) & Backend Bridge (`server.js`)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#12161f] border-b border-[#21262d]">
          <button
            onClick={() => setActiveTab('frontend')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'frontend'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Single-File Frontend (index.html)</span>
          </button>

          <button
            onClick={() => setActiveTab('backend')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backend'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Node.js Bridge (server.js)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>ScalaCube Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('txt_guide')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'txt_guide'
                ? 'bg-[#21262d] text-white border border-[#30363d]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>HOW_IT_WORKS.txt</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'frontend' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase font-mono">
                    Part 1: Single-File Vanilla JS / Tailwind Frontend
                  </h4>
                  <p className="text-xs text-slate-400">
                    Self-contained in <code className="text-slate-300">standalone/index.html</code>. Works immediately in offline/interactive simulation mode and connects to live WebSocket bridge.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(frontendSnippet)}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('index.html', frontendSnippet)}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
                <pre>{frontendSnippet}</pre>
              </div>
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase font-mono">
                    Part 2: Lightweight Node.js RCON Bridge
                  </h4>
                  <p className="text-xs text-slate-400">
                    Located in <code className="text-slate-300">standalone/server.js</code>. Connects web browsers via WebSockets/REST to your ScalaCube RCON port.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(backendSnippet)}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('server.js', backendSnippet)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
                <pre>{backendSnippet}</pre>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-300">
              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2.5">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Step 1: Enable RCON on ScalaCube Minecraft Server
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                  <li>Navigate to your ScalaCube control panel and stop your Minecraft server.</li>
                  <li>Click on <strong>File Manager</strong> in the left sidebar.</li>
                  <li>Locate and open the file named <code className="text-slate-200 font-mono">server.properties</code>.</li>
                  <li>
                    Look for or append these lines:
                    <div className="mt-1.5 p-2.5 rounded bg-[#161b22] border border-[#21262d] font-mono text-[11px] text-emerald-300">
                      <div>enable-rcon=true</div>
                      <div>rcon.port=25575</div>
                      <div>rcon.password=YourSecretPasswordHere</div>
                    </div>
                  </li>
                  <li>Save the file and start your Minecraft server.</li>
                </ol>
              </div>

              <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2.5">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Step 2: Run the Standalone Bridge (or use the Integrated Web Console)
                </h4>
                <div className="space-y-2 text-slate-400">
                  <p>In this applet, the full-stack server is already running with Express and WebSocket support on port 3000!</p>
                  <p>To run the standalone server on your own local computer or server:</p>
                  <div className="p-2.5 rounded bg-[#161b22] border border-[#21262d] font-mono text-[11px] text-cyan-300 space-y-1">
                    <div>mkdir minecraft-console && cd minecraft-console</div>
                    <div>npm init -y</div>
                    <div>npm install express ws rcon-client</div>
                    <div>node server.js</div>
                  </div>
                  <p>Open <code className="text-slate-200 font-mono">http://localhost:3001</code> in your browser to access the control panel!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'txt_guide' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase font-mono">
                    HOW_IT_WORKS.txt (Operational Guide & Architecture)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Full plain-text documentation of the dual-mode architecture, RCON commands, and ScalaCube configuration.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetch('/HOW_IT_WORKS.txt')
                        .then((res) => res.text())
                        .then((text) => handleCopy(text))
                        .catch(() => handleCopy('HOW_IT_WORKS.txt available in repository root.'));
                    }}
                    className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => {
                      fetch('/HOW_IT_WORKS.txt')
                        .then((res) => res.text())
                        .then((text) => handleDownload('HOW_IT_WORKS.txt', text))
                        .catch(() => handleDownload('HOW_IT_WORKS.txt', 'HOW_IT_WORKS.txt'));
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] font-mono text-xs text-slate-300 overflow-x-auto max-h-72 select-text">
                <iframe
                  src="/HOW_IT_WORKS.txt"
                  className="w-full h-64 bg-transparent border-0 text-slate-300 font-mono text-xs"
                  title="HOW_IT_WORKS.txt"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#21262d] bg-[#12161f] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
