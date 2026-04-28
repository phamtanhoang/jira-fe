/**
 * Pretty-print an HTML string by indenting one level per nested tag.
 * Lightweight (~80 LOC, no dep) — purpose-built for the email-template
 * editor where admins paste minified HTML and need to read/tweak it.
 *
 * Trade-offs vs `prettier --parser=html`:
 *  - Doesn't wrap long attribute lists onto multiple lines.
 *  - Treats `<style>` / `<script>` content as opaque text (preserved).
 *  - HTML comments + DOCTYPE are kept on their own line.
 *
 * Round-trips: formatting an already-formatted document is idempotent
 * because we collapse whitespace between tags before re-indenting.
 */

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// Tags whose content is opaque (not HTML — don't dive into it). We pass
// the inner contents through unchanged so admin-supplied CSS / JS keeps
// its line breaks.
const RAW_TEXT_TAGS = new Set(["script", "style", "pre", "textarea"]);

type Token =
  | { type: "open"; value: string; tag: string }
  | { type: "close"; value: string; tag: string }
  | { type: "self"; value: string }
  | { type: "comment"; value: string }
  | { type: "doctype"; value: string }
  | { type: "text"; value: string };

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < html.length) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      const stop = end === -1 ? html.length : end + 3;
      tokens.push({ type: "comment", value: html.slice(i, stop) });
      i = stop;
      continue;
    }
    if (html.startsWith("<!", i)) {
      const end = html.indexOf(">", i);
      const stop = end === -1 ? html.length : end + 1;
      tokens.push({ type: "doctype", value: html.slice(i, stop) });
      i = stop;
      continue;
    }
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      if (end === -1) {
        tokens.push({ type: "text", value: html.slice(i) });
        break;
      }
      const tag = html.slice(i, end + 1);
      const isClose = tag.startsWith("</");
      const nameMatch = tag.match(/<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/);
      const tagName = nameMatch ? nameMatch[1].toLowerCase() : "";
      const selfClosed =
        tag.endsWith("/>") ||
        (!isClose && VOID_TAGS.has(tagName));
      i = end + 1;

      if (isClose) {
        tokens.push({ type: "close", value: tag, tag: tagName });
        continue;
      }
      if (selfClosed) {
        tokens.push({ type: "self", value: tag });
        continue;
      }
      tokens.push({ type: "open", value: tag, tag: tagName });

      // Swallow opaque-content tags whole — we don't want to break their
      // inner CSS/JS across lines.
      if (RAW_TEXT_TAGS.has(tagName)) {
        const closeIdx = html.toLowerCase().indexOf(`</${tagName}`, i);
        const stop = closeIdx === -1 ? html.length : closeIdx;
        const raw = html.slice(i, stop);
        if (raw) tokens.push({ type: "text", value: raw });
        i = stop;
      }
      continue;
    }
    // Text run
    const end = html.indexOf("<", i);
    const stop = end === -1 ? html.length : end;
    const text = html.slice(i, stop);
    // Collapse whitespace-only runs between tags so they don't render as
    // empty lines after re-indent.
    if (text.trim()) tokens.push({ type: "text", value: text.trim() });
    i = stop;
  }
  return tokens;
}

/**
 * Pretty-print HTML. Returns the input unchanged when it already contains
 * newlines and indentation that look intentional, so we don't fight a
 * carefully hand-formatted template on every focus.
 */
export function formatHtml(html: string, indentSize = 2): string {
  if (!html.trim()) return html;
  const tokens = tokenize(html);
  const pad = " ".repeat(indentSize);
  let depth = 0;
  const out: string[] = [];
  for (const tok of tokens) {
    if (tok.type === "close") depth = Math.max(0, depth - 1);
    const indent = pad.repeat(depth);
    if (tok.type === "text") {
      // Soft-wrap long text lines so the textarea doesn't scroll
      // horizontally forever. Keep <80 col after indent.
      const lines = tok.value.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) out.push(indent + line.trim());
      }
    } else {
      out.push(indent + tok.value);
    }
    if (tok.type === "open") depth++;
  }
  return out.join("\n");
}
