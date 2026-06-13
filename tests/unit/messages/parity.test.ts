/**
 * i18n key parity gate.
 *
 * Both vi.json and en.json must expose the same key tree. A drift here
 * is invisible at runtime (the missing-key fallback prints the literal
 * dotted path in the UI), so type-check + lint won't catch it. This
 * test fails CI whenever the two files diverge — preventing the slow
 * accumulation of vi-only or en-only keys that the codebase has
 * historically suffered from.
 *
 * Also asserts that every `{var}` interpolation token in one locale
 * exists in the other for the same key — otherwise a translator drops
 * a placeholder and the user sees garbled output.
 */
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Json, path));
    } else if (typeof v === "string") {
      out[path] = v;
    }
  }
  return out;
}

function extractTokens(value: string): string[] {
  const matches = value.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) ?? [];
  return [...new Set(matches)].sort();
}

const flatEn = flatten(en as Json);
const flatVi = flatten(vi as Json);

describe("i18n parity (vi.json vs en.json)", () => {
  it("en.json has at least one key (sanity)", () => {
    expect(Object.keys(flatEn).length).toBeGreaterThan(50);
  });

  it("vi.json has at least one key (sanity)", () => {
    expect(Object.keys(flatVi).length).toBeGreaterThan(50);
  });

  it("every en key exists in vi", () => {
    const missing = Object.keys(flatEn).filter((k) => !(k in flatVi));
    expect(missing).toEqual([]);
  });

  it("every vi key exists in en", () => {
    const missing = Object.keys(flatVi).filter((k) => !(k in flatEn));
    expect(missing).toEqual([]);
  });

  it("interpolation tokens match per key", () => {
    // For each key present in BOTH files, the set of {var} tokens must
    // be identical. A translator dropping {count} from vi means the UI
    // renders "có" (literal) instead of "có 5 dự án".
    const drift: Array<{ key: string; en: string[]; vi: string[] }> = [];
    for (const key of Object.keys(flatEn)) {
      if (!(key in flatVi)) continue; // covered by previous test
      const a = extractTokens(flatEn[key]);
      const b = extractTokens(flatVi[key]);
      if (a.length !== b.length || a.some((tok, i) => tok !== b[i])) {
        drift.push({ key, en: a, vi: b });
      }
    }
    expect(drift).toEqual([]);
  });

  it("no key resolves to an empty string", () => {
    // An empty translation is almost always a leftover from a copy-paste
    // — the UI renders blank space and looks broken.
    const empties = [
      ...Object.entries(flatEn).filter(([, v]) => v.trim() === ""),
      ...Object.entries(flatVi).filter(([, v]) => v.trim() === ""),
    ].map(([k]) => k);
    expect(empties).toEqual([]);
  });
});
