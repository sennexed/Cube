import React, { useState } from 'react';
import {
  Globe2,
  Sun,
  Moon,
  CloudSun,
  CloudLightning,
  CloudRain,
  Save,
  Users,
  Megaphone,
  Sliders,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';
import { GameruleState } from '../types';
import { playSound } from '../utils/audio';

interface WorldControlsProps {
  gamerules: GameruleState;
  onExecuteCommand: (command: string, successMessage?: string) => void;
  onToggleGamerule: (rule: keyof GameruleState, newValue: boolean) => void;
}

export const WorldControls: React.FC<WorldControlsProps> = ({
  gamerules,
  onExecuteCommand,
  onToggleGamerule,
}) => {
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Time macro handler
  const handleTimeMacro = (time: 'day' | 'noon' | 'midnight') => {
    onExecuteCommand(`time set ${time}`, `Set world time to ${time}`);
    playSound('pop');
  };

  // Weather macro handler
  const handleWeatherMacro = (weather: 'clear' | 'thunder' | 'rain') => {
    onExecuteCommand(`weather ${weather}`, `Set weather condition to ${weather}`);
    playSound('pop');
  };

  // Maintenance macros
  const handleSaveAll = () => {
    onExecuteCommand('save-all flush', 'World state saved to storage');
    playSound('success');
  };

  const handleListPlayers = () => {
    onExecuteCommand('list', 'Refreshed online player list');
    playSound('click');
  };

  // Broadcast
  const handleBroadcast = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!broadcastText.trim()) return;
    onExecuteCommand(`say [Announcement] ${broadcastText.trim()}`, 'Broadcast sent to all players');
    setBroadcastText('');
    setIsBroadcasting(false);
    playSound('success');
  };

  // Gamerule toggles list
  const ruleConfigs: {
    key: keyof GameruleState;
    label: string;
    description: string;
  }[] = [
    {
      key: 'keepInventory',
      label: 'keepInventory',
      description: 'Keep items & XP on death',
    },
    {
      key: 'mobGriefing',
      label: 'mobGriefing',
      description: 'Creepers & Ghasts break blocks',
    },
    {
      key: 'doDaylightCycle',
      label: 'doDaylightCycle',
      description: 'Sun & Moon advance naturally',
    },
    {
      key: 'doWeatherCycle',
      label: 'doWeatherCycle',
      description: 'Dynamic rain & storms',
    },
    {
      key: 'pvp',
      label: 'pvp',
      description: 'Player vs Player combat',
    },
    {
      key: 'doInsomnia',
      label: 'doInsomnia',
      description: 'Phantoms spawn when sleepless',
    },
    {
      key: 'naturalRegeneration',
      label: 'naturalRegen',
      description: 'Regenerate health from full food',
    },
    {
      key: 'showDeathMessages',
      label: 'deathMessages',
      description: 'Announce deaths in public chat',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-r border-[#21262d] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#21262d] bg-[#12161f] shrink-0">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            World & Server Controls
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          Global Environment & Gamerules
        </p>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* 1. Environment & Time Macros */}
        <div>
          <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider block mb-2">
            Time Macros
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleTimeMacro('day')}
              className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-mono flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Day (1000)</span>
            </button>
            <button
              onClick={() => handleTimeMacro('noon')}
              className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-mono flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <CloudSun className="w-4 h-4 text-yellow-400" />
              <span>Noon (6000)</span>
            </button>
            <button
              onClick={() => handleTimeMacro('midnight')}
              className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-xs font-mono flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Midnight</span>
            </button>
          </div>
        </div>

        {/* 2. Weather Macros */}
        <div>
          <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider block mb-2">
            Weather Control
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleWeatherMacro('clear')}
              className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-mono flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Sun className="w-4 h-4 text-cyan-400" />
              <span>Clear Sky</span>
            </button>
            <button
              onClick={() => handleWeatherMacro('rain')}
              className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-blue-500/40 text-slate-300 hover:text-blue-300 text-xs font-mono flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <CloudRain className="w-4 h-4 text-blue-400" />
              <span>Rain</span>
            </button>
            <button
              onClick={() => handleWeatherMacro('thunder')}
              className="p-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-purple-500/40 text-slate-300 hover:text-purple-300 text-xs font-mono flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <CloudLightning className="w-4 h-4 text-purple-400" />
              <span>Thunder</span>
            </button>
          </div>
        </div>

        {/* 3. Server Maintenance Macros */}
        <div>
          <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider block mb-2">
            Server Maintenance
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveAll}
              className="p-2.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-emerald-600/50 text-slate-300 hover:text-emerald-300 text-xs font-medium flex items-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="block font-mono">save-all</span>
                <span className="text-[10px] text-slate-500">Flush to disk</span>
              </div>
            </button>

            <button
              onClick={handleListPlayers}
              className="p-2.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-blue-600/50 text-slate-300 hover:text-blue-300 text-xs font-medium flex items-center gap-2 cursor-pointer transition-all"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <span className="block font-mono">list</span>
                <span className="text-[10px] text-slate-500">Refresh players</span>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Broadcast Alert Input */}
        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Server Broadcast
            </span>
            <span className="text-[10px] font-mono text-slate-500">/say command</span>
          </div>

          <form onSubmit={handleBroadcast} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Broadcast message to all players..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="flex-1 bg-[#161b22] border border-[#21262d] focus:border-amber-500/60 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!broadcastText.trim()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 5. Live Gamerule Toggles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Live Gamerules
            </label>
            <span className="text-[10px] font-mono text-slate-500">Auto-executes</span>
          </div>

          <div className="space-y-1.5 bg-[#0d1117] p-2 rounded-lg border border-[#21262d]">
            {ruleConfigs.map((rule) => {
              const isEnabled = !!gamerules[rule.key];
              return (
                <div
                  key={rule.key}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#161b22] transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-mono text-white block">
                      {rule.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {rule.description}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={() => {
                      const nextVal = !isEnabled;
                      onToggleGamerule(rule.key, nextVal);
                      playSound('click');
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-emerald-600' : 'bg-[#21262d]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
