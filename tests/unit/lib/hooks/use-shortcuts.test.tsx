/**
 * Unit tests for useShortcuts — global keyboard shortcut handler.
 *
 * Coverage focuses on the contract end-users interact with:
 *   - single-key bindings fire actions
 *   - leader sequences ("g d") match within timeout, fail outside it
 *   - typing in <input>/<textarea> does NOT trigger shortcuts
 *   - modifier keys (Ctrl/Cmd) bypass shortcuts so browser defaults still work
 *   - "?" preserves case (single-key binding uses raw e.key)
 *   - dispatched events reach listeners registered with onShortcutEvent
 */
import { renderHook } from "@testing-library/react";
import { act } from "react";
import {
  onShortcutEvent,
  SHORTCUT_EVENTS,
  useShortcuts,
} from "@/lib/hooks/use-shortcuts";

function press(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  if (target) {
    Object.defineProperty(event, "target", {
      value: target,
      enumerable: true,
    });
    target.dispatchEvent(event);
  } else {
    document.dispatchEvent(event);
  }
}

function pressWithModifier(key: string, mod: "ctrl" | "meta" | "alt") {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      ctrlKey: mod === "ctrl",
      metaKey: mod === "meta",
      altKey: mod === "alt",
    }),
  );
}

describe("useShortcuts()", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("invokes navigate() for a single-key navigate binding", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        { single: { c: { kind: "navigate", path: "/create" } } },
        navigate,
      ),
    );
    press("c");
    expect(navigate).toHaveBeenCalledWith("/create");
  });

  it("dispatches a custom event for a single-key event binding", () => {
    const navigate = jest.fn();
    const handler = jest.fn();
    const unsub = onShortcutEvent("shortcuts:test", handler);
    renderHook(() =>
      useShortcuts(
        { single: { c: { kind: "event", name: "shortcuts:test" } } },
        navigate,
      ),
    );
    press("c");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    unsub();
  });

  it("preserves '?' as the literal key (case-sensitive single binding)", () => {
    const handler = jest.fn();
    const unsub = onShortcutEvent(SHORTCUT_EVENTS.TOGGLE_CHEATSHEET, handler);
    renderHook(() =>
      useShortcuts(
        {
          single: {
            "?": { kind: "event", name: SHORTCUT_EVENTS.TOGGLE_CHEATSHEET },
          },
        },
        jest.fn(),
      ),
    );
    press("?");
    expect(handler).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("matches a leader sequence (g then d → /dashboard)", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        {
          leader: {
            g: { d: { kind: "navigate", path: "/dashboard" } },
          },
        },
        navigate,
      ),
    );
    press("g");
    press("d");
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("leader sequence times out after 800ms, ignoring a late second key", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        {
          leader: {
            g: { d: { kind: "navigate", path: "/dashboard" } },
          },
        },
        navigate,
      ),
    );
    press("g");
    act(() => {
      jest.advanceTimersByTime(900);
    });
    press("d");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("rearming leader on second 'g' resets the window", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        {
          leader: {
            g: { d: { kind: "navigate", path: "/dashboard" } },
          },
        },
        navigate,
      ),
    );
    press("g");
    act(() => {
      jest.advanceTimersByTime(500);
    });
    press("g"); // rearm
    act(() => {
      jest.advanceTimersByTime(500);
    });
    press("d");
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("ignores keystrokes when typing inside an <input>", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        { single: { c: { kind: "navigate", path: "/create" } } },
        navigate,
      ),
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    press("c", input);
    document.body.removeChild(input);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("ignores keystrokes when typing inside a <textarea>", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        { single: { c: { kind: "navigate", path: "/create" } } },
        navigate,
      ),
    );

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    press("c", textarea);
    document.body.removeChild(textarea);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("ignores keystrokes inside a contenteditable region", () => {
    const navigate = jest.fn();
    renderHook(() =>
      useShortcuts(
        { single: { c: { kind: "navigate", path: "/create" } } },
        navigate,
      ),
    );
    const div = document.createElement("div");
    // jsdom doesn't compute isContentEditable from the attribute; stub the
    // getter directly so we exercise the same code path the browser would.
    Object.defineProperty(div, "isContentEditable", {
      value: true,
      configurable: true,
    });
    document.body.appendChild(div);
    press("c", div);
    document.body.removeChild(div);
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each(["ctrl", "meta", "alt"] as const)(
    "ignores key when %s modifier is held (browser shortcuts win)",
    (mod) => {
      const navigate = jest.fn();
      renderHook(() =>
        useShortcuts(
          { single: { c: { kind: "navigate", path: "/create" } } },
          navigate,
        ),
      );
      pressWithModifier("c", mod);
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it("removes its document listener on unmount (no leaks)", () => {
    const navigate = jest.fn();
    const { unmount } = renderHook(() =>
      useShortcuts(
        { single: { c: { kind: "navigate", path: "/create" } } },
        navigate,
      ),
    );
    unmount();
    press("c");
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("onShortcutEvent()", () => {
  it("returns an unsubscribe function that removes the listener", () => {
    const handler = jest.fn();
    const unsub = onShortcutEvent("shortcuts:once", handler);
    window.dispatchEvent(new CustomEvent("shortcuts:once"));
    expect(handler).toHaveBeenCalledTimes(1);
    unsub();
    window.dispatchEvent(new CustomEvent("shortcuts:once"));
    expect(handler).toHaveBeenCalledTimes(1); // no second call after unsub
  });
});
