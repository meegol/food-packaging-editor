# Food Packaging Editor

A web-based 2D packaging dieline generator and branding editor built for an undergraduate thesis project.

## About

This tool helps small food businesses and creators design custom packaging without expensive CAD software or design subscriptions. Users can generate 2D packaging nets by entering dimensions (length, width, depth, material thickness), place artwork/branding on specific box panels, and export print-ready files (PDF, SVG, PNG)—completely client-side with no account needed.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Canvas:** Fabric.js
- **Storage:** IndexedDB / LocalStorage
- **Export:** jsPDF, JsBarcode, QRCode

## Planned Sprints

- **Sprint 1:** Core dieline generator (Burger Box, Pizza Box, Stand-up Pouch) and interactive 2D canvas.
- **Sprint 2:** Graphic editor tools (image uploads, text controls, nutrition/ingredient presets, food compliance icons, barcodes/QR).
- **Sprint 3:** Session saving (IndexedDB auto-save and JSON project save/load).
- **Sprint 4:** Print exports (cut/crease layered PDF, SVG, 300 DPI PNG).

## Development

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build for production
npm run build
```
