/**
 * UI dimension + timing constants.
 *
 * Keep magic numbers for layout, debounce, and HTTP category thresholds
 * here — consumers import instead of inlining `240`, `300`, `400`.
 */

export const UI_SIZES = {
  SIDEBAR_SM: 240,
  SIDEBAR_MD: 280,
  SIDEBAR_LG: 320,
} as const;

export const RICH_EDITOR = {
  CHAR_LIMIT: 5000,
  CHAR_WARNING: 4500,
} as const;

export const HTTP_STATUS_RANGE = {
  SUCCESS: 200,
  REDIRECT: 300,
  CLIENT_ERROR: 400,
  SERVER_ERROR: 500,
} as const;

export const DEBOUNCE = {
  /** Search input + filter input */
  SEARCH: 300,
  /** Background autosave for long-form editors */
  AUTOSAVE: 800,
} as const;
