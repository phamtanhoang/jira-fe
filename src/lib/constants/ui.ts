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
  /** Maximum resizable sidebar width (issue detail panel) */
  SIDEBAR_MAX: 500,
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

/** Duration (ms) the "Copied!" feedback badge stays visible after clipboard write. */
export const CLIPBOARD_FEEDBACK_MS = 1500;

/** Delay (ms) before auto-redirecting after a successful join/action. */
export const REDIRECT_DELAY_MS = 1200;

/** Drag-and-drop sensor configuration for press-and-hold activation. */
export const DRAG_SENSOR = {
  /** How long (ms) the pointer must be held before a drag starts. */
  ACTIVATION_DELAY: 180,
  /** How many px the pointer can move before the delay resets. */
  TOLERANCE: 5,
} as const;

/** SMTP default values used in the admin email settings form. */
export const SMTP_DEFAULTS = {
  PORT: 587,
  SECURE: false,
} as const;

/** Maximum number of emails accepted in the bulk-invite dialog. */
export const BULK_INVITE_MAX_EMAILS = 500;

/** Next.js `revalidate` seconds for the public share-link page. */
export const SHARE_LINK_REVALIDATE_SEC = 300;

/** Invite link expiry options in seconds. */
export const INVITE_EXPIRY_SEC = {
  ONE_DAY: 24 * 3600,
  SEVEN_DAYS: 7 * 24 * 3600,
  THIRTY_DAYS: 30 * 24 * 3600,
} as const;
