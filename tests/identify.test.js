// Checks how SnapSet reads the AI's reply. Uses made-up replies: no API calls, no cost.
const test = require("node:test");
const assert = require("node:assert");
const { parseIdentification } = require("../server.js");

test("a known machine comes back with its muscle group", () => {
  assert.deepStrictEqual(parseIdentification('{"machine":"Lat Pulldown"}'), {
    machine: "Lat Pulldown",
    muscleGroup: "Back (lats), biceps",
  });
});

test("JSON wrapped in ``` fences still works", () => {
  assert.strictEqual(parseIdentification('```json\n{"machine":"Leg Press"}\n```').machine, "Leg Press");
});

test("'unknown', unlisted machines, or garbage all mean 'not sure'", () => {
  for (const reply of ['{"machine":"unknown"}', '{"machine":"Treadmill"}', "It's a leg press!", "", undefined]) {
    assert.strictEqual(parseIdentification(reply).machine, null, `reply: ${reply}`);
  }
});
