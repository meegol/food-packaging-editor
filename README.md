# Food Packaging Editor

A client-side 2D dieline generator and packaging layout editor developed for undergraduate thesis research.

The project allows users (such as food entrepreneurs, small bakeries, and cloud kitchens) to calculate and preview parametric packaging nets directly in the browser. Users adjust package dimensions (length, width, depth, and board caliper), inspect structural panels, and preview cut and fold lines without needing desktop CAD software or software licenses.

## Architecture & Tech Stack

- **Framework:** React 18 with TypeScript and Vite
- **2D Canvas Renderer:** Fabric.js (HTML5 Canvas)
- **Barcodes & QR Codes:** JsBarcode, QRCode
- **Icons:** Lucide React
- **Styling:** CSS Custom Properties (Theme tokens)
- **Local Persistence:** LocalStorage & IndexedDB (High-Capacity Asset Store)
- **Print Pipeline:** jsPDF (1:1 CAD PDF), Layered SVG, High-DPI 300/600 DPI Raster proofs

## Project Structure

```
src/
├── components/
│   ├── canvas/          # Canvas viewport, zoom controls, dieline legend
│   ├── export/          # Production Export Suite Modal (PDF, SVG, 300 DPI, BOM)
│   ├── layout/          # Top navigation header, theme picker, draft recovery banner
│   ├── preview/         # 360° 3D assembled preview studio, turntable, proof cards
│   └── sidebar/         # Template picker, dimensions, typography, compliance icons, barcode/QR generator
├── core/
│   ├── canvas/          # Fabric.js dieline canvas wrapper and multi-type graphic clipping engine
│   ├── dieline/         # 12 parametric dieline math generators
│   ├── export/          # 1:1 CAD PDF, grouped SVG, 300 DPI raster proof, and spec sheet BOM calculators
│   ├── graphics/        # Graphic element data models and typing
│   ├── preview/         # 3D projection math and polygon affine mapping
│   └── storage/         # IndexedDB & localStorage draft autosave and project JSON I/O
└── styles/              # Global reset, typography, and 6 software industry theme tokens
```

## Running Locally

Requires Node.js 18+ and npm:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check and build production bundle
npm run build
```

## Roadmap & Sprints

- **Sprint 1: Parametric Dieline Engine & Interactive Canvas** *(Completed)*
  - Mathematical net generation for all 12 packaging templates.
  - Dimension controls with real-time recalculation and mm/inch conversion.
  - Interactive canvas with viewport panning, mouse-wheel zoom, layer toggling, and panel focus.
  - 360° photorealistic 3D assembled preview with turntable rotation and all-sides proof cards.
- **Sprint 2: Graphic & Branding Editor** *(Completed)*
  - Drag-and-drop image uploads directly onto 2D net, 3D faces, or proof cards with strict polygon clipping.
  - Typography engine with font selection, formatting controls, and quick food label presets.
  - Standard food compliance and recycling vector icon library (12 presets).
  - Dynamic 1D Barcode (EAN-13, UPC-A, Code 128) and 2D QR code generator.
  - Unified layer stack with reordering and polygon clip toggling.
- **Sprint 3: Session Persistence & File I/O** *(Completed)*
  - Guest session draft recovery via LocalStorage and high-capacity IndexedDB.
  - Portable JSON project export and import.
  - 6 authentic software industry color themes (GitHub Dark/Light, Nord, Catppuccin Mocha, Shadcn Zinc, Warm Kraft).
- **Sprint 4: Print & Vector Production Exports** *(Completed)*
  - 1:1 Scale Vector CAD PDF export with FEFCO/ECMA solid red cut (`#ef4444`) and dashed green crease (`#22c55e`) lines.
  - Grouped, layer-separated CAD SVG export for Adobe Illustrator and CNC cutting tables (Zünd, Kongsberg, ESKO).
  - High-resolution 150/300/600 DPI raster flat dieline proof rendering.
  - Page 2 Technical Packaging Spec Sheet & Bill of Materials (BOM) with Shoelace surface area calculation and substrate recommendations.
