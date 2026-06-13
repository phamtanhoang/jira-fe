import sanitizeHtml from "sanitize-html";

/**
 * Allowlist for rich-text HTML produced by Tiptap (StarterKit + Image + Mention
 * + Link). MUST stay in sync with BE config in
 * `jira-be/src/core/utils/sanitize-html.util.ts`.
 *
 * Defense-in-depth: BE sanitizes on write; this FE pass re-sanitizes on read
 * to cover (a) historical rows persisted before BE sanitization shipped and
 * (b) any future BE bypass.
 *
 * Why `sanitize-html` (not DOMPurify): we need the same library both layers
 * so server-rendered HTML matches client-hydrated HTML — different sanitizers
 * serialize differently (whitespace, attr order, void-element slashes) and
 * cause React hydration mismatches. `sanitize-html` is pure-JS, runs in Node
 * + browser without jsdom, and uses `htmlparser2` so it's deterministic.
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
  "span",
  "a",
  "img",
  // Tiptap TaskList — keep in sync with BE config.
  "div",
  "label",
  "input",
];

const SHARED_ATTRS = [
  "class",
  "data-type",
  "data-id",
  "data-label",
  "data-mention",
  "data-checked",
  "title",
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel", ...SHARED_ATTRS],
    img: ["src", "alt", ...SHARED_ATTRS],
    span: SHARED_ATTRS,
    input: ["type", "checked", "disabled", ...SHARED_ATTRS],
    label: ["contenteditable", ...SHARED_ATTRS],
    li: ["data-checked", ...SHARED_ATTRS],
    "*": [...SHARED_ATTRS, "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^(left|center|right|justify)$/],
    },
  },
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === "_blank") {
        attribs.rel = "noopener noreferrer";
      }
      return { tagName, attribs };
    },
    input: (tagName, attribs) => {
      if (attribs.type !== "checkbox") {
        return { tagName: "", attribs: {} };
      }
      attribs.disabled = "disabled";
      return { tagName, attribs };
    },
  },
};

export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
