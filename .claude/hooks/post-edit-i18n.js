#!/usr/bin/env node
/**
 * PostToolUse hook — after Edit/Write on src/messages/*.json, check parity.
 * Bug class: adding a key to vi.json without en.json (or vice versa) → broken UI in one locale.
 */
let input = {};
try {
  input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
} catch { process.exit(0); }

const file = input.tool_input?.file_path || '';
if (!/src[\\/]messages[\\/](vi|en)\.json$/.test(file)) process.exit(0);

const fs = require('fs');
try {
  const vi = JSON.parse(fs.readFileSync('src/messages/vi.json', 'utf8'));
  const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));
  const viKeys = Object.keys(vi);
  const enKeys = Object.keys(en);
  const missingEn = viKeys.filter((k) => !(k in en));
  const missingVi = enKeys.filter((k) => !(k in vi));

  if (missingEn.length || missingVi.length) {
    process.stderr.write('⚠️  i18n parity broken after edit:\n');
    if (missingEn.length) {
      const preview = missingEn.slice(0, 5).join(', ');
      const more = missingEn.length > 5 ? ` (+${missingEn.length - 5} more)` : '';
      process.stderr.write(`   missing in en.json: ${preview}${more}\n`);
    }
    if (missingVi.length) {
      const preview = missingVi.slice(0, 5).join(', ');
      const more = missingVi.length > 5 ? ` (+${missingVi.length - 5} more)` : '';
      process.stderr.write(`   missing in vi.json: ${preview}${more}\n`);
    }
    process.stderr.write('   Add the missing keys before commit.\n');
  }
} catch { /* parse errors → silent */ }

process.exit(0);
