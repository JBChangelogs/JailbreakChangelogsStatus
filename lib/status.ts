export const STATUS_URL = "https://api.jailbreakchangelogs.com/v2/uptime/status";
export const MAX_BEATS = 100;

// 0 = down, 1 = up, 2 = pending, 3 = maintenance
export type BeatStatus = 0 | 1 | 2 | 3;

export type Heartbeat = {
  status: BeatStatus;
  time: string;
  msg: string;
  ping: number | null;
  health: "" | "ok" | "degraded" | "down";
};

export type Maintenance = {
  id: number;
  title: string;
  description: string | null;
  end: string | null;
};

export type Monitor = {
  id: number;
  name: string;
  uptime24h: number | null;
  heartbeats: Heartbeat[];
  maintenance: Maintenance | null;
};

export type Overall = "down" | "degraded" | "maintenance" | "operational";

export const STATUS_LABEL: Record<BeatStatus, string> = {
  0: "Down",
  1: "Up",
  2: "Pending",
  3: "Maintenance",
};

export const latest = (m: Monitor): Heartbeat | undefined => m.heartbeats.at(-1);

// Status shown on a monitor's pill; an up monitor inside a maintenance window reads as maintenance.
export function currentStatus(m: Monitor): BeatStatus | null {
  const beat = latest(m);
  if (!beat) return null;
  return beat.status === 1 && m.maintenance ? 3 : beat.status;
}

export function overallStatus(monitors: Monitor[]): Overall {
  const live = monitors.filter((m) => m.heartbeats.length > 0);
  const last = live.map((m) => latest(m)!);
  if (last.some((b) => b.status === 0)) return "down";
  if (last.some((b) => b.status === 2 || b.health === "degraded")) return "degraded";
  if (live.some((m) => latest(m)!.status === 3 || m.maintenance)) return "maintenance";
  return "operational";
}

// One entry per distinct maintenance window, with the monitors it covers.
export function activeMaintenance(monitors: Monitor[]) {
  const byId = new Map<number, { window: Maintenance; names: string[] }>();
  for (const m of monitors) {
    if (!m.maintenance) continue;
    const entry = byId.get(m.maintenance.id) ?? { window: m.maintenance, names: [] };
    entry.names.push(m.name);
    byId.set(m.maintenance.id, entry);
  }
  return [...byId.values()];
}

// Left-pads with null so every bar has MAX_BEATS segments.
export function padBeats(beats: Heartbeat[]): (Heartbeat | null)[] {
  const recent = beats.slice(-MAX_BEATS);
  return [...Array(MAX_BEATS - recent.length).fill(null), ...recent];
}

// Display groups by exact monitor name. Anything not listed lands in "Other",
// so new monitors still show up without a code change.
export const GROUPS: { name: string; monitors: string[] }[] = [
  { name: "Website", monitors: ["Website", "Testing Website", "Rybbit"] },
  { name: "APIs", monitors: ["API", "Inventories API", "Image Scans"] },
  { name: "Bots", monitors: ["Discord Bot", "Inventory Bots", "Robbery Tracking Bots"] },
];

export function groupMonitors(monitors: Monitor[]) {
  const groups = [...GROUPS.map((g) => ({ name: g.name, monitors: [] as Monitor[] })), { name: "Other", monitors: [] as Monitor[] }];
  for (const m of monitors) {
    const i = GROUPS.findIndex((g) => g.monitors.includes(m.name));
    groups[i === -1 ? groups.length - 1 : i].monitors.push(m);
  }
  // Within a configured group, keep the order the names are listed in GROUPS.
  GROUPS.forEach((g, i) => groups[i].monitors.sort((a, b) => g.monitors.indexOf(a.name) - g.monitors.indexOf(b.name)));
  return groups.filter((g) => g.monitors.length > 0);
}

const STATUS_WORDS = new Set(["up", "down", "pending", "degraded", "ok", "maintenance"]);
const capitalize = (s: string) => (/^[a-z]+:\/\//.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1));

// Turns check text like "down: bots: no bots online" into { scope: "Bots", text: "No bots online" }.
// A leading status word is dropped (the tooltip already shows the status); earlier
// "x: " parts become the scope. Splits only on ": " so URLs and times stay intact.
export function formatMsg(msg: string): { scope: string | null; text: string } {
  const parts = msg.trim().split(/:\s+/).filter(Boolean);
  if (parts.length > 1 && STATUS_WORDS.has(parts[0].toLowerCase())) parts.shift();
  const text = capitalize(parts.pop() ?? "");
  return { scope: parts.length ? parts.map(capitalize).join(" › ") : null, text };
}

export const formatUptime = (u: number | null) => (u === null ? "—" : `${(u * 100).toFixed(2)}%`);
