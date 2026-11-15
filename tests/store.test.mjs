import test from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY,
  freshState,
  loadState,
  saveState,
  sanitizeState,
  toggleSaved,
  recordProgress,
  isInProgress,
} from "../src/store.js";
const ids = ["sintel", "steel"];
test("missing and malformed storage recover to a guest state", () => {
  for (const raw of [null, "{broken", "null", "42", '"text"']) {
    assert.deepEqual(loadState({ getItem: () => raw }, ids), freshState());
  }
});
test("storage failures do not throw", () => {
  const storage = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("quota");
    },
  };
  assert.deepEqual(loadState(storage, ids), freshState());
  assert.equal(saveState(storage, freshState()), false);
});
test("state sanitization removes unknown IDs, duplicates and invalid progress", () => {
  const result = sanitizeState(
    {
      name: "  Farid  ",
      saved: ["sintel", "unknown", "sintel"],
      progress: {
        sintel: { seconds: 100, duration: 80 },
        steel: { seconds: -1, duration: 100 },
        unknown: { seconds: 3, duration: 5 },
      },
    },
    ids,
  );
  assert.deepEqual(result, {
    name: "Farid",
    saved: ["sintel"],
    progress: { sintel: { seconds: 80, duration: 80 } },
  });
  assert.equal(
    sanitizeState({ name: "x".repeat(100), saved: "bad", progress: null }, ids)
      .name.length,
    32,
  );
});
test("watchlist adds and removes without changing the previous state", () => {
  const initial = freshState();
  const saved = toggleSaved(initial, "sintel", ids);
  assert.deepEqual(initial.saved, []);
  assert.deepEqual(saved.saved, ["sintel"]);
  assert.deepEqual(toggleSaved(saved, "sintel", ids).saved, []);
  assert.equal(toggleSaved(saved, "unknown", ids), saved);
});
test("playback rejects invalid values and clamps time to duration", () => {
  const initial = freshState();
  for (const [seconds, duration] of [
    [NaN, 100],
    [-1, 100],
    [1, 0],
    [1, Infinity],
  ])
    assert.equal(
      recordProgress(initial, "sintel", seconds, duration, ids),
      initial,
    );
  assert.equal(recordProgress(initial, "bad", 1, 100, ids), initial);
  const next = recordProgress(initial, "sintel", 150, 100, ids);
  assert.deepEqual(next.progress.sintel, { seconds: 100, duration: 100 });
  assert.deepEqual(initial.progress, {});
});
test("continue watching excludes unstarted and completed films", () => {
  assert.equal(isInProgress(undefined), false);
  assert.equal(isInProgress({ seconds: 0, duration: 100 }), false);
  assert.equal(isInProgress({ seconds: 94, duration: 100 }), true);
  assert.equal(isInProgress({ seconds: 95, duration: 100 }), false);
});
test("state round-trips through storage", () => {
  const map = new Map();
  const storage = {
    getItem: (key) => map.get(key),
    setItem: (key, value) => map.set(key, value),
  };
  const state = {
    name: "Viewer",
    saved: ["steel"],
    progress: { steel: { seconds: 22, duration: 100 } },
  };
  assert.equal(saveState(storage, state), true);
  assert.ok(map.has(STORAGE_KEY));
  assert.deepEqual(loadState(storage, ids), state);
});
