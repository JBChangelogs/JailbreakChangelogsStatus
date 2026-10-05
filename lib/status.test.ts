import { test } from "node:test";
import assert from "node:assert/strict";
import { activeMaintenance, currentStatus, formatMsg, formatUptime, groupMonitors, overallStatus, padBeats, type Heartbeat, type Monitor } from "./status.ts";

const beat = (status: Heartbeat["status"], health: Heartbeat["health"] = ""): Heartbeat => ({
  status, health, time: "2026-10-04T17:30:41.288+00:00", msg: "", ping: 50,
});
const mon = (id: number, beats: Heartbeat[], maintenance: Monitor["maintenance"] = null): Monitor => ({
  id, name: `M${id}`, uptime24h: 1, heartbeats: beats, maintenance,
});
const win = { id: 3, title: "DB", description: null, end: null };

test("overall banner priority", () => {
  assert.equal(overallStatus([]), "operational");
  assert.equal(overallStatus([mon(1, [beat(1)]), mon(2, [])]), "operational");
  assert.equal(overallStatus([mon(1, [beat(1)], win)]), "maintenance");
  assert.equal(overallStatus([mon(1, [beat(3)]), mon(2, [beat(1, "degraded")])]), "degraded");
  assert.equal(overallStatus([mon(1, [beat(2)]), mon(2, [beat(1), beat(0)])]), "down");
  // only the latest beat counts
  assert.equal(overallStatus([mon(1, [beat(0), beat(1)])]), "operational");
  // no-heartbeat monitors are ignored even with a maintenance window
  assert.equal(overallStatus([mon(1, [], win)]), "operational");
});

test("current status", () => {
  assert.equal(currentStatus(mon(1, [])), null);
  assert.equal(currentStatus(mon(1, [beat(1)], win)), 3);
  assert.equal(currentStatus(mon(1, [beat(0)], win)), 0);
});

test("maintenance grouped by id", () => {
  const got = activeMaintenance([mon(1, [], win), mon(2, [beat(1)]), mon(3, [], win)]);
  assert.deepEqual(got, [{ window: win, names: ["M1", "M3"] }]);
});

test("grouping keeps unknown monitors in Other and drops empty groups", () => {
  const named = (id: number, name: string) => ({ ...mon(id, []), name });
  const got = groupMonitors([named(1, "Website"), named(2, "Brand New"), named(3, "API")]);
  assert.deepEqual(got.map((g) => [g.name, g.monitors.map((m) => m.id)]), [["Website", [1]], ["APIs", [3]], ["Other", [2]]]);
  // config order wins over the API's alphabetical order
  const site = groupMonitors([named(1, "Rybbit"), named(2, "Testing Website"), named(3, "Website")])[0];
  assert.deepEqual(site.monitors.map((m) => m.name), ["Website", "Testing Website", "Rybbit"]);
});

test("check messages are tidied for display", () => {
  assert.deepEqual(formatMsg("down: bots: no bots online"), { scope: "Bots", text: "No bots online" });
  assert.deepEqual(formatMsg("200 - OK"), { scope: null, text: "200 - OK" });
  assert.deepEqual(formatMsg("all 2 replicas ok"), { scope: null, text: "All 2 replicas ok" });
  assert.deepEqual(formatMsg("Under maintenance: Database upgrade"), { scope: "Under maintenance", text: "Database upgrade" });
  assert.deepEqual(formatMsg("down: https://x.io:8080 timed out"), { scope: null, text: "https://x.io:8080 timed out" });
});

test("padding and formatting", () => {
  const padded = padBeats([beat(1), beat(0)]);
  assert.equal(padded.length, 100);
  assert.equal(padded[97], null);
  assert.equal(padded[99]!.status, 0);
  assert.equal(padBeats(Array(120).fill(beat(1))).length, 100);
  assert.equal(formatUptime(0.99871), "99.87%");
  assert.equal(formatUptime(null), "—");
});
