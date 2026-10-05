"use client";

import { useEffect, useState } from "react";
import {
  STATUS_LABEL, STATUS_URL, activeMaintenance, currentStatus, formatMsg, groupMonitors, formatUptime, latest, overallStatus, padBeats,
  type BeatStatus, type Heartbeat, type Maintenance, type Monitor, type Overall,
} from "@/lib/status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const REFRESH_MS = 60_000;
const BOT_HEALTH_URLS = {
  "Inventory Bots": "https://inventories.jailbreakchangelogs.com/bots/health?method=1",
  "Robbery Tracking Bots": "https://inventories.jailbreakchangelogs.com/bots/health?method=2",
} as const;

type BotCounts = Partial<Record<keyof typeof BOT_HEALTH_URLS, number>>;

const BEAT_BG: Record<BeatStatus, string> = {
  0: "bg-status-error",
  1: "bg-status-success",
  2: "bg-status-warning",
  3: "bg-status-info",
};

const BANNER: Record<Overall, { text: string; tone: string }> = {
  down: { text: "Some services are down", tone: "border-status-error/50 bg-status-error/15 [--dot:var(--color-status-error)]" },
  degraded: { text: "Some services are degraded", tone: "border-status-warning/50 bg-status-warning/15 [--dot:var(--color-status-warning)]" },
  maintenance: { text: "Maintenance in progress", tone: "border-status-info/50 bg-status-info/15 [--dot:var(--color-status-info)]" },
  operational: { text: "All systems operational", tone: "border-status-success/50 bg-status-success/15 [--dot:var(--color-status-success)]" },
};

const timeShort = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dateTime = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const pingText = (ping: number | null) => (ping === null ? "no response" : `${ping} ms`);

export default function StatusPage() {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [botCounts, setBotCounts] = useState<BotCounts>({});

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastAttempt = 0;
    let ctrl: AbortController | undefined;

    // One list request per refresh: the API rate-limits each IP to 100 requests/minute.
    const load = async () => {
      lastAttempt = Date.now();
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch(STATUS_URL, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMonitors(await res.json());
        setUpdatedAt(Date.now());
        setFailed(false);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      }

      if (!ctrl.signal.aborted) {
        const entries = await Promise.all(Object.entries(BOT_HEALTH_URLS).map(async ([name, url]) => {
          try {
            const res = await fetch(url, { cache: "no-store", signal: ctrl!.signal });
            if (!res.ok) return null;
            const data: unknown = await res.json();
            if (typeof data !== "object" || data === null || !("checks" in data)) return null;
            const checks = data.checks;
            if (typeof checks !== "object" || checks === null || !("bots" in checks)) return null;
            const bots = checks.bots;
            if (typeof bots !== "object" || bots === null || !("online" in bots)) return null;
            const online = bots.online;
            return typeof online === "number" && Number.isFinite(online) && online >= 0
              ? [name, online] as const
              : null;
          } catch {
            return null;
          }
        }));
        if (!ctrl.signal.aborted) {
          setBotCounts(Object.fromEntries(entries.filter((entry): entry is readonly [string, number] => entry !== null)));
        }
      }
    };

    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await load();
        if (!document.hidden) schedule(REFRESH_MS);
      }, delay);
    };

    // Paused while hidden; on return, refresh right away only if the last attempt is stale.
    const onVisibility = () => {
      if (document.hidden) clearTimeout(timer);
      else schedule(Math.max(0, REFRESH_MS - (Date.now() - lastAttempt)));
    };

    schedule(0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      ctrl?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="page-heading">Jailbreak Changelogs Status</h1>
          <p className="text-secondary-text mt-1 text-sm">Live health of our services, checked about every minute.</p>
        </div>
        <div className="text-tertiary-text text-right text-xs" aria-live="polite">
          {updatedAt !== null && <LastUpdated at={updatedAt} />}
          {failed && <p className="text-status-warning">Couldn&apos;t refresh, retrying</p>}
        </div>
      </header>

      {monitors === null ? (
        failed ? (
          <p className="border-border-card bg-secondary-bg text-secondary-text rounded-xl border p-6 text-center">
            Couldn&apos;t load service status. Retrying in a minute.
          </p>
        ) : (
          <Skeleton />
        )
      ) : monitors.length === 0 ? (
        <p className="border-border-card bg-secondary-bg text-secondary-text rounded-xl border p-6 text-center">
          No services are being monitored
        </p>
      ) : (
        <>
          <Banner overall={overallStatus(monitors)} />
          {activeMaintenance(monitors).map(({ window, names }) => (
            <MaintenanceCard key={window.id} window={window} names={names} />
          ))}
          <Legend />
          {groupMonitors(monitors).map((g) => (
            <MonitorGroup key={g.name} name={g.name} monitors={g.monitors} botCounts={botCounts} />
          ))}
        </>
      )}
    </main>
  );
}

function LastUpdated({ at }: { at: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) setNow(Date.now());
    };
    const id = setInterval(tick, 1_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  const secs = Math.floor(Math.max(0, now - at) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const unit: Intl.RelativeTimeFormatUnit = secs < 60 ? "second" : secs < 3_600 ? "minute" : secs < 86_400 ? "hour" : "day";
  const count = unit === "second" ? secs : unit === "minute" ? Math.floor(secs / 60) : unit === "hour" ? Math.floor(secs / 3_600) : Math.floor(secs / 86_400);
  const parts = count === 0 ? null : rtf.formatToParts(-count, unit);
  return (
    <p title={new Date(at).toLocaleString([], { dateStyle: "medium", timeStyle: "medium" })}>
      Last updated {parts
        ? parts.map((part, index) => part.type === "integer"
          ? <span key={`${unit}-${count}-${index}`} style={{ width: `${Math.max(unit === "day" ? 3 : 2, part.value.length)}ch` }} className="inline-block text-center animate-[counter-pop_180ms_ease-out_both] tabular-nums motion-reduce:animate-none">{part.value}</span>
          : <span key={index}>{part.value}</span>)
        : rtf.format(0, "second")}
    </p>
  );
}

function Banner({ overall }: { overall: Overall }) {
  const { text, tone } = BANNER[overall];
  return (
    <div role="status" className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${tone}`}>
      <PulseDot className="size-3" color="bg-(--dot)" />
      <p className="text-lg font-semibold">{text}</p>
    </div>
  );
}

function MaintenanceCard({ window: w, names }: { window: Maintenance; names: string[] }) {
  return (
    <section className="border-status-info/40 bg-secondary-bg mt-4 rounded-xl border border-l-4 border-l-status-info p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-semibold">{w.title}</h2>
        <p className="text-secondary-text text-sm">{w.end ? `until ${dateTime(w.end)}` : "until further notice"}</p>
      </div>
      {w.description && <p className="text-secondary-text mt-2 text-sm whitespace-pre-line">{w.description}</p>}
      <p className="text-tertiary-text mt-3 text-xs">Affects: {names.join(", ")}</p>
    </section>
  );
}

function PulseDot({ className, color }: { className: string; color: string }) {
  return (
    <span className={`relative flex shrink-0 ${className}`} aria-hidden>
      <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${color}`} />
      <span className={`relative inline-flex size-full rounded-full ${color}`} />
    </span>
  );
}

function StatusPill({ status }: { status: BeatStatus | null }) {
  const label = status === null ? "No data" : STATUS_LABEL[status];
  const dot = status === null ? "bg-status-neutral" : BEAT_BG[status];
  return (
    <span className="border-border-primary bg-tertiary-bg inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

function MonitorGroup({ name, monitors, botCounts }: { name: string; monitors: Monitor[]; botCounts: BotCounts }) {
  const [open, setOpen] = useState(false);
  const uptimes = monitors.flatMap((m) => m.uptime24h === null ? [] : [m.uptime24h]);
  const uptime = uptimes.length ? uptimes.reduce((sum, value) => sum + value, 0) / uptimes.length : null;
  return (
    <section className="border-border-card bg-secondary-bg relative mt-4 overflow-clip rounded-xl border shadow-[0_2px_8px_-4px_var(--color-border-card)]" aria-label={name}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="bg-primary-bg hover:bg-tertiary-bg/50 focus-visible:ring-link relative z-20 flex w-full cursor-pointer select-none items-start gap-2 overflow-clip rounded-xl p-3 text-left shadow-[0_1px_4px_-2px_var(--color-border-card)] transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none sm:gap-3 sm:p-4"
      >
        <span className="shrink-0 p-1">
          <svg className={`text-secondary-text size-3 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-0" : "-rotate-90"}`} viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M1.75 4.25 6 8.5l4.25-4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-primary-text min-w-0 flex-1 text-sm leading-tight font-semibold sm:text-base">{name}</span>
          <span className="flex shrink-0 items-center gap-2">
            <GroupHeartbeat monitors={monitors} />
            <span className="text-secondary-text whitespace-nowrap text-sm leading-tight tabular-nums sm:text-base">
              <span className="font-medium">{formatUptime(uptime)}</span> uptime
            </span>
          </span>
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${open ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`} aria-hidden="true">
        <div className="min-h-0 overflow-clip">
          <div className={`flex flex-col px-2 pb-2 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${open ? "translate-y-1 opacity-0 blur-[3px]" : "translate-y-0 opacity-100 blur-0"}`}>
            <div className="bg-primary-bg relative z-[3] mx-2 h-2 rounded-b-lg shadow-[0_1px_4px_-2px_var(--color-border-card)]" />
            <div className="bg-primary-bg/70 relative z-[2] -mt-0.5 mx-4 h-2 rounded-b-lg shadow-[0_1px_4px_-2px_var(--color-border-card)]" />
            <div className="bg-primary-bg/40 relative z-[1] -mt-0.5 mx-6 h-2 rounded-b-lg shadow-[0_1px_4px_-2px_var(--color-border-card)]" />
          </div>
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-clip">
          <div
            aria-hidden={!open}
            inert={!open}
            className={`bg-secondary-bg px-2 pb-2 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${open ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none -translate-y-1 opacity-0 blur-[3px]"}`}
          >
            <ul className="divide-border-secondary divide-y">
              {monitors.map((m) => (
                <MonitorRow key={m.id} monitor={m} botCount={botCounts[m.name as keyof typeof BOT_HEALTH_URLS]} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function MonitorRow({ monitor: m, botCount }: { monitor: Monitor; botCount?: number }) {
  const last = latest(m);
  const health = last?.health;
  return (
    <li className="px-5 py-4 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="truncate font-medium">{m.name}</h4>
          {health && health !== "ok" && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${health === "down" ? "bg-status-error/15 text-status-error" : "bg-status-warning/15 text-status-warning"}`}>
              {health}
            </span>
          )}
        </div>
        <div className="text-secondary-text flex items-center gap-3 text-sm tabular-nums">
          {botCount !== undefined && <span>{botCount} {botCount === 1 ? "bot" : "bots"} online</span>}
          {last?.ping != null && <span>{last.ping} ms</span>}
          <span title="Uptime over the last 24 hours">{formatUptime(m.uptime24h)}</span>
          <StatusPill status={currentStatus(m)} />
        </div>
      </div>
      <HeartbeatBar beats={m.heartbeats} />
    </li>
  );
}

function GroupHeartbeat({ monitors }: { monitors: Monitor[] }) {
  const columns = Array.from({ length: 40 }, (_, column) => {
    const beats = monitors.flatMap((m) => {
      const beat = m.heartbeats.at(-40 + column);
      return beat ? [beat.status] : [];
    });
    if (beats.includes(0)) return 0;
    if (beats.includes(2)) return 2;
    if (beats.includes(3)) return 3;
    return beats.length ? 1 : null;
  });
  const runs = columns.reduce<{ status: BeatStatus | null; length: number }[]>((result, status) => {
    const lastRun = result.at(-1);
    if (lastRun?.status === status) lastRun.length += 1;
    else result.push({ status, length: 1 });
    return result;
  }, []);
  return (
    <div className="hidden shrink-0 overflow-hidden sm:block" aria-hidden="true">
      <div className="flex h-1.5 w-28 items-center gap-[3px]">
        {runs.map(({ status, length }, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full ${status === null ? "bg-quaternary-bg/50" : BEAT_BG[status]}`}
            style={{ flex: `${length} 0 ${status === 1 ? "0px" : "6px"}` }}
          />
        ))}
      </div>
    </div>
  );
}

// Fixed-width segments and gaps so spacing is identical at every width. The list is
// newest-first in a wrapping row-reverse flex: when a row is too narrow for all
// 100, the oldest beats wrap onto a hidden second line instead of squeezing.
function HeartbeatBar({ beats }: { beats: Heartbeat[] }) {
  return (
    <div className="mt-3">
      <ol className="flex h-8 flex-row-reverse flex-wrap gap-0.5 overflow-hidden" aria-label="Recent checks, newest first">
        {padBeats(beats).reverse().map((b, i) => (
          <Segment key={i} beat={b} />
        ))}
      </ol>
      <p className="text-quaternary-text mt-1 text-right text-[11px]">Now</p>
    </div>
  );
}

function Segment({ beat }: { beat: Heartbeat | null }) {
  if (!beat) return <li className="bg-quaternary-bg/40 h-8 w-1.5 shrink-0 rounded-[2px]" aria-label="No data" />;
  const label = `${STATUS_LABEL[beat.status]} at ${timeShort(beat.time)}, ${pingText(beat.ping)}`;
  const msg = beat.msg ? formatMsg(beat.msg) : null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <li className={`h-8 w-1.5 shrink-0 rounded-[2px] transition-opacity duration-150 hover:opacity-70 motion-reduce:transition-none ${BEAT_BG[beat.status]}`} aria-label={label} />
      </TooltipTrigger>
      <TooltipContent className="max-w-72 px-2.5 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={`size-2 shrink-0 rounded-full ${BEAT_BG[beat.status]}`} aria-hidden />
          <span className="font-semibold">{STATUS_LABEL[beat.status]}</span>
          <time dateTime={beat.time} className="text-secondary-text ml-auto shrink-0 tabular-nums">
            {new Date(beat.time).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </time>
        </div>
        <div className="text-tertiary-text mt-1 flex items-center gap-2 text-[11px]">
          <span>{pingText(beat.ping)}</span>
          {beat.health && <span className="capitalize">· {beat.health}</span>}
          {msg?.scope && <span className="truncate">· {msg.scope}</span>}
        </div>
        {msg && <p className="text-primary-text mt-1 max-w-64 text-xs leading-snug break-words">{msg.text}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

const LEGEND: { label: string; bg: string }[] = [
  ...([1, 2, 0, 3] as BeatStatus[]).map((st) => ({ label: STATUS_LABEL[st], bg: BEAT_BG[st] })),
  { label: "No data", bg: "bg-quaternary-bg/40" },
];

// Swatches use the same shape as bar segments so the mapping is obvious.
function Legend() {
  return (
    <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-semibold">Services</h2>
        <p className="text-tertiary-text text-xs">Each bar is one check, about a minute apart</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading status">
      <div className="bg-secondary-bg h-16 rounded-xl" />
      <div className="border-border-card bg-secondary-bg divide-border-secondary mt-6 divide-y rounded-xl border">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex justify-between">
              <div className="bg-quaternary-bg/60 h-4 w-32 rounded" />
              <div className="bg-quaternary-bg/60 h-4 w-40 rounded" />
            </div>
            <div className="bg-quaternary-bg/40 mt-3 h-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
