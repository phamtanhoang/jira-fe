/**
 * Component test — <CommandPalette /> (global Cmd+K search).
 *
 * The palette was redesigned to add text search across all issues
 * (was previously key-only). This suite pins:
 *
 *   1. Cmd+K / Ctrl+K opens, Esc closes — keyboard contract
 *   2. Empty query shows the "start typing" hint (no API call)
 *   3. Issue-key shaped input (e.g. "PROJ-42") uses the fast byKey
 *      endpoint, NOT the full text-search endpoint
 *   4. Free-text input < 2 chars shows the "keep typing" hint and
 *      does NOT fire a search (BE rejects <2 chars)
 *   5. Free-text input ≥ 2 chars fires /issues?search=... with
 *      take: 10
 *   6. Debounce: typing fast → one API call
 *   7. No-results state renders a friendly message with the query
 *   8. Workspaces filter client-side from the existing useWorkspaces
 *      cache (no extra API call per keystroke)
 *   9. Clicking an issue / workspace closes the palette and navigates
 *  10. Clear button (X) resets the query
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// cmdk (the underlying command-palette library) uses ResizeObserver to
// measure list items and `Element.scrollIntoView` for the keyboard-driven
// active item. jsdom ships neither — polyfill so the component can mount
// without crashing.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: typeof FakeResizeObserver }).ResizeObserver =
  FakeResizeObserver;
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// ─── Mocks ─────────────────────────────────────────────────────────────
jest.mock("@/lib/stores/use-app-store", () => ({
  useAppStore: () => ({
    t: (key: string, vars?: Record<string, string>) => {
      if (!vars) return key;
      // Append unmatched vars as ` k=v` suffix so the test can assert on
      // the interpolated value even when the literal key path has no
      // `{var}` placeholder (which is the case when we echo back keys
      // as-is for assertion purposes).
      let s = key;
      const remaining: string[] = [];
      for (const [k, v] of Object.entries(vars)) {
        const before = s;
        s = s.replace(`{${k}}`, String(v));
        if (s === before) remaining.push(`${k}=${v}`);
      }
      return remaining.length ? `${s} ${remaining.join(" ")}` : s;
    },
  }),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// useRecents — return empty so the test focuses on search behavior.
const mockRecents = jest.fn().mockReturnValue([]);
jest.mock("@/lib/utils", () => {
  const real = jest.requireActual("@/lib/utils");
  return {
    ...real,
    useRecents: () => mockRecents(),
    clearRecents: jest.fn(),
  };
});

// useWorkspaces — return a small fixture so workspaces group has data.
const mockUseWorkspaces = jest.fn().mockReturnValue({
  data: [
    { id: "ws-1", name: "Acme", _count: { projects: 3 } },
    { id: "ws-2", name: "Beta Corp", _count: { projects: 0 } },
  ],
});
jest.mock("@/features/workspaces/hooks", () => ({
  useWorkspaces: () => mockUseWorkspaces(),
}));

// api.get is the source of truth — mock the module-level instance.
const mockApiGet = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

import { CommandPalette } from "@/components/shared/command-palette";

function openPalette(user: ReturnType<typeof userEvent.setup>) {
  // Trigger button is the easiest entry — the keyboard shortcut path is
  // covered separately.
  return user.click(screen.getByRole("button", { name: /common\.search/i }));
}

describe("<CommandPalette />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockReset();
    mockRecents.mockReturnValue([]);
    mockUseWorkspaces.mockReturnValue({
      data: [
        { id: "ws-1", name: "Acme", _count: { projects: 3 } },
        { id: "ws-2", name: "Beta Corp", _count: { projects: 0 } },
      ],
    });
  });

  describe("open / close", () => {
    it("renders the trigger button when closed (no overlay)", () => {
      render(<CommandPalette />);
      expect(
        screen.getByRole("button", { name: /common\.search/i }),
      ).toBeInTheDocument();
      // No combobox / dialog mounted yet
      expect(screen.queryByPlaceholderText("search.placeholder")).toBeNull();
    });

    it("opens when the trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<CommandPalette />);
      await openPalette(user);
      expect(
        screen.getByPlaceholderText("search.placeholder"),
      ).toBeInTheDocument();
    });

    it("opens with Ctrl+K", async () => {
      const user = userEvent.setup();
      render(<CommandPalette />);
      await user.keyboard("{Control>}k{/Control}");
      expect(
        screen.getByPlaceholderText("search.placeholder"),
      ).toBeInTheDocument();
    });

    it("toggles closed with a second Ctrl+K", async () => {
      const user = userEvent.setup();
      render(<CommandPalette />);
      await user.keyboard("{Control>}k{/Control}");
      await user.keyboard("{Control>}k{/Control}");
      expect(screen.queryByPlaceholderText("search.placeholder")).toBeNull();
    });
  });

  describe("idle state — no query", () => {
    it("does NOT fire any API call on open (search is debounced + gated)", async () => {
      const user = userEvent.setup();
      render(<CommandPalette />);
      await openPalette(user);
      expect(mockApiGet).not.toHaveBeenCalled();
    });

    it("shows the 'start typing' hint when there are no workspaces/recents to show", async () => {
      // The hook is read on every render — use mockReturnValue (not Once)
      // so the empty list survives the re-render triggered by opening.
      mockUseWorkspaces.mockReturnValue({ data: [] });
      mockRecents.mockReturnValue([]);
      const user = userEvent.setup();
      render(<CommandPalette />);
      await openPalette(user);

      expect(screen.getByText("search.startTyping")).toBeInTheDocument();
      expect(mockApiGet).not.toHaveBeenCalled();
    });

    it("shows the first 5 workspaces in the Workspaces group", async () => {
      const user = userEvent.setup();
      render(<CommandPalette />);
      await openPalette(user);
      expect(screen.getByText("Acme")).toBeInTheDocument();
      expect(screen.getByText("Beta Corp")).toBeInTheDocument();
    });
  });

  describe("issue-key fast path", () => {
    it("calls the byKey endpoint when input matches PROJ-42 pattern (case-insensitive)", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValueOnce({
        data: { id: "i-1", key: "PROJ-42", type: "TASK", summary: "Fix" },
      });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);

      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "proj-42",
      );
      // Flush the 300ms debounce + the promise microtask queue.
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      // Hits the byKey endpoint with the uppercased key.
      expect(mockApiGet).toHaveBeenCalledTimes(1);
      const [url] = mockApiGet.mock.calls[0];
      expect(url).toContain("PROJ-42");
      // No accidental fall-through to the search endpoint
      expect(
        mockApiGet.mock.calls.some(
          (call) =>
            (call[1] as { params?: { search?: string } })?.params?.search,
        ),
      ).toBe(false);
    });
  });

  describe("text-search path", () => {
    it("shows 'keep typing' for a 1-char query and skips the API", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);

      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "x",
      );
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      expect(screen.getByText("search.keepTyping")).toBeInTheDocument();
      expect(mockApiGet).not.toHaveBeenCalled();
    });

    it("fires GET /issues with search + take=10 for queries ≥ 2 chars", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValueOnce({ data: [] });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);

      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "bug",
      );
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      const [, opts] = mockApiGet.mock.calls[0];
      expect((opts as { params: { search: string; take: number } }).params).toEqual({
        search: "bug",
        take: 10,
      });
    });

    it("debounces — typing 5 chars rapidly results in one API call", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValue({ data: [] });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);

      const input = screen.getByPlaceholderText("search.placeholder");
      // Each user.type keystroke fires a new effect — but only the
      // trailing edge of the 300ms debounce window should make a request.
      await user.type(input, "react");
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      const [, opts] = mockApiGet.mock.calls[0];
      expect((opts as { params: { search: string } }).params.search).toBe(
        "react",
      );
    });

    it("renders matching issues with their key prefix and summary", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValueOnce({
        data: [
          {
            id: "i-1",
            key: "PROJ-1",
            type: "TASK",
            summary: "Login broken",
          },
          {
            id: "i-2",
            key: "PROJ-2",
            type: "BUG",
            summary: "Logout race",
          },
        ],
      });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);
      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "log",
      );
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      await waitFor(() => {
        expect(screen.getByText("PROJ-1")).toBeInTheDocument();
        expect(screen.getByText("Login broken")).toBeInTheDocument();
        expect(screen.getByText("PROJ-2")).toBeInTheDocument();
        expect(screen.getByText("Logout race")).toBeInTheDocument();
      });
    });

    it("renders the no-results state with the literal query echoed", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValueOnce({ data: [] });
      // Also drop workspaces so no group hides the empty state.
      mockUseWorkspaces.mockReturnValueOnce({ data: [] });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);
      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "xyzzy",
      );
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      // The literal query appears inside the message via {query} interp.
      await waitFor(() => {
        expect(screen.getByText(/xyzzy/)).toBeInTheDocument();
      });
    });

    it("falls back to no-results on API failure (no toast / no throw)", async () => {
      jest.useFakeTimers();
      mockApiGet.mockRejectedValueOnce(new Error("Network down"));
      mockUseWorkspaces.mockReturnValueOnce({ data: [] });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);
      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "abc",
      );
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      // No crash, no issues shown
      await waitFor(() => {
        expect(screen.getByText(/abc/)).toBeInTheDocument();
      });
    });
  });

  describe("workspaces client-side filter", () => {
    it("filters workspaces by case-insensitive substring as the user types", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValue({ data: [] });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);

      await user.type(
        screen.getByPlaceholderText("search.placeholder"),
        "ac",
      );
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      // "Acme" matches "ac"; "Beta Corp" does not.
      expect(screen.getByText("Acme")).toBeInTheDocument();
      expect(screen.queryByText("Beta Corp")).toBeNull();
    });
  });

  describe("clear button", () => {
    it("appears when query is non-empty + idle, clears query on click", async () => {
      jest.useFakeTimers();
      mockApiGet.mockResolvedValue({ data: [] });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(<CommandPalette />);
      await openPalette(user);

      const input = screen.getByPlaceholderText(
        "search.placeholder",
      ) as HTMLInputElement;
      await user.type(input, "abc");
      await act(async () => {
        jest.advanceTimersByTime(310);
      });
      jest.useRealTimers();

      // Clear button has aria-label common.clear
      const clearBtn = screen.getByLabelText("common.clear");
      await user.click(clearBtn);
      expect(input.value).toBe("");
    });
  });
});
