'use strict';
// Release validation for the extension: info.json metadata and gameart.png. Dependency-free.
//
//   node tools/release/validate.js                 validate the repo (info.json, assets/gameart.png)
//   node tools/release/validate.js --stage <dir>   validate a staged archive root (pack.ps1 uses this)
//
// Exit 0 when valid; 1 with one "validate: <problem>" line per problem on stderr.
// Human inspection still decides whether the artwork is free of text and logos (assets/README.md).
const fs = require('fs');
const path = require('path');

const NEXUS_GAME_ID = 7911;          // Farm Together 2 on Nexus Mods
const ART_WIDTH = 640;
const ART_HEIGHT = 360;
const ART_MAX_BYTES = 1000000;       // Vortex wiki: max 1 MB; stay strictly below
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?$/;
const STAGED_FILES = ['index.js', 'installers.js', 'info.json', 'gameart.png', 'LICENSE'];

function validateInfo(info) {
  const errors = [];
  if (info === null || typeof info !== 'object' || Array.isArray(info)) return ['info.json is not a JSON object'];
  for (const key of ['name', 'author', 'version', 'description']) {
    if (typeof info[key] !== 'string' || info[key].trim() === '') errors.push(`info.json: "${key}" must be a non-empty string`);
  }
  if (typeof info.version === 'string' && !SEMVER.test(info.version)) {
    errors.push(`info.json: version "${info.version}" is not semver (MAJOR.MINOR.PATCH)`);
  }
  if (typeof info.name === 'string' && /\d+\.\d+|\bv\d/i.test(info.name)) {
    errors.push(`info.json: name "${info.name}" must be the game's name and never carry a version`);
  }
  if (info.gameId !== NEXUS_GAME_ID) {
    errors.push(`info.json: gameId must be the number ${NEXUS_GAME_ID} (Farm Together 2 on Nexus), got ${JSON.stringify(info.gameId)}`);
  }
  return errors;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function validatePng(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return ['gameart.png: not a PNG file'];
  }
  if (buf.toString('latin1', 12, 16) !== 'IHDR') return ['gameart.png: first chunk is not IHDR'];
  const errors = [];
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width !== ART_WIDTH || height !== ART_HEIGHT) {
    errors.push(`gameart.png: must be ${ART_WIDTH}x${ART_HEIGHT}, is ${width}x${height}`);
  }
  if (buf.length >= ART_MAX_BYTES) errors.push(`gameart.png: ${buf.length} bytes, must be below ${ART_MAX_BYTES}`);
  if (buf.toString('latin1', buf.length - 8, buf.length - 4) !== 'IEND') errors.push('gameart.png: truncated (no IEND chunk)');
  return errors;
}

function readJson(file) {
  try {
    return { value: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (e) {
    return { error: `${path.basename(file)}: ${e.code === 'ENOENT' ? 'missing' : `unreadable (${e.message})`}` };
  }
}

// Validates a directory. stage=true expects the flat archive layout; false expects the repo layout.
function validateDir(dir, stage) {
  const errors = [];
  const info = readJson(path.join(dir, 'info.json'));
  if (info.error) errors.push(info.error); else errors.push(...validateInfo(info.value));
  const art = path.join(dir, stage ? 'gameart.png' : path.join('assets', 'gameart.png'));
  if (fs.existsSync(art)) errors.push(...validatePng(fs.readFileSync(art))); else errors.push('gameart.png: missing');
  if (stage) {
    const present = fs.readdirSync(dir).sort();
    const missing = STAGED_FILES.filter((f) => !present.includes(f) && f !== 'gameart.png' && f !== 'info.json');
    const extra = present.filter((f) => !STAGED_FILES.includes(f));
    for (const f of missing) errors.push(`stage: missing ${f}`);
    for (const f of extra) errors.push(`stage: unexpected ${f}`);
  }
  return errors;
}

function main(argv) {
  const stageAt = argv.indexOf('--stage');
  const stage = stageAt >= 0;
  if (stage && !argv[stageAt + 1]) { process.stderr.write('validate: --stage needs a directory\n'); return 2; }
  const dir = stage ? path.resolve(argv[stageAt + 1]) : path.resolve(__dirname, '..', '..');
  const errors = validateDir(dir, stage);
  for (const e of errors) process.stderr.write(`validate: ${e}\n`);
  if (errors.length === 0) process.stderr.write(`validate: OK ${dir}\n`);
  return errors.length === 0 ? 0 : 1;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { validateInfo, validatePng, validateDir, NEXUS_GAME_ID, STAGED_FILES };
