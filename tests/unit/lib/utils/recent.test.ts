/**
 * Unit tests for recent.ts — the localStorage-backed ring buffer that
 * powers the Cmd+K "Recent" section.
 *
 * Things we want to lock down:
 *   - dedup by `${type}:${id}` (re-pushing the same item moves it to top)
 *   - cap at MAX_ITEMS (10) — older entries fall off
 *   - clearRecents() empties storage
 *   - readRaw() tolerates corrupted JSON / missing key
 */
import {
  clearRecents,
  getRecents,
  pushRecent,
} from "@/lib/utils/recent";

beforeEach(() => {
  // Use the real jsdom localStorage but reset it for each test
  window.localStorage.clear();
});

describe("pushRecent()", () => {
  it("pushes a single issue and getRecents returns it", () => {
    pushRecent({
      type: "ISSUE",
      id: "i1",
      key: "PROJ-1",
      summary: "Fix the thing",
      issueType: "BUG",
    });
    const items = getRecents();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "ISSUE",
      id: "i1",
      key: "PROJ-1",
    });
    expect(typeof items[0].openedAt).toBe("number");
  });

  it("re-pushing the same id moves it to the front (dedup)", () => {
    pushRecent({ type: "ISSUE", id: "i1", key: "PROJ-1", summary: "First" });
    pushRecent({ type: "ISSUE", id: "i2", key: "PROJ-2", summary: "Second" });
    pushRecent({ type: "ISSUE", id: "i1", key: "PROJ-1", summary: "First" });
    const items = getRecents();
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("i1");
    expect(items[1].id).toBe("i2");
  });

  it("treats issues and projects as separate even when ids collide", () => {
    pushRecent({ type: "ISSUE", id: "x", key: "PROJ-1", summary: "Issue x" });
    pushRecent({
      type: "PROJECT",
      id: "x",
      key: "PROJ",
      name: "Project x",
      workspaceId: "w1",
    });
    const items = getRecents();
    expect(items).toHaveLength(2);
    // Both `x` items survive because the dedup key includes the type prefix.
    expect(items.map((i) => i.type).sort()).toEqual(["ISSUE", "PROJECT"]);
  });

  it("caps the buffer at MAX_ITEMS=10 (oldest fall off the tail)", () => {
    for (let i = 0; i < 13; i++) {
      pushRecent({
        type: "ISSUE",
        id: `i${i}`,
        key: `P-${i}`,
        summary: `Issue ${i}`,
      });
    }
    const items = getRecents();
    expect(items).toHaveLength(10);
    // Most-recent push is at index 0
    expect(items[0].id).toBe("i12");
    // Oldest survivor is i3 (i0/i1/i2 fell off)
    expect(items[items.length - 1].id).toBe("i3");
  });

  it("dispatches a recent-items:change event so components can re-render", () => {
    const spy = jest.fn();
    window.addEventListener("recent-items:change", spy);
    pushRecent({ type: "ISSUE", id: "i1", key: "PROJ-1", summary: "x" });
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener("recent-items:change", spy);
  });
});

describe("clearRecents()", () => {
  it("empties the storage", () => {
    pushRecent({ type: "ISSUE", id: "i1", key: "PROJ-1", summary: "x" });
    expect(getRecents()).toHaveLength(1);
    clearRecents();
    expect(getRecents()).toEqual([]);
  });
});

describe("getRecents() — read robustness", () => {
  it("returns empty array when storage is missing the key", () => {
    expect(getRecents()).toEqual([]);
  });

  it("returns empty array when storage payload is corrupted JSON", () => {
    window.localStorage.setItem("recent-items.v1", "{not json");
    expect(getRecents()).toEqual([]);
  });

  it("returns empty array when storage payload is the wrong shape", () => {
    window.localStorage.setItem(
      "recent-items.v1",
      JSON.stringify({ wrong: "shape" }),
    );
    expect(getRecents()).toEqual([]);
  });
});
