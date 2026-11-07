# Changelog

Written for us; the player-facing Nexus changelog lives in [NEXUS.md](NEXUS.md).

## 0.1.0 - unreleased

First public release.

- Registers Farm Together 2 (Steam 2418520, `FarmTogether2.exe`) with Vortex; creates
  `BepInEx/plugins` on setup; symlink deployment supported.
- Two mod types: `farmtogether2-root` (game folder) and `farmtogether2-plugins`
  (`BepInEx/plugins`).
- Three installer rules: BepInEx loader pack (`doorstop_config.ini`) to the game root, archives with
  a `BepInEx/` tree from `BepInEx` down, plain DLL archives under `BepInEx/plugins`.
- `info.json`: `name` is the game's name, numeric Nexus `gameId` 7911, `gameart.png` added.
- Verified on ANU's Vortex before extraction (installer rules and symlink deploy).
