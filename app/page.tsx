"use client";

import { useEffect, useState } from "react";
import {
  STATUS_LABEL, STATUS_URL, activeMaintenance, currentStatus, groupMonitors, formatUptime, latest, overallStatus, padBeats,
  type BeatStatus, type Heartbeat, type Maintenance, type Monitor, type Overall,
} from "@/lib/status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const REFRESH_MS = 60_000;

const BEAT_BG: Record<BeatStatus, string> = {
  0: "bg-status-error",
  1: "bg-tertiary",
  2: "bg-status-warning",
  3: "bg-status-info",
};

const BANNER: Record<Overall, { text: string; tone: string }> = {
  down: { text: "Some services are down", tone: "border-status-error/50 bg-status-error/15 [--dot:var(--color-status-error)]" },
  degraded: { text: "Some services are degraded", tone: "border-status-warning/50 bg-status-warning/15 [--dot:var(--color-status-warning)]" },
  maintenance: { text: "Maintenance in progress", tone: "border-status-info/50 bg-status-info/15 [--dot:var(--color-status-info)]" },
  operational: { text: "All systems operational", tone: "border-tertiary/50 bg-tertiary/15 [--dot:var(--color-tertiary)]" },
};

const timeShort = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dateTime = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const pingText = (ping: number | null) => (ping === null ? "no response" : `${ping} ms`);

export default function StatusPage() {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

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
            <MonitorGroup key={g.name} name={g.name} monitors={g.monitors} />
          ))}
        </>
      )}
    </main>
  );
}

function LastUpdated({ at }: { at: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.round((Math.max(now, at) - at) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const text = secs < 60 ? rtf.format(-secs, "second") : rtf.format(-Math.round(secs / 60), "minute");
  return <p title={new Date(at).toLocaleString()}>Last updated {text}</p>;
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

const GROUP_SUMMARY: Record<Overall, { text: string; color: string }> = {
  down: { text: "Partial outage", color: "text-form-error" },
  degraded: { text: "Degraded", color: "text-status-warning" },
  maintenance: { text: "Maintenance", color: "text-link" },
  operational: { text: "Operational", color: "text-tertiary" },
};

function MonitorGroup({ name, monitors }: { name: string; monitors: Monitor[] }) {
  const { text, color } = GROUP_SUMMARY[overallStatus(monitors)];
  return (
    <section className="mt-4" aria-label={name}>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-secondary-text text-xs font-semibold tracking-[0.16em] uppercase">{name}</h3>
        <span className={`text-xs font-medium ${color}`}>{text}</span>
      </div>
      <ul className="border-border-card bg-secondary-bg divide-border-secondary divide-y rounded-xl border">
        {monitors.map((m) => (
          <MonitorRow key={m.id} monitor={m} />
        ))}
      </ul>
    </section>
  );
}

function MonitorRow({ monitor: m }: { monitor: Monitor }) {
  const last = latest(m);
  const health = last?.health;
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="truncate font-medium">{m.name}</h4>
          {health && health !== "ok" && (
            <span className={`rounded ${health === "down" ? "bg-status-error/15 text-form-error" : "bg-status-warning/15 text-status-warning"} px-1.5 py-0.5 text-xs font-medium capitalize`}>
              {health}
            </span>
          )}
        </div>
        <div className="text-secondary-text flex items-center gap-3 text-sm tabular-nums">
          {last?.ping != null && <span>{last.ping} ms</span>}
          <span title="Uptime over the last 24 hours">{formatUptime(m.uptime24h)}</span>
          <StatusPill status={currentStatus(m)} />
        </div>
      </div>
      <HeartbeatBar beats={m.heartbeats} />
    </li>
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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <li className={`h-8 w-1.5 shrink-0 rounded-[2px] ${BEAT_BG[beat.status]} hover:opacity-70`} aria-label={label} />
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        <p className="font-semibold">{STATUS_LABEL[beat.status]}</p>
        <p className="text-tertiary-text">{dateTime(beat.time)}</p>
        <p className="text-secondary-text mt-1 break-words">{beat.msg || "—"}</p>
        <p className="text-secondary-text">{pingText(beat.ping)}</p>
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
      <ul className="flex flex-wrap gap-1.5" aria-label="Legend">
        {LEGEND.map(({ label, bg }) => (
          <li
            key={label}
            className="border-border-card bg-secondary-bg text-secondary-text flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
          >
            <span className={`h-3.5 w-1.5 rounded-[2px] ${bg}`} aria-hidden />
            {label}
          </li>
        ))}
      </ul>
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
