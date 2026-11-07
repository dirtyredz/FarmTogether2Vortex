# Nexus page source

The authoritative copy for the extension's Nexus page. Edit this file, then run
`node tools/nexus/render.js` to regenerate [nexus-paste.md](nexus-paste.md), the raw BBCode that is
set into the description editor. Never edit `nexus-paste.md` by hand; `render.js --check` fails when
it drifts. The renderer's supported Markdown subset is documented at the top of
[tools/nexus/render.js](tools/nexus/render.js); anything outside it is rejected, not degraded.

Style: Moonlight Peaks guides 13 (page standard), 14 (section order) and 15 (gold/plum palette,
quote panels, character rules, left-aligned Title Case headings). Before a description update,
read the live page first and fold any change made there back into this file (see
[RELEASING.md](RELEASING.md)).

## Page fields

| Field | Value |
|---|---|
| Name | `Farm Together 2 Support for Vortex` |
| Game / domain | Nexus `site` (Modding Tools), not the Farm Together 2 game domain |
| Category | Modding Tools > Vortex Extensions |
| Version | from `info.json` (never typed from memory) |
| Main file | `dist/FarmTogether2Vortex-<version>.zip`, exactly one active Main file |
| Requirements | none on Nexus (BepInEx is off-site and only needed by game mods) |
| Permissions | open source, MIT; source at https://github.com/dirtyredz/FarmTogether2Vortex |

**Summary** (one line, shows in listings; keep under ~200 characters):

Adds Farm Together 2 to Vortex. Finds the game on Steam and installs BepInEx 6 plugins, mod archives and the BepInEx loader itself into the right folders.

**File description** (shown under the Main file):

The Vortex extension. Vortex normally installs it for you; download manually only if you want to place it yourself.

**Changelog for 0.1.0** (player-facing):

First release: Farm Together 2 shows up in Vortex, BepInEx plugins and loader packs install to the right folders.

## Description

<!-- nexus:description -->
# 🚜  Farm Together 2 Support for Vortex

*Manage Farm Together 2 mods in Vortex. Plugins land where BepInEx looks for them.*

:: 🎮 Steam  ·  🧩 BepInEx 6 IL2CPP  ·  📦 Three install rules  ·  🔓 Open source

---

> 🧹 **Clean in, clean out.** Everything this extension installs is an ordinary Vortex mod, so disabling or purging it in Vortex takes the files back out of your game folder.

## 🌾  What it does

Farm Together 2 mods are BepInEx 6 plugins, and until now the only way to install one was to unzip it by hand into the right folder and hope the archive was laid out the way you guessed.

This extension teaches Vortex about the game. Vortex finds your Steam copy, you add mods the way you would for any other game, and each archive is looked at and sent to the right place: the BepInEx loader into the game folder, plugins into BepInEx\plugins.

It does not change the game, your farm or your saves. It only decides where a mod's files go.

## ✨  Main features

- Farm Together 2 appears in Vortex's Games tab and is found automatically from your Steam library.
- BepInEx loader packs (the zip with doorstop_config.ini and winhttp.dll) install straight into the game folder, even when the zip wraps them in an extra folder.
- Mod archives that ship their own BepInEx folder install from BepInEx down, and stray readme files outside it are left out.
- Plain plugin archives (just the DLLs) install into BepInEx\plugins with their own folder layout kept.
- Anything it does not recognise falls through to Vortex's normal installer, so nothing is forced into the wrong place.
- Creates BepInEx\plugins for you the first time you manage the game.

## 📋  Requirements

- [Vortex](https://www.nexusmods.com/site/mods/1) (the Nexus Mods mod manager).
- Farm Together 2 on Steam.
- For the game mods themselves: [BepInEx 6 bleeding edge, Unity IL2CPP win-x64](https://builds.bepinex.dev/projects/bepinex_be). Farm Together 2 is an IL2CPP game, so BepInEx 5 and the Mono builds of BepInEx 6 will not load. The extension does not download BepInEx for you.

## 📥  Installation

**🟢 With Vortex**

1. In Vortex, open Games, search for Farm Together 2 and click Manage. Vortex fetches this extension on its own.
2. Download the BepInEx 6 IL2CPP win-x64 zip from the link above and drag it into Vortex's Mods tab. The extension recognises the loader pack and installs it into the game folder. Enable it and deploy.
3. Start the game once so BepInEx can set itself up. The first start takes a minute longer than usual.
4. Install Farm Together 2 mods the normal way, with Mod Manager Download or by dragging their archives in.

**🔧 Manually**

1. Download the main file from the Files tab.
2. Extract it into a new folder named farmtogether2 under %APPDATA%\Vortex\plugins, so that info.json sits directly inside that folder.
3. Restart Vortex. Farm Together 2 now appears under Games, and you can carry on from step 2 above.

## 🎛️  Configuration

There is nothing to configure. The extension has no settings of its own: it registers the game, two mod types (BepInEx in the game folder, and BepInEx plugin) and the install rules above. Each mod's own settings stay in that mod's config file under BepInEx\config.

## 🤝  Compatibility

- Works with any Farm Together 2 mod packaged as a BepInEx folder tree or as plain plugin DLLs.
- Vortex deploys with symlinks when your Vortex staging folder and the game sit on different drives. That is expected and works with BepInEx.
- It only knows the Steam release of the game.
- Bugs and suggestions are welcome on the Posts tab or the [GitHub repository](https://github.com/dirtyredz/FarmTogether2Vortex).

## 💜  Shout outs

- Milkstone Studios, for Farm Together 2 and a farm worth sharing.
- The BepInEx and HarmonyX teams, without whom none of this scene exists.
- The Nexus Mods Vortex team, whose Moonlight Peaks extension showed the shape this one follows.
- My Mate, for being my inspiration.
<!-- /nexus:description -->
