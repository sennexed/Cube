/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ServerMode,
  ConnectionStatus,
  Player,
  LogEntry,
  Telemetry,
  GameruleState,
  RconConfig,
  ToastMessage,
} from './types';
import {
  INITIAL_PLAYERS,
  INITIAL_LOGS,
  INITIAL_GAMERULES,
} from './data/mockData';
import {
  sanitizeCommand,
  executeSimulatedCommand,
  AMBIENT_SIMULATION_MESSAGES,
} from './utils/minecraft';
import { playSound, toggleAudioMute, getAudioMuted } from './utils/audio';

import { TopBar } from './components/TopBar';
import { TelemetryCards } from './components/TelemetryCards';
import { WorldControls } from './components/WorldControls';
import { LiveTerminal } from './components/LiveTerminal';
import { PlayerMatrix } from './components/PlayerMatrix';
import { ToastContainer } from './components/ToastContainer';
import { RconSettingsModal } from './components/RconSettingsModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';

export default function App() {
  // App State
  const [mode, setMode] = useState<ServerMode>('simulated');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMuted, setIsMuted] = useState(getAudioMuted());

  // RCON Configuration
  const [rconConfig, setRconConfig] = useState<RconConfig>({
    host: 'play.scalacube.net',
    port: 25575,
    password: '',
  });

  // World & Entities State
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(INITIAL_PLAYERS[0]);
  const [gamerules, setGamerules] = useState<GameruleState>(INITIAL_GAMERULES);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  // Telemetry
  const [telemetry, setTelemetry] = useState<Telemetry>({
    cpu: 28.4,
    ramUsed: 4.2,
    ramTotal: 8.0,
    tps: 20.0,
    activePlayers: INITIAL_PLAYERS.length,
    maxPlayers: 20,
    uptimeSeconds: 84200,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // Helper: Trigger Toast
  const addToast = (title: string, description: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newToast: ToastMessage = {
      id,
      title,
      description,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper: Append log
  const appendLog = (level: LogEntry['level'], message: string, source: LogEntry['source'] = 'SERVER') => {
    const newLog: LogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      source,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // 1. WebSocket Setup for Live Mode
  useEffect(() => {
    if (mode === 'live') {
      setConnectionStatus('connecting');
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setConnectionStatus('connected');
          appendLog('INFO', '[RCON Bridge] Connected to full-stack WebSocket bridge', 'BRIDGE');
          addToast('RCON Bridge Connected', 'Live WebSocket connected to backend', 'success');
          playSound('success');
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'log' && data.log) {
              setLogs((prev) => [...prev, data.log]);
            } else if (data.type === 'status') {
              setConnectionStatus(data.connected ? 'connected' : 'disconnected');
            } else if (data.type === 'command_result') {
              if (data.success) {
                playSound('success');
              } else {
                playSound('error');
                addToast('Command Error', data.error || 'Execution failed', 'error');
              }
            }
          } catch {
            // ignore non-json
          }
        };

        socket.onclose = () => {
          setConnectionStatus('disconnected');
          appendLog('WARN', '[RCON Bridge] WebSocket disconnected. Running locally.', 'BRIDGE');
        };

        socket.onerror = () => {
          setConnectionStatus('disconnected');
        };

        return () => {
          socket.close();
          wsRef.current = null;
        };
      } catch (err) {
        setConnectionStatus('disconnected');
      }
    } else {
      // Disconnect socket if switched to simulated
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnectionStatus('connected'); // Simulated is always healthy
    }
  }, [mode]);

  // 2. Realistic Simulated Background Jitter & Ambient Events
  useEffect(() => {
    const timer = setInterval(() => {
      // Micro-jitter CPU & RAM
      setTelemetry((prev) => {
        const cpuDrift = (Math.random() - 0.5) * 4;
        const newCpu = Math.max(18, Math.min(65, prev.cpu + cpuDrift));
        const ramDrift = (Math.random() - 0.5) * 0.05;
        const newRam = Math.max(3.8, Math.min(5.5, prev.ramUsed + ramDrift));
        const tpsDrift = Math.random() > 0.8 ? 19.9 : 20.0;
        return {
          ...prev,
          cpu: newCpu,
          ramUsed: newRam,
          tps: tpsDrift,
          activePlayers: players.length,
        };
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [players.length]);

  // Ambient simulated chat / advancements every 30 seconds
  useEffect(() => {
    if (mode !== 'simulated' || players.length === 0) return;

    const ambientTimer = setInterval(() => {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      const randomMsgObj =
        AMBIENT_SIMULATION_MESSAGES[Math.floor(Math.random() * AMBIENT_SIMULATION_MESSAGES.length)];
      const text = randomMsgObj.template(randomPlayer.username);
      appendLog(randomMsgObj.level, text, randomMsgObj.source);
    }, 32000);

    return () => clearInterval(ambientTimer);
  }, [mode, players]);

  // 3. Command Execution Handler (Used by Terminal, PlayerMatrix, WorldControls)
  const handleExecuteCommand = async (rawCmd: string, feedbackLabel?: string) => {
    const cmd = sanitizeCommand(rawCmd);
    if (!cmd) return;

    setIsExecuting(true);

    // 1. Immediately log outgoing command to terminal
    appendLog('RCON', `> ${cmd}`, 'OPERATOR');

    if (mode === 'live' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Live Backend Execution via WebSocket or REST fallback
      wsRef.current.send(JSON.stringify({ type: 'command', command: cmd }));
      if (feedbackLabel) {
        addToast('Command Dispatched', `${feedbackLabel} (> ${cmd})`, 'success');
      }
      setIsExecuting(false);
    } else {
      // Interactive Simulation Mode Execution
      setTimeout(() => {
        const result = executeSimulatedCommand(cmd, players, gamerules);

        // Append server response to terminal
        appendLog(result.level, result.output, 'SERVER');

        // Apply state updates
        if (result.updatedPlayers) {
          setPlayers(result.updatedPlayers);
          if (selectedPlayer) {
            const fresh = result.updatedPlayers.find((p) => p.username === selectedPlayer.username);
            if (fresh) setSelectedPlayer(fresh);
          }
        }

        if (result.updatedGamerules) {
          setGamerules((prev) => ({ ...prev, ...result.updatedGamerules }));
        }

        // Trigger sleek feedback toast
        if (result.level === 'ERROR') {
          playSound('error');
          addToast('Command Error', result.output, 'error');
        } else {
          playSound('success');
          addToast(feedbackLabel || 'Command Executed', result.output, 'success');
        }

        setIsExecuting(false);
      }, 120);
    }
  };

  // 4. Gamerule Toggle
  const handleToggleGamerule = (rule: keyof GameruleState, newValue: boolean) => {
    handleExecuteCommand(
      `gamerule ${rule} ${newValue}`,
      `Gamerule ${rule} set to ${newValue}`
    );
  };

  // 5. Connect to RCON via modal
  const handleSaveAndConnectRcon = async (cfg: RconConfig): Promise<boolean> => {
    setRconConfig(cfg);
    try {
      const res = await fetch('/api/rcon/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMode('live');
        setConnectionStatus('connected');
        addToast('Connected to RCON', `Connected to ${cfg.host}:${cfg.port}`, 'success');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDisconnectRcon = async () => {
    try {
      await fetch('/api/rcon/disconnect', { method: 'POST' });
    } catch {
      // ignore
    }
    setConnectionStatus('disconnected');
    addToast('Disconnected', 'Disconnected from RCON server', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] antialiased">
      {/* 1. TOP BAR */}
      <TopBar
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          addToast(
            'Mode Switched',
            newMode === 'simulated'
              ? 'Simulation Active: local commands & state simulation'
              : 'Live Mode: Connected to backend RCON bridge',
            'info'
          );
        }}
        status={connectionStatus}
        serverHost={rconConfig.host}
        serverPort={rconConfig.port}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenHelp={() => setExportModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = toggleAudioMute();
          setIsMuted(next);
          playSound('click');
        }}
      />

      {/* 2. SERVER TELEMETRY CARDS (CPU, RAM, 20.0 TPS, PLAYERS) */}
      <TelemetryCards
        telemetry={telemetry}
        onViewPlayersClick={() => {
          // If needed, focus player panel
          if (players.length > 0) setSelectedPlayer(players[0]);
        }}
      />

      {/* 3. RESPONSIVE 3-COLUMN DASHBOARD */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[640px] overflow-hidden">
        {/* Left Column: World & Server Maintenance Controls (3 cols) */}
        <section className="lg:col-span-3 min-h-0 order-2 lg:order-1">
          <WorldControls
            gamerules={gamerules}
            onExecuteCommand={handleExecuteCommand}
            onToggleGamerule={handleToggleGamerule}
          />
        </section>

        {/* Center Column: Live RCON Terminal (6 cols) */}
        <section className="lg:col-span-6 min-h-[460px] lg:min-h-0 flex flex-col order-1 lg:order-2">
          <LiveTerminal
            logs={logs}
            onSendCommand={handleExecuteCommand}
            onClearLogs={() => setLogs([])}
            isExecuting={isExecuting}
          />
        </section>

        {/* Right Column: Targeted Player Control Matrix (3 cols) */}
        <section className="lg:col-span-3 min-h-0 order-3">
          <PlayerMatrix
            players={players}
            selectedPlayer={selectedPlayer}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
            onExecuteCommand={handleExecuteCommand}
          />
        </section>
      </main>

      {/* 4. MODALS & OVERLAYS */}
      <RconSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        config={rconConfig}
        status={connectionStatus}
        onSaveAndConnect={handleSaveAndConnectRcon}
        onDisconnect={handleDisconnectRcon}
      />

      <StandaloneExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* 5. BOTTOM-RIGHT TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
