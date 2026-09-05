import { TemplateDefinition, PackagingDimensions, DielineResult } from './types';
import { generateBurgerBoxDieline } from './burgerBox';
import { generatePizzaBoxDieline } from './pizzaBox';
import { generateStandUpPouchDieline } from './standUpPouch';
import { generateSandwichWedgeBoxDieline } from './sandwichWedgeBox';
import { generatePillowBoxDieline } from './pillowBox';
import { generateFriesScoopBoxDieline } from './friesScoopBox';
import { generateDessertSleeveBoxDieline } from './dessertSleeveBox';
import { generateRoundFoodTubDieline } from './roundFoodTub';
import { generateSachetStickPackDieline } from './sachetStickPack';
import { generateSideGussetBagDieline } from './sideGussetBag';
import { generateBurgerWrapperDieline } from './burgerWrapper';
import { generateBreadLoafBagDieline } from './breadLoafBag';

export * from './types';
export { generateBurgerBoxDieline } from './burgerBox';
export { generatePizzaBoxDieline } from './pizzaBox';
export { generateStandUpPouchDieline } from './standUpPouch';
export { generateSandwichWedgeBoxDieline } from './sandwichWedgeBox';
export { generatePillowBoxDieline } from './pillowBox';
export { generateFriesScoopBoxDieline } from './friesScoopBox';
export { generateDessertSleeveBoxDieline } from './dessertSleeveBox';
export { generateRoundFoodTubDieline } from './roundFoodTub';
export { generateSachetStickPackDieline } from './sachetStickPack';
export { generateSideGussetBagDieline } from './sideGussetBag';
export { generateBurgerWrapperDieline } from './burgerWrapper';
export { generateBreadLoafBagDieline } from './breadLoafBag';

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'burger-box',
    name: 'Burger Clamshell Box',
    category: 'takeout',
    description: 'Classic interlocking burger clamshell with rear hinge and closure lock flap.',
    defaultDimensions: {
      length: 120,
      width: 120,
      depth: 70,
      thickness: 1.2,
      unit: 'mm',
    },
    minDimensions: { length: 80, width: 80, depth: 40, thickness: 0.5 },
    maxDimensions: { length: 250, width: 250, depth: 150, thickness: 3.0 },
    generateDieline: generateBurgerBoxDieline,
  },
  {
    id: 'sandwich-wedge-box',
    name: 'Sandwich Wedge Box',
    category: 'takeout',
    description: 'Triangular prism carton with slanted front window face for gourmet cut sandwiches.',
    defaultDimensions: {
      length: 120,
      width: 75,
      depth: 120,
      thickness: 0.8,
      unit: 'mm',
    },
    minDimensions: { length: 80, width: 50, depth: 80, thickness: 0.4 },
    maxDimensions: { length: 200, width: 130, depth: 200, thickness: 2.0 },
    generateDieline: generateSandwichWedgeBoxDieline,
  },
  {
    id: 'fries-scoop-box',
    name: 'French Fries Scoop Box',
    category: 'takeout',
    description: 'Tapered fast-food scoop carton with concave curved front and high arched back.',
    defaultDimensions: {
      length: 50,
      width: 85,
      depth: 135,
      thickness: 0.8,
      unit: 'mm',
    },
    minDimensions: { length: 30, width: 60, depth: 90, thickness: 0.4 },
    maxDimensions: { length: 90, width: 140, depth: 200, thickness: 2.0 },
    generateDieline: generateFriesScoopBoxDieline,
  },
  {
    id: 'pillow-box',
    name: 'Pillow Packaging Box',
    category: 'bakery',
    description: 'Convex pillow box with curved-crease ends for bakery pies, pastries, and treats.',
    defaultDimensions: {
      length: 150,
      width: 95,
      depth: 35,
      thickness: 0.7,
      unit: 'mm',
    },
    minDimensions: { length: 80, width: 60, depth: 20, thickness: 0.3 },
    maxDimensions: { length: 300, width: 200, depth: 80, thickness: 2.0 },
    generateDieline: generatePillowBoxDieline,
  },
  {
    id: 'dessert-sleeve-box',
    name: 'Dessert Window Sleeve Box',
    category: 'containers',
    description: 'Panoramic sliding window sleeve and collapsible inner serving tray for pastries.',
    defaultDimensions: {
      length: 180,
      width: 90,
      depth: 45,
      thickness: 1.2,
      unit: 'mm',
    },
    minDimensions: { length: 100, width: 60, depth: 30, thickness: 0.6 },
    maxDimensions: { length: 350, width: 180, depth: 90, thickness: 2.5 },
    generateDieline: generateDessertSleeveBoxDieline,
  },
  {
    id: 'round-food-tub',
    name: 'Round Food Tub with Lid',
    category: 'containers',
    description: 'Conical tapered tub body with bottom base disc and circular lid with skirt.',
    defaultDimensions: {
      length: 90,
      width: 115,
      depth: 85,
      thickness: 0.6,
      unit: 'mm',
    },
    minDimensions: { length: 60, width: 75, depth: 50, thickness: 0.3 },
    maxDimensions: { length: 180, width: 220, depth: 160, thickness: 1.8 },
    generateDieline: generateRoundFoodTubDieline,
  },
  {
    id: 'pizza-box',
    name: 'Pizza Box (Roll-End Tuck Top)',
    category: 'containers',
    description: 'Roll-end tuck top corrugated box with double-layer sidewalls and locking lid.',
    defaultDimensions: {
      length: 250,
      width: 250,
      depth: 45,
      thickness: 1.8,
      unit: 'mm',
    },
    minDimensions: { length: 150, width: 150, depth: 30, thickness: 1.0 },
    maxDimensions: { length: 500, width: 500, depth: 90, thickness: 4.0 },
    generateDieline: generatePizzaBoxDieline,
  },
  {
    id: 'standup-pouch',
    name: 'Stand-up Ziplock Pouch',
    category: 'pouches',
    description: 'Flexible food pouch with bottom expansion gusset, zipper track, and heat seal borders.',
    defaultDimensions: {
      length: 200,
      width: 130,
      depth: 60,
      thickness: 0.2,
      unit: 'mm',
    },
    minDimensions: { length: 100, width: 80, depth: 30, thickness: 0.1 },
    maxDimensions: { length: 350, width: 250, depth: 120, thickness: 0.5 },
    generateDieline: generateStandUpPouchDieline,
  },
  {
    id: 'side-gusset-bag',
    name: 'Side Gusset Coffee/Cookie Bag',
    category: 'pouches',
    description: 'Stand-up gusseted bag with clear product window, fin seal back, and block bottom.',
    defaultDimensions: {
      length: 220,
      width: 95,
      depth: 60,
      thickness: 0.2,
      unit: 'mm',
    },
    minDimensions: { length: 120, width: 60, depth: 30, thickness: 0.1 },
    maxDimensions: { length: 400, width: 180, depth: 120, thickness: 0.5 },
    generateDieline: generateSideGussetBagDieline,
  },
  {
    id: 'sachet-stick-pack',
    name: 'Single-Serve Sachet Stick Pack',
    category: 'pouches',
    description: 'Slender single-portion stick pouch with fin seal, heat seals, and tear notches.',
    defaultDimensions: {
      length: 130,
      width: 35,
      depth: 8,
      thickness: 0.15,
      unit: 'mm',
    },
    minDimensions: { length: 70, width: 25, depth: 5, thickness: 0.08 },
    maxDimensions: { length: 220, width: 65, depth: 15, thickness: 0.4 },
    generateDieline: generateSachetStickPackDieline,
  },
  {
    id: 'burger-wrapper',
    name: 'Burger & Food Wrapper Sheet',
    category: 'wrappers',
    description: 'Greaseproof packaging sheet with central burger target zone and folding guides.',
    defaultDimensions: {
      length: 300,
      width: 300,
      depth: 130,
      thickness: 0.05,
      unit: 'mm',
    },
    minDimensions: { length: 180, width: 180, depth: 80, thickness: 0.03 },
    maxDimensions: { length: 500, width: 500, depth: 250, thickness: 0.15 },
    generateDieline: generateBurgerWrapperDieline,
  },
  {
    id: 'bread-loaf-bag',
    name: 'Sliced Bread Loaf Bag',
    category: 'bakery',
    description: 'Wicketed side-gusseted poly bag with gathered twist-tie lip and clear loaf window.',
    defaultDimensions: {
      length: 320,
      width: 120,
      depth: 110,
      thickness: 0.04,
      unit: 'mm',
    },
    minDimensions: { length: 180, width: 80, depth: 60, thickness: 0.02 },
    maxDimensions: { length: 500, width: 220, depth: 180, thickness: 0.1 },
    generateDieline: generateBreadLoafBagDieline,
  },
];

export function getTemplateById(id: string): TemplateDefinition {
  const found = TEMPLATES.find(t => t.id === id);
  return found || TEMPLATES[0];
}

export function generateDieline(templateId: string, dimensions: PackagingDimensions): DielineResult {
  const template = getTemplateById(templateId);
  return template.generateDieline(dimensions);
}
