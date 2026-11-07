# Farm Together 2 Support for Vortex

A [Vortex](https://www.nexusmods.com/site/mods/1) game extension for **Farm Together 2**
(Steam 2418520). It registers the game, finds the Steam install, and routes BepInEx 6 IL2CPP mod
archives to the right folders. Plain JavaScript, no bundler, MIT.

## What it does

- Registers `farmtogether2` and creates `BepInEx/plugins` on setup.
- Two mod types: `farmtogether2-root` (game folder) and `farmtogether2-plugins` (`BepInEx/plugins`).
- Three installer rules, first match wins:
  1. BepInEx loader pack (`doorstop_config.ini` + `winhttp.dll`, optionally wrapped in a folder)
     -> game folder.
  2. Archive with a `BepInEx/` tree -> kept from `BepInEx` down; files outside it are dropped.
  3. Archive with DLLs and no `BepInEx/` -> `BepInEx/plugins`, layout kept.
  Anything else falls through to Vortex's default installer.

It does not download BepInEx; players add the BepInEx 6 IL2CPP win-x64 zip themselves (rule 1
installs it).

## Install (players)

Use Vortex: Games -> Farm Together 2 -> Manage, once the extension is on Nexus. Manually: extract
the release zip into `%APPDATA%\Vortex\plugins\farmtogether2\` so `info.json` sits directly in it,
then restart Vortex.

## Develop

Requires Node (any current LTS) and Windows PowerShell 5.1 or PowerShell 7.

| Command | What it does |
|---|---|
| `node tests/installers.test.js` | installer-rule tests |
| `node tests/release.test.js` | metadata, artwork and page-renderer tests |
| `node tools/release/validate.js` | validate `info.json` and `assets/gameart.png` |
| `node tools/nexus/render.js [--check]` | regenerate (or check) `nexus-paste.md` from `NEXUS.md` |
| `powershell -NoProfile -ExecutionPolicy Bypass -File pack.ps1 [-OutDir <dir>] [-Json]` | test, validate and build `dist/FarmTogether2Vortex-<version>.zip` |
| `powershell -NoProfile -ExecutionPolicy Bypass -File tests/package.test.ps1` | archive contract tests (~2 min) |

**Fast gate** (run all before committing a release):

```
node --check src/index.js
node --check src/installers.js
node tests/installers.test.js
node tests/release.test.js
node tools/nexus/render.js --check
powershell -NoProfile -ExecutionPolicy Bypass -File tests/package.test.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File pack.ps1 -Json
git diff --check
```

`pwsh` works in place of `powershell` where installed.

To try a build in Vortex, extract the zip into `%APPDATA%\Vortex\plugins\farmtogether2\` and
restart Vortex. In the [Farm Together 2 modding workspace](https://github.com/dirtyredz/Farm-Together-2-Agentic-Modding)
(where this repo is checked out at `mods/FarmTogether2Vortex/`),
`tools/anu/deploy-vortex-extension.ps1` packs with `pack.ps1 -Json` and deploys those exact bytes
to the test PC.

Releasing and Nexus publishing: [RELEASING.md](RELEASING.md). Layout: [STRUCTURE.md](STRUCTURE.md).

## License

MIT, see [LICENSE](LICENSE).
