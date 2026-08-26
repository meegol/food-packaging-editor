import { TemplateDefinition, PackagingDimensions, DielineResult } from './types';
import { generateBurgerBoxDieline } from './burgerBox';
import { generatePizzaBoxDieline } from './pizzaBox';
import { generateStandUpPouchDieline } from './standUpPouch';

export * from './types';
export { generateBurgerBoxDieline } from './burgerBox';
export { generatePizzaBoxDieline } from './pizzaBox';
export { generateStandUpPouchDieline } from './standUpPouch';

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
];

export function getTemplateById(id: string): TemplateDefinition {
  const found = TEMPLATES.find(t => t.id === id);
  return found || TEMPLATES[0];
}

export function generateDieline(templateId: string, dimensions: PackagingDimensions): DielineResult {
  const template = getTemplateById(templateId);
  return template.generateDieline(dimensions);
}
