// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { addLog, lastLogFor } = require("../server.js");

// Use a throwaway file so tests never touch your real logs
const tmpFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "snapset-")), "logs.json");

test("no logs yet returns null", () => {
  assert.strictEqual(lastLogFor("Leg Press", tmpFile()), null);
});

test("returns the most recent log for the chosen machine only", () => {
  const file = tmpFile();
  addLog({ machine: "Leg Press", date: "2026-11-01", sets: 3, reps: 10, weight: 180 }, file);
  addLog({ machine: "Chest Press", date: "2026-11-02", sets: 3, reps: 8, weight: 90 }, file);
  addLog({ machine: "Leg Press", date: "2026-11-03", sets: 4, reps: 8, weight: 200 }, file);

  assert.deepStrictEqual(lastLogFor("Leg Press", file), {
    machine: "Leg Press", date: "2026-11-03", sets: 4, reps: 8, weight: 200,
  });
  assert.strictEqual(lastLogFor("Chest Press", file).weight, 90);
});
