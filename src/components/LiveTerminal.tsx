import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  ArrowDown,
  Search,
  CornerDownLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { LogEntry, LogLevel } from '../types';
import { AUTOCOMPLETE_COMMANDS } from '../data/mockData';
import { playSound } from '../utils/audio';

interface LiveTerminalProps {
  logs: LogEntry[];
  onSendCommand: (command: string) => void;
  onClearLogs: () => void;
  isExecuting?: boolean;
}

type FilterMode = 'ALL' | 'INFO' | 'WARN_ERROR' | 'PLAYER' | 'RCON';

export const LiveTerminal: React.FC<LiveTerminalProps> = ({
  logs,
  onSendCommand,
  onClearLogs,
  isExecuting = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Command history navigation
  const [history, setHistory] = useState<string[]>([
    'list',
    'save-all',
    'time set day',
    'gamemode creative Steve',
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(history[nextIndex]);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (cmdToSubmit?: string) => {
    const raw = cmdToSubmit !== undefined ? cmdToSubmit : inputVal;
    let trimmed = raw.trim();
    if (!trimmed) return;

    // Requirement: Strips any accidental leading / automatically
    if (trimmed.startsWith('/')) {
      trimmed = trimmed.substring(1).trim();
    }

    if (!trimmed) return;

    // Add to history
    setHistory((prev) => [...prev.filter((h) => h !== trimmed), trimmed]);
    setHistoryIndex(-1);

    onSendCommand(trimmed);
    setInputVal('');
    playSound('click');

    // Keep focus
    inputRef.current?.focus();
  };

  const handleAutocompleteClick = (cmd: string) => {
    setInputVal(cmd);
    inputRef.current?.focus();
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        log.message.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q) ||
        (log.source && log.source.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Filter mode
    if (filterMode === 'ALL') return true;
    if (filterMode === 'INFO') return log.level === 'INFO';
    if (filterMode === 'WARN_ERROR') return log.level === 'WARN' || log.level === 'ERROR';
    if (filterMode === 'PLAYER') return log.source === 'PLAYER';
    if (filterMode === 'RCON') return log.level === 'RCON' || log.source === 'OPERATOR';
    return true;
  });

  const getLogBadge = (level: LogLevel) => {
    switch (level) {
      case 'INFO':
        return <span className="text-cyan-400 font-mono text-[11px] font-semibold">[INFO]</span>;
      case 'WARN':
        return <span className="text-amber-400 font-mono text-[11px] font-semibold">[WARN]</span>;
      case 'ERROR':
        return <span className="text-rose-400 font-mono text-[11px] font-semibold">[ERROR]</span>;
      case 'RCON':
        return <span className="text-emerald-400 font-mono text-[11px] font-semibold">[RCON]</span>;
      default:
        return <span className="text-slate-400 font-mono text-[11px]">[LOG]</span>;
    }
  };

  const getLogTextColor = (level: LogLevel) => {
    switch (level) {
      case 'INFO':
        return 'text-slate-200';
      case 'WARN':
        return 'text-amber-200';
      case 'ERROR':
        return 'text-rose-300 font-medium';
      case 'RCON':
        return 'text-emerald-300 font-medium';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] overflow-hidden">
      {/* Terminal Toolbar */}
      <div className="px-4 py-2.5 bg-[#161b22] border-b border-[#21262d] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            RCON Terminal
          </span>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            ({filteredLogs.length} logs)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#21262d]">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-[#21262d] text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode('WARN_ERROR')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
              filterMode === 'WARN_ERROR'
                ? 'bg-rose-950/60 text-rose-300 font-medium border border-rose-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Warn/Err
          </button>
          <button
            onClick={() => setFilterMode('PLAYER')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
              filterMode === 'PLAYER'
                ? 'bg-[#21262d] text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Player Events
          </button>
          <button
            onClick={() => setFilterMode('RCON')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
              filterMode === 'RCON'
                ? 'bg-emerald-950/60 text-emerald-300 font-medium border border-emerald-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RCON
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0d1117] border border-[#21262d] text-xs font-mono text-slate-200 rounded-md pl-8 pr-2.5 py-1 w-32 md:w-44 focus:outline-none focus:border-[#388bfd] placeholder:text-slate-600"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Lock to bottom: Enabled' : 'Auto-scroll: Paused'}
            className={`px-2 py-1 rounded border text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
              autoScroll
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                : 'bg-[#0d1117] text-slate-400 border-[#21262d]'
            }`}
          >
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Follow</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => {
              onClearLogs();
              playSound('click');
            }}
            title="Clear Console Output"
            className="p-1.5 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-rose-900/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Log Stream Window */}
      <div
        ref={terminalScrollRef}
        className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-1 bg-[#090d13] text-slate-300 leading-relaxed select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
            <Filter className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-sans text-slate-400">No console output matching current filters</p>
            <p className="text-xs text-slate-600 mt-1">Commands executed will appear here in real-time</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2 py-0.5 px-1.5 rounded hover:bg-[#161b22]/50 transition-colors ${
                log.level === 'RCON' ? 'bg-emerald-950/15' : ''
              }`}
            >
              <span className="text-slate-500 shrink-0 select-none text-[11px] tabular-nums">
                [{log.timestamp}]
              </span>
              <span className="shrink-0">{getLogBadge(log.level)}</span>
              <span className={`break-all ${getLogTextColor(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Quick Autocomplete Suggestions Chips Bar */}
      <div className="px-3 py-1.5 bg-[#12161f] border-t border-[#21262d] overflow-x-auto whitespace-nowrap flex items-center gap-1.5 no-scrollbar shrink-0">
        <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mr-1 shrink-0">
          Suggestions:
        </span>
        {AUTOCOMPLETE_COMMANDS.slice(0, 9).map((ac) => (
          <button
            key={ac.cmd}
            onClick={() => handleAutocompleteClick(ac.cmd)}
            title={ac.desc}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-emerald-300 border border-[#21262d] hover:border-[#30363d] transition-all cursor-pointer shrink-0"
          >
            /{ac.cmd}
          </button>
        ))}
      </div>

      {/* Terminal Command Input Prompt */}
      <div className="p-3 bg-[#161b22] border-t border-[#21262d] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-emerald-400 font-mono font-bold select-none text-sm">
              &gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type a command... (e.g. "op Steve", "time set day", "give Alex diamond 64")'
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/50 rounded-lg pl-7 pr-16 py-2.5 text-xs sm:text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none transition-all"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="absolute right-2.5 hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d] select-none">
              <span>↑↓ History</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isExecuting || !inputVal.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:hover:bg-[#238636] text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            {isExecuting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
            ) : (
              <>
                <CornerDownLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1.5 px-1">
          <span className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-emerald-500" />
            Leading slash <code className="text-slate-400">/</code> is automatically stripped
          </span>
          <span className="hidden md:inline">Press Enter to execute</span>
        </div>
      </div>
    </div>
  );
};
