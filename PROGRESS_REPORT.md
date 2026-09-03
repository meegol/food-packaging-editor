# Thesis Engineering Progress Report: Web-Based 2D Food Packaging Editor

**Project Title:** Development of a Digital Food Packaging Editing System for Cost-Effective Product Branding  
**Target Platform:** Web (Desktop & Tablet / Mobile-responsive)  
**Overall Completion:** 31% (Sprint 1 at 100%, Sprint 2 at 25%)  
**Current Build Status:** Passing (`npm run build` cleanly compiles TypeScript & Vite bundles)  
**Live Demo:** [https://thesis-demo-app.vercel.app](https://thesis-demo-app.vercel.app) (Alternative: [https://food-packaging-demo.vercel.app](https://food-packaging-demo.vercel.app))  

---

## 1. Executive Summary

Small food enterprises, local bakeries, and cloud kitchens frequently face cost barriers when creating custom packaging. Traditional solutions require specialized industrial packaging CAD software (e.g., ArtiosCAD) or costly recurring subscriptions, followed by manual pre-press dieline preparation.

This thesis project delivers an accessible, browser-based 2D packaging dieline generator and layout editor. It operates entirely on the client side with zero login friction, enabling food vendors to generate structurally accurate packaging nets, place branding assets on specific panels, and output print-ready vector files.

Development is structured into four sequential sprints:
1. **Sprint 1: Parametric Dieline Geometry Engine & Interactive Canvas (100% Completed)**
2. **Sprint 2: Graphic & Branding Editor (25% Completed — In Progress)**
3. **Sprint 3: Session Persistence & Portable Project Files (0% Completed)**
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
- **Status:** In Progress (25% Completed)
- **Objective:** Allow users to place visual assets, typography, and food safety iconography onto individual packaging panels without elements spilling outside boundaries.

#### Completed Deliverables (25% Milestone):
1. **Image & Logo Upload Pipeline (`BrandingControls.tsx`, `types.ts`):**
   - Implemented drag-and-drop dropzone and native file browser supporting PNG, JPG, WebP, and SVG files.
   - Target face selection allowing designers to place artwork specifically on chosen packaging panels (e.g. Top Lid, Base Tray, Front Panel).
2. **Panel Polygon Clipping Engine (`FabricDielineCanvas.ts`):**
   - Automatic polygon clipping paths (`clipPath`) derived from exact parametric panel geometry, ensuring artwork stays strictly within panel boundaries without spilling into glue flaps, dust flaps, or fold creases.
   - User toggle for polygon clipping vs full-bleed unclipped display.
3. **Interactive Graphic Layer & Canvas Transformations:**
   - Visual transformation handles (scaling corner points, rotation knob, translation drag).
   - Independent event routing distinguishing canvas viewport panning from graphic object manipulation.
4. **Placed Artwork Management:**
   - Dedicated branding sidebar tab with thumbnail preview, target panel assignment, clipping toggle, and quick removal.

#### Upcoming Sub-Modules (Remaining 75% of Sprint 2):
1. **Typography & Text Engine (+25%):**
   - Editable text elements for brand titles, ingredient listings, net weight, and nutrition disclosures.
   - Font family picker, font size, line height, text alignment, and color controls.
2. **Food Compliance & Vector Icon Library (+25%):**
   - Pre-loaded SVG icon presets commonly required on food packaging:
     - Recycling / Resin identification codes
     - Keep Frozen / Perishable indicators
     - Microwave safe & oven safe icons
     - Halal / Kosher certification marks
     - Storage instructions (e.g., Keep in Cool Dry Place)
3. **Barcode & QR Code Generator (+25%):**
   - Embedded client-side generator for standard product barcodes (EAN-13, UPC-A) using `JsBarcode`.
   - Dynamic 2D QR code generator for menus, promotional URLs, or social handles using `qrcode`.

---

### Sprint 3: Session Persistence & Portable Project Files
- **Status:** Pending (0%)
- **Objective:** Enable reliable client-side saving and loading so users never lose work upon accidental browser refreshes, completely eliminating backend account requirements.

#### Planned Architecture & Sub-Modules:
1. **Guest Session Initialization:**
   - Automatic generation of a UUID session token stored in memory upon first page load.
   - Zero login screens, authentication barriers, or email verifications.

2. **Local Browser Draft Auto-Save:**
   - Background serialization of active canvas state, selected template, and dimensional parameters to `IndexedDB` (or `localStorage` fallback) on every user modification debounce.
   - Automatic draft restore prompt if a user reloads or navigates back to the application.

3. **Portable JSON Project File Schema:**
   - "Save Project" button generating a downloadable `.json` file (e.g., `burger-box-design.json`) containing:
     - Project metadata and timestamp
     - Selected template ID and dimensions ($L \times W \times D \times t$, unit)
     - Serialized Fabric.js object tree and panel asset references
   - "Open Project" parser validating schema versioning and restoring the complete project state onto the dieline canvas.

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
| **Sprint 2** | Media Uploads | Drag-and-drop logos, PNG/SVG placement | 0% | Planned |
| **Sprint 2** | Panel Clipping | Bounding polygon clipping & bleed margins | 0% | Planned |
| **Sprint 2** | Text Engine | Custom text labels, typography controls | 0% | Planned |
| **Sprint 2** | Asset Presets | Food compliance symbols & nutritional badges | 0% | Planned |
| **Sprint 2** | Code Generator | Dynamic vector Barcode (EAN-13) & QR codes | 0% | Planned |
| **Sprint 3** | Persistence | IndexedDB / LocalStorage draft auto-save | 0% | Planned |
| **Sprint 3** | Project Files | `.json` export and import parser | 0% | Planned |
| **Sprint 4** | Vector PDF | Layer-separated cut/crease/artwork PDF | 0% | Planned |
| **Sprint 4** | SVG Export | Grouped vector SVG output | 0% | Planned |
| **Sprint 4** | High-Res Raster | 300 DPI PNG/JPG flat dieline renders | 0% | Planned |
| **Overall** | **Entire System** | **Complete No-Registration Web Editor** | **~25%** | **Phase 1 Done** |

---

## 4. Technical Challenges & Mitigations

1. **Polygon Clipping on Canvas:**
   - *Challenge:* Uploaded artwork must stay visually bounded within non-rectangular panels (e.g., tapered flaps, triangular dust flaps).
   - *Mitigation:* Fabric.js supports `clipPath` on canvas objects. In Sprint 2, the exact polygon points calculated in the dieline engine will be assigned as the `clipPath` of any object added to that panel.

2. **Physical Scale Fidelity on PDF Export:**
   - *Challenge:* Exported PDFs must match real-world millimeter dimensions exactly for physical carton die-cutting.
   - *Mitigation:* The dieline engine operates with mm as the ground truth. When outputting via `jsPDF`, coordinates will be mapped directly using `pt` or `mm` units without canvas pixel distortion.

3. **Performance with Large Graphic Assets:**
   - *Challenge:* High-resolution images uploaded by users could cause canvas redraw lag during pan and zoom interactions.
   - *Mitigation:* Separate the rendering of background dieline vectors and active artwork objects. Use Fabric.js object caching (`objectCaching: true`) to retain 60 FPS viewport interaction.

---

## 5. Immediate Next Steps

1. Initiate **Sprint 2 development**:
   - Create the image upload handler and tie dropped images to the active panel ID.
   - Implement the panel polygon clip path system.
   - Add the text tool palette with basic typography controls.
