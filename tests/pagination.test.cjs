const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./load-ts.cjs");
const { remapBookPosition } = loadTs("lib/pagination.ts");

test("reflow keeps the cover, authored passage and ending reachable", () => {
  assert.equal(remapBookPosition(0, [1, 1, 1], [3, 2, 1], 1), 0);
  assert.equal(remapBookPosition(3, [1, 1, 1], [3, 2, 1], 1), 6);
  assert.equal(remapBookPosition(4, [1, 1, 1], [3, 2, 1], 1), 7);
  assert.equal(remapBookPosition(6, [3, 2, 1], [1, 1, 1], 1), 3);
});

test("a disappearing continuation clamps within its original passage", () => {
  assert.equal(remapBookPosition(3, [4, 2], [1, 2], 1), 1);
  assert.equal(remapBookPosition(6, [4, 2], [1, 1], 1), 2);
  assert.equal(remapBookPosition(3, [1, 1, 1], [3, 2, 1], 2), 6);
});
