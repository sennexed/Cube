# Minecraft Server Web Console & Admin Control Panel (ScalaCube RCON)

A production-ready, dark-slate cyberpunk web console and administration control panel for Minecraft Java servers (Paper/Spigot/Vanilla) hosted on ScalaCube or dedicated VPS hosts, supporting both instant offline simulation and live RCON WebSocket bridge connectivity.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The application is architected with a **Zero-Friction Dual Mode** engine. You can test and inspect every operator workflow immediately in "Interactive Simulation Mode" without requiring an active Minecraft server, or switch to "Live RCON Bridge" to manage your real ScalaCube server.

- **Dual Mode Operation**: Built-in stateful simulation engine responds accurately to standard Minecraft commands (`gamemode`, `op`, `deop`, `give`, `time`, `weather`, `gamerule`, `tp`, `kick`, `ban`) while the live mode bridges to real RCON over WebSockets.
- **Auto-Stripping Command Prompt**: Console input automatically strips leading `/` slashes so commands formatted with or without slashes execute cleanly.
- **Standalone Deliverables**: In addition to the full-stack React + Express applet, self-contained standalone files (`standalone/index.html` and `standalone/server.js`) are bundled with in-app copy, download, and ScalaCube deployment guides.

---

## 1. Overview & Core Concept

### What It Does
Provides server administrators, moderators, and operators with a responsive, browser-based command center for Minecraft servers. Admins can execute console commands, inspect color-coded server logs, adjust gamerules and world weather/time on the fly, and manage players with one-click actions (gamemode switches, inventory clears, heals, teleportation, item distribution, and moderation bans/kicks).

### Target Audience
- Minecraft server owners and community operators hosting on ScalaCube or cloud servers.
- Moderators needing a fast, mobile-friendly administration panel without logging into game clients or SSH terminals.

### Key Value
- **Zero Latency & No Downtime**: Instant feedback with sound effects, auto-scrolling terminal logs, and live telemetry (CPU, RAM, 20.0 TPS, Player Count).
- **Safe Guardrails**: Destructive actions (killing players, clearing inventories, banning) include confirmation modals and reason logs.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & Palette
- **Aesthetic**: Cyberpunk Dark-Slate Server Operations Console.
- **Background Canvas**: Deep terminal black/slate (`#0d1117`).
- **Structural Surfaces**: Card containers (`#161b22`) with hairline dividers (`#21262d`).
- **Semantic Accents**:
  - Emerald (`#10b981`): Optimal 20.0 TPS, online server status, successful execution.
  - Electric Blue (`#3b82f6`): Primary actions, player controls, navigation.
  - Cyber Cyan (`#06b6d4`): Item giveaways, telemetry graphs, CPU monitoring.
  - Warning Amber (`#f59e0b`): Server warnings, kicks, daylight macros.
  - Destructive Crimson (`#ef4444`): Server errors, player kill, player ban.

### Typography & Spacing
- **UI & Controls**: Clean, legible `Inter` sans-serif with tight line heights.
- **Terminal & Telemetry**: Monospace `JetBrains Mono` and `Fira Code` with strict `tabular-nums` alignment to prevent layout shifts.
- **Layout Math**: Responsive 3-column desktop layout (`3-col World Controls` | `6-col Live Terminal` | `3-col Player Matrix`) adapting cleanly to tablets and mobile stacks.

### Key User Flows
1. **Console Command Execution**: User types commands (or uses `↑`/`↓` history arrows and autocomplete suggestion chips). On Enter, command is logged (`> time set day`), executed, and feedback toast is displayed.
2. **Targeted Player Management**: Admin selects a player from the visual list (with real Minecraft 2D skin heads via `mc-heads.net`), switches gamemode with 1 click, or gives items via a searchable inventory drawer.
3. **World & Environment Configuration**: Admin toggles live gamerules (`keepInventory`, `mobGriefing`, `pvp`) or triggers maintenance (`save-all`, `list`, `/say` broadcast alert).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Communication Architecture** | WebSocket (`/ws`) + REST Proxy (`/api/rcon/*`) | WebSockets allow instant bi-directional log streaming without HTTP polling lag. | HTTP polling (high latency, wasteful overhead). |
| **Simulation Engine** | Client + Server Stateful Parser | Enables immediate testing of all features without server setup or firewall barriers. | Static mock stubs (no realistic reaction or badge updates). |
| **Standalone Distribution** | Single-File HTML + `server.js` | ScalaCube users can drop `server.js` on their VPS or local machine with 3 commands. | Heavy Docker-only requirement. |
| **Input Flexibility** | Auto slash-stripper (`/op` $\rightarrow$ `op`) | Prevents accidental Minecraft syntax errors in web terminals. | Strict error on leading slash. |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Web Browser Frontend                            │
│                                                                        │
│  ┌────────────────────┐ ┌───────────────────┐ ┌─────────────────────┐  │
│  │   World Controls   │ │   Live Terminal   │ │    Player Matrix    │  │
│  │ (Macros & Rules)   │ │ (Logs & History)  │ │ (Vitals, TP, Items) │  │
│  └─────────┬──────────┘ └─────────┬─────────┘ └──────────┬──────────┘  │
│            │                      │                      │             │
│            └──────────────────────┼──────────────────────┘             │
│                                   ▼                                    │
│                     Command Dispatcher & State                         │
│                     (Simulation Mode OR Live)                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         WebSocket / HTTP (/api)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Full-Stack Node.js Express Bridge                       │
│                                                                        │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │  WebSocket Server (/ws)   │      │  REST API Router (/api/rcon)  │  │
│  └─────────────┬─────────────┘      └───────────────┬───────────────┘  │
│                └────────────────────┬───────────────┘                  │
│                                     ▼                                  │
│                       RCON Client Connection Pool                      │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ TCP Socket (Port 25575)
                                      ▼
                        ScalaCube Minecraft Server
```

### State Model
- **`Telemetry`**: CPU %, RAM used/total, TPS (target 20.0), online/max player slots.
- **`Player`**: Username, role (`OP` | `Member`), gamemode, health, ping, dimension, coordinates.
- **`GameruleState`**: Boolean flags for `keepInventory`, `mobGriefing`, `doDaylightCycle`, `pvp`, etc.
- **`LogEntry`**: Unique ID, timestamp, level (`INFO`, `WARN`, `ERROR`, `RCON`), formatted message, source.
