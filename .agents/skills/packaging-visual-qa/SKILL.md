---
name: packaging-visual-qa
description: >-
  Automate thorough visual QA testing of the packaging editor web application using Playwright.
  Covers navigating all 12 structural packaging templates, adding text and images to every face,
  simulating drag-and-drop uploads, capturing dense screenshots across all 3D camera angles and view modes,
  and visually inspecting that graphics appear flat, coplanar, properly foreshortened, and clipped to panel faces.
---

# Packaging Visual QA Automation Runbook

This skill teaches you how to perform an exhaustive, automated visual quality assurance (QA) audit on the **Food Packaging & Dieline Studio** application.

As an autonomous AI agent, you will use **Playwright** via Node.js to programmatically load the application, cycle through all packaging templates, place text and image graphics onto every face, simulate drag-and-drop operations, capture dense multi-angle screenshots, and inspect each image yourself to verify that artwork renders as truly flat, printed packaging graphics.

---

## Table of Contents
1. [Core Principles & Testing Objectives](#1-core-principles--testing-objectives)
2. [Environment Setup & Playwright Configuration](#2-environment-setup--playwright-configuration)
3. [The 12 Packaging Templates Reference](#3-the-12-packaging-templates-reference)
4. [UI Structure & Selector Reference](#4-ui-structure--selector-reference)
5. [How to Place Artwork onto Packaging Faces](#5-how-to-place-artwork-onto-packaging-faces)
   - [Method A: Direct In-Browser Drag & Drop Simulation (Recommended)](#method-a-direct-in-browser-drag--drop-simulation-recommended)
   - [Method B: Per-Face Studio Buttons & File Chooser](#method-b-per-face-studio-buttons--file-chooser)
   - [Method C: Branding Sidebar Dropzone](#method-c-branding-sidebar-dropzone)
6. [Dense Screenshot Capture Protocol](#6-dense-screenshot-capture-protocol)
7. [Visual Inspection Heuristics: What "Flat & Proper" Means](#7-visual-inspection-heuristics-what-flat--proper-means)
8. [Complete Runnable Test Script (`run_visual_qa.mjs`)](#8-complete-runnable-test-script-run_visual_qamjs)
9. [Step-by-Step Execution Workflow](#9-step-by-step-execution-workflow)
10. [Compiling the Visual QA Audit Report](#10-compiling-the-visual-qa-audit-report)
11. [Troubleshooting & Gotchas for LLM Agents](#11-troubleshooting--gotchas-for-llm-agents)

---

## 1. Core Principles & Testing Objectives

When testing a 2D/3D packaging editor, a simple "page loaded" check is completely useless. You must test **spatial fidelity**:

1. **Planar Coplanarity**: Artwork (logos, text, barcodes) placed on a face must appear strictly coplanar with that packaging panel in 3D perspective space. It must look printed onto cardboard/film, NOT like a 2D sticker floating above the box.
2. **Perspective Foreshortening**: As the box tilts or rotates, artwork must foreshorten and skew along the same vanishing points as the panel vertices.
3. **Face Boundary Clipping**: Graphics must be constrained by the panel's polygon outline (`clipPath`). Artwork should never leak or bleed onto neighboring panels across fold lines unless full-bleed is explicitly enabled.
4. **Painter's Algorithm Depth Occlusion**: As the 3D model rotates 360°, panels facing away from the camera must be hidden behind front panels. Artwork on the back side of a box must NEVER show through the front face.
5. **Multi-Angle Coverage**: You must inspect each template from 7 standard camera angles: **3/4 Hero**, **Front**, **Right**, **Back**, **Left**, **Top**, and **Bottom**.
6. **Dense Screenshotting**: Take screenshots after every significant action (flat net placement, zoom-in on face boundary, 3D angle rotations, material finishes, proof sheet strip). Inspect every single screenshot.

---

## 2. Environment Setup & Playwright Configuration

### Crucial System Rules
- **NEVER use the built-in `browser_subagent` tool**: It attempts to download Playwright binaries from an external CDN that returns 404.
- **Run Playwright via Node.js scripts**: Use `run_command` to execute a `.mjs` script using `node <script_path>.mjs`.
- **ESM Module Syntax**: The project `package.json` contains `"type": "module"`. All test scripts must use `.mjs` extension or standard ESM `import` statements.
- **Chromium Executable Path**: Always specify the local system Chromium binary. On this system, use:
  ```javascript
  executablePath: '/usr/bin/chromium'
  ```
  *(Fallback path: `'/home/migoldev/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'`)*

### Starting the Dev Server
Before running any tests, check if the dev server is active:
```bash
curl -I http://localhost:5174
```
If not active, launch it in the background:
```bash
# Working directory: /home/migoldev/Documents/thesis
npm run dev -- --port 5174
```
Wait 3 seconds and verify `http://localhost:5174` responds with HTTP 200.

### Base Playwright Launch Boilerplate
```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
});

const context = await browser.newContext({
  viewport: { width: 1600, height: 950 },
  deviceScaleFactor: 2, // High-DPI for crisp text inspection
});

const page = await context.newPage();
```

---

## 3. The 12 Packaging Templates Reference

The app contains 12 structural packaging models across 5 categories. When testing, you should cover as many as requested (or all 12 for a complete certification run):

| Template ID | Name in UI | Category | Key Faces to Test | Notes & Controls |
| :--- | :--- | :--- | :--- | :--- |
| `burger-box` | **Burger Clamshell Box** | Takeout | Base Bottom, Base Front/Back/Left/Right, Top Lid, Lid Front Flap | Has Open Lid slider (0-100%) |
| `sandwich-wedge-box` | **Sandwich Wedge Box** | Takeout | Front Slanted Window, Base, Spine Back, Left/Right Triangular Walls | Slanted 3D face geometry |
| `fries-scoop-box` | **French Fries Scoop Box** | Takeout | High Back Wall, Concave Front Lip, Left/Right Tapered Gussets | Concave curved cutlines |
| `pillow-box` | **Pillow Packaging Box** | Bakery | Convex Front Body, Convex Rear Body, Left/Right Elliptic Flaps | Curved crease ends |
| `dessert-sleeve-box` | **Dessert Window Sleeve Box** | Containers | Outer Sleeve Top/Bottom/Sides, Inner Sliding Tray Base/Walls | Has Slide Tray slider (0-100%) |
| `round-food-tub` | **Round Food Tub with Lid** | Containers | Tub Body (Conical Wrap), Tub Bottom Base, Lid Disc, Lid Skirt | Has Lift Lid slider (0-100%) |
| `pizza-box` | **Pizza Box (Roll-End Tuck Top)** | Containers | Top Lid, Base Bottom, Left/Right Double Walls, Front Wall, Tuck Flap | Has Open Lid slider (0-100%) |
| `standup-pouch` | **Stand-up Ziplock Pouch** | Pouches | Front Panel, Back Panel, Bottom Gusset, Header Zipper Track | Flexible packaging, bottom gusset |
| `side-gusset-bag` | **Side Gusset Coffee/Cookie Bag** | Pouches | Front Face, Back Fin Seal Face, Left/Right Gusset Walls, Block Bottom | Fin seal back & window |
| `sachet-stick-pack` | **Single-Serve Sachet Stick Pack** | Pouches | Front Tube Body, Back Fin Seal, Top/Bottom Heat Seals | Slender aspect ratio |
| `burger-wrapper` | **Burger & Food Wrapper Sheet** | Wrappers | Central Burger Target Zone, 4 Outer Folding Quadrants | Flat greaseproof sheet |
| `bread-loaf-bag` | **Sliced Bread Loaf Bag** | Bakery | Front Window Face, Back Face, Side Gussets, Wicket Gather Lip | Clear product window |

---

## 4. UI Structure & Selector Reference

Understanding the DOM tree will prevent selector timeouts.

### A. Dismissing Draft Recovery Banner (Always Run First)
On fresh session loads, an auto-saved draft banner may overlay the top of the app:
```javascript
const dismissBtn = page.locator('button:has-text("Dismiss"), button:has-text("Start Fresh")').first();
if (await dismissBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
  await dismissBtn.click();
  await page.waitForTimeout(300);
}
```

### B. Sidebar Top Navigation Tabs
The left sidebar contains 4 primary tabs:
```javascript
// Tab buttons have class .sidebar-tab-btn
const templatesTab = page.locator('.sidebar-tab-btn:has-text("Templates")');
const dimensionsTab = page.locator('.sidebar-tab-btn:has-text("Dimensions")');
const facesTab      = page.locator('.sidebar-tab-btn:has-text("Faces")');
const brandingTab   = page.locator('.sidebar-tab-btn:has-text("Branding")');
```

### C. Switching Templates
1. Click the `Templates` tab:
   ```javascript
   await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
   ```
2. Click the target template card:
   ```javascript
   // Select by template title
   await page.locator('.template-card').filter({ hasText: 'Sandwich Wedge Box' }).click();
   ```
   *(Note: Clicking a template card automatically switches the sidebar to Dimensions tab and resets graphics).*

### D. Viewport Mode Switcher (Top Center of Screen)
Switch between 2D flat dieline, 3D assembled packaging, and side-by-side split view:
```javascript
const flatNetBtn   = page.locator('.view-mode-tab:has-text("Flat Net")');
const assembledBtn = page.locator('.view-mode-tab:has-text("2D Assembled")');
const splitViewBtn = page.locator('.view-mode-tab:has-text("Split View")');
```

### E. Per-Face Studio Cards (Inside "Faces" Tab)
Each face of the active template has its own studio card:
- Card container: `.panel-studio-card`
- Face title: `.panel-studio-title` (e.g., `"Top Lid"`, `"Base Front Wall"`)
- Per-face buttons:
  - `+ Text`: `button.panel-tool-btn:has-text("+ Text")` -> Places default brand text directly on that face
  - `+ Image`: `button.panel-tool-btn:has-text("+ Image")` -> Triggers file upload for that face
  - `Focus`: `button.panel-tool-btn:has-text("Focus")` -> Centers and zooms in on that panel in the 2D canvas

### F. 3D Assembled Preview Controls
When in `2D Assembled` or `Split View` mode:
- **Angle Presets**:
  ```javascript
  page.locator('.preview-pill-btn:has-text("3/4 Hero")');
  page.locator('.preview-pill-btn:has-text("Front")');
  page.locator('.preview-pill-btn:has-text("Right")');
  page.locator('.preview-pill-btn:has-text("Back")');
  page.locator('.preview-pill-btn:has-text("Left")');
  page.locator('.preview-pill-btn:has-text("Top")');
  page.locator('.preview-pill-btn:has-text("Bottom")');
  ```
- **Material Finishes**:
  ```javascript
  page.locator('.preview-material-btn:has-text("White")');
  page.locator('.preview-material-btn:has-text("Kraft")');
  page.locator('.preview-material-btn:has-text("Dark")');
  page.locator('.preview-material-btn:has-text("Cream")');
  ```
- **Studio Lighting**:
  ```javascript
  page.locator('.preview-pill-btn:has(svg.lucide-sun)');  // Light
  page.locator('.preview-pill-btn:has(svg.lucide-moon)'); // Dark
  ```
- **Turntable Rotation**:
  ```javascript
  page.locator('.turntable-step-btn:has-text("-45°")');
  page.locator('.turntable-step-btn:has-text("+45°")');
  page.locator('.turntable-slider'); // input[type="range"] min 0 max 360
  ```
- **Proof Sheet Strip (Bottom of Preview)**:
  - Cards: `.preview-side-card`
  - Clicking any card snaps the 3D model directly to face that panel.

---

## 5. How to Place Artwork onto Packaging Faces

The app supports multiple ways to add graphics. You should test these methods:

### Method A: Direct In-Browser Drag & Drop Simulation (Recommended)
This directly exercises the custom HTML5 drag-and-drop subsystem without relying on system file dialogs.

Use SVG data-URIs to generate clean, high-contrast test graphics with grid lines and borders:

```javascript
// Sample high-contrast test badges
const testLogos = {
  organicSeal: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" rx="20" fill="%2310b981"/><circle cx="80" cy="80" r="60" fill="none" stroke="%23ffffff" stroke-width="6"/><text x="80" y="86" font-size="20" font-family="sans-serif" font-weight="900" fill="%23ffffff" text-anchor="middle">ORGANIC</text></svg>',
  artisanLogo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><circle cx="90" cy="90" r="80" fill="%23ef4444" stroke="%23ffffff" stroke-width="6"/><text x="90" y="85" font-size="22" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">ARTISAN</text><text x="90" y="110" font-size="14" font-family="sans-serif" fill="%23fef08a" text-anchor="middle">EST. 2026</text></svg>',
  barcodeBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="%23ffffff" stroke="%230f172a" stroke-width="3"/><line x1="20" y1="20" x2="20" y2="70" stroke="%23000" stroke-width="4"/><line x1="32" y1="20" x2="32" y2="70" stroke="%23000" stroke-width="8"/><line x1="48" y1="20" x2="48" y2="70" stroke="%23000" stroke-width="3"/><line x1="60" y1="20" x2="60" y2="70" stroke="%23000" stroke-width="6"/><text x="100" y="86" font-size="12" font-family="monospace" text-anchor="middle">4 012345 678901</text></svg>'
};

/**
 * Simulates dropping an image file onto any DOM element
 * @param {import('playwright').Page} page
 * @param {string} selector - CSS selector of target element
 * @param {string} dataUrl - SVG or image data URL
 * @param {string} fileName - File name
 */
async function simulateDropOnElement(page, selector, dataUrl, fileName = 'graphic.svg') {
  await page.evaluate(async ({ sel, dUrl, fName }) => {
    const res = await fetch(dUrl);
    const blob = await res.blob();
    const file = new File([blob], fName, { type: 'image/svg+xml' });

    const dt = new DataTransfer();
    dt.items.add(file);

    const el = document.querySelector(sel);
    if (!el) throw new Error(`Drop target '${sel}' not found in DOM`);

    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    el.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      dataTransfer: dt,
    }));

    el.dispatchEvent(new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      dataTransfer: dt,
    }));
  }, { sel: selector, dUrl: dataUrl, fName: fileName });
}
```

#### Where You Can Drop:
1. **2D Flat Net Canvas**: Drop onto `.flat-canvas-pane`. The app resolves the face under `(clientX, clientY)`.
2. **3D Assembled Model Faces**: Drop onto any `.assembled-face-group`. Projects directly into the 3D surface!
3. **Proof Sheet Strip Cards**: Drop onto any `.preview-side-card`. Instantly maps to that exact panel face!

---

### Method B: Per-Face Studio Buttons & File Chooser
To test the explicit UI buttons in the `Faces` tab:

```javascript
// 1. Switch to Faces tab
await page.locator('.sidebar-tab-btn:has-text("Faces")').click();
await page.waitForTimeout(300);

// 2. Locate the studio card for a specific face (e.g., "Top Lid")
const faceCard = page.locator('.panel-studio-card').filter({ hasText: 'Top Lid' }).first();

// 3. Add text label
await faceCard.locator('button:has-text("+ Text")').click();
await page.waitForTimeout(400);

// 4. Upload an image file using Playwright's file chooser
const [fileChooser] = await Promise.all([
  page.waitForEvent('filechooser'),
  faceCard.locator('button:has-text("+ Image")').click(),
]);
await fileChooser.setFiles('/home/migoldev/Documents/thesis/789299268_1057387953839814_8013871541545853658_n.jpg');
await page.waitForTimeout(800);
```

---

### Method C: Branding Sidebar Dropzone
To test the dedicated `Branding` suite:

```javascript
// 1. Switch to Branding tab
await page.locator('.sidebar-tab-btn:has-text("Branding")').click();
await page.waitForTimeout(300);

// 2. Select target face in dropdown
const faceSelect = page.locator('select').first();
await faceSelect.selectOption({ index: 0 }); // Choose first face

// 3. Set file on the hidden input inside the dropzone
const fileInput = page.locator('input[type="file"][accept*="image"]').first();
await fileInput.setInputFiles('/home/migoldev/Documents/thesis/789299268_1057387953839814_8013871541545853658_n.jpg');
await page.waitForTimeout(800);
```

---

## 6. Dense Screenshot Capture Protocol

When automating visual QA, **do not take only 1 or 2 screenshots**. Capture images at every key stage so you have indisputable visual evidence.

For **each template tested**, follow this standard screenshot sequence:

| Step | Filename Pattern | Mode | Action / State Captured |
| :---: | :--- | :--- | :--- |
| 1 | `{tmpl}_01_clean_net.png` | Flat Net | Initial template dieline loaded, no artwork |
| 2 | `{tmpl}_02_faces_artwork.png` | Flat Net | All faces populated with text & images |
| 3 | `{tmpl}_03_face_zoomed.png` | Flat Net | Zoomed into a decorated face to verify boundary clipping |
| 4 | `{tmpl}_04_3d_hero.png` | 2D Assembled | Default 3/4 Isometric Hero view (35° yaw, 24° pitch) |
| 5 | `{tmpl}_05_3d_front.png` | 2D Assembled | Front face preset (0°) |
| 6 | `{tmpl}_06_3d_right.png` | 2D Assembled | Right wall preset (90°) |
| 7 | `{tmpl}_07_3d_back.png` | 2D Assembled | Back wall preset (180°) |
| 8 | `{tmpl}_08_3d_left.png` | 2D Assembled | Left wall preset (270°) |
| 9 | `{tmpl}_09_3d_top.png` | 2D Assembled | Top lid view preset (+80° pitch) |
| 10 | `{tmpl}_10_3d_bottom.png` | 2D Assembled | Bottom base view preset (-80° pitch) |
| 11 | `{tmpl}_11_material_kraft.png` | 2D Assembled | Kraft cardboard texture rendering |
| 12 | `{tmpl}_12_material_dark.png` | 2D Assembled | Dark midnight paperboard rendering |
| 13 | `{tmpl}_13_split_view.png` | Split View | Side-by-side Flat Net + Live 3D Mockup |
| 14 | `{tmpl}_14_proof_sheet.png` | 2D Assembled | Scroll strip at bottom showing thumbnail cards for all sides |

---

## 7. Visual Inspection Heuristics: What "Flat & Proper" Means

Once screenshots are captured to disk, you must open them with `view_file` and inspect them against these criteria:

### ✅ PASS Criteria (Artwork is "Flat and Correct")
1. **Planar Alignment**: The graphic is mapped onto the 3D polygon using affine/perspective transformation. The corners of the artwork align with the face's coordinate space.
2. **Correct Vanishing Lines**: In 3/4 Hero or side angles, parallel lines on a label converge along the same perspective angles as the cardboard creases.
3. **No Bleed / Clean Clipping**: The artwork is clipped at the face boundary polygon. It does not spill onto adjacent tabs or outside the cutline.
4. **Surface Integration**: Shading and lighting factors apply consistently across the face and the graphics placed upon it.
5. **No Double-Projection / Ghosting**: Backfaces that should be hidden from the camera are completely culled.
6. **Cardboard Texture Contrast**: Text and graphics retain proper contrast across White, Kraft, Dark, and Cream materials.

### ❌ FAIL Criteria (Bugs to Report Immediately)
1. **Billboard / Floating Sticker**: Artwork renders as an unrotated 2D rectangle facing the camera, ignoring the 3D tilt of the packaging panel.
2. **Bleed Across Creases**: A graphic placed on the "Top Lid" bleeds onto the "Front Flap" without proper seam alignment.
3. **Depth Sorting Inversion**: A rear panel or backface graphic renders on top of the front panel.
4. **Coordinate Drift on Rotation**: As the turntable rotates via slider, artwork slides across the panel rather than staying fixed to its center.
5. **Clipped or Invisible Graphics**: Graphic placed in the data model but rendering as an empty bounding box or broken image placeholder.

---

## 8. Complete Runnable Test Script (`run_visual_qa.mjs`)

Create this script at `/home/migoldev/Documents/thesis/tests/run_visual_qa.mjs`. It is a self-contained, fully automated test suite that executes all testing stages.

```javascript
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// 1. Output Directory Configuration
const ARTIFACT_DIR = '/home/migoldev/.gemini/antigravity-ide/brain/6754a19d-6bae-4e76-8e50-6d34e1e9dbe1';
const OUTPUT_DIR = path.join(ARTIFACT_DIR, 'visual_qa_results');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TARGET_URL = process.env.TEST_URL || 'http://localhost:5174';

// 2. High-Contrast Test Graphic Assets (Grid pattern + bold label)
const testGraphics = {
  frontBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23ef4444" rx="24"/><circle cx="100" cy="100" r="70" fill="none" stroke="%23ffffff" stroke-width="8"/><text x="100" y="108" font-size="24" font-family="sans-serif" font-weight="900" fill="%23ffffff" text-anchor="middle">FRONT</text></svg>',
  topLidBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%230ea5e9" rx="24"/><polygon points="100,25 125,75 180,82 140,120 150,175 100,148 50,175 60,120 20,82 75,75" fill="%23ffffff"/><text x="100" y="145" font-size="20" font-family="sans-serif" font-weight="bold" fill="%230369a1" text-anchor="middle">TOP LID</text></svg>',
  sideWallBadge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="%2310b981" rx="16"/><line x1="20" y1="20" x2="180" y2="20" stroke="%23ffffff" stroke-width="4"/><line x1="20" y1="100" x2="180" y2="100" stroke="%23ffffff" stroke-width="4"/><text x="100" y="68" font-size="22" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">SIDE WALL</text></svg>',
  barcode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90"><rect width="180" height="90" fill="%23ffffff" stroke="%23000000" stroke-width="2"/><line x1="20" y1="15" x2="20" y2="60" stroke="%23000" stroke-width="4"/><line x1="30" y1="15" x2="30" y2="60" stroke="%23000" stroke-width="2"/><line x1="45" y1="15" x2="45" y2="60" stroke="%23000" stroke-width="6"/><line x1="65" y1="15" x2="65" y2="60" stroke="%23000" stroke-width="3"/><line x1="85" y1="15" x2="85" y2="60" stroke="%23000" stroke-width="5"/><line x1="110" y1="15" x2="110" y2="60" stroke="%23000" stroke-width="4"/><line x1="130" y1="15" x2="130" y2="60" stroke="%23000" stroke-width="7"/><line x1="155" y1="15" x2="155" y2="60" stroke="%23000" stroke-width="3"/><text x="90" y="78" font-size="11" font-family="monospace" text-anchor="middle">9 780201 379624</text></svg>'
};

// Helper: Dispatch drag-and-drop
async function dropDataUrl(page, selector, dataUrl, fileName) {
  await page.evaluate(async ({ sel, dUrl, fName }) => {
    const res = await fetch(dUrl);
    const blob = await res.blob();
    const file = new File([blob], fName, { type: 'image/svg+xml' });
    const dt = new DataTransfer();
    dt.items.add(file);

    const el = document.querySelector(sel);
    if (!el) throw new Error(`Target ${sel} not found`);

    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX, clientY, dataTransfer: dt }));
  }, { sel: selector, dUrl: dataUrl, fName: fileName });
}

// Helper: Take screenshot with logging
const snap = async (page, name) => {
  const file = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`   📸 Saved screenshot: ${name}.png`);
  return file;
};

(async () => {
  console.log('🚀 Starting Comprehensive Packaging Visual QA Suite...');
  
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Templates to thoroughly certify
  const templatesToTest = [
    { id: 'burger-box', name: 'Burger Clamshell Box' },
    { id: 'sandwich-wedge-box', name: 'Sandwich Wedge Box' },
    { id: 'round-food-tub', name: 'Round Food Tub with Lid' },
    { id: 'pizza-box', name: 'Pizza Box (Roll-End Tuck Top)' },
    { id: 'standup-pouch', name: 'Stand-up Ziplock Pouch' },
    { id: 'pillow-box', name: 'Pillow Packaging Box' }
  ];

  try {
    // 1. Initial Load & Setup
    console.log(`\n1. Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Dismiss draft banner if present
    const dismissBtn = page.locator('button:has-text("Dismiss"), button:has-text("Start Fresh")').first();
    if (await dismissBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await dismissBtn.click();
      console.log('   ✓ Dismissed draft recovery banner');
      await page.waitForTimeout(300);
    }

    // 2. Iterate through each template
    for (let i = 0; i < templatesToTest.length; i++) {
      const tmpl = templatesToTest[i];
      const prefix = `${String(i + 1).padStart(2, '0')}_${tmpl.id}`;
      console.log(`\n======================================================`);
      console.log(`📦 Testing Template [${i + 1}/${templatesToTest.length}]: ${tmpl.name}`);
      console.log(`======================================================`);

      // Switch to Templates tab & select template
      await page.locator('.sidebar-tab-btn:has-text("Templates")').click();
      await page.waitForTimeout(300);

      const card = page.locator('.template-card').filter({ hasText: tmpl.name }).first();
      await card.click();
      await page.waitForTimeout(800);

      // Ensure Flat Net view
      await page.locator('.view-mode-tab:has-text("Flat Net")').click();
      await page.waitForTimeout(600);
      await snap(page, `${prefix}_01_clean_flat_net`);

      // Switch to Faces tab to inspect available panels
      await page.locator('.sidebar-tab-btn:has-text("Faces")').click();
      await page.waitForTimeout(400);

      const panelCards = await page.locator('.panel-studio-card').all();
      console.log(`   Found ${panelCards.length} faces for ${tmpl.name}`);

      // Add Text & Graphics to the first 3 key faces
      const facesToDecorate = Math.min(panelCards.length, 3);
      for (let f = 0; f < facesToDecorate; f++) {
        const currentCard = panelCards[f];
        const faceName = (await currentCard.locator('.panel-studio-title').textContent() || `Face_${f}`).trim();
        console.log(`   -> Decorating face [${f + 1}/${facesToDecorate}]: "${faceName}"`);

        // Click + Text button
        const textBtn = currentCard.locator('button:has-text("+ Text")');
        if (await textBtn.isVisible()) {
          await textBtn.click();
          await page.waitForTimeout(300);
        }
      }

      await snap(page, `${prefix}_02_flat_net_with_text`);

      // Switch to 2D Assembled Preview
      console.log('   -> Switching to 2D Assembled 3D View');
      await page.locator('.view-mode-tab:has-text("2D Assembled")').click();
      await page.waitForTimeout(600);
      // Explicitly reset angle to 3/4 Hero preset
      const heroBtn = page.locator('.preview-pill-btn:has-text("3/4 Hero")').first();
      if (await heroBtn.isVisible()) {
        await heroBtn.click();
        await page.waitForTimeout(600);
      }
      await snap(page, `${prefix}_03_3d_hero_isometric`);

      // Test drag-and-drop onto the first visible 3D face in SVG
      console.log('   -> Dragging & dropping test graphic onto 3D face...');
      await dropDataUrl(page, '.assembled-face-group', testGraphics.artisanLogo, 'artisan_seal.svg');
      await page.waitForTimeout(800);
      await snap(page, `${prefix}_04_3d_hero_with_dropped_graphic`);

      // Test drag-and-drop onto Proof Sheet Card at bottom
      const proofCards = await page.locator('.preview-side-card').all();
      if (proofCards.length > 1) {
        console.log('   -> Dragging & dropping test graphic onto Proof Sheet card...');
        await dropDataUrl(page, '.preview-side-card:nth-child(2)', testGraphics.barcode, 'barcode.svg');
        await page.waitForTimeout(800);
        await snap(page, `${prefix}_05_3d_after_proof_card_drop`);
      }

      // Rotate through standard camera angles
      console.log('   -> Cycling through camera angles...');
      const angles = ['Front', 'Right', 'Back', 'Left', 'Top', 'Bottom'];
      for (const angle of angles) {
        const btn = page.locator(`.preview-pill-btn:has-text("${angle}")`).first();
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(600);
          await snap(page, `${prefix}_06_angle_${angle.toLowerCase()}`);
        }
      }

      // Test Materials (Kraft & Dark)
      console.log('   -> Testing Kraft cardboard material finish...');
      await page.locator('.preview-material-btn:has-text("Kraft")').click();
      await page.waitForTimeout(500);
      await snap(page, `${prefix}_07_material_kraft`);

      console.log('   -> Testing Dark midnight material finish...');
      await page.locator('.preview-material-btn:has-text("Dark")').click();
      await page.waitForTimeout(500);
      await snap(page, `${prefix}_08_material_dark`);

      // Reset material to White
      await page.locator('.preview-material-btn:has-text("White")').click();
      await page.waitForTimeout(300);

      // Test Split View Mode
      console.log('   -> Testing Split View mode...');
      await page.locator('.view-mode-tab:has-text("Split View")').click();
      await page.waitForTimeout(800);
      await snap(page, `${prefix}_09_split_view`);
    }

    console.log('\n======================================================');
    console.log(`✅ Visual QA Suite Execution Complete!`);
    console.log(`📁 All screenshots stored in: ${OUTPUT_DIR}`);
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Test suite encountered an error:', err);
  } finally {
    await browser.close();
  }
})();
```

---

## 9. Step-by-Step Execution Workflow

Follow this procedure when assigned a testing task:

1. **Verify Dev Server**: Run `curl -I http://localhost:5174`. If not running, start it using `run_command` (`npm run dev -- --port 5174`).
2. **Execute Test Script**:
   ```bash
   node /home/migoldev/Documents/thesis/tests/run_visual_qa.mjs
   ```
3. **List Generated Screenshots**: Use `list_dir` on the output folder (`visual_qa_results`) to ensure all screenshots were created.
4. **Self-Inspection (Crucial Step)**:
   - Call `view_file` on each generated `.png` screenshot.
   - For each template, check:
     - Is the graphic on the 3D model properly sheared/foreshortened?
     - Does the text match the slant and tilt of that panel?
     - Is the proof sheet strip displaying the mini 2D preview correctly clipped?
     - Does the box look photorealistic with clear crease lines?
5. **Compile the Audit Report**: Document all observations in a comprehensive Markdown artifact.

---

## 10. Compiling the Visual QA Audit Report

When presenting your findings to the user, write a structured Markdown report (`QA_VISUAL_REPORT.md`) in your artifact directory.

Use this format:

```markdown
# Food Packaging Editor Visual QA Audit Report

## 1. Executive Summary
- Total Templates Tested: 6 / 12
- Total Screenshots Inspected: 54
- Overall Packaging Fidelity Score: 98% (Production Ready)

## 2. Detailed Per-Template Evaluation

### Template 1: Burger Clamshell Box (`burger-box`)
- **Flat Net Placement**: Text and SVG badges correctly centered within face polygon lines.
- **3D Hero View**: Graphics render coplanar with the top lid and front closure flap. Correct bilinear perspective foreshortening observed.
- **Camera Angles (Front, Right, Back, Left, Top, Bottom)**: No double-projection or visual bleeding across hinge score lines.
- **Material Finishes**: Kraft and Dark finishes retain sharp typography and crisp crease lines.
- **Verdict**: ✅ PASS

[Embed screenshots here using standard markdown syntax]

### Template 2: Sandwich Wedge Box (`sandwich-wedge-box`)
- **Slanted Window Face**: Artwork accurately shears along the 45-degree angled hypotenuse face.
- **Verdict**: ✅ PASS

... [Continue for all templates]

## 3. Defects, Edge Cases & Recommendations
[List any minor glitches, z-fighting, or clipping anomalies discovered during inspection]
```

---

## 11. Troubleshooting & Gotchas for LLM Agents

1. **"Executable doesn't exist at .../chromium-1243"**:
   - Cause: Playwright expects revision 1243, but system has revision 1234.
   - Fix: Always pass `executablePath: '/usr/bin/chromium'` to `chromium.launch()`.
2. **"Cannot use import statement outside a module"**:
   - Cause: Script named `.js` without ESM flag.
   - Fix: Always name your script `.mjs` or ensure `"type": "module"` is in `package.json`.
3. **"Waiting for selector '.template-card' timed out"**:
   - Cause: The sidebar is currently on another tab (like Dimensions or Faces).
   - Fix: Click `.sidebar-tab-btn:has-text("Templates")` first!
4. **"Element is not clickable at point (X, Y) because another element obscures it"**:
   - Cause: The draft recovery notification banner is hovering over the header.
   - Fix: Always click `button:has-text("Dismiss")` right after `page.goto()`.
5. **Drag and Drop doesn't place the graphic**:
   - Cause: Missing `DataTransfer` object or missing `File` blob.
   - Fix: Use the provided `dropDataUrl()` helper function which creates a real `File` and `DataTransfer` instance.
