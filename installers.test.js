'use strict';
// Run: node tools/vortex/farmtogether2/installers.test.js  (plain node, no deps)
const assert = require('assert');
const { rules, MODTYPE_ROOT, MODTYPE_PLUGINS } = require('./installers');

const firstPlan = (files) => {
  for (const r of rules.slice().sort((a, b) => a.priority - b.priority)) {
    const p = r.plan(files);
    if (p) return { rule: r.id, ...p };
  }
  return undefined;
};
const dests = (p) => p.entries.map((e) => e.destination).sort();

// BepInEx loader pack, nested one folder deep
let p = firstPlan(['BepInEx-IL2CPP/', 'BepInEx-IL2CPP/winhttp.dll', 'BepInEx-IL2CPP/doorstop_config.ini',
  'BepInEx-IL2CPP/BepInEx/core/BepInEx.Core.dll']);
assert.strictEqual(p.rule, 'farmtogether2-bepinex-loader');
assert.strictEqual(p.modType, MODTYPE_ROOT);
assert.deepStrictEqual(dests(p), ['BepInEx/core/BepInEx.Core.dll', 'doorstop_config.ini', 'winhttp.dll']);

// Mod zip with a BepInEx tree, wrapped in a folder; stray readme outside is dropped
p = firstPlan(['Mod v1/BepInEx/plugins/My/My.dll', 'Mod v1/README.txt']);
assert.strictEqual(p.rule, 'farmtogether2-bepinex-tree');
assert.deepStrictEqual(dests(p), ['BepInEx/plugins/My/My.dll']);

// Plain DLL zip -> plugins mod type, layout kept
p = firstPlan(['MyMod.dll', 'MyMod.pdb', 'cfg/']);
assert.strictEqual(p.rule, 'farmtogether2-plugin');
assert.strictEqual(p.modType, MODTYPE_PLUGINS);
assert.deepStrictEqual(dests(p), ['MyMod.dll', 'MyMod.pdb']);

// Nothing recognisable -> falls through to Vortex's default installer
assert.strictEqual(firstPlan(['readme.txt']), undefined);
console.log('installers.test.js: OK');
