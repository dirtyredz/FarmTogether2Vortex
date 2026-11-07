# CLAUDE.md - working in FarmTogether2Vortex

The Vortex game extension for Farm Together 2. Public repo `dirtyredz/FarmTogether2Vortex`; in the
owner's FT2 workspace it is checked out at `mods/FarmTogether2Vortex/` (its own git repo).

- [README.md](README.md) - what it does, commands, the fast gate.
- [STRUCTURE.md](STRUCTURE.md) - layout and the archive contract.
- [RELEASING.md](RELEASING.md) - version rules, release checklist, recovery.
- [NEXUS.md](NEXUS.md) - page source; `node tools/nexus/render.js` regenerates `nexus-paste.md`.
- `/nexus-publish` - `.claude/skills/nexus-publish/SKILL.md`, publishing on Nexus via Chrome.

## Rules

- Commit identity: `dirtyredz <dirtyredz@live.com>`.
- `info.json` `version` is the only version; it moves only when publishing. `name` stays
  "Farm Together 2", `gameId` stays 7911.
- Keep installer behaviour as verified unless a change is asked for; every rule change gets a case
  in `tests/installers.test.js`.
- Never hand-edit `nexus-paste.md`. The owner does not write page copy: agents write `NEXUS.md` in
  full, following the Moonlight Peaks page style (guides 13-15 in that workspace).
- `gameart.png`: real game art only, never AI-generated; record provenance in `assets/README.md`.
- Run the fast gate in README.md before any release commit. No long suites exist.
