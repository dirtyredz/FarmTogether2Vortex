# assets

Not packaged except `gameart.png` (this README stays out of the zip).

## gameart.png

The tile Vortex shows for the game. Requirements (Vortex wiki, "How to package a game extension"):
640x360 PNG, below 1 MB, no text or logos (Vortex overlays the game name), readable on a dark
background. `tools/release/validate.js` enforces size, dimensions and PNG structure; the "no text"
check is human, below.

**Provenance (2026-11-07):** Farm Together 2's own Steam library hero image (app 2418520), the
text-free key art Steam shows behind the library page, from Valhalla's Steam cache:
`C:\Program Files (x86)\Steam\appcache\librarycache\2418520\0ee64eb07b59dd0e43d0a8e1914ea36cafa83cca\library_hero.jpg`
(1920x620, SHA-256 `ce82b346fdcf071a975f4cda73f446c8ba97666dea1348f573f4ded12aed18c8`). Not
AI-generated, not a mock-up.

**Crop:** the 16:9 region x=449..1550, y=0..619 (1102x620, centred on the two farmers, pig, dog
and chickens), scaled to 640x360 with high-quality bicubic (System.Drawing), saved as PNG
(652,710 bytes).

**Visual check:** no text, no logo, no UI, no watermark; bright farm scene, subjects centred so the
name overlay along the bottom edge does not cover faces.

Raw source images are not committed. In-game captures from the ANU test runner were rejected: they
show the title screen or desktop UI, never a clean farm scene.

To replace it: keep the same rules, update this provenance block, run `node tests/release.test.js`.
