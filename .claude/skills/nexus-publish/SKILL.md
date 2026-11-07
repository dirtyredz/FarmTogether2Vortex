---
name: nexus-publish
description: Publish or update the Farm Together 2 Vortex extension on Nexus Mods by driving the owner's logged-in Chrome - create the page, upload a new version, sync the description, or verify the live page. Use when asked to publish, release, upload, deploy or update the extension on Nexus, or to fix or check its page.
---

# Publishing the extension to Nexus

You drive the owner's real Chrome (`mcp__claude-in-chrome__*`) against their logged-in Nexus
account. Everything you write is **public**. Adapted from the Moonlight Peaks `nexus-publish` skill
(that workspace: `C:\Users\dirty\projects\Moonlight Peaks\.claude\skills\nexus-publish\SKILL.md`),
whose form traps all apply here. What differs: this is a Vortex **extension** on the Nexus `site`
domain, the page text comes from this repo's `NEXUS.md`, and the version comes from `info.json`.

Argument: a mode - `create`, `update`, `description` or `verify`. No argument: `nexus.json` has no
`modId` -> `create`; otherwise ask which (one question, `update` recommended if `info.json` is ahead
of the live version).

All paths are relative to this repo's root (the folder holding `info.json`); resolve it first.

---

## 0. Read first

| File | What it settles |
|---|---|
| `RELEASING.md` | version rules, checklist, recovery |
| `NEXUS.md` | page fields (name, summary, category, file description, changelog) and description source |
| `nexus-paste.md` | the exact BBCode for the description field (generated) |
| `nexus.json` | destination: `modId`, `mainFileId`, last publication receipt |
| `CHANGELOG.md` | what changed in this version |

Page style is Moonlight Peaks guide 15 (`15-page-style.md` in that workspace): gold/plum palette,
quote panels, character rules. The renderer already applies it; do not hand-restyle the BBCode.

## 1. Preflight - stop on any failure

1. `git status --porcelain` is empty and HEAD is the release commit (pushed to `origin`).
2. Fast gate from README.md passes, including `node tools/nexus/render.js --check`.
3. `pack.ps1 -Json` -> archive path, `version`, `sha256`. `version` equals `info.json` and has a
   `CHANGELOG.md` heading. Record all three; you will verify against them.
4. `node tools/release/validate.js` passes, and you have looked at `assets/gameart.png` (no text).
5. For `update`: `nexus.json.modId` is set; `version` is greater than the live page's version.

## 2. Get a browser

```
ToolSearch: select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find,mcp__claude-in-chrome__file_upload,mcp__claude-in-chrome__read_page
```

`tabs_context_mcp{createIfEmpty:true}`, then open `https://www.nexusmods.com/site/mods/<modId>`
(or the Nexus home page for `create`). If it says "Log in" or the extension is not connected:
**stop and ask the owner to sign in in Chrome.** Never type credentials, never handle MFA or
CAPTCHAs. The in-app Browser pane is a different, logged-out browser.

Edit tabs (discover the exact URL from the page's own Edit link and record it in `nexus.json` the
first time): `/edit/general`, `/edit/media`, `/edit/files`, `/edit/requirements`, `/edit/permissions`.

## 3. Form traps (each has caused a silent failure on Moonlight Peaks)

- **Description is BBCode behind SCEditor.** Writing the hidden textarea does nothing. Go through
  the instance:
  ```js
  const ta = [...document.querySelectorAll('textarea')].find(t => t.parentElement.className.includes('bbcode-editor'));
  ta._sceditor.val(newDoc); ta._sceditor.updateOriginal(); ta._sceditor.valueChanged();
  ```
- **Save stays disabled unless a React-controlled field differs.** For a description-only change,
  pad the short description with one trailing space, save, remove it, save again; then assert
  `!/\s$/.test(document.getElementById('short-description').value)`. Set React fields with the
  native value setter + `input` event:
  `Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}))`.
- **`[hr]` is silently destroyed** (becomes `[line]`, stripped publicly). The renderer emits the
  plum character rule instead; never add `[hr]`.
- **Never click the upload control or drop zone** - the native file dialog freezes the tab. `find`
  the hidden `<input type=file>` (accept `.rar,.zip,.7z,.exe,.omod`) and use
  `file_upload{ref, paths:[<absolute archive path>]}`.
- **Headless-UI controls ignore `.click()`.** Drive them with keyboard events from
  `javascript_tool`: combobox `focus()` + `keydown ArrowDown` then `Enter`; checkbox `focus()` +
  keydown/keyup Space. Re-read `aria-checked` / the selected value after every change.
- **The file-version field mis-parses the archive name** (it filled `1` from `...-1.0.1.zip`). Set it
  explicitly to the full `info.json` version and assert by boolean (`el.value === '<v>'`); reading a
  bare version string back can return `[BLOCKED: JWT token]`.
- **Selecting an existing file to update resets the display name and unticks "Update mod version
  to match".** Re-set both after selecting.
- Return counts and booleans from `javascript_tool`, not raw HTML or long field values (the content
  filter blocks large reads).
- Do **not** port Moonlight Peaks' experimental upload-API interception or call Nexus APIs with
  lifted tokens. Browser form automation only.

## 4. Mode `create` - first release

The new-page flow is **unverified** (no extension page has been created this way). Discover it from
the current UI: the header "Upload" control is a JS button. Expect General -> Media -> Files ->
Requirements -> Permissions.

1. **Check it does not already exist:** search Nexus `site` mods for "Farm Together 2" by author
   dirtyredz, and check `nexus.json`. If a page exists, record its ID and switch to `update`.
2. **General:** game/section **Modding Tools** (the `site` domain - not the Farm Together 2 game
   domain), category **Vortex Extensions**, name, summary and version from `NEXUS.md`/`info.json`,
   description = the full contents of `nexus-paste.md` via SCEditor. Save.
3. **Record the new page ID** in `nexus.json` (`modId`) immediately, before anything else, so an
   interruption resumes by ID instead of creating a second page. Commit it later with the receipt.
4. **Media:** upload `assets/gameart.png` as the primary image via the hidden file input.
5. **Files:** add the archive as a **new file**, category **Main**, display name
   `Farm Together 2 Support for Vortex <version>`, version `<version>` set explicitly, file
   description from `NEXUS.md`, changelog line from `NEXUS.md`.
6. **Requirements:** none. **Permissions:** open source; link the GitHub repo; MIT.
7. **Publishing boundary.** If the owner's request already authorised publishing, publish. If it only
   authorised preparation, stop here with the page staged (unpublished) and show the owner the
   staged page plus the archive path, version and SHA-256 for a yes.
8. Verify (section 7).

## 5. Mode `update` - new version

1. Preflight. On the public Files tab, check whether a Main file at this version already exists
   (an interrupted earlier run). If so, compare its size with the local archive and skip to verify.
2. `/edit/files`: `file_upload` the archive. Upload type **Update existing file**; select the
   current Main file (combobox via keyboard). Then re-set display name
   `Farm Together 2 Support for Vortex <version>`, set file version `<version>`, re-tick **Update
   mod version to match**, leave category **Main**, tick **Archive existing file** (keep exactly one
   active Main file), add the changelog line from `NEXUS.md` in `#file-changelog-text`.
3. Save the file. If `NEXUS.md`'s description changed in this release, run `description` mode.
4. Verify (section 7).

## 6. Mode `description` - sync the page text

1. Read the live BBCode with `ta._sceditor.val()` and compare it inside the page with the last
   published `nexus-paste.md` (pass that text into `javascript_tool`). Return only a short summary:
   equal or not, lengths, and the first differing line, never the whole value.
2. **If the live page differs from the last published `nexus-paste.md` (someone edited it on Nexus),
   do not overwrite it.** Fold those edits into `NEXUS.md`, re-render, commit, then continue.
3. Set the description from `nexus-paste.md`, save with the pad-and-restore trick, and check the
   short description and name still match `NEXUS.md`.
4. Verify (section 7).

## 7. Mode `verify` - always after any change

The editor is not a preview. On the **public** page (`https://www.nexusmods.com/site/mods/<modId>`,
navigate the tab rather than `fetch`, and read `document.body.innerText` returning booleans):

- the page header version equals `info.json` (confirm with a `computer` screenshot of the public
  page; version text can trip the token filter);
- category is Vortex Extensions under Modding Tools;
- the Files tab shows exactly **one** Main file, at this version;
- the description has lists (`ul,ol` count > 0), quote panels (`blockquote`), the `────` rule, and no
  literal `[b]`/`[url` BBCode leaking;
- download the Main file through the page if possible and compare its SHA-256 with the local archive;
  otherwise compare the listed size and say the hash was not checked.

Report upload success and **Vortex discovery separately**: discovery is pending until Farm Together
2 is seen in a clean Vortex's Games list (usually within about two hours of upload).

## 8. After a confirmed upload

1. Tag the release commit: `git tag -a v<version> -m "v<version>" <commit>`, `git push origin
   v<version>`. Never move an existing tag; on a mismatch, stop and report.
2. Update `nexus.json`: `modId`, `mainFileId`, and `lastPublished` =
   `{ version, sha256, commit, fileName, date }`. Commit separately ("Record Nexus release
   <version>") and push.

## 9. Standing decisions

- No AI-disclosure line on the page.
- The owner does not write page copy; agents write `NEXUS.md` in full.
- Do not copy another author's page identity (Moonlight Peaks guide 15, "what we deliberately do
  not do").
- Never put credentials, tokens or cookies in any file.

## 10. Report honestly

Say what changed, what you verified on the live page, and what you did not verify (hash, discovery).
A save that looks right in the editor is not a verified page.
