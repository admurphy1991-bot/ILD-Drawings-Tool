
# Handoff: Markup Drawings Measurement App

## Overview
A tool for marking up waterproofing/roofing construction drawings and generating an inspection report PDF. Users upload drawing pages (PDF or image), calibrate a real-world scale on each page, draw measured lines/areas, flag breach points, and add text callouts. The app then generates a printable report: one full-page marked-up drawing per input page (with a title block) plus a summary sheet with measurement tables and breach listings.

## About the Design Files
The files in this bundle are **design references built as an HTML prototype** — they demonstrate intended layout, interaction, and visual style, not production code to lift directly. The task is to recreate this design in the target codebase's actual environment (React/Vue/native/etc., using its existing component library, state management, and PDF-rendering approach), or to choose an appropriate stack if none exists yet. Client-side PDF rasterization (currently via pdf.js loaded from a CDN) and print-to-PDF report generation are functional prototype choices, not necessarily the production approach — evaluate what fits the target app's infrastructure (e.g. server-side rendering for reports).

## Fidelity
**High-fidelity.** Colors, type, spacing, and interaction behavior are final for a v1 and should be reproduced closely. Layout measurements below are taken directly from the prototype's inline styles.

## Screens / Views

The app is a single-page tool with three modes: **Upload**, **Workspace** (editor), **Report**.

### 1. Upload
- **Purpose**: Add drawing pages before entering the editor.
- **Layout**: Centered column, max-width 640px, on a light gray page (`#eef0f3`). Vertical gap 20px.
- **Components**:
  - Heading "Upload drawing pages" (24px/700) + helper paragraph (14px, `#475569`).
  - Dropzone: dashed 2px border `#cbd5e1`, 8px radius, 36px padding, white background, centered text; hover state border `#ea580c` / bg `#fff7ed`. Contains bold label + "or drag and drop image files here" (12px, `#94a3b8`).
  - Uploaded page list: each row is a white card, 1px border `#e2e8f0`, 6px radius, 56×40px thumbnail, filename (13px/500), and a "×" remove button (hover red `#dc2626`).
  - Primary CTA "Continue to Markup": solid `#ea580c`, white text, 4px radius, disabled state gray `#94a3b8` at 0.4 opacity when no pages.

### 2. Workspace (Editor)
- **Purpose**: Calibrate scale and draw annotations per page.
- **Layout**: Full-height flex row: left tool rail (96px) → center canvas column (flex) → right sidebar (300px). Top header bar is 56px, dark navy `#0f172a`.
- **Left tool rail** (96px, `#0f172a` background): vertical stack of tool buttons — Set Scale (`#ea580c`), Line (`#2563eb`), Area (`#16a34a`), Breach (`#dc2626`), Label (`#334155`), Pan (`#64748b`). Each button: 14px dot swatch (2px white border) + 11px/700 label underneath, active state bg `#1e293b`. All tools except Set Scale/Pan are disabled (30% opacity) until the page is calibrated or set to Demonstrate mode.
- **Canvas column**:
  - Page tabs bar (56px, white, bottom border `#e2e8f0`): each tab is a pill with 36×26px thumbnail, name (12px/600), and an 8px scale-status dot (green `#16a34a` = calibrated, gray `#cbd5e1` = not). Active tab: bg `#fff7ed`, border `#ea580c`. Plus an "+ Add page" dashed button and a right-aligned "Undo" button (disabled at 0.35 opacity when no history).
  - Mode toggle bar (below tabs, `#f8fafc` bg): segmented control "Measure" / "Demonstrate only" (pill halves, active = dark navy fill/white text), and a right-aligned "Start breach numbering at" number input — carries breach numbering forward across visits.
  - Warning banner (only when uncalibrated and not in Demonstrate mode): `#fff7ed` bg, `#fed7aa` border, `#9a3412` text, 13px.
  - Canvas area: gray `#dfe3e8` background, scrollable/pannable, drawing rendered in an SVG at a fixed 1000-unit-wide viewBox scaled to the page's aspect ratio, white page background with soft shadow.
  - Floating instruction pill (top center): dark pill, 12px text, contextual per active tool, with inline "Finish" (green `#16a34a`) / "Cancel" (red outline) buttons while drafting a line/area.
  - Zoom control (bottom right): dark pill with −, percentage (click to reset to 100%), + — range 50–300%, step 25%.
  - Calibration popover: appears after clicking 2 points; white card, 6px radius, shadow, numeric input (meters) + Cancel / "Set Scale" (`#ea580c`) buttons.
  - Annotation edit popover (substrate dropdown for areas: Plywood/Concrete/Warm Roof; textarea for breach notes / text callouts): same white-card style, Cancel / Save.
- **Annotation rendering (SVG)**:
  - Lines: 4px stroke, rounded caps/joins, color `#2563eb`; label chip at midpoint.
  - Areas: fill at 18% opacity (editor) / 28% (report) colored by substrate — Plywood `#ccff00` (chartreuse), Concrete `#00e5ff` (cyan), Warm Roof `#ff3c00` (neon orange-red), unset `#39ff14` (fluro green); 3px outline stroke, no fill on the outline itself. Exclusion holes rendered as white 60%-opacity polygons with dashed gray (`#64748b`) 2px stroke.
  - Breach points: small red (`#dc2626`) cross at the exact defect point, a thin red leader line with an arrowhead marker pointing from an offset label position back to the cross, and a circular number chip (solid black text `#000`, white chip background, box-shadow ring) at the leader's tail end — the label position auto-flips to stay inside the canvas bounds.
  - Text callouts: white chip label at the click point, `#334155` text.
  - All labels are HTML chips inside SVG `foreignObject` elements (not raw SVG `<text>`), so they render crisply and support wrapping/background/shadow — this was a deliberate fix for a prior bug where plain `<text>` + nested `<span>` produced invisible labels.
  - Font for all measurement/label text: `'IBM Plex Mono', monospace`, weight 600–700.
- **Right sidebar** (300px, white, left border `#e2e8f0`):
  - "Job details" section: 5 text inputs (client name, site address, report title, company name — defaults to "ILD", date).
  - "This page" stat cards: 2-column grid — Length, Area, and a full-width Breaches-flagged card. Values in IBM Plex Mono 15px/600.
  - Substrate legend chips (only shown when the page has area annotations): colored dot + label per substrate in use.
  - "Annotations" list: one row per annotation — colored dot, marker code (e.g. `L1`, `A2`, `B14`, `T1`) in mono 11px/700, truncated value text, "Edit" link (blue `#2563eb`) for editable types, and a "×" delete. Area rows get an extra sub-row: "+ Exclude untestable area" plus an exclusion count and "Clear" link when holes exist.

### 3. Report
- **Purpose**: Printable/exportable output.
- **Layout**: Landscape paginated document (built on a reusable paged-document shell). One page per drawing, plus a final summary page.
- **Per-drawing page**: full-bleed SVG of the marked-up drawing (bordered `#94a3b8`) above a title block.
  - **Title block** (bordered `#0f172a`, 9px base text): 6 columns — Client (name + address), Project (report title), Drawing (page name + calibration status), Markup Colours (swatch + substrate label per color in use), Symbol Key (dot + label per annotation type present), and a logo block (ILD logo image, max 80×56px, centered, with the company name below in bold).
  - Footer strip below the title block: report year (left), italic disclaimer "This drawing is the property of {company} and may not be reproduced without consent." (center, `#64748b`), "NOT TO SCALE" (right, bold).
- **Summary page**: report title (26px) + "Prepared for {client · address · date}" subtitle, a 4-column stat grid (Pages / Total length / Total area / Breaches flagged, values in IBM Plex Mono 20px/600), then per-page sections: a measurements table (Marker / Type / Measurement columns) and a breach list (numbered circle chip in the breach's color + description + optional photo thumbnail).
- **Top header bar** (56px, `#0f172a`): "Overlay" wordmark + "Drawing Markup" subtitle, and mode-dependent right-aligned actions — "Generate Report" (workspace) or "Back to Editor" / "Print / Save PDF" (report).

## Interactions & Behavior
- **Upload**: drag-and-drop or file picker; multi-page PDFs are split into one page per sheet automatically (rasterized client-side at 3x scale for crisp on-screen measuring); each dropped/selected page appears in a removable list before continuing.
- **Calibration** ("Measure" mode only): click two points a known real-world distance apart → popover asks for the real-world length in meters → confirming computes a pixels-per-unit ratio stored per page. Recalibrating overwrites it. "Demonstrate only" mode skips calibration entirely and unlocks drawing tools without producing real measurements (labels show em-dash instead of a value).
- **Line tool**: click to add points; double-click or the floating "Finish" button completes the polyline (min 2 points); "Cancel" discards the in-progress draft. Live length converted using the page's scale.
- **Area tool**: click to trace a polygon; clicking within 10px of the start point (visually indicated by a highlighted ring around the start point) or pressing Finish closes it (min 3 points) — after closing, a popover asks for substrate/membrane type (Plywood / Concrete / Warm Roof, or left unset).
- **Exclusions**: from an area's row in the sidebar, "+ Exclude untestable area" starts a second polygon-tracing draft scoped to that area; on close it's stored as a hole and subtracted from the area's m² total. Multiple exclusions per area are supported; "Clear" removes all of them for that area.
- **Breach tool**: single click drops a marker immediately (no draft state) and opens a note popover (optional text + optional photo attachment). Numbering is sequential per page but offset by the page's "Start breach numbering at" value, so numbering can continue across follow-up site visits.
- **Text/label tool**: single click drops a callout and opens a text-entry popover. Canceling with empty text deletes the callout.
- **Editing existing annotations**: "Edit" reopens the same popover pre-filled (substrate for areas, note for breaches, text for callouts) positioned near the annotation.
- **Deleting**: "×" on any sidebar row removes that annotation immediately (pushes an undo step).
- **Undo**: every mutating action (add/delete annotation, add/clear exclusion, calibrate) snapshots the prior full page list; Undo pops the most recent snapshot, capped at 20 steps.
- **Zoom**: 50–300% in 25% steps via +/− buttons; clicking the percentage resets to 100%. Independent of the SVG viewBox — scales the rendered canvas width.
- **Pan tool**: click-drag scrolls the canvas container; cursor swaps to grab/grabbing.
- **Report generation**: "Generate Report" switches mode; "Back to Editor" returns without altering data; "Print / Save PDF" triggers the browser print dialog against the paginated report layout.
- **No responsive behavior** — this is a desktop-only tool (fixed 96px rail / 300px sidebar), consistent with its professional/field-inspection use case on laptops or tablets.

## State Management
Suggested state shape (mirrors the prototype):
- `mode`: `'upload' | 'workspace' | 'report'`
- `pages[]`: each `{ id, name, img (raster or original), naturalW, naturalH, scale: { ppu, value } | null, demoMode: boolean, breachStartNumber, annotations[] }`
- `annotations[]` per page: `{ id, type: 'line'|'area'|'point'|'text', points[], holes[][] (area only), substrate (area only), note/photo (point only), label (text only) }`
- `activePageIndex`, `activeTool`
- Transient draft state while drawing: in-progress polyline/polygon points + live mouse position; in-progress calibration click state; open popover state (which annotation, which field)
- `history[]`: stack of prior full `pages` snapshots for undo (cap 20)
- `zoom`, pan scroll position (can live in the DOM/ref, doesn't need to be React state)
- `job`: `{ clientName, address, reportTitle, company, date }`
- Derived/computed per page (recompute on render, don't store): pixel→real-world conversions for lengths/areas, net area after subtracting exclusion holes, per-type counters for marker labels (L1, A1, B14, T1…), totals, legend/symbol-key lists used in the report title block.

## Design Tokens
**Colors**
- Background (app shell): `#eef0f3`
- Header/dark surfaces: `#0f172a`, hover `#1e293b`
- Primary/accent (CTAs, calibration): `#ea580c`, hover `#c2410c`, tint `#fff7ed`
- Borders/neutrals: `#e2e8f0`, `#cbd5e1`, `#94a3b8`, `#64748b`, `#475569`
- Text: primary `#0f172a`, secondary `#475569`, muted `#94a3b8`
- Line annotation: `#2563eb`
- Area annotation (unclassified): `#39ff14`
- Breach/point annotation: `#dc2626`
- Text callout: `#334155`
- Substrate colors: Plywood `#ccff00`, Concrete `#00e5ff`, Warm Roof `#ff3c00`
- Success/finish: `#16a34a`
- Warning banner: bg `#fff7ed`, border `#fed7aa`, text `#9a3412`

**Typography**
- UI font: Public Sans (400/500/600/700), Google Fonts
- Monospace (measurements, marker codes, report stat values): IBM Plex Mono (500/600/700)
- Sizes in use: 24px (page heading), 20px (report stat values), 16–18px (in-canvas labels), 15px (sidebar stat values), 13–14px (body/inputs), 11–12px (labels, chips, tabs), 9–10px (report title block, uppercase eyebrow labels)

**Spacing / Radius**
- Card/button radius: 4px (buttons, stat cards), 6px (popovers, tab pills, dropzone), 3px (in-canvas label chips), pill/circular for segmented controls and marker dots
- Common gaps: 8px, 10px, 12px, 16px, 20px

**Shadows**
- Popovers/floating pills: `0 6px 20px rgba(0,0,0,0.25)` (popovers), `0 4px 12px rgba(0,0,0,0.25)` (floating instruction/zoom pills)
- In-canvas label chips: `0 0 0 1px rgba(15,23,42,0.08)` (hairline outline, not a drop shadow)

## Assets
- `ILD Logo.jpeg` — company logo shown in the report title block (bundled in this handoff as `assets/ild-logo.jpeg`).
- No other external imagery; all icons are simple CSS-drawn dots/shapes, not an icon font or SVG icon set.
- Third-party libraries used by the prototype (for reference, not necessarily what production should use): pdf.js (CDN) for client-side PDF rasterization; a custom paginated-document web component for the print layout.

## Files
- `Markup Drawings App.dc.html` — the full prototype (single file: markup + component logic). This is the primary reference for exact structure, conditional rendering, and computed values (measurement math, label positioning, marker numbering) — see the embedded component class for the calculation logic (`polylineLen`, `polyArea`, `buildPathD`, `enrichPage`).
