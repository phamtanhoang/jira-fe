import { get as _get, isEmpty as _isEmpty, isEqual as _isEqual, isNil as _isNil } from "lodash";

export function safeGet<T = unknown>(obj: unknown, path: string | (string | number)[], fallback?: T): T {
  return _get(obj, path, fallback) as T;
}

export function safeArray<T = unknown>(obj: unknown, path: string | (string | number)[]): T[] {
  const v = _get(obj, path);
  return Array.isArray(v) ? (v as T[]) : [];
}

export function safeString(obj: unknown, path: string | (string | number)[], fallback = ""): string {
  const v = _get(obj, path);
  return typeof v === "string" ? v : fallback;
}

export function safeNumber(obj: unknown, path: string | (string | number)[], fallback = 0): number {
  const v = _get(obj, path);
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export const isEmpty = _isEmpty;
export const isNil = _isNil;
export const isEqual = _isEqual;

export function hasChanged(a: unknown, b: unknown): boolean {
  return !_isEqual(a, b);
}
