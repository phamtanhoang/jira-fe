#!/usr/bin/env node
/**
 * PostToolUse hook — warn when page.tsx gets "use client" added or when
 * client.tsx imports server-only code. Common mistake that breaks Next.js builds.
 */
let input = {};
try {
  input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
} catch { process.exit(0); }

const file = input.tool_input?.file_path || '';
const content = input.tool_input?.new_string || input.tool_input?.content || '';

// page.tsx should NOT be "use client"
if (/[\\/]page\.tsx$/.test(file) && /^"use client"/m.test(content)) {
  process.stderr.write(
    '⚠️  page.tsx contains "use client" — this forfeits server metadata + locale cookie.\n' +
    '   Move "use client" to client.tsx and re-export it from page.tsx.\n' +
    '   See .claude/rules/page-organization.md\n'
  );
}

// Server-only env access in a client component
if (/[\\/]client\.tsx$/.test(file) || /^"use client"/m.test(content)) {
  if (/process\.env\.(?!NEXT_PUBLIC_)/.test(content)) {
    process.stderr.write(
      '⚠️  Client component reads non-NEXT_PUBLIC_ env var.\n' +
      '   Server env leaks into the JS bundle. Read it server-side or rename to NEXT_PUBLIC_*.\n'
    );
  }
}

process.exit(0);
