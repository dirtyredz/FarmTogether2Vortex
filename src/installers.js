'use strict';
// Pure install-planning logic (no vortex-api), so it can be unit-tested with plain node.
// Archive paths are normalised to forward slashes; directory entries end with '/'.

const MODTYPE_ROOT = 'farmtogether2-root';       // installs relative to the game folder
const MODTYPE_PLUGINS = 'farmtogether2-plugins'; // installs relative to <game>/BepInEx/plugins

const norm = (p) => p.replace(/\\/g, '/');
const isDir = (p) => p.endsWith('/');
const segs = (p) => norm(p).split('/').filter((s) => s.length > 0);
const lower = (s) => s.toLowerCase();

// Index of the first path segment equal (case-insensitively) to `name`, or -1.
const segIndex = (p, name) => segs(p).findIndex((s) => lower(s) === lower(name));

// Each plan: { modType, entries: [{ source, destination }] }, destination relative to the mod
// type's root. A planner returns undefined when the archive is not its kind.

// The BepInEx loader pack itself: doorstop_config.ini (+ winhttp.dll) beside a BepInEx/ folder.
// Installed with the pack's own root as the game folder.
function planLoader(files) {
  const hit = files.find((f) => !isDir(f) && lower(segs(f).pop()) === 'doorstop_config.ini');
  if (hit === undefined) return undefined;
  const strip = segs(hit).length - 1;
  return {
    modType: MODTYPE_ROOT,
    entries: files.filter((f) => !isDir(f))
      .map((f) => ({ source: f, destination: segs(f).slice(strip).join('/') }))
      .filter((e) => e.destination !== ''),
  };
}

// Mod zip shipping a BepInEx/ tree (BepInEx/plugins/MyMod/MyMod.dll): keep from BepInEx down.
function planBepInExTree(files) {
  const inTree = files.filter((f) => !isDir(f) && segIndex(f, 'BepInEx') >= 0);
  if (inTree.length === 0) return undefined;
  return {
    modType: MODTYPE_ROOT,
    entries: inTree.map((f) => ({ source: f, destination: segs(f).slice(segIndex(f, 'BepInEx')).join('/') })),
  };
}

// Plain plugin zip (DLLs, no BepInEx folder): keep the archive layout under BepInEx/plugins.
function planPlainPlugin(files) {
  if (!files.some((f) => !isDir(f) && lower(f).endsWith('.dll'))) return undefined;
  return {
    modType: MODTYPE_PLUGINS,
    entries: files.filter((f) => !isDir(f)).map((f) => ({ source: f, destination: segs(f).join('/') })),
  };
}

// Installer rules; lower priority number runs first in Vortex.
const rules = [
  { id: 'farmtogether2-bepinex-loader', priority: 5, plan: planLoader },
  { id: 'farmtogether2-bepinex-tree', priority: 10, plan: planBepInExTree },
  { id: 'farmtogether2-plugin', priority: 20, plan: planPlainPlugin },
];

module.exports = { rules, MODTYPE_ROOT, MODTYPE_PLUGINS, norm };
