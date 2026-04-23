/**
 * Unit tests for breadcrumbs.ts ring buffer.
 *
 * Breadcrumbs are module-level state, so we import clearBreadcrumbs()
 * in beforeEach to reset the buffer between tests.
 */
import {
  pushBreadcrumb,
  snapshotBreadcrumbs,
  clearBreadcrumbs,
} from "@/lib/logging/breadcrumbs";

describe("breadcrumbs ring buffer", () => {
  beforeEach(() => {
    clearBreadcrumbs();
  });

  it("starts empty", () => {
    expect(snapshotBreadcrumbs()).toEqual([]);
  });

  it("pushes a breadcrumb and adds timestamp automatically", () => {
    pushBreadcrumb({ type: "nav", message: "navigate to /home" });
    const snap = snapshotBreadcrumbs();
    expect(snap).toHaveLength(1);
    expect(snap[0].type).toBe("nav");
    expect(snap[0].message).toBe("navigate to /home");
    expect(typeof snap[0].timestamp).toBe("string");
    // ISO-8601 ends with Z
    expect(snap[0].timestamp).toMatch(/Z$/);
  });

  it("preserves optional data payload", () => {
    pushBreadcrumb({
      type: "api",
      message: "GET /issues",
      data: { status: 200 },
    });
    const snap = snapshotBreadcrumbs();
    expect(snap[0].data).toEqual({ status: 200 });
  });

  it("keeps entries in insertion order", () => {
    pushBreadcrumb({ type: "click", message: "a" });
    pushBreadcrumb({ type: "click", message: "b" });
    pushBreadcrumb({ type: "click", message: "c" });
    const snap = snapshotBreadcrumbs();
    expect(snap.map((b) => b.message)).toEqual(["a", "b", "c"]);
  });

  it("caps at 50 items — oldest is dropped when full", () => {
    for (let i = 0; i < 60; i++) {
      pushBreadcrumb({ type: "click", message: `msg-${i}` });
    }
    const snap = snapshotBreadcrumbs();
    expect(snap).toHaveLength(50);
    // First message remaining should be msg-10 (0..9 were shifted out)
    expect(snap[0].message).toBe("msg-10");
    expect(snap[49].message).toBe("msg-59");
  });

  it("snapshotBreadcrumbs returns a defensive copy — callers can mutate freely", () => {
    pushBreadcrumb({ type: "click", message: "x" });
    const snap = snapshotBreadcrumbs();
    snap.push({
      type: "error",
      message: "mutated",
      timestamp: new Date().toISOString(),
    });
    // Internal buffer still holds only the originally-pushed breadcrumb
    expect(snapshotBreadcrumbs()).toHaveLength(1);
    expect(snapshotBreadcrumbs()[0].message).toBe("x");
  });

  it("clearBreadcrumbs empties the buffer", () => {
    pushBreadcrumb({ type: "click", message: "a" });
    pushBreadcrumb({ type: "click", message: "b" });
    expect(snapshotBreadcrumbs()).toHaveLength(2);
    clearBreadcrumbs();
    expect(snapshotBreadcrumbs()).toHaveLength(0);
  });
});
