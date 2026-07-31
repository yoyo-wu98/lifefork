# LifeFork Map UX Evidence

Date: 2026-04-30
Scope: UX / UI / Motion Team assignment 5.3

## Screenshots

- `docs/ux-evidence/lifefork-map-1440-selected.png`
- `docs/ux-evidence/lifefork-map-1280-selected.png`
- `docs/ux-evidence/lifefork-map-390-selected.png`
- `docs/ux-evidence/lifefork-map-inapp-selected.png`

The three viewport files were captured through the Codex Desktop browser-use browser against `http://localhost:3006/`, using a same-origin local harness only for fixed-width evidence framing.

## Visual Grammar

- Life branch card: solid rounded card, readable title, time marker, violet action color when it is an enterable child.
- Life container after selection: selected life branch becomes the camera subject; its descendants remain spatially related while unrelated context is muted.
- Phase container after drill-down: parent phases render as translucent container fields with a compact label, not as competing readable cards.
- Checkpoint node: checkpoint remains card-like and readable at its active scale; non-active checkpoint context fades.
- Local child node: active children use stronger violet border, subtle ring, and higher opacity.
- Background context node: dashed/low-opacity treatment; it should explain context without reading as the same hierarchy level.
- Current selected node: gold accent, strong card emphasis, camera label says `锁定焦点`.
- Ancestor route: route bar stays below the map as readable lineage buttons; ancestors inside the map are lower contrast unless directly selected.

## Responsive Containment

- Desktop 1440px: nav, progress, scale controls, map viewport, focus lock, right hint, reset camera, and current route remain visible without horizontal page overflow.
- Desktop 1280px: same hierarchy as 1440px; branch cards still have readable title/subtitle, and active children stay visually distinct from muted background nodes.
- Mobile 390px: nav wraps, scale controls scroll horizontally, the map keeps the focus-lock badge and reset camera reachable, and core map operation is not covered by overlays.

## Overlay Placement

- Focus lock: top-left inside map viewport, compact pill, demo-facing copy only.
- Right hint: top-right inside map viewport, hidden on narrow mobile widths.
- Reset camera: bottom-right inside map viewport.
- Current route bar: below map viewport, outside the canvas, so it does not compete with node selection.

## Removed / Reduced Debug Labels

- Camera badge no longer shows English `FOCUS LOCK`.
- Camera badge no longer shows raw zoom percentage.
- Detail panel no longer shows raw `X/Y` node coordinates.

## What Changed After Selection

- `当前读取` changes from the root/current self to the selected life branch.
- Selected branch becomes the camera subject and uses stronger readable-card treatment.
- Active children remain violet/ringed and readable.
- Background nodes stay present but are dashed, lower opacity, and visually subordinate.
- Detail panel shows `当前读取节点` instead of debug coordinates.

## Demo Mode Text That Should Remain Visible

- `Life Simulation Map`
- `人生模拟地图`
- `当前读取`
- `尺度`
- `镜头`
- `节点`
- `核心冲突`
- `锁定焦点`
- `左侧来路 · 右侧未来 · 子节点进入父框`
- `重置镜头`
- `当前读取路线`
- `当前读取节点`
