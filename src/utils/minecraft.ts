import { Player, GameruleState } from '../types';

export function sanitizeCommand(input: string): string {
  let cleaned = input.trim();
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1).trim();
  }
  return cleaned;
}

export interface SimulationResult {
  output: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  updatedPlayers?: Player[];
  updatedGamerules?: Partial<GameruleState>;
  updatedWorld?: {
    time?: string;
    weather?: string;
  };
}

export function executeSimulatedCommand(
  rawCommand: string,
  players: Player[],
  gamerules: GameruleState
): SimulationResult {
  const cmd = sanitizeCommand(rawCommand);
  const parts = cmd.split(/\s+/);
  const base = parts[0]?.toLowerCase();

  if (!base) {
    return { output: 'Unknown command. Type "help" for help.', level: 'ERROR' };
  }

  // 1. Gamemode
  if (base === 'gamemode') {
    const mode = parts[1]?.toLowerCase();
    const targetName = parts[2] || (players[0] ? players[0].username : 'Steve');

    const validModes = ['survival', 'creative', 'adventure', 'spectator'];
    const aliasMap: Record<string, 'survival' | 'creative' | 'adventure' | 'spectator'> = {
      '0': 'survival',
      's': 'survival',
      'survival': 'survival',
      '1': 'creative',
      'c': 'creative',
      'creative': 'creative',
      '2': 'adventure',
      'a': 'adventure',
      'adventure': 'adventure',
      '3': 'spectator',
      'sp': 'spectator',
      'spectator': 'spectator',
    };

    const targetMode = aliasMap[mode];
    if (!targetMode) {
      return {
        output: `Invalid gamemode "${mode}". Valid options: survival, creative, adventure, spectator`,
        level: 'ERROR',
      };
    }

    const playerExists = players.some((p) => p.username.toLowerCase() === targetName.toLowerCase());
    if (!playerExists) {
      return { output: `No player was found with name "${targetName}"`, level: 'ERROR' };
    }

    const updated = players.map((p) =>
      p.username.toLowerCase() === targetName.toLowerCase() ? { ...p, gamemode: targetMode } : p
    );

    return {
      output: `Set ${targetName}'s game mode to ${targetMode.charAt(0).toUpperCase() + targetMode.slice(1)} Mode`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 2. OP
  if (base === 'op') {
    const targetName = parts[1];
    if (!targetName) {
      return { output: 'Usage: /op <player>', level: 'ERROR' };
    }
    const updated = players.map((p) =>
      p.username.toLowerCase() === targetName.toLowerCase() ? { ...p, role: 'OP' as const } : p
    );
    return {
      output: `Made ${targetName} a server operator`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 3. DEOP
  if (base === 'deop') {
    const targetName = parts[1];
    if (!targetName) {
      return { output: 'Usage: /deop <player>', level: 'ERROR' };
    }
    const updated = players.map((p) =>
      p.username.toLowerCase() === targetName.toLowerCase() ? { ...p, role: 'Member' as const } : p
    );
    return {
      output: `Made ${targetName} no longer a server operator`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 4. Give
  if (base === 'give') {
    const targetName = parts[1];
    let item = parts[2];
    const amount = parts[3] ? parseInt(parts[3], 10) : 1;

    if (!targetName || !item) {
      return { output: 'Usage: /give <player> <item> [amount]', level: 'ERROR' };
    }

    item = item.replace('minecraft:', '');
    const formattedItem = item
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      output: `Gave ${amount} [${formattedItem}] to ${targetName}`,
      level: 'INFO',
    };
  }

  // 5. Teleport (tp)
  if (base === 'tp' || base === 'teleport') {
    if (parts.length === 3) {
      // tp playerA playerB
      const pA = parts[1];
      const pB = parts[2];
      const destPlayer = players.find((p) => p.username.toLowerCase() === pB.toLowerCase());
      if (destPlayer) {
        const updated = players.map((p) =>
          p.username.toLowerCase() === pA.toLowerCase()
            ? { ...p, coordinates: { ...destPlayer.coordinates } }
            : p
        );
        return {
          output: `Teleported ${pA} to ${pB}`,
          level: 'INFO',
          updatedPlayers: updated,
        };
      }
      return { output: `Teleported ${pA} to ${pB}`, level: 'INFO' };
    } else if (parts.length >= 4) {
      // tp player X Y Z
      const target = parts[1];
      const x = parseFloat(parts[2]) || 0;
      const y = parseFloat(parts[3]) || 64;
      const z = parseFloat(parts[4]) || 0;
      const updated = players.map((p) =>
        p.username.toLowerCase() === target.toLowerCase()
          ? { ...p, coordinates: { x, y, z } }
          : p
      );
      return {
        output: `Teleported ${target} to ${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`,
        level: 'INFO',
        updatedPlayers: updated,
      };
    }
    return { output: 'Usage: /tp <player> <destinationPlayer> OR /tp <player> <x> <y> <z>', level: 'ERROR' };
  }

  // 6. Heal / Vitals (effect give <player> instant_health ...)
  if (base === 'effect' && parts[1]?.toLowerCase() === 'give') {
    const targetName = parts[2];
    const effectName = parts[3];
    const updated = players.map((p) =>
      p.username.toLowerCase() === targetName.toLowerCase()
        ? { ...p, health: 20, food: 20 }
        : p
    );
    return {
      output: `Applied effect [${effectName}] to ${targetName}`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 7. Clear inventory
  if (base === 'clear') {
    const targetName = parts[1];
    if (!targetName) return { output: 'Usage: /clear <player>', level: 'ERROR' };
    return {
      output: `Cleared the inventory of ${targetName}, removing 36 items`,
      level: 'INFO',
    };
  }

  // 8. Kill
  if (base === 'kill') {
    const targetName = parts[1];
    if (!targetName) return { output: 'Usage: /kill <player>', level: 'ERROR' };
    const updated = players.map((p) =>
      p.username.toLowerCase() === targetName.toLowerCase()
        ? { ...p, health: 0 }
        : p
    );
    return {
      output: `Killed ${targetName}`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 9. Kick
  if (base === 'kick') {
    const targetName = parts[1];
    const reason = parts.slice(2).join(' ') || 'Kicked by an operator.';
    if (!targetName) return { output: 'Usage: /kick <player> [reason]', level: 'ERROR' };
    const updated = players.filter((p) => p.username.toLowerCase() !== targetName.toLowerCase());
    return {
      output: `Kicked ${targetName}: ${reason}`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 10. Ban
  if (base === 'ban') {
    const targetName = parts[1];
    const reason = parts.slice(2).join(' ') || 'Banned by an operator.';
    if (!targetName) return { output: 'Usage: /ban <player> [reason]', level: 'ERROR' };
    const updated = players.filter((p) => p.username.toLowerCase() !== targetName.toLowerCase());
    return {
      output: `Banned ${targetName}: ${reason}`,
      level: 'INFO',
      updatedPlayers: updated,
    };
  }

  // 11. Pardon
  if (base === 'pardon' || base === 'unban') {
    const targetName = parts[1];
    if (!targetName) return { output: 'Usage: /pardon <player>', level: 'ERROR' };
    return {
      output: `Unbanned ${targetName}`,
      level: 'INFO',
    };
  }

  // 12. Time
  if (base === 'time') {
    const sub = parts[1]?.toLowerCase();
    const val = parts[2]?.toLowerCase();
    if (sub === 'set') {
      const times: Record<string, number> = {
        day: 1000,
        noon: 6000,
        sunset: 12000,
        night: 13000,
        midnight: 18000,
      };
      const tick = times[val] || parseInt(val, 10) || 1000;
      return {
        output: `Set the time to ${tick}`,
        level: 'INFO',
        updatedWorld: { time: val || `${tick} ticks` },
      };
    }
    return { output: 'Usage: /time set <day|noon|night|midnight|<number>>', level: 'ERROR' };
  }

  // 13. Weather
  if (base === 'weather') {
    const type = parts[1]?.toLowerCase();
    if (type === 'clear') {
      return { output: 'Set the weather to clear', level: 'INFO', updatedWorld: { weather: 'clear' } };
    }
    if (type === 'rain') {
      return { output: 'Set the weather to rain', level: 'INFO', updatedWorld: { weather: 'rain' } };
    }
    if (type === 'thunder') {
      return { output: 'Set the weather to rain and thunder', level: 'INFO', updatedWorld: { weather: 'thunder' } };
    }
    return { output: 'Usage: /weather <clear|rain|thunder> [duration]', level: 'ERROR' };
  }

  // 14. Gamerule
  if (base === 'gamerule') {
    const rule = parts[1] as keyof GameruleState;
    const val = parts[2]?.toLowerCase();
    if (!rule) {
      return { output: 'Usage: /gamerule <rule> [true|false]', level: 'ERROR' };
    }
    if (val === undefined) {
      const current = gamerules[rule];
      return { output: `Gamerule ${rule} is currently set to: ${current ?? 'unknown'}`, level: 'INFO' };
    }
    const boolVal = val === 'true';
    return {
      output: `Gamerule ${rule} is now set to: ${boolVal}`,
      level: 'INFO',
      updatedGamerules: { [rule]: boolVal },
    };
  }

  // 15. Say / Broadcast
  if (base === 'say') {
    const msg = parts.slice(1).join(' ');
    if (!msg) return { output: 'Usage: /say <message ...>', level: 'ERROR' };
    return {
      output: `[Server] ${msg}`,
      level: 'INFO',
    };
  }

  // 16. Save-all
  if (base === 'save-all') {
    return {
      output: 'Saved the game (world, world_nether, world_the_end)',
      level: 'INFO',
    };
  }

  // 17. List
  if (base === 'list') {
    const names = players.map((p) => p.username).join(', ');
    return {
      output: `There are ${players.length} of a max of 20 players online: ${names}`,
      level: 'INFO',
    };
  }

  // 18. Whitelist
  if (base === 'whitelist') {
    const sub = parts[1]?.toLowerCase();
    if (sub === 'on') return { output: 'Whitelist is now turned on', level: 'INFO' };
    if (sub === 'off') return { output: 'Whitelist is now turned off', level: 'INFO' };
    if (sub === 'reload') return { output: 'Reloaded the whitelist', level: 'INFO' };
    return { output: 'Usage: /whitelist <on|off|list|add|remove|reload>', level: 'INFO' };
  }

  // 19. Difficulty
  if (base === 'difficulty') {
    const diff = parts[1]?.toLowerCase() || 'normal';
    return {
      output: `The difficulty has been set to ${diff.charAt(0).toUpperCase() + diff.slice(1)}`,
      level: 'INFO',
    };
  }

  // Default fallback for generic Minecraft commands
  return {
    output: `Executed command "${cmd}" on server`,
    level: 'INFO',
  };
}

export const AMBIENT_SIMULATION_MESSAGES = [
  { level: 'INFO' as const, source: 'PLAYER' as const, template: (u: string) => `<${u}> Anyone found a Nether fortress yet?` },
  { level: 'INFO' as const, source: 'PLAYER' as const, template: (u: string) => `<${u}> Selling 64 diamonds at the market hub` },
  { level: 'INFO' as const, source: 'PLAYER' as const, template: (u: string) => `${u} has made the advancement [Diamonds!]` },
  { level: 'INFO' as const, source: 'PLAYER' as const, template: (u: string) => `${u} has made the advancement [We Need to Go Deeper]` },
  { level: 'INFO' as const, source: 'SERVER' as const, template: () => 'Autosave completed (flush 14 chunks)' },
  { level: 'WARN' as const, source: 'SERVER' as const, template: () => 'Entity tick rate balanced (+0.4ms overhead)' },
];
