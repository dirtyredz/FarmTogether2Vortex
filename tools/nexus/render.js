'use strict';
// Renders the description in NEXUS.md into the BBCode the Nexus editor takes, in the Moonlight Peaks
// page style (gold headings, plum character rules, quote panels, real lists, no hard wraps).
//
//   node tools/nexus/render.js          regenerate nexus-paste.md
//   node tools/nexus/render.js --check  exit 1 if nexus-paste.md is stale; writes nothing
//
// Only the text between the two marker comments in NEXUS.md is rendered. Supported subset, one
// construct per block (blocks are separated by blank lines):
//   # Title              page title (first block only)         *Whole line italic*  tagline
//   :: a  ·  b           at-a-glance strip                     ---                  character rule
//   ## Heading           section heading                       > text               quote panel
//   - item / 1. item     lists (indent continuation lines)     anything else        paragraph
// Inline: **bold**, *italic*, [text](https://url). Everything else (backticks, HTML, images, tables,
// ### headings, raw [bbcode]) is rejected with its line number rather than silently degraded.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'NEXUS.md');
const OUTPUT = path.join(ROOT, 'nexus-paste.md');
const START = '<!-- nexus:description -->';
const END = '<!-- /nexus:description -->';

const GOLD = '#F7D994';
const GOLD_RIM = '#C7A25B';
const PLUM = '#7A6A9B';
const BODY = '#D4D4D8';
const RULE = `[color=${PLUM}]${'─'.repeat(40)}[/color]`;

class RenderError extends Error {}
const fail = (line, msg) => { throw new RenderError(`NEXUS.md line ${line}: ${msg}`); };

const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

function emphasis(text, line, boldOpen, boldClose) {
  let out = text.replace(/\*\*(.+?)\*\*/g, (_, t) => `${boldOpen}${t}${boldClose}`);
  out = out.replace(/\*(.+?)\*/g, '[i]$1[/i]');
  if (out.includes('*')) fail(line, 'unbalanced * emphasis');
  return out;
}

// Inline markup. `quote` switches bold to the gold lead-in used inside panels.
function inline(text, line, quote) {
  const [bo, bc] = quote ? [`[color=${GOLD}][b]`, '[/b][/color]'] : ['[b]', '[/b]'];
  let out = '';
  let last = 0;
  const plain = (s) => {
    if (/[`<>]/.test(s)) fail(line, 'unsupported markup (backticks or HTML)');
    if (/[[\]]/.test(s)) fail(line, 'square brackets outside a [text](https://url) link');
    return emphasis(s, line, bo, bc);
  };
  for (const m of text.matchAll(LINK)) {
    out += plain(text.slice(last, m.index));
    out += `[url=${m[2]}]${plain(m[1])}[/url]`;
    last = m.index + m[0].length;
  }
  return out + plain(text.slice(last));
}

// Splits the description into blocks of { line, lines[] }, separated by blank lines.
function blocks(lines, firstLine) {
  const out = [];
  let cur = null;
  lines.forEach((raw, i) => {
    const text = raw.replace(/\s+$/, '');
    if (text === '') { cur = null; return; }
    if (!cur) { cur = { line: firstLine + i, lines: [] }; out.push(cur); }
    cur.lines.push(text);
  });
  return out;
}

const joined = (lines) => lines.map((l) => l.trim()).join(' ');

function listItems(block, marker) {
  const items = [];
  block.lines.forEach((l, i) => {
    const m = l.match(marker);
    if (m) items.push({ line: block.line + i, parts: [l.slice(m[0].length)] });
    else if (/^\s{2,}\S/.test(l) && items.length > 0) items[items.length - 1].parts.push(l);
    else fail(block.line + i, 'list lines must start with the list marker or be indented continuations');
  });
  return items;
}

function renderBlock(block, index) {
  const first = block.lines[0];
  const line = block.line;
  if (/^```/.test(first)) fail(line, 'code fences are not supported');
  if (/^\|/.test(first)) fail(line, 'tables are not supported');
  if (/^#{3,}\s/.test(first)) fail(line, 'only # and ## headings are supported');
  if (/^!\[/.test(first)) fail(line, 'images are not supported');
  if (/^# /.test(first)) {
    if (index !== 0 || block.lines.length > 1) fail(line, 'the # title must be the first block, on one line');
    return { bb: `[size=6][color=${GOLD}]${inline(first.slice(2), line)}[/color][/size]`, tight: true };
  }
  if (/^## /.test(first)) {
    if (block.lines.length > 1) fail(line + 1, 'a ## heading must be followed by a blank line');
    return { bb: `[size=5][color=${GOLD}]${inline(first.slice(3), line)}[/color][/size]`, tight: true };
  }
  if (block.lines.length === 1 && first === '---') return { bb: RULE, tight: false };
  if (/^:: /.test(first)) return { bb: `[color=${GOLD_RIM}]${inline(joined(block.lines).slice(3), line)}[/color]`, tight: true };
  if (/^> /.test(first) || first === '>') {
    if (!block.lines.every((l) => /^>( |$)/.test(l))) fail(line, 'every line of a quote panel must start with >');
    return { bb: `[quote]${inline(joined(block.lines.map((l) => l.slice(1))), line, true)}[/quote]`, tight: false };
  }
  for (const [marker, open] of [[/^- /, '[list]'], [/^\d+\. /, '[list=1]']]) {
    if (!marker.test(first)) continue;
    const items = listItems(block, marker).map((it) => `[*][color=${BODY}]${inline(joined(it.parts), it.line)}[/color]`);
    return { bb: `${open}\n${items.join('\n')}\n[/list]`, tight: false };
  }
  const text = joined(block.lines);
  if (/^\*[^*]+\*$/.test(text)) return { bb: `[color=${GOLD_RIM}][i]${inline(text.slice(1, -1), line)}[/i][/color]`, tight: true };
  return { bb: `[color=${BODY}]${inline(text, line)}[/color]`, tight: false };
}

// Renders a whole NEXUS.md source string to the BBCode description (with a trailing newline).
function render(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const start = lines.indexOf(START);
  const end = lines.indexOf(END);
  if (start < 0 || end < 0 || end < start) throw new RenderError(`NEXUS.md: needs ${START} ... ${END} markers`);
  const parts = blocks(lines.slice(start + 1, end), start + 2).map(renderBlock);
  if (parts.length === 0) throw new RenderError('NEXUS.md: the description is empty');
  let out = '';
  parts.forEach((p, i) => { out += p.bb + (i === parts.length - 1 ? '\n' : p.tight ? '\n' : '\n\n'); });
  return out;
}

function main(argv) {
  const check = argv.includes('--check');
  let rendered;
  try {
    rendered = render(fs.readFileSync(SOURCE, 'utf8'));
  } catch (e) {
    process.stderr.write(`render: ${e.message}\n`);
    return 1;
  }
  if (check) {
    // Compare ignoring CRLF, so a Windows checkout with autocrlf does not read as drift.
    const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n') : null;
    if (current !== rendered) {
      process.stderr.write('render: nexus-paste.md is stale; run node tools/nexus/render.js\n');
      return 1;
    }
    process.stderr.write('render: nexus-paste.md is up to date\n');
    return 0;
  }
  fs.writeFileSync(OUTPUT, rendered, 'utf8');
  process.stderr.write(`render: wrote ${OUTPUT}\n`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { render, RenderError, RULE };
