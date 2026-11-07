'use strict';
// Vortex game extension: Farm Together 2 (Steam 2418520), BepInEx 6 IL2CPP.
// Hand-written, no bundler. Same shape as the official Moonlight Peaks extension (Nexus mod 2027,
// a GDL-generated bundle): two mod types plus BepInEx-aware installer rules, minus the generated
// runtime. Vortex cannot install BepInEx for us; tools/anu/install-bepinex.ps1 does that.
const path = require('path');
const { rules, MODTYPE_ROOT, MODTYPE_PLUGINS, norm } = require('./installers');

const GAME_ID = 'farmtogether2';
const STEAM_APP_ID = '2418520';
const EXE = 'FarmTogether2.exe';

function main(context) {
  const { fs, util, selectors } = require('vortex-api');

  const gamePathOf = () => {
    const discovery = selectors.discoveryByGame(context.api.getState(), GAME_ID);
    return discovery && discovery.path ? discovery.path : undefined;
  };

  context.registerGame({
    id: GAME_ID,
    name: 'Farm Together 2',
    mergeMods: true,
    queryPath: () => util.GameStoreHelper.findByAppId([STEAM_APP_ID])
      .then((game) => game.gamePath)
      .catch(() => undefined),
    queryModPath: () => '.',
    executable: () => EXE,
    requiredFiles: [EXE],
    setup: (discovery) => fs.ensureDirWritableAsync(path.join(discovery.path, 'BepInEx', 'plugins')),
    supportedTools: [],
    details: { steamAppId: Number(STEAM_APP_ID), supportsSymlinks: true },
  });

  context.registerModType(MODTYPE_ROOT, 50, (gameId) => gameId === GAME_ID,
    () => gamePathOf(), () => Promise.resolve(false), { name: 'BepInEx (game folder)' });
  context.registerModType(MODTYPE_PLUGINS, 50, (gameId) => gameId === GAME_ID,
    () => { const p = gamePathOf(); return p ? path.join(p, 'BepInEx', 'plugins') : undefined; },
    () => Promise.resolve(false), { name: 'BepInEx plugin' });

  for (const rule of rules) {
    context.registerInstaller(rule.id, rule.priority,
      (files, gameId) => Promise.resolve({
        supported: gameId === GAME_ID && rule.plan(files.map(norm)) !== undefined,
        requiredFiles: [],
      }),
      (files, _destinationPath, gameId) => {
        const raw = new Map(files.map((f) => [norm(f), f]));
        const plan = gameId === GAME_ID ? rule.plan(files.map(norm)) : undefined;
        if (plan === undefined) return Promise.resolve({ instructions: [] });
        const instructions = plan.entries.map((e) => ({
          type: 'copy', source: raw.get(e.source) || e.source, destination: e.destination }));
        instructions.push({ type: 'setmodtype', value: plan.modType });
        return Promise.resolve({ instructions });
      });
  }
  return true;
}

module.exports = { default: main };
