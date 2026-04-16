import vi from "@/messages/vi.json";
import en from "@/messages/en.json";

export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const messages = { vi, en } as const;

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

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string>,
): string {
  const parts = key.split(".");
  let result: unknown = getMessages(locale);

  for (const part of parts) {
    if (result && typeof result === "object" && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  if (typeof result !== "string") return key;

  if (vars) {
    return result.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  }

  return result;
}