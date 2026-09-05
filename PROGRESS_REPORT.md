# Thesis Engineering Progress Report: Web-Based 2D Food Packaging Editor

**Project Title:** Development of a Digital Food Packaging Editing System for Cost-Effective Product Branding  
**Target Platform:** Web (Desktop & Tablet / Mobile-responsive)  
**Overall Completion:** 100% (Sprint 1: 100%, Sprint 2: 100%, Sprint 3: 100%, Sprint 4: 100% — All Sprints Completed)  
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
   - **Burger Clamshell Box (`burgerBox.ts`):** Calculates the base tray, tapered side walls with nesting draft angles, corner dust flaps, rear hinge wall, and a top lid with front tuck flap.
   - **Sandwich Wedge Box (`sandwichWedgeBox.ts`):** Triangular prism carton with vertical back spine, triangular sidewalls, and front slanted face with display window cutout.
   - **Pillow Packaging Box (`pillowBox.ts`):** Curved-crease packaging with parabolic inward score lines, outward cut flaps with thumb notches, and side glue tab.
   - **French Fries Scoop Box (`friesScoopBox.ts`):** Fast-food scoop carton with concave front curve, high arched back support wall, and interlocking fold-in base.
   - **Dessert Window Sleeve Box (`dessertSleeveBox.ts`):** Two-piece design with sliding outer window sleeve and inner collapsible serving tray.
   - **Round Food Tub with Lid (`roundFoodTub.ts`):** Conical frustum unwrapped body sector net, bottom base disc, circular lid top, and outer rim skirt.
   - **Pizza Box (`pizzaBox.ts`):** Standard Roll-End Tuck Top (REFT) corrugated net with double-layer roll-over sidewalls and locking tabs.
   - **Stand-up Ziplock Pouch (`standUpPouch.ts`):** Flexible pouch net with bottom expansion gusset, tear notches, and heat seal borders.
   - **Side Gusset Coffee/Cookie Bag (`sideGussetBag.ts`):** Accordion side gussets with V-creases, front window cutout, tin-tie header, and block-bottom envelope fold.
   - **Single-Serve Sachet Stick Pack (`sachetStickPack.ts`):** Slender stick pouch with fin seal seam, top & bottom heat seals, and tear notches.
   - **Burger & Food Wrapper Sheet (`burgerWrapper.ts`):** Greaseproof deli paper wrapping sheet with central burger target zone, diagonal corner fold guides, and margin bleeds.
   - **Sliced Bread Loaf Bag (`breadLoafBag.ts`):** Wicketed side-gusseted poly bag with top gathered twist-tie / bread clip fold indicator, clear bread crust window, and bottom heat-seal band.

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
8. **Per-Side Packaging Studio & Direct Canvas Drop Pipeline:**
   - **Direct Canvas Drag-and-Drop:** Native file drop handling directly over the 2D packaging dieline, automatically calculating ray-cast point-in-polygon coordinates to anchor artwork to the specific panel under the mouse cursor.
   - **Active Face Action Bar:** Floating contextual action pill on the canvas providing 1-click `+ Text`, `+ Image`, and `Focus` tools for the selected face.
   - **Face Studio Drawer (`PanelList.tsx`):** Face-by-face management featuring per-face asset count badges, direct upload inputs, and element chips with visibility and deletion controls.
   - **Side Reassignment & Flap Rotation:** Live panel reassignment dropdown and 0°/90°/180°/270° flap orientation rotation presets for typography and placed brand assets.
9. **2D Assembled Packaging Preview & Multi-View Studio (`AssembledPreview.tsx`, `assembledBoxModels.ts`, `graphicProjection.ts`):**
   - **Comprehensive 12-Template 2D Assembled Models:** Photorealistic 2D perspective / isometric projections of the assembled packaging products for all 12 parametric templates.
   - **Real-Time Artwork Projection:** Maps placed brand logos, typography, barcodes, and icons from flat net panels onto visible assembled 3D perspective faces with affine transforms and clipping.
   - **Tri-Mode Viewport Switcher:** Instant toggling between `Flat Net`, `2D Assembled`, and side-by-side `Split View` with automatic canvas re-fitting.
   - **Interactive Studio Controls:** Angle presets (`3/4 Hero`, `Front`, `Top`, `Side`), realistic material finishes (`Clay-Coated White`, `Kraft Cardboard`, `Midnight Dark`), studio lighting backdrops, and openness/extension sliders (hinged clamshell open/close, sliding pastry trays).
   - **High-Resolution Mockup Export:** Direct one-click export of 2400×1800 PNG mockups with soft ground shadows and SVG vector downloads.
### Sprint 3: Session Persistence & Portable Project Files
- **Status:** Completed (100%)
- **Objective:** Enable reliable client-side saving and loading so users never lose work upon accidental browser refreshes, completely eliminating backend account requirements, while supporting professional software design themes.

#### Implemented Deliverables:
1. **Local Browser Draft Auto-Save (`projectStorage.ts`):**
   - Background serialization of active canvas state, selected template, dimensional parameters, and placed graphics with 600ms debounce.
   - Header autosave indicator displaying real-time saving status (pulsing amber indicator) and saved state (green indicator).
2. **Draft Recovery Alert (`DraftRecoveryBanner.tsx`):**
   - Startup detection of unsaved drafts displaying an alert banner with time-ago indicators, allowing 1-click restore or dismissal.
3. **High-Capacity IndexedDB Asset Storage (`indexedDbStorage.ts`):**
   - Client-side IndexedDB persistence layer storing full-resolution user image uploads and textures, eliminating browser `localStorage` 5MB quota errors.
4. **Portable JSON Project File Schema & I/O (`projectStorage.ts`):**
   - **Export:** Instant one-click generation and download of formatted `.json` project files (`{template}-design-{date}.json`).
   - **Import:** File parsing with strict schema validation restoring template, dimensions, graphics, and theme.
5. **Authentic Software Industry Color Palettes (`themeDefinitions.ts`, `theme.css`, `ThemePicker.tsx`):
   - Interactive header theme selector offering 6 industry-standard software themes:
     - **Dark Themes:** GitHub Dark, Nord, Catppuccin Mocha.
     - **Light Themes:** GitHub Light, Shadcn Zinc, Warm Kraft Paper.
   - Dynamic canvas background, grid, and panel highlight adaptation with persistent local preference.

---

### Sprint 4: Print & Vector Production Exports
- **Status:** Completed (100%)
- **Objective:** Convert the digital canvas layout into standard print-ready formats required by commercial printing, packaging die-makers, and prepress houses.

#### Implemented Architecture & Deliverables:
1. **1:1 Scale Vector CAD PDF Export (`dielinePdfExport.ts`):**
   - Generation of PDF documents formatted at true physical scale (1:1 millimeter scale) using `jsPDF`.
   - Distinct color-coded vector paths conforming to FEFCO / ECMA international packaging conventions:
     - **Cut Lines Layer:** Solid red stroke (`#ef4444`, 0.5 mm / ~1.4 pt) for laser-cut steel rule dies and digital knife cutters.
     - **Crease Lines Layer:** Dashed green stroke (`#22c55e`, 0.35 mm, `[2, 1.5]` dash) for matrix creasing and folding wheels.
     - **Artwork Layer:** Placed high-fidelity branding, typography, vector barcodes, and compliance marks.
     - **Dimension Callouts & Annotations:** Width, height, depth callouts, and panel ID watermarks.
     - **Optical Registration Marks:** 4-corner printer target crosshairs for die-cutting alignment.
     - **Engineering Title Block & Legend:** Standard technical block detailing template ID, dimensions, line conventions, and timestamp.
2. **Technical Packaging Spec Sheet & Bill of Materials (BOM) (`specSheetCalculator.ts`):**
   - Integrated as Page 2 of the production CAD PDF and viewable live in the UI.
   - Computes:
     - Flat blank cutting envelope (`W × H mm`).
     - Net carton surface area (`cm²` and `mm²`) via Shoelace polygon formula.
     - Nesting area efficiency percentage (yield ratio).
     - Linear cut and crease rule perimeters in meters.
     - Substrate grade and caliper recommendations (FBB, SBS, Barrier film, Kraft).
     - Estimated carton blank weight in grams (based on 320 GSM board).
     - Full regulatory compliance standards (FDA 21 CFR 176.170 / EU 1935/2004).
3. **Layer-Separated CAD SVG Export (`dielineSvgExport.ts`):**
   - Standalone XML/SVG formatted in physical millimeters with grouped layer IDs:
     - `<g id="cut-lines">`, `<g id="crease-lines">`, `<g id="artwork">`, `<g id="dimensions">`, `<g id="registration-marks">`.
   - Directly compatible with Adobe Illustrator, CorelDRAW, and CNC digital cutters (Zünd, Kongsberg, ESKO).
4. **High-Resolution Raster Proofs (150, 300, 600 DPI) (`dielineRasterExport.ts`):**
   - Offscreen high-DPI rasterization producing crisp 300 DPI commercial print proofs (PNG transparent or JPEG white) for client sign-off.
5. **Unified Production Export Suite Modal (`ExportModal.tsx`):**
   - Integrated modal accessible from the Header with live tabbed configuration, layer toggles, real-time BOM preview, and one-click downloads.

---

## 3. Current Progress Summary Table

| Sprint | Module / Capability | Target Deliverable | Completion | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Sprint 1** | Parametric Engine | 12 packaging templates (Burger, Pizza, Pouch, etc.) | 100% | Completed |
| **Sprint 1** | Dimensional Controls | $L, W, D, t$ sliders, inputs, mm/in toggle | 100% | Completed |
| **Sprint 1** | Interactive Canvas | Fabric.js viewport, pan/zoom, layer toggles | 100% | Completed |
| **Sprint 1** | 3D Assembled Preview | 360° turntable 3D view, studio lighting, proof cards | 100% | Completed |
| **Sprint 2** | Media Uploads | Drag-and-drop logos onto 2D, 3D, and proof cards | 100% | Completed |
| **Sprint 2** | Panel Clipping | Strict face boundary clipping on 2D, 3D, & proof cards | 100% | Completed |
| **Sprint 2** | Text Engine | Custom typography, fonts, alignment, color | 100% | Completed |
| **Sprint 2** | Asset Presets | Food compliance symbols & certification badges | 100% | Completed |
| **Sprint 2** | Code Generator | Dynamic vector Barcode (EAN-13, Code 128) & QR codes | 100% | Completed |
| **Sprint 3** | Persistence | LocalStorage draft auto-save & recovery banner | 100% | Completed |
| **Sprint 3** | IndexedDB Storage | High-capacity persistence for large image assets | 100% | Completed |
| **Sprint 3** | Project Files | Portable `.json` export and import parser | 100% | Completed |
| **Sprint 3** | Themes | 6 Industry color schemes & Theme Picker | 100% | Completed |
| **Sprint 4** | Vector CAD PDF | 1:1 Scale FEFCO/ECMA red cut & green crease PDF | 100% | Completed |
| **Sprint 4** | Technical BOM | Page 2 engineering spec sheet & surface area metrics | 100% | Completed |
| **Sprint 4** | Layered SVG Export | Grouped CAD SVG for Illustrator & CNC cutters | 100% | Completed |
| **Sprint 4** | High-Res Raster | 150/300/600 DPI flat dieline renders (PNG/JPG) | 100% | Completed |
| **Overall** | **Entire System** | **Complete No-Registration Packaging CAD Web Editor** | **100%** | **Completed** |ess** |

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
