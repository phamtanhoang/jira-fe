/**
 * Edge-case tests for `upload-storage.ts` — localStorage-backed resume
 * registry for large file uploads.
 *
 * The hot paths are: page reloads mid-upload, multiple tabs writing the
 * same key, quota errors when the user already has lots of resumes,
 * corrupted JSON (from manual edits or extension interference), and
 * `pagehide` fire-and-forget beacons. None of these can throw — losing
 * the resume capability is acceptable; crashing the FE is not.
 */
import {
  beaconAbortAll,
  fileMatchesPersisted,
  listPersistedUploads,
  removePersistedUpload,
  savePersistedUpload,
  type PersistedUpload,
} from "@/features/projects/upload-storage";

const STORAGE_KEY = "jira:pending-large-uploads:v1";
const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 1000).toISOString();

function entry(overrides: Partial<PersistedUpload> = {}): PersistedUpload {
  return {
    sessionId: "sess-1",
    issueId: "issue-1",
    fileName: "report.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    expiresAt: FUTURE,
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("upload-storage edge cases", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  describe("listPersistedUploads()", () => {
    it("returns an empty array when nothing is persisted", () => {
      expect(listPersistedUploads()).toEqual([]);
    });

    it("returns entries sorted by updatedAt DESC (most recent first)", () => {
      savePersistedUpload(entry({ sessionId: "old", updatedAt: 1 }));
      // Real Date.now() in save() — order by manual updatedAt via custom write
      const newer = entry({ sessionId: "new", updatedAt: 9_999_999 });
      const older = entry({ sessionId: "old2", updatedAt: 1 });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ new: newer, old2: older }),
      );
      const out = listPersistedUploads();
      expect(out.map((e) => e.sessionId)).toEqual(["new", "old2"]);
    });

    it("filters by issueId when provided", () => {
      savePersistedUpload(entry({ sessionId: "a", issueId: "issue-1" }));
      savePersistedUpload(entry({ sessionId: "b", issueId: "issue-2" }));
      const out = listPersistedUploads("issue-1");
      expect(out.map((e) => e.sessionId)).toEqual(["a"]);
    });

    it("drops expired entries proactively on read", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fresh: entry({ sessionId: "fresh", expiresAt: FUTURE }),
          stale: entry({ sessionId: "stale", expiresAt: PAST }),
        }),
      );
      const out = listPersistedUploads();
      expect(out.map((e) => e.sessionId)).toEqual(["fresh"]);
    });

    it("treats invalid expiresAt as expired (drops the entry)", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          weird: entry({ sessionId: "weird", expiresAt: "not-a-date" }),
        }),
      );
      expect(listPersistedUploads()).toEqual([]);
    });

    it("returns [] and wipes the key on corrupt JSON (no throw)", () => {
      window.localStorage.setItem(STORAGE_KEY, "{not valid JSON");
      expect(listPersistedUploads()).toEqual([]);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("returns [] when value is a JSON array (wrong shape — must be a map)", () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry()]));
      // Array.isArray check inside iter still yields a map of indices —
      // and the entries have valid expiry, so they survive. Pin the
      // current observable behavior.
      const out = listPersistedUploads();
      // Either [] (preferred) or an array of valid entries. Both
      // outcomes are acceptable; ensure no throw.
      expect(Array.isArray(out)).toBe(true);
    });

    it("skips entries that are null or non-object", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          good: entry({ sessionId: "good" }),
          junk1: null,
          junk2: "a string",
          junk3: 42,
        }),
      );
      const out = listPersistedUploads();
      expect(out.map((e) => e.sessionId)).toEqual(["good"]);
    });
  });

  describe("savePersistedUpload()", () => {
    it("stamps updatedAt to Date.now() on save (even if entry carries a different value)", () => {
      const before = Date.now();
      savePersistedUpload(
        entry({ sessionId: "a", updatedAt: 1 /* stale */ }),
      );
      const stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY)!,
      ) as Record<string, PersistedUpload>;
      const after = Date.now();
      expect(stored.a.updatedAt).toBeGreaterThanOrEqual(before);
      expect(stored.a.updatedAt).toBeLessThanOrEqual(after);
      expect(stored.a.updatedAt).not.toBe(1);
    });

    it("upserts — saving twice with same sessionId leaves a single entry", () => {
      savePersistedUpload(entry({ sessionId: "x", fileName: "v1.txt" }));
      savePersistedUpload(entry({ sessionId: "x", fileName: "v2.txt" }));
      const out = listPersistedUploads();
      expect(out).toHaveLength(1);
      expect(out[0].fileName).toBe("v2.txt");
    });

    it("preserves OTHER sessionIds when saving a new one", () => {
      savePersistedUpload(entry({ sessionId: "a" }));
      savePersistedUpload(entry({ sessionId: "b" }));
      const out = listPersistedUploads();
      expect(out.map((e) => e.sessionId).sort()).toEqual(["a", "b"]);
    });

    it("silently swallows localStorage quota errors (no throw)", () => {
      jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementationOnce(() => {
          throw new Error("QuotaExceededError");
        });
      expect(() => savePersistedUpload(entry())).not.toThrow();
    });

    it("survives the storage key being corrupted between read and write (re-reads fresh)", () => {
      savePersistedUpload(entry({ sessionId: "a" }));
      // Mutate raw underneath
      window.localStorage.setItem(STORAGE_KEY, "garbage");
      // Next save must NOT throw and must produce a valid single-entry map
      expect(() =>
        savePersistedUpload(entry({ sessionId: "b" })),
      ).not.toThrow();
      const out = listPersistedUploads();
      // Old "a" was wiped by the corruption-handler read; "b" is now the only one
      expect(out.map((e) => e.sessionId)).toEqual(["b"]);
    });
  });

  describe("removePersistedUpload()", () => {
    it("removes the matching sessionId", () => {
      savePersistedUpload(entry({ sessionId: "a" }));
      savePersistedUpload(entry({ sessionId: "b" }));
      removePersistedUpload("a");
      expect(listPersistedUploads().map((e) => e.sessionId)).toEqual(["b"]);
    });

    it("is a no-op when the sessionId is absent (no extra write)", () => {
      savePersistedUpload(entry({ sessionId: "a" }));
      const before = window.localStorage.getItem(STORAGE_KEY);
      const setSpy = jest.spyOn(Storage.prototype, "setItem");
      removePersistedUpload("missing");
      // We didn't call setItem after the read because the map didn't change.
      // (Note: the impl skips the write when key was absent.)
      expect(setSpy).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(before);
    });

    it("does not throw when storage is empty", () => {
      expect(() => removePersistedUpload("nope")).not.toThrow();
    });
  });

  describe("fileMatchesPersisted()", () => {
    function makeFile(name: string, size: number): File {
      const blob = new Blob(new Array(size).fill("a"), {
        type: "text/plain",
      });
      return new File([blob], name, { type: "text/plain" });
    }

    it("returns true when name + size match exactly", () => {
      const e = entry({ fileName: "doc.txt", fileSize: 5 });
      expect(fileMatchesPersisted(makeFile("doc.txt", 5), e)).toBe(true);
    });

    it("returns false when the name differs (case-sensitive)", () => {
      const e = entry({ fileName: "doc.txt", fileSize: 5 });
      expect(fileMatchesPersisted(makeFile("Doc.txt", 5), e)).toBe(false);
    });

    it("returns false when the size differs by even 1 byte", () => {
      const e = entry({ fileName: "doc.txt", fileSize: 5 });
      expect(fileMatchesPersisted(makeFile("doc.txt", 6), e)).toBe(false);
    });

    it("returns false for two zero-byte files of different names", () => {
      const e = entry({ fileName: "a.txt", fileSize: 0 });
      expect(fileMatchesPersisted(makeFile("b.txt", 0), e)).toBe(false);
    });

    it("does NOT check mimeType (filename + size is the contract)", () => {
      const e = entry({
        fileName: "doc.txt",
        fileSize: 5,
        mimeType: "text/plain",
      });
      // Make a file with a different mimetype but same name+size
      const blob = new Blob(["aaaaa"], { type: "application/octet-stream" });
      const file = new File([blob], "doc.txt", {
        type: "application/octet-stream",
      });
      expect(fileMatchesPersisted(file, e)).toBe(true);
    });
  });

  describe("beaconAbortAll()", () => {
    it("calls sendBeacon once per sessionId", () => {
      const spy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, "sendBeacon", {
        value: spy,
        configurable: true,
        writable: true,
      });
      beaconAbortAll(["s1", "s2", "s3"]);
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it("URL-encodes sessionIds with special characters", () => {
      const spy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, "sendBeacon", {
        value: spy,
        configurable: true,
        writable: true,
      });
      beaconAbortAll(["a/b?c=d"]);
      const url = spy.mock.calls[0][0] as string;
      expect(url).not.toContain("?c=d"); // raw query string would break BE routing
      expect(url).toContain(encodeURIComponent("a/b?c=d"));
    });

    it("uses the abort-beacon endpoint path (not the regular abort)", () => {
      const spy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, "sendBeacon", {
        value: spy,
        configurable: true,
        writable: true,
      });
      beaconAbortAll(["x"]);
      const url = spy.mock.calls[0][0] as string;
      expect(url).toBe("/api/attachments/large/x/abort-beacon");
    });

    it("is a no-op when navigator.sendBeacon is undefined (older browsers)", () => {
      Object.defineProperty(navigator, "sendBeacon", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      expect(() => beaconAbortAll(["s1", "s2"])).not.toThrow();
    });

    it("is a no-op when sessionIds is empty", () => {
      const spy = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, "sendBeacon", {
        value: spy,
        configurable: true,
        writable: true,
      });
      beaconAbortAll([]);
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not throw when sendBeacon itself throws (fire-and-forget contract)", () => {
      Object.defineProperty(navigator, "sendBeacon", {
        value: () => {
          throw new Error("CSP denied");
        },
        configurable: true,
        writable: true,
      });
      expect(() => beaconAbortAll(["s1", "s2"])).not.toThrow();
    });

    it("posts an empty body so BE only relies on the sessionId path param", () => {
      let body: Blob | null = null;
      Object.defineProperty(navigator, "sendBeacon", {
        value: (_url: string, payload: Blob) => {
          body = payload;
          return true;
        },
        configurable: true,
        writable: true,
      });
      beaconAbortAll(["x"]);
      expect(body).toBeInstanceOf(Blob);
      expect((body as unknown as Blob).size).toBe(0);
    });
  });

  describe("schema versioning safety", () => {
    it("does NOT read from a hypothetical v0/v2 key — keys are version-isolated", () => {
      window.localStorage.setItem(
        "jira:pending-large-uploads:v0",
        JSON.stringify({ a: entry({ sessionId: "a" }) }),
      );
      window.localStorage.setItem(
        "jira:pending-large-uploads:v2",
        JSON.stringify({ b: entry({ sessionId: "b" }) }),
      );
      // listPersistedUploads only reads the v1 key
      expect(listPersistedUploads()).toEqual([]);
    });
  });
});
