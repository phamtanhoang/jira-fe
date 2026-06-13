/**
 * Hook test — `useReorderColumns` (optimistic update with rollback).
 *
 * The canonical optimistic-mutation pattern in the repo:
 *
 *   onMutate  : cancel in-flight queries, snapshot current cache,
 *               rearrange the cached board immediately
 *   onError   : restore from snapshot (the user sees the drag undone)
 *   onSettled : invalidate the queryKey so the BE-canonical order wins
 *               on the next refetch
 *
 * The recently-added board column drag-and-drop UI depends on this for
 * "no snap-back during the in-flight request". This suite pins the
 * three pillars: optimistic apply, rollback on error, invalidate on
 * settle.
 */
import { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useReorderColumns } from "@/features/projects/hooks";
import { boardsApi } from "@/features/projects/api";
import type { Board } from "@/features/projects/types";

// Silence the toast from handleApiError so failed mutations don't pollute
// console in test output. We assert error state via mutation.status.
jest.mock("@/lib/utils", () => {
  const real = jest.requireActual("@/lib/utils");
  return {
    ...real,
    handleApiError: jest.fn(),
  };
});

const PROJECT_ID = "p-1";
const BOARD_ID = "b-1";
const COL_A = "col-a";
const COL_B = "col-b";
const COL_C = "col-c";

function makeBoard(): Board {
  return {
    id: BOARD_ID,
    name: "Test Board",
    projectId: PROJECT_ID,
    type: "SCRUM",
    columns: [
      {
        id: COL_A,
        boardId: BOARD_ID,
        name: "To Do",
        category: "TODO",
        position: 0,
        wipLimit: null,
        issues: [],
      },
      {
        id: COL_B,
        boardId: BOARD_ID,
        name: "In Progress",
        category: "IN_PROGRESS",
        position: 1,
        wipLimit: null,
        issues: [],
      },
      {
        id: COL_C,
        boardId: BOARD_ID,
        name: "Done",
        category: "DONE",
        position: 2,
        wipLimit: null,
        issues: [],
      },
    ],
    sprints: [],
  };
}

function makeClient() {
  // Note: do NOT set `gcTime: 0`. The hook only observes the mutation,
  // not the `["board", projectId]` query — so with gcTime: 0 the cache
  // entry we seed via setQueryData is immediately garbage-collected and
  // every getQueryData read inside onMutate sees `undefined`.
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapper(client: QueryClient) {
  const Provider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Provider.displayName = "TestQueryClientWrapper";
  return Provider;
}

describe("useReorderColumns()", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("optimistically rearranges the cached board BEFORE the network call resolves", async () => {
    const client = makeClient();
    client.setQueryData<Board>(["board", PROJECT_ID], makeBoard());

    // Make the API call hang forever — we only want to observe the
    // post-onMutate snapshot.
    const pending = new Promise<unknown>(() => {});
    jest.spyOn(boardsApi, "reorderColumns").mockReturnValue(pending as never);

    const { result } = renderHook(() => useReorderColumns(PROJECT_ID), {
      wrapper: wrapper(client),
    });

    act(() => {
      result.current.mutate({
        boardId: BOARD_ID,
        columnIds: [COL_B, COL_C, COL_A],
      });
    });

    await waitFor(() => {
      const cached = client.getQueryData<Board>(["board", PROJECT_ID]);
      expect(cached?.columns.map((c) => c.id)).toEqual([COL_B, COL_C, COL_A]);
    });

    // Positions reassigned to the new order, not preserved from old.
    const cached = client.getQueryData<Board>(["board", PROJECT_ID]);
    expect(cached?.columns.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it("rolls back to the snapshot when the mutation rejects", async () => {
    const client = makeClient();
    const original = makeBoard();
    client.setQueryData<Board>(["board", PROJECT_ID], original);

    jest
      .spyOn(boardsApi, "reorderColumns")
      .mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useReorderColumns(PROJECT_ID), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      result.current.mutate({
        boardId: BOARD_ID,
        columnIds: [COL_C, COL_B, COL_A],
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache snapped back to the original order — the drag visually
    // undoes itself.
    const cached = client.getQueryData<Board>(["board", PROJECT_ID]);
    expect(cached?.columns.map((c) => c.id)).toEqual([COL_A, COL_B, COL_C]);
  });

  it("invalidates the board query on settle so the BE order wins next refetch", async () => {
    const client = makeClient();
    client.setQueryData<Board>(["board", PROJECT_ID], makeBoard());

    jest.spyOn(boardsApi, "reorderColumns").mockResolvedValueOnce([] as never);

    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useReorderColumns(PROJECT_ID), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      result.current.mutate({
        boardId: BOARD_ID,
        columnIds: [COL_B, COL_A, COL_C],
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["board", PROJECT_ID],
    });
  });

  it("filters out unknown column ids so a stale drag doesn't corrupt the cache", async () => {
    const client = makeClient();
    client.setQueryData<Board>(["board", PROJECT_ID], makeBoard());

    // Hang the request so we observe only the optimistic step.
    jest
      .spyOn(boardsApi, "reorderColumns")
      .mockReturnValue(new Promise(() => {}) as never);

    const { result } = renderHook(() => useReorderColumns(PROJECT_ID), {
      wrapper: wrapper(client),
    });

    act(() => {
      result.current.mutate({
        boardId: BOARD_ID,
        // GHOST does not exist on the cached board
        columnIds: [COL_B, "GHOST", COL_A, COL_C],
      });
    });

    await waitFor(() => {
      const cached = client.getQueryData<Board>(["board", PROJECT_ID]);
      // GHOST stripped; existing columns kept in the user's order
      expect(cached?.columns.map((c) => c.id)).toEqual([COL_B, COL_A, COL_C]);
    });
  });

  it("is a no-op against the cache when there is no cached board (cold load)", async () => {
    const client = makeClient();
    // intentionally no setQueryData

    jest
      .spyOn(boardsApi, "reorderColumns")
      .mockReturnValue(new Promise(() => {}) as never);

    const { result } = renderHook(() => useReorderColumns(PROJECT_ID), {
      wrapper: wrapper(client),
    });

    act(() => {
      result.current.mutate({
        boardId: BOARD_ID,
        columnIds: [COL_B, COL_A, COL_C],
      });
    });

    // No throw, no cached board produced from thin air
    expect(client.getQueryData(["board", PROJECT_ID])).toBeUndefined();
  });

  it("passes the boardId + columnIds payload to the API unchanged", async () => {
    const client = makeClient();
    client.setQueryData<Board>(["board", PROJECT_ID], makeBoard());

    const api = jest
      .spyOn(boardsApi, "reorderColumns")
      .mockResolvedValueOnce([] as never);

    const { result } = renderHook(() => useReorderColumns(PROJECT_ID), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      result.current.mutate({
        boardId: BOARD_ID,
        columnIds: [COL_B, COL_A, COL_C],
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api).toHaveBeenCalledWith(BOARD_ID, [COL_B, COL_A, COL_C]);
  });
});
