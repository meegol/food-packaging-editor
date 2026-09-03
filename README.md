# Food Packaging Editor

A client-side 2D dieline generator and packaging layout editor developed for undergraduate thesis research.

The project allows users (such as food entrepreneurs, small bakeries, and cloud kitchens) to calculate and preview parametric packaging nets directly in the browser. Users adjust package dimensions (length, width, depth, and board caliper), inspect structural panels, and preview cut and fold lines without needing desktop CAD software or software licenses.

## Architecture & Tech Stack

- **Framework:** React 18 with TypeScript and Vite
- **2D Canvas Renderer:** Fabric.js (HTML5 Canvas)
- **Barcodes & QR Codes:** JsBarcode, QRCode
- **Icons:** Lucide React
- **Styling:** CSS Custom Properties (Theme tokens)
- **Local Persistence (Upcoming Sprint 3):** LocalStorage & IndexedDB
- **Print Pipeline (Upcoming Sprint 4):** jsPDF, SVG DOM export, Canvas high-DPI rasterization

## Project Structure

```
src/
├── components/
│   ├── canvas/          # Canvas viewport, zoom controls, dieline legend
│   ├── layout/          # Top navigation header and main sidebar
│   └── sidebar/         # Template picker, dimensions, typography, compliance icons, barcode/QR generator
├── core/
│   ├── canvas/          # Fabric.js dieline canvas wrapper and multi-type graphic clipping engine
│   ├── dieline/         # Parametric dieline math generators (Burger Box, Pizza Box, Pouch)
│   └── graphics/        # Graphic element data models and typing
└── styles/              # Global reset, typography, and theme tokens
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
  - Mathematical net generation for Burger Clamshell, Pizza Box (Roll-End Tuck Top), and Stand-up Pouch.
  - Dimension controls with real-time recalculation and mm/inch conversion.
  - Interactive canvas with viewport panning, mouse-wheel zoom, layer toggling, and panel focus.
- **Sprint 2: Graphic & Branding Editor** *(Completed)*
  - Image/logo uploads with panel boundary clipping.
  - Typography engine with font selection, formatting controls, and quick food label presets.
  - Standard food compliance and recycling vector icon library (12 presets).
  - Dynamic 1D Barcode (EAN-13, UPC-A, Code 128) and 2D QR code generator.
  - Unified layer stack with reordering and polygon clip toggling.
- **Sprint 3: Session Persistence & File I/O** *(Next Priority)*
  - Guest session draft recovery via LocalStorage / IndexedDB.
  - Portable JSON project export and import.
- **Sprint 4: Print & Vector Exports**
  - Layer-separated PDF and SVG export (Cut lines, Crease lines, Artwork layer).
  - High-resolution 300 DPI image rendering.
