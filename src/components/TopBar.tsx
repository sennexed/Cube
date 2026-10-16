import React, { useState } from 'react';
import {
  Server,
  Copy,
  Check,
  Settings,
  Terminal,
  Volume2,
  VolumeX,
  FileCode2,
  HelpCircle,
} from 'lucide-react';
import { ServerMode, ConnectionStatus } from '../types';
import { playSound } from '../utils/audio';

interface TopBarProps {
  mode: ServerMode;
  onModeChange: (mode: ServerMode) => void;
  status: ConnectionStatus;
  serverHost: string;
  serverPort: number;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onModeChange,
  status,
  serverHost,
  serverPort,
  onOpenSettings,
  onOpenExport,
  onOpenHelp,
  isMuted,
  onToggleMute,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`${serverHost}:${serverPort}`);
    setCopied(true);
    playSound('pop');
    setTimeout(() => setCopied(false), 2000);
  };

  const statusText =
    mode === 'simulated'
      ? 'Simulation Active'
      : status === 'connected'
      ? 'Live RCON Online'
      : status === 'connecting'
      ? 'Connecting...'
      : 'RCON Offline';

  const statusColor =
    mode === 'simulated'
      ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60'
      : status === 'connected'
      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
      : status === 'connecting'
      ? 'text-amber-400 bg-amber-950/40 border-amber-800/60'
      : 'text-rose-400 bg-rose-950/40 border-rose-800/60';

  const statusDotColor =
    mode === 'simulated'
      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
      : status === 'connected'
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
      : status === 'connecting'
      ? 'bg-amber-400 animate-pulse'
      : 'bg-rose-500';

  return (
    <header className="h-16 border-b border-[#21262d] bg-[#161b22]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Brand & Server Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-tight text-base whitespace-nowrap">
              Minecraft RCON Console
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">
              ScalaCube Edition
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Paper 1.20.4</span>
            <span aria-hidden="true">·</span>
            <span>RCON Protocol v1</span>
          </div>
        </div>
      </div>

      {/* Middle: IP Display & Status */}
      <div className="hidden md:flex items-center gap-3">
        {/* Connection status tag */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono font-medium ${statusColor}`}>
          <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
          <span>{statusText}</span>
        </div>

        {/* Server IP One-Click Copy */}
        <button
          onClick={handleCopyIp}
          title="Click to copy Server Address"
          className="group flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#388bfd] text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <Server className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          <span className="tabular-nums">{serverHost}:{serverPort}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          )}
        </button>
      </div>

      {/* Right Actions: Mode Switcher & Tools */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center p-0.5 bg-[#0d1117] border border-[#21262d] rounded-lg">
          <button
            onClick={() => {
              onModeChange('simulated');
              playSound('click');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              mode === 'simulated'
                ? 'bg-[#1f6feb] text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulated Server
          </button>
          <button
            onClick={() => {
              onModeChange('live');
              playSound('click');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              mode === 'live'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live RCON Bridge
          </button>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="p-2 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* RCON Config / Settings */}
        <button
          onClick={() => {
            onOpenSettings();
            playSound('click');
          }}
          title="RCON Server Connection Settings"
          className="p-2 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#388bfd] text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {/* Export Standalone index.html & server.js */}
        <button
          onClick={() => {
            onOpenExport();
            playSound('click');
          }}
          title="View & Export Standalone index.html & server.js"
          className="px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <FileCode2 className="w-4 h-4 text-cyan-400" />
          <span className="hidden lg:inline">Standalone Files</span>
        </button>

        {/* Help / Guide */}
        <button
          onClick={() => {
            onOpenHelp();
            playSound('click');
          }}
          title="ScalaCube Setup Guide"
          className="p-2 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
