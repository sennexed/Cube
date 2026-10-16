import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Heart,
  Trash2,
  Skull,
  Navigation,
  Gift,
  UserX,
  UserCheck,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Player, Gamemode } from '../types';
import { GiveItemModal } from './GiveItemModal';
import { ModerationModal } from './ModerationModal';
import { playSound } from '../utils/audio';

interface PlayerMatrixProps {
  players: Player[];
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onExecuteCommand: (command: string, successMessage?: string) => void;
}

export const PlayerMatrix: React.FC<PlayerMatrixProps> = ({
  players,
  selectedPlayer,
  onSelectPlayer,
  onExecuteCommand,
}) => {
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modActionType, setModActionType] = useState<'kick' | 'ban' | 'pardon'>('kick');

  // Teleport inputs
  const [tpDestPlayer, setTpDestPlayer] = useState('');
  const [tpCoords, setTpCoords] = useState({ x: '0', y: '64', z: '0' });
  const [tpMode, setTpMode] = useState<'player' | 'coords'>('player');

  const activePlayer = selectedPlayer || players[0] || null;

  // Handler: Operator toggle
  const handleToggleOp = () => {
    if (!activePlayer) return;
    if (activePlayer.role === 'OP') {
      onExecuteCommand(`deop ${activePlayer.username}`, `Revoked Operator from ${activePlayer.username}`);
    } else {
      onExecuteCommand(`op ${activePlayer.username}`, `Granted Operator to ${activePlayer.username}`);
    }
    playSound('pop');
  };

  // Handler: Gamemode Switch
  const handleSetGamemode = (mode: Gamemode) => {
    if (!activePlayer) return;
    onExecuteCommand(
      `gamemode ${mode} ${activePlayer.username}`,
      `Changed ${activePlayer.username}'s gamemode to ${mode}`
    );
    playSound('click');
  };

  // Handler: Heal & Feed
  const handleHealFeed = () => {
    if (!activePlayer) return;
    onExecuteCommand(
      `effect give ${activePlayer.username} minecraft:instant_health 1 255`,
      `Restored health of ${activePlayer.username}`
    );
    onExecuteCommand(
      `effect give ${activePlayer.username} minecraft:saturation 1 255`,
      `Restored hunger saturation of ${activePlayer.username}`
    );
    playSound('success');
  };

  // Handler: Clear Inventory
  const handleClearInventory = () => {
    if (!activePlayer) return;
    if (confirm(`Clear all inventory items for ${activePlayer.username}?`)) {
      onExecuteCommand(`clear ${activePlayer.username}`, `Cleared inventory of ${activePlayer.username}`);
      playSound('warning');
    }
  };

  // Handler: Kill Player
  const handleKillPlayer = () => {
    if (!activePlayer) return;
    if (confirm(`Kill player ${activePlayer.username}?`)) {
      onExecuteCommand(`kill ${activePlayer.username}`, `Killed ${activePlayer.username}`);
      playSound('error');
    }
  };

  // Handler: Teleport
  const handleTeleport = () => {
    if (!activePlayer) return;
    if (tpMode === 'player') {
      const dest = tpDestPlayer || (players.find((p) => p.username !== activePlayer.username)?.username ?? '');
      if (!dest) return;
      onExecuteCommand(`tp ${activePlayer.username} ${dest}`, `Teleported ${activePlayer.username} to ${dest}`);
    } else {
      onExecuteCommand(
        `tp ${activePlayer.username} ${tpCoords.x} ${tpCoords.y} ${tpCoords.z}`,
        `Teleported ${activePlayer.username} to ${tpCoords.x}, ${tpCoords.y}, ${tpCoords.z}`
      );
    }
    playSound('pop');
  };

  // Handler: Give Item from modal
  const handleGiveItem = (targetUser: string, itemId: string, amount: number) => {
    onExecuteCommand(`give ${targetUser} minecraft:${itemId} ${amount}`, `Gave ${amount} ${itemId} to ${targetUser}`);
  };

  // Handler: Moderation action
  const handleModeration = (action: 'kick' | 'ban' | 'pardon', username: string, reason: string) => {
    if (action === 'kick') {
      onExecuteCommand(`kick ${username} ${reason}`, `Kicked ${username}`);
    } else if (action === 'ban') {
      onExecuteCommand(`ban ${username} ${reason}`, `Banned ${username}`);
    } else if (action === 'pardon') {
      onExecuteCommand(`pardon ${username}`, `Unbanned ${username}`);
    }
  };

  const gamemodes: { id: Gamemode; label: string }[] = [
    { id: 'survival', label: 'Survival' },
    { id: 'creative', label: 'Creative' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'spectator', label: 'Spectator' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-l border-[#21262d] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#21262d] bg-[#12161f] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Player Control Matrix
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {players.length} Online
          </span>
        </div>

        {/* Active Player Selector Dropdown */}
        <div className="relative">
          <select
            value={activePlayer?.username || ''}
            onChange={(e) => {
              const p = players.find((pl) => pl.username === e.target.value);
              if (p) onSelectPlayer(p);
            }}
            className="w-full appearance-none bg-[#0d1117] border border-[#21262d] hover:border-[#388bfd] text-white text-xs font-mono rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#388bfd] cursor-pointer"
          >
            {players.map((p) => (
              <option key={p.id} value={p.username}>
                {p.username} [{p.role}] ({p.gamemode}) - {p.ping}ms
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Online Players Visual Strip (Horizontal scroll on mobile, vertical stack) */}
      <div className="p-3 border-b border-[#21262d] bg-[#0d1117]/60 shrink-0">
        <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 tracking-wider block mb-2">
          Online Players
        </span>
        <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
          {players.map((p) => {
            const isSelected = activePlayer?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPlayer(p);
                  playSound('pop');
                }}
                className={`w-full flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#21262d] border-[#388bfd] text-white'
                    : 'bg-[#161b22] border-[#21262d] hover:border-[#30363d] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={`https://mc-heads.net/avatar/${p.username}/24`}
                    alt={p.username}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded shrink-0 bg-[#0d1117] border border-[#30363d]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xs font-medium truncate">{p.username}</span>
                  {p.role === 'OP' && (
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-semibold">
                      OP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-slate-400">
                  <span className="capitalize">{p.gamemode}</span>
                  <span className="tabular-nums text-emerald-400">{p.ping}ms</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Player Detailed Actions */}
      {activePlayer ? (
        <div className="p-4 space-y-4 flex-1">
          {/* Active Target Info Card */}
          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={`https://mc-heads.net/avatar/${activePlayer.username}/36`}
                  alt={activePlayer.username}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded border border-[#30363d] bg-[#161b22]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {activePlayer.username}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                        activePlayer.role === 'OP'
                          ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                          : 'bg-[#21262d] text-slate-400 border-[#30363d]'
                      }`}
                    >
                      {activePlayer.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Coords: {activePlayer.coordinates.x}, {activePlayer.coordinates.y}, {activePlayer.coordinates.z}
                  </div>
                </div>
              </div>

              {/* Operator Toggle */}
              <button
                onClick={handleToggleOp}
                title={activePlayer.role === 'OP' ? 'Revoke Operator (/deop)' : 'Grant Operator (/op)'}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer border ${
                  activePlayer.role === 'OP'
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/40'
                    : 'bg-[#21262d] text-slate-300 border-[#30363d] hover:text-white'
                }`}
              >
                {activePlayer.role === 'OP' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Revoke OP</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Grant OP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gamemode Segmented Switcher */}
          <div>
            <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
              Gamemode Switcher
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0d1117] rounded-lg border border-[#21262d]">
              {gamemodes.map((gm) => {
                const isActive = activePlayer.gamemode === gm.id;
                return (
                  <button
                    key={gm.id}
                    onClick={() => handleSetGamemode(gm.id)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-[#1f6feb] text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-[#161b22]'
                    }`}
                  >
                    {gm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vitals & Utilities (Heal, Clear, Kill, Give) */}
          <div>
            <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
              Vitals & Inventory
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleHealFeed}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-emerald-950/30 border border-[#21262d] hover:border-emerald-700/50 text-slate-200 hover:text-emerald-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Heal & Feed</span>
              </button>

              <button
                onClick={() => {
                  setGiveModalOpen(true);
                  playSound('pop');
                }}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-cyan-950/30 border border-[#21262d] hover:border-cyan-700/50 text-slate-200 hover:text-cyan-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Gift className="w-4 h-4 text-cyan-400" />
                <span>Give Item...</span>
              </button>

              <button
                onClick={handleClearInventory}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-amber-950/30 border border-[#21262d] hover:border-amber-700/50 text-slate-200 hover:text-amber-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Clear Inventory</span>
              </button>

              <button
                onClick={handleKillPlayer}
                className="p-2 rounded-lg bg-[#0d1117] hover:bg-rose-950/30 border border-[#21262d] hover:border-rose-700/50 text-slate-200 hover:text-rose-300 transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Skull className="w-4 h-4 text-rose-500" />
                <span>Kill Player</span>
              </button>
            </div>
          </div>

          {/* Teleportation Matrix */}
          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                Teleportation
              </label>
              <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded border border-[#21262d]">
                <button
                  onClick={() => setTpMode('player')}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                    tpMode === 'player' ? 'bg-[#21262d] text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  To Player
                </button>
                <button
                  onClick={() => setTpMode('coords')}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                    tpMode === 'coords' ? 'bg-[#21262d] text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  To Coords
                </button>
              </div>
            </div>

            {tpMode === 'player' ? (
              <div className="flex items-center gap-2">
                <select
                  value={tpDestPlayer}
                  onChange={(e) => setTpDestPlayer(e.target.value)}
                  className="flex-1 bg-[#161b22] border border-[#21262d] rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#388bfd]"
                >
                  <option value="">Select destination player...</option>
                  {players
                    .filter((p) => p.username !== activePlayer.username)
                    .map((p) => (
                      <option key={p.id} value={p.username}>
                        {p.username} ({p.coordinates.x}, {p.coordinates.y}, {p.coordinates.z})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleTeleport}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer shrink-0"
                >
                  Teleport
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500">X</label>
                    <input
                      type="text"
                      value={tpCoords.x}
                      onChange={(e) => setTpCoords({ ...tpCoords, x: e.target.value })}
                      className="w-full bg-[#161b22] border border-[#21262d] rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-[#388bfd]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500">Y</label>
                    <input
                      type="text"
                      value={tpCoords.y}
                      onChange={(e) => setTpCoords({ ...tpCoords, y: e.target.value })}
                      className="w-full bg-[#161b22] border border-[#21262d] rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-[#388bfd]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500">Z</label>
                    <input
                      type="text"
                      value={tpCoords.z}
                      onChange={(e) => setTpCoords({ ...tpCoords, z: e.target.value })}
                      className="w-full bg-[#161b22] border border-[#21262d] rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-[#388bfd]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTpCoords({ x: '0', y: '64', z: '0' })}
                      className="text-[10px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Spawn (0,64,0)
                    </button>
                  </div>
                  <button
                    onClick={handleTeleport}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
                  >
                    Teleport Coords
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Moderation Actions (Kick, Ban, Pardon) */}
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 space-y-2">
            <span className="text-[11px] font-mono uppercase font-semibold text-rose-400 tracking-wider block">
              Disciplinary Moderation
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setModActionType('kick');
                  setModModalOpen(true);
                  playSound('warning');
                }}
                className="py-1.5 px-2.5 rounded bg-[#161b22] hover:bg-amber-950/40 border border-amber-900/40 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Kick Player</span>
              </button>

              <button
                onClick={() => {
                  setModActionType('ban');
                  setModModalOpen(true);
                  playSound('warning');
                }}
                className="py-1.5 px-2.5 rounded bg-[#161b22] hover:bg-rose-950/40 border border-rose-900/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Ban Player</span>
              </button>
            </div>

            <button
              onClick={() => {
                setModActionType('pardon');
                setModModalOpen(true);
                playSound('pop');
              }}
              className="w-full py-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] text-slate-400 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pardon / Unban a Player...</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          No players currently online
        </div>
      )}

      {/* Give Item Modal */}
      {activePlayer && (
        <GiveItemModal
          player={activePlayer}
          isOpen={giveModalOpen}
          onClose={() => setGiveModalOpen(false)}
          onGiveItem={handleGiveItem}
        />
      )}

      {/* Moderation Modal */}
      <ModerationModal
        player={modActionType === 'pardon' ? null : activePlayer}
        actionType={modActionType}
        isOpen={modModalOpen}
        onClose={() => setModModalOpen(false)}
        onExecute={handleModeration}
      />
    </div>
  );
};
