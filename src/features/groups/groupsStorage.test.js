import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  GROUPS_KEY,
  loadGroupsState,
  saveGroupsState,
  readList,
  writeList,
} from "./groupsStorage.js";

const memory = new Map();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
});

describe("groupsStorage", () => {
  it("returns empty arrays when nothing stored", () => {
    const state = loadGroupsState();
    assert.deepEqual(state.groups, []);
    assert.deepEqual(state.memberships, []);
    assert.deepEqual(state.messages, []);
    assert.deepEqual(state.sharedFiles, []);
  });

  it("round-trips state", () => {
    const next = {
      groups: [{ id: "1", name: "G" }],
      memberships: [],
      messages: [],
      sharedFiles: [],
    };
    saveGroupsState(next);
    assert.deepEqual(loadGroupsState(), next);
  });

  it("readList falls back on corrupt JSON", () => {
    localStorage.setItem(GROUPS_KEY, "{not-json");
    assert.deepEqual(readList(GROUPS_KEY), []);
  });

  it("writeList persists JSON", () => {
    writeList(GROUPS_KEY, [{ id: "a" }]);
    assert.equal(localStorage.getItem(GROUPS_KEY), JSON.stringify([{ id: "a" }]));
  });

  it("readList falls back when a non-array was stored", () => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify({ id: "a" }));
    assert.deepEqual(readList(GROUPS_KEY), []);
  });

  it("saveGroupsState fills in missing buckets with empty arrays", () => {
    saveGroupsState({ groups: [{ id: "2" }] });
    const state = loadGroupsState();
    assert.deepEqual(state.groups, [{ id: "2" }]);
    assert.deepEqual(state.memberships, []);
    assert.deepEqual(state.messages, []);
    assert.deepEqual(state.sharedFiles, []);
  });
});
