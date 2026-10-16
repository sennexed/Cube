export type ServerMode = 'simulated' | 'live';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'RCON';
export type Gamemode = 'creative' | 'survival' | 'adventure' | 'spectator';
export type PlayerRole = 'OP' | 'Member';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: 'SERVER' | 'OPERATOR' | 'PLAYER' | 'BRIDGE';
}

export interface Player {
  id: string;
  username: string;
  role: PlayerRole;
  gamemode: Gamemode;
  health: number; // 0 to 20
  food: number; // 0 to 20
  ping: number; // ms
  dimension: 'overworld' | 'nether' | 'end';
  coordinates: { x: number; y: number; z: number };
}

export interface Telemetry {
  cpu: number; // percentage 0-100
  ramUsed: number; // GB
  ramTotal: number; // GB
  tps: number; // usually 20.0
  activePlayers: number;
  maxPlayers: number;
  uptimeSeconds: number;
}

export interface GameruleState {
  keepInventory: boolean;
  mobGriefing: boolean;
  doDaylightCycle: boolean;
  doWeatherCycle: boolean;
  pvp: boolean;
  doInsomnia: boolean;
  naturalRegeneration: boolean;
  showDeathMessages: boolean;
}

export interface RconConfig {
  host: string;
  port: number;
  password: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

export interface MinecraftItem {
  id: string;
  name: string;
  category: 'weapons' | 'tools' | 'armor' | 'food' | 'minerals' | 'utility' | 'redstone';
  iconEmoji: string;
  defaultAmount?: number;
}
