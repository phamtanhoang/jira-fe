/**
 * Workspace and project tiles. Two workspaces with the same name (or first
 * letter) used to look identical in the sidebar — `getTileGradient` hashes
 * a stable seed (workspace/project id) to a palette slot so the tile
 * colour is deterministic but varied across the list.
 *
 * Seed contract:
 *  - Use the entity's UUID, NOT its name. Names get renamed; the colour
 *    should stay stable across renames so users keep their visual anchor.
 *  - Empty/blank seed → first palette entry (defensive fallback).
 */
const TILE_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-indigo-600",
  "from-fuchsia-500 to-purple-600",
] as const;

export type TileGradient = (typeof TILE_GRADIENTS)[number];

export function getTileGradient(seed: string | null | undefined): TileGradient {
  if (!seed) return TILE_GRADIENTS[0];
  // djb2-flavoured hash — overflow-safe via `| 0` (forces int32),
  // collision-tolerant since we only need a palette index.
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return TILE_GRADIENTS[Math.abs(hash) % TILE_GRADIENTS.length];
}
