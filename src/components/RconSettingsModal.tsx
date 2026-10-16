import React, { useState } from 'react';
import {
  X,
  Server,
  KeyRound,
  Hash,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Power,
  RefreshCw,
} from 'lucide-react';
import { RconConfig, ConnectionStatus } from '../types';
import { playSound } from '../utils/audio';

interface RconSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RconConfig;
  status: ConnectionStatus;
  onSaveAndConnect: (cfg: RconConfig) => Promise<boolean>;
  onDisconnect: () => void;
}

export const RconSettingsModal: React.FC<RconSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  status,
  onSaveAndConnect,
  onDisconnect,
}) => {
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(String(config.port));
  const [password, setPassword] = useState(config.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim() || !port.trim() || !password.trim()) {
      setFeedback({ type: 'error', message: 'All fields are required to connect.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      const success = await onSaveAndConnect({
        host: host.trim(),
        port: parseInt(port.trim(), 10) || 25575,
        password: password.trim(),
      });
      if (success) {
        setFeedback({ type: 'success', message: 'Connected to Minecraft RCON server successfully!' });
        playSound('success');
      } else {
        setFeedback({
          type: 'error',
          message: 'Failed to connect. Verify your ScalaCube server is running, RCON is enabled in server.properties, and the port is open.',
        });
        playSound('error');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Connection timeout.' });
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between bg-[#1b212c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">RCON Bridge Configuration</h3>
              <p className="text-xs text-slate-400 font-mono">
                Connect to ScalaCube or any Minecraft Java Server
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status banner */}
          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : status === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-mono font-medium text-slate-200">
                Current Status:{' '}
                <span className={status === 'connected' ? 'text-emerald-400' : 'text-slate-400'}>
                  {status === 'connected' ? 'Active RCON Connection' : 'Disconnected / Simulated Mode'}
                </span>
              </span>
            </div>
            {status === 'connected' && (
              <button
                onClick={onDisconnect}
                className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/50 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <Power className="w-3 h-3" />
                Disconnect
              </button>
            )}
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Server IP / Hostname
              </label>
              <input
                type="text"
                placeholder="e.g. s14.scalacube.org or play.myserver.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                RCON Port
              </label>
              <input
                type="number"
                placeholder="25575"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Standard Minecraft RCON port is 25575. Check your host panel if customized.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                RCON Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Set in server.properties rcon.password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg pl-3 pr-16 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting to RCON...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  Test & Connect to Server
                </>
              )}
            </button>
          </form>

          {/* ScalaCube Instructions Box */}
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              ScalaCube Setup Checklist:
            </div>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal pl-4 font-sans leading-relaxed">
              <li>
                Log into your <strong className="text-slate-200">ScalaCube Control Panel</strong> and click{' '}
                <strong className="text-slate-200">File Manager</strong>.
              </li>
              <li>
                Edit <code className="text-slate-300 font-mono text-[11px] bg-[#161b22] px-1 rounded">server.properties</code>:
                <div className="mt-1 p-2 rounded bg-[#161b22] font-mono text-[11px] text-emerald-300 space-y-0.5 border border-[#30363d]">
                  <div>enable-rcon=true</div>
                  <div>rcon.port=25575</div>
                  <div>rcon.password=YourSecretPassword</div>
                </div>
              </li>
              <li>Save changes and restart the Minecraft server.</li>
              <li>Enter your server IP and RCON credentials above to connect!</li>
            </ol>
          </div>
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
