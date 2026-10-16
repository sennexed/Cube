import React, { useState } from 'react';
import { X, UserX, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Player } from '../types';
import { playSound } from '../utils/audio';

interface ModerationModalProps {
  player: Player | null;
  actionType: 'kick' | 'ban' | 'pardon';
  isOpen: boolean;
  onClose: () => void;
  onExecute: (action: 'kick' | 'ban' | 'pardon', username: string, reason: string) => void;
}

export const ModerationModal: React.FC<ModerationModalProps> = ({
  player,
  actionType,
  isOpen,
  onClose,
  onExecute,
}) => {
  const [reason, setReason] = useState('Rule violation');
  const [customUsername, setCustomUsername] = useState('');

  if (!isOpen) return null;

  const targetName = player ? player.username : customUsername;

  const quickReasons = [
    'Rule violation',
    'Griefing & Block destruction',
    'Using illegal mods / X-Ray',
    'Toxic behavior or chat spam',
    'AFK farming bypass',
    'Unauthorized PVP',
  ];

  const handleConfirm = () => {
    if (!targetName.trim()) return;
    onExecute(actionType, targetName.trim(), reason.trim());
    playSound(actionType === 'pardon' ? 'success' : 'warning');
    onClose();
  };

  const getTitle = () => {
    if (actionType === 'kick') return 'Kick Player from Server';
    if (actionType === 'ban') return 'Ban Player (Add to Blacklist)';
    return 'Pardon Player (Remove Ban)';
  };

  const getIcon = () => {
    if (actionType === 'kick') return <UserX className="w-5 h-5 text-amber-400" />;
    if (actionType === 'ban') return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between bg-[#1b212c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#21262d] border border-[#30363d]">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{getTitle()}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {actionType === 'pardon' ? 'Restore access' : 'Disciplinary Action'}
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

        {/* Body */}
        <div className="p-5 space-y-4">
          {player ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
              <img
                src={`https://mc-heads.net/avatar/${player.username}/40`}
                alt={player.username}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded border border-[#30363d] bg-[#161b22]"
                onError={(e) => {
                  // Fallback if avatar fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <span className="text-sm font-semibold text-white">{player.username}</span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                  <span>Role: {player.role}</span>
                  <span aria-hidden="true">·</span>
                  <span>Ping: {player.ping}ms</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Player Username to Pardon
              </label>
              <input
                type="text"
                placeholder="Minecraft Username..."
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
              />
            </div>
          )}

          {actionType !== 'pardon' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Reason for {actionType.toUpperCase()}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-[#388bfd]"
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Reason Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickReasons.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`text-[11px] font-sans px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                        reason === r
                          ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                          : 'bg-[#0d1117] text-slate-400 border-[#21262d] hover:border-[#30363d]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-xs font-mono text-slate-400">
            Command preview:{' '}
            <span className="text-white">
              {actionType} {targetName || '<player>'} {actionType !== 'pardon' ? reason : ''}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#21262d] bg-[#12161f] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!targetName.trim()}
            className={`px-4 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-40 ${
              actionType === 'ban'
                ? 'bg-rose-600 hover:bg-rose-500'
                : actionType === 'kick'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {actionType === 'ban' ? 'Execute Ban' : actionType === 'kick' ? 'Execute Kick' : 'Pardon Player'}
          </button>
        </div>
      </div>
    </div>
  );
};
