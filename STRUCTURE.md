# STRUCTURE

Code-shape map. Runtime code is what ships in the zip; everything else is authoring tooling.

## Layout

- `src/` - runtime extension code, flattened to the archive root by `pack.ps1`
- `tests/` - plain-node and PowerShell tests (fixtures are created in temp folders)
- `tools/release/` - release validation (metadata, artwork)
- `tools/nexus/` - Nexus page rendering (`NEXUS.md` -> `nexus-paste.md`)
- `assets/` - packaged artwork plus its provenance README
- `pack.ps1` - packaging entry point; sits at the root by convention (the Moonlight Peaks mods do the same) so `pack.ps1` is the one obvious command

## Components

| Component | Responsibility | Files |
|---|---|---|
| Game registration | registers FT2, mod types, installers with Vortex | `src/index.js` |
| Install planning | pure archive -> destination planning, no `vortex-api` | `src/installers.js` |
| Metadata | name, author, version (single source), description, Nexus `gameId` | `info.json` |
| Validation | `info.json` rules, PNG size/dimensions; `--stage` checks the archive layout | `tools/release/validate.js` |
| Packaging | tests -> stage explicit files -> validate -> zip -> verify -> publish to `dist/` | `pack.ps1` |
| Page source | Nexus fields + description (Markdown subset) | `NEXUS.md` -> `nexus-paste.md` |
| Page renderer | Markdown subset -> MP-style BBCode, `--check` for drift | `tools/nexus/render.js` |
| Publishing | Chrome-driven Nexus create/update/description/verify | `.claude/skills/nexus-publish/SKILL.md`, `nexus.json` |

## Dependencies

None at runtime beyond Vortex itself (`vortex-api` is required only inside `main()`, so `index.js`
loads under plain node for tests). Tooling needs Node and PowerShell 5.1+. No npm packages.

## Archive contract

Exactly `index.js`, `installers.js`, `info.json`, `gameart.png`, `LICENSE` at the zip root, no
wrapper folder. `index.js` keeps its relative `require('./installers')`.
