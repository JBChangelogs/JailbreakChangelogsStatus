export const MAX_BEATS = 100;

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

export function padBeats(beats: Heartbeat[]): (Heartbeat | null)[] {
  const recent = beats.slice(-MAX_BEATS);
  return [...Array(MAX_BEATS - recent.length).fill(null), ...recent];
}

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
  GROUPS.forEach((g, i) => groups[i].monitors.sort((a, b) => g.monitors.indexOf(a.name) - g.monitors.indexOf(b.name)));
  return groups.filter((g) => g.monitors.length > 0);
}

const STATUS_WORDS = new Set(["up", "down", "pending", "degraded", "ok", "maintenance"]);
const capitalize = (s: string) => (/^[a-z]+:\/\//.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1));

export function formatMsg(msg: string): { scope: string | null; text: string } {
  const parts = msg.trim().split(/:\s+/).filter(Boolean);
  if (parts.length > 1 && STATUS_WORDS.has(parts[0].toLowerCase())) parts.shift();
  const text = capitalize(parts.pop() ?? "");
  return { scope: parts.length ? parts.map(capitalize).join(" › ") : null, text };
}

export const formatUptime = (u: number | null) => (u === null ? "—" : `${(u * 100).toFixed(2)}%`);
