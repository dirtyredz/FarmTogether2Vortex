'use strict';
// Run: node tests/release.test.js  (plain node, no deps)
// Release metadata, artwork and Nexus page renderer.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validateInfo, validatePng, validateDir } = require('../tools/release/validate');
const { render, RenderError, RULE } = require('../tools/nexus/render');

const ROOT = path.resolve(__dirname, '..');
const good = { name: 'Farm Together 2', author: 'dirtyredz', version: '0.1.0', description: 'd', gameId: 7911 };
const has = (errors, re) => errors.some((e) => re.test(e));

// --- info.json ---
assert.deepStrictEqual(validateInfo(good), []);
assert.deepStrictEqual(validateInfo({ ...good, version: '1.2.3-beta.1', type: 'game' }), []);
for (const key of ['name', 'author', 'version', 'description']) {
  const info = { ...good };
  delete info[key];
  assert(has(validateInfo(info), new RegExp(`"${key}"`)), `missing ${key} rejected`);
}
for (const v of ['1.0', '01.0.0', 'v1.0.0', '1.0.0.0']) assert(has(validateInfo({ ...good, version: v }), /semver/), `version ${v}`);
assert(has(validateInfo({ ...good, gameId: '7911' }), /gameId/), 'string gameId rejected');
assert(has(validateInfo({ ...good, gameId: 7912 }), /gameId/), 'wrong gameId rejected');
assert(has(validateInfo({ ...good, name: 'Farm Together 2 v0.1' }), /version/), 'versioned name rejected');
assert(has(validateInfo({ ...good, name: 'Farm Together 2 0.1.0' }), /version/), 'versioned name rejected');
assert(has(validateInfo([]), /object/));

// --- gameart.png ---
function png(width, height, pad = 0) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); ihdr.write('IHDR', 4, 'latin1');
  ihdr.writeUInt32BE(width, 8); ihdr.writeUInt32BE(height, 12);
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  return Buffer.concat([sig, ihdr, Buffer.alloc(pad), iend]);
}
assert.deepStrictEqual(validatePng(png(640, 360)), []);
assert(has(validatePng(Buffer.from('not a png at all, just some text bytes')), /not a PNG/));
assert(has(validatePng(png(1280, 720)), /640x360/), 'wrong size rejected');
assert(has(validatePng(png(640, 360, 1000000)), /below/), 'oversize rejected');
assert(has(validatePng(png(640, 360).subarray(0, 40)), /IEND|not a PNG/), 'truncated rejected');
assert.deepStrictEqual(validatePng(fs.readFileSync(path.join(ROOT, 'assets', 'gameart.png'))), [], 'shipped art valid');

// --- staged directory ---
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ft2vx stage '));
try {
  fs.writeFileSync(path.join(stage, 'info.json'), JSON.stringify(good));
  fs.writeFileSync(path.join(stage, 'gameart.png'), png(640, 360));
  for (const f of ['index.js', 'installers.js', 'LICENSE']) fs.writeFileSync(path.join(stage, f), '');
  assert.deepStrictEqual(validateDir(stage, true), []);
  fs.writeFileSync(path.join(stage, 'installers.test.js'), '');
  assert(has(validateDir(stage, true), /unexpected installers\.test\.js/), 'extra staged file rejected');
  fs.unlinkSync(path.join(stage, 'installers.test.js'));
  fs.unlinkSync(path.join(stage, 'gameart.png'));
  assert(has(validateDir(stage, true), /gameart\.png: missing/), 'missing art rejected');
  fs.writeFileSync(path.join(stage, 'info.json'), '{ not json');
  assert(has(validateDir(stage, true), /info\.json: unreadable/), 'malformed info rejected');
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}

// --- Nexus renderer ---
const doc = (body) => `intro\n<!-- nexus:description -->\n${body}\n<!-- /nexus:description -->\n`;
const out = render(doc([
  '# 🚜  Title', '', '*Tag line.*', '', ':: a  ·  b', '', '---', '',
  '> 🧹 **Lead.** Panel', '> continues.', '', '## ✨  Head', '',
  'A paragraph wrapped', 'over two lines with **bold**, *italic* and [a link](https://example.com/x).', '',
  '- one', '- two wrapped', '  onto a continuation', '', '1. first', '2. second',
].join('\n')));
assert(out.startsWith('[size=6][color=#F7D994]🚜  Title[/color][/size]\n[color=#C7A25B][i]Tag line.[/i][/color]\n'));
assert(out.includes(`[color=#C7A25B]a  ·  b[/color]\n${RULE}\n\n`), 'strip then rule');
assert(out.includes('[quote]🧹 [color=#F7D994][b]Lead.[/b][/color] Panel continues.[/quote]'), 'quote panel');
assert(out.includes('[size=5][color=#F7D994]✨  Head[/color][/size]\n'), 'heading');
assert(out.includes('A paragraph wrapped over two lines with [b]bold[/b], [i]italic[/i] and [url=https://example.com/x]a link[/url].'), 'prose unwrapped, inline kept');
assert(out.includes('[list]\n[*][color=#D4D4D8]one[/color]\n[*][color=#D4D4D8]two wrapped onto a continuation[/color]\n[/list]'), 'bullets');
assert(out.includes('[list=1]\n[*][color=#D4D4D8]first[/color]'), 'numbered');
assert(!/```|<!--/.test(out), 'no fences or markers in output');
assert.strictEqual(render(doc('# T\n\ntext')), render(doc('# T\n\ntext')), 'stable');
for (const bad of ['`code`', '<b>x</b>', '![img](https://x/y.png)', '| a | b |', '### deep', '[b]raw[/b]', '**open', '```\nx\n```', 'p\n\n# late title']) {
  assert.throws(() => render(doc(bad)), RenderError, `rejects ${JSON.stringify(bad)}`);
}
assert.throws(() => render('no markers here'), RenderError);

// The committed paste file must match its source (same check as render.js --check).
assert.strictEqual(fs.readFileSync(path.join(ROOT, 'nexus-paste.md'), 'utf8').replace(/\r\n/g, '\n'),
  render(fs.readFileSync(path.join(ROOT, 'NEXUS.md'), 'utf8')), 'nexus-paste.md is stale');
console.log('release.test.js: OK');
