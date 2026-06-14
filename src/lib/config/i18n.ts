import vi from "@/messages/vi.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import ko from "@/messages/ko.json";
import zh from "@/messages/zh.json";
import fr from "@/messages/fr.json";

/**
 * Supported UI locales.
 *
 * `en` and `vi` are the canonical pair — every new i18n key MUST be
 * added to BOTH (the parity test enforces this). The other locales
 * (ja, ko, zh, fr) are "partial" — keys missing there silently fall
 * back to English via `t()` below. When you add a new key, please
 * also translate to the partial locales when reasonable; the fallback
 * exists to keep the UI usable, not to excuse skipping translation.
 *
 * If you need to add another locale: create the JSON shell, import it
 * here, append the code to `locales`, then add an entry to
 * `LOCALE_CONFIG` in `src/components/shared/locale-switcher/index.tsx`.
 */
export const locales = ["en", "vi", "ja", "ko", "zh", "fr"] as const;
export type Locale = (typeof locales)[number];

/**
 * Default fallback locale. When the current locale doesn't define a key,
 * `t()` re-walks the tree under this locale before giving up and
 * returning the key path. English is the canonical reference because
 * every key starts there.
 */
export const defaultLocale: Locale = "en";

// We TYPE every locale as `Messages` (= the shape of vi.json, our
// reference). Partial locales (ja/ko/zh/fr) are JSON objects that may
// only define a SUBSET of keys, so the cast is intentional — runtime
// `t()` handles the gap via fallback. Trying to declare partial locales
// with a `Partial<Messages>` shape blows up the `NestedKeyOf` recursion.
const messages = { vi, en, ja, ko, zh, fr } as Record<Locale, Messages>;

type Messages = typeof vi;
type NestedKeyOf<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? NestedKeyOf<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

export type MessageKey = NestedKeyOf<Messages>;

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages[defaultLocale];
}

/**
 * Resolve a dotted i18n key against the current locale. When the key
 * isn't defined in `locale` (because the locale is partial), retry the
 * lookup under `defaultLocale` so the user sees English instead of a
 * raw key path. Only when BOTH miss do we return the literal key — that
 * pathway should never reach production because the parity test fails
 * the build for missing en/vi keys.
 */
export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string>,
): string {
  const fromCurrent = lookup(locale, key);
  const resolved =
    typeof fromCurrent === "string" && fromCurrent !== ""
      ? fromCurrent
      : // Fallback path. Skipped when we're already on the default to
        // avoid a redundant tree walk in the happy case.
        locale === defaultLocale
        ? null
        : lookup(defaultLocale, key);

  if (typeof resolved !== "string") return key;

  if (vars) {
    return resolved.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  }
  return resolved;
}

function lookup(locale: Locale, key: string): string | null {
  const parts = key.split(".");
  let result: unknown = getMessages(locale);
  for (const part of parts) {
    if (result && typeof result === "object" && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof result === "string" ? result : null;
}
