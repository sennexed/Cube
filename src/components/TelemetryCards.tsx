import React from 'react';
import { Cpu, HardDrive, Gauge, Users } from 'lucide-react';
import { Telemetry } from '../types';

interface TelemetryCardsProps {
  telemetry: Telemetry;
  onViewPlayersClick?: () => void;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  telemetry,
  onViewPlayersClick,
}) => {
  // TPS color logic: 19.5 - 20 is optimal green, 16.0 - 19.4 is amber, < 16 is red
  const getTpsColor = (tps: number) => {
    if (tps >= 19.5) return 'text-emerald-400';
    if (tps >= 16.0) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getTpsBg = (tps: number) => {
    if (tps >= 19.5) return 'bg-emerald-500';
    if (tps >= 16.0) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const ramPercentage = Math.min(
    100,
    Math.round((telemetry.ramUsed / telemetry.ramTotal) * 100)
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-[#0d1117] border-b border-[#21262d]">
      {/* 1. CPU Usage */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#21262d] flex flex-col justify-between hover:border-[#30363d] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            CPU Usage
          </span>
          <span className="text-[11px] font-mono text-slate-500">4 Cores (E5-2690)</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            {telemetry.cpu.toFixed(1)}
            <span className="text-sm font-normal text-slate-400 ml-0.5">%</span>
          </div>
          <span className={`text-xs font-mono font-medium ${telemetry.cpu > 80 ? 'text-rose-400' : 'text-slate-400'}`}>
            {telemetry.cpu < 40 ? 'Nominal' : telemetry.cpu < 75 ? 'Moderate' : 'High Load'}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-2.5">
          <div
            className={`h-full transition-all duration-500 ${
              telemetry.cpu > 85 ? 'bg-rose-500' : telemetry.cpu > 65 ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
            style={{ width: `${Math.min(100, telemetry.cpu)}%` }}
          />
        </div>
      </div>

      {/* 2. RAM Allocation */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#21262d] flex flex-col justify-between hover:border-[#30363d] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-purple-400" />
            RAM Allocation
          </span>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            {ramPercentage}%
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            {telemetry.ramUsed.toFixed(1)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ {telemetry.ramTotal.toFixed(1)} GB</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            DDR4 ECC
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-2.5">
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${ramPercentage}%` }}
          />
        </div>
      </div>

      {/* 3. Server TPS */}
      <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#21262d] flex flex-col justify-between hover:border-[#30363d] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Server TPS
          </span>
          <span className="text-[11px] font-mono text-slate-500">Target 20.0</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${getTpsColor(telemetry.tps)}`}>
            {telemetry.tps.toFixed(1)}
            <span className="text-sm font-normal text-slate-400 ml-1">TPS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${getTpsBg(telemetry.tps)}`} />
            <span className="text-slate-300">
              {telemetry.tps >= 19.5 ? '100% Rate' : telemetry.tps >= 16.0 ? 'Minor Lag' : 'Lag Spike'}
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-2.5">
          <div
            className={`h-full transition-all duration-500 ${getTpsBg(telemetry.tps)}`}
            style={{ width: `${Math.min(100, (telemetry.tps / 20.0) * 100)}%` }}
          />
        </div>
      </div>

      {/* 4. Active Player Count */}
      <div
        onClick={onViewPlayersClick}
        className="p-3.5 rounded-lg bg-[#161b22] border border-[#21262d] flex flex-col justify-between hover:border-[#388bfd] transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            Active Players
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
            Slots Open
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            {telemetry.activePlayers}
            <span className="text-sm font-normal text-slate-400 ml-1">/ {telemetry.maxPlayers}</span>
          </div>
          <span className="text-xs font-mono text-blue-400 group-hover:underline">
            Manage &rarr;
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-2.5">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (telemetry.activePlayers / telemetry.maxPlayers) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
