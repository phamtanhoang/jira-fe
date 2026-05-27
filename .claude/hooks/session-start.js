#!/usr/bin/env node
/**
 * SessionStart hook — orientation for jira-fe.
 * Output to stdout becomes context for the new session.
 */
const { execSync } = require('child_process');
const fs = require('fs');

function safe(cmd, fallback = '') {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 2000,
    }).trim();
  } catch { return fallback; }
}

const branch = safe('git rev-parse --abbrev-ref HEAD', 'no-git');
const dirty = safe('git status --short');
const lastCommits = safe('git log --oneline -5');

// i18n parity quick check
let parityWarning = '';
try {
  const vi = JSON.parse(fs.readFileSync('src/messages/vi.json', 'utf8'));
  const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));
  const viKeys = Object.keys(vi);
  const enKeys = Object.keys(en);
  const missingEn = viKeys.filter((k) => !(k in en));
  const missingVi = enKeys.filter((k) => !(k in vi));
  if (missingEn.length || missingVi.length) {
    parityWarning = `- ⚠️  i18n parity broken: ${missingEn.length} missing in en.json, ${missingVi.length} missing in vi.json`;
  }
} catch { /* missing files → skip */ }

const out = ['## jira-fe session context', ''];
out.push(`- branch: \`${branch}\``);
if (dirty) {
  const lines = dirty.split('\n').length;
  out.push(`- uncommitted: ${lines} file(s)`);
}
if (lastCommits) {
  out.push('- recent commits:');
  lastCommits.split('\n').forEach((l) => out.push(`  - ${l}`));
}
if (parityWarning) out.push(parityWarning);

out.push('');
out.push('Start with `.claude/ONBOARDING.md` if new session.');
out.push('Skill hints + rules in `.claude/CLAUDE.md` and `.claude/RULES_INDEX.md`.');

process.stdout.write(out.join('\n') + '\n');
process.exit(0);
