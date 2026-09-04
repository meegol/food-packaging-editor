# Thesis Engineering Progress Report: Web-Based 2D Food Packaging Editor

**Project Title:** Development of a Digital Food Packaging Editing System for Cost-Effective Product Branding  
**Target Platform:** Web (Desktop & Tablet / Mobile-responsive)  
**Overall Completion:** 65% (Sprint 1 at 100%, Sprint 2 at 100%, Sprint 3 at 60% In Progress)  
**Current Build Status:** Passing (`npm run build` cleanly compiles TypeScript & Vite bundles)  
**Live Demo:** [https://thesis-sable-pi.vercel.app](https://thesis-sable-pi.vercel.app)  

---

## 1. Executive Summary

Small food enterprises, local bakeries, and cloud kitchens frequently face cost barriers when creating custom packaging. Traditional solutions require specialized industrial packaging CAD software (e.g., ArtiosCAD) or costly recurring subscriptions, followed by manual pre-press dieline preparation.

This thesis project delivers an accessible, browser-based 2D packaging dieline generator and layout editor. It operates entirely on the client side with zero login friction, enabling food vendors to generate structurally accurate packaging nets, place branding assets on specific panels, and output print-ready vector files.

Development is structured into four sequential sprints:
1. **Sprint 1: Parametric Dieline Geometry Engine & Interactive Canvas (100% Completed)**
2. **Sprint 2: Graphic & Branding Editor (100% Completed)**
3. **Sprint 3: Session Persistence & Portable Project Files (60% Completed — Active Development)**
4. **Sprint 4: Print-Ready Vector & High-Res Image Exports (0% Completed)**

---

## 2. Sprint-by-Sprint Technical Breakdown

### Sprint 1: Parametric Dieline Engine & Interactive Canvas
- **Status:** Completed (100%)
- **Objective:** Establish the foundational geometry calculation engine and an interactive 2D canvas that renders packaging nets in real time as dimensions change.

#### Key Deliverables Implemented:
1. **Parametric Packaging Templates (`src/core/dieline/`):**
   - **Burger Clamshell Box (`burgerBox.ts`):** Calculates the base tray, tapered side walls with nesting draft angles, corner dust flaps, rear hinge wall, and a top lid with front tuck flap. Includes material thickness ($t$) compensation so the lid closes smoothly over the base.
   - **Pizza Box (`pizzaBox.ts`):** Implements a standard Roll-End Tuck Top (REFT) corrugated net. Computes double-layer roll-over sidewalls, bottom tray locking tab cutouts, rear hinge, and front locking tuck flaps.
   - **Stand-up Ziplock Pouch (`standUpPouch.ts`):** Calculates front and back panel faces, side heat-seal borders (8 mm default), top header zone with tear notch indicators, zipper position line, and bottom expansion gusset geometry.

2. **Parametric Dimension Controls (`DimensionControls.tsx`):**
   - Live two-way inputs (sliders + numeric inputs) for Length ($L$), Width ($W$), Depth ($D$), and Board Caliper / Thickness ($t$).
   - Bidirectional unit conversion between millimeters (mm) and inches (in) with appropriate rounding and validation against template-specific structural limits.
   - One-click reset to standard industry default dimensions.

3. **Interactive 2D Canvas Engine (`FabricDielineCanvas.ts`):**
   - Canvas wrapper built on Fabric.js with responsive viewport scaling and device pixel ratio awareness.
   - Viewport navigation: Smooth mouse-wheel zooming, background click-and-drag panning, and zoom-to-fit calculation based on bounding box coordinates.
   - Layer toggling: Independent toggling of solid red cut lines (`#e53935`), dashed green crease lines (`#10b981`), and panel identification labels.

4. **Panel Identification & Focus Mapping (`PanelList.tsx`):**
   - Automatic polygon computation for individual packaging faces (Bottom Base, Top Lid, Front Wall, Flaps, etc.).
   - Panel hover detection with visual highlight tinting and an active panel inspector list.
   - Panel focus trigger: Clicking any panel smoothly shifts the canvas viewport transform and zooms directly into that face for editing.

---

### Sprint 2: Graphic & Branding Editor
- **Status:** Completed (100%)
- **Objective:** Allow users to place visual assets, typography, and food safety iconography onto individual packaging panels without elements spilling outside boundaries.

#### Completed Deliverables (100% Milestone):
1. **Image & Logo Upload Pipeline (`BrandingControls.tsx`, `types.ts`):**
   - Implemented drag-and-drop dropzone and native file browser supporting PNG, JPG, WebP, and SVG files.
   - Target face selection allowing designers to place artwork specifically on chosen packaging panels (e.g. Top Lid, Base Tray, Front Panel).
2. **Panel Polygon Clipping Engine (`FabricDielineCanvas.ts`):**
   - Automatic polygon clipping paths (`clipPath`) derived from exact parametric panel geometry, ensuring artwork stays strictly within panel boundaries without spilling into glue flaps, dust flaps, or fold creases.
   - User toggle for polygon clipping vs full-bleed unclipped display.
3. **Interactive Graphic Layer & Canvas Transformations:**
   - Visual transformation handles (scaling corner points, rotation knob, translation drag).
   - Independent event routing distinguishing canvas viewport panning from graphic object manipulation.
4. **Typography & Text Engine (`TextControls.tsx`):**
   - Direct text label placement on target packaging faces with Fabric.js `Textbox` word wrapping and multi-line rendering.
   - Font family picker (`Inter`, `Roboto`, `Playfair Display`, `Montserrat`, `Courier Prime`, `Oswald`).
   - Font size slider (8px - 48px), weight toggles (Regular, Medium, Bold), text alignment (Left, Center, Right), and packaging color presets.
   - Quick food packaging text templates for Brand Title, Net Weight, Ingredients, and Storage Notes.
5. **Food Compliance & Recycling Vector Icon Library (`ComplianceIconControls.tsx`):**
   - Built-in library of clean, scalable vector SVG presets across three essential packaging categories:
     - **Recycling & Material Identification:** Universal Mobius Recycle Loop, PAP 20 (Corrugated Fiberboard for boxes), PP 05 (Polypropylene for food contact), and PET 01.
     - **Handling & Storage Instructions:** Keep Frozen (snowflake seal), Microwave Safe, Keep Upright (dual arrows), and Keep Dry (umbrella & rain).
     - **Dietary & Religious Certifications:** 100% Vegan (dual leaf crest), Halal Certified (bilingual Arabic/English seal), Gluten-Free (crossed wheat stalk badge), and Kosher Pareve (orthodox U symbol).
   - Instant one-click placement onto selected packaging panel with automatic scale-to-fit and polygon boundary clipping.
6. **Barcode & QR Code Generator (`BarcodeControls.tsx`):**
   - **Vector 1D Barcode Generator:** Client-side generation of standard packaging barcodes (EAN-13 for international retail products, UPC-A for North American retail, and Code 128 for batch and lot tracking) using `JsBarcode`.
   - **Dynamic 2D QR Code Engine:** High-contrast 2D matrix generation for digital restaurant menus, allergen disclosures, or social links using `qrcode`, with selectable error correction levels (L, M, Q, H).
   - Real-time preview canvas with format validation, sample presets, and direct one-click placement onto target panel faces.
7. **Placed Artwork & Layer Management:**
   - Dedicated branding sidebar tab with thumbnail preview, target panel assignment, clipping toggle, layer reordering (bring forward/send backward), and removal.

---

### Sprint 3: Session Persistence & Portable Project Files
- **Status:** In Progress (60% Completed)
- **Objective:** Enable reliable client-side saving and loading so users never lose work upon accidental browser refreshes, completely eliminating backend account requirements, while supporting professional software design themes.

#### Implemented & Active Deliverables:
1. **Local Browser Draft Auto-Save (`projectStorage.ts`):**
   - Background serialization of active canvas state, selected template, dimensional parameters, and placed graphics with 600ms debounce.
   - Header autosave indicator displaying real-time saving status (pulsing amber indicator) and saved state (green indicator).
2. **Draft Recovery Alert (`DraftRecoveryBanner.tsx`):**
   - Startup detection of unsaved drafts displaying an alert banner with time-ago indicators, allowing 1-click restore or dismissal.
3. **Portable JSON Project File Schema & I/O (`projectStorage.ts`):**
   - **Export:** Instant one-click generation and download of formatted `.json` project files (`{template}-design-{date}.json`).
   - **Import:** File parsing with strict schema validation restoring template, dimensions, graphics, and theme.
4. **Professional Color Theme System (`themeDefinitions.ts`, `theme.css`, `ThemePicker.tsx`):**
   - Interactive header theme selector offering 6 industry-standard software themes:
     - **Dark Themes:** Slate Studio (Linear/JetBrains), Midnight Navy (GitHub/VS Code), Obsidian Emerald (Raycast/Terminal).
     - **Light Themes:** Clean Enterprise (Stripe/Linear), Warm Kraft Paper (Figma/Notion/Packaging Craft), Steel Minimal (macOS/CAD).
   - Dynamic canvas background and panel highlight adaptation with persistent local preference.

---

### Sprint 4: Print & Vector Production Exports
- **Status:** Pending (0%)
- **Objective:** Convert the digital canvas layout into standard print-ready formats required by commercial printing and packaging houses.

#### Planned Architecture & Sub-Modules:
1. **Layer-Separated Vector PDF Export:**
   - Generation of PDF documents formatted at true physical scale (1:1 millimeter scale) using `jsPDF`.
   - Distinct color-coded vector paths:
     - **Cut Lines Layer:** Solid red stroke (`#e53935`, 1 pt), designated for the digital die cutter or steel-rule die maker.
     - **Crease Lines Layer:** Dashed green stroke (`#10b981`, 1 pt), designated for scoring and folding wheels.
     - **Artwork Layer:** High-fidelity raster and vector graphic objects.

2. **Raw Vector SVG Export:**
   - Clean, grouped SVG file output preserving path coordinates and group labels (`<g id="cut-lines">`, `<g id="crease-lines">`, `<g id="artwork">`) for direct import into packaging CAD tools or Illustrator.

3. **High-Resolution Raster Proof (300 DPI):**
   - High-DPI canvas render export (PNG / JPEG) scaled to 300 dots per inch based on package physical dimensions, providing a crisp digital proof for client sign-off.

---

## 3. Current Progress Summary Table

| Sprint | Module / Capability | Target Deliverable | Completion | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Sprint 1** | Parametric Engine | Burger box, pizza box, pouch dieline math | 100% | Completed |
| **Sprint 1** | Dimensional Controls | $L, W, D, t$ sliders, inputs, mm/in toggle | 100% | Completed |
| **Sprint 1** | Interactive Canvas | Fabric.js viewport, pan/zoom, layer toggles | 100% | Completed |
| **Sprint 1** | Face Mapping | Panel hover, focus trigger, face list | 100% | Completed |
| **Sprint 2** | Media Uploads | Drag-and-drop logos, PNG/SVG placement | 100% | Completed |
| **Sprint 2** | Panel Clipping | Bounding polygon clipping & bleed margins | 100% | Completed |
| **Sprint 2** | Text Engine | Custom text labels, typography controls | 100% | Completed |
| **Sprint 2** | Asset Presets | Food compliance symbols & nutritional badges | 100% | Completed |
| **Sprint 2** | Code Generator | Dynamic vector Barcode (EAN-13) & QR codes | 100% | Completed |
| **Sprint 3** | Persistence | LocalStorage draft auto-save & recovery banner | 100% | Completed |
| **Sprint 3** | Project Files | Portable `.json` export and import parser | 100% | Completed |
| **Sprint 3** | Themes | 6 Industry color schemes & Theme Picker | 100% | Completed |
| **Sprint 3** | Full Engine | Complete zero-login session persistence | 60% | In Progress |
| **Sprint 4** | Vector PDF | Layer-separated cut/crease/artwork PDF | 0% | Planned |
| **Sprint 4** | SVG Export | Grouped vector SVG output | 0% | Planned |
| **Sprint 4** | High-Res Raster | 300 DPI PNG/JPG flat dieline renders | 0% | Planned |
| **Overall** | **Entire System** | **Complete No-Registration Web Editor** | **65%** | **In Progress** |

---

## 4. Technical Challenges & Mitigations

1. **Polygon Clipping on Canvas (Resolved in Sprint 2):**
   - *Challenge:* Uploaded artwork and typography must stay visually bounded within non-rectangular panels (e.g., tapered flaps, triangular dust flaps).
   - *Status & Resolution:* Successfully implemented in Sprint 2 using Fabric.js `clipPath` assigned with exact parametric polygon vertices mapped with `absolutePositioned: true`. A user toggle allows switching between clipped display and full-bleed inspection.

2. **Barcode & QR Symbology Validation (Resolved in Sprint 2):**
   - *Challenge:* Invalid check digits in barcodes (such as EAN-13 parity errors) could cause generator crashes or illegible retail scans.
   - *Status & Resolution:* Implemented reactive input validation with `JsBarcode` and `qrcode` wrapped in error boundaries with quick-fill presets for guaranteed scanner compliance.

3. **Offline Persistence & Zero-Auth Draft Integrity (Sprint 3 Challenge):**
   - *Challenge:* Storing complex canvas state, typography layers, and uploaded raster/vector brand assets locally without exhausting browser storage quotas or requiring server authentication.
   - *Mitigation:* Utilize `IndexedDB` with structured cloning for image data URLs and debounced serialization of dieline parameters to prevent performance degradation.

4. **Physical Scale Fidelity on PDF Export (Sprint 4 Challenge):**
   - *Challenge:* Exported PDFs must match real-world millimeter dimensions exactly for physical carton die-cutting.
   - *Mitigation:* The dieline engine operates with millimeters as the ground truth. When outputting via `jsPDF`, coordinates will be mapped directly using `pt` or `mm` units without canvas pixel distortion.

---

## 5. Immediate Next Steps

1. Initiate **Sprint 3 development (Session Persistence & Portable Project Files)**:
   - **Local Browser Draft Auto-Save:** Implement `IndexedDB` background autosave debounced on dimensional changes or canvas modifications.
   - **Draft Recovery:** Add an automatic draft restoration prompt when reopening the editor or refreshing the browser.
   - **Portable JSON Project File Schema:** Define and implement the `.json` project file schema storing template parameters, dimensions, and graphic layer states.
   - **Project File I/O:** Add "Export Project (.json)" and "Import Project" file parsing with schema validation.
