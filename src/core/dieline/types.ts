export type LineType = 'cut' | 'crease' | 'bleed' | 'guide';

export type MeasurementUnit = 'mm' | 'in';

export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: LineType;
  label?: string;
}

export interface PanelFace {
  id: string;
  name: string;
  polygon: Point[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: Point;
  isLid?: boolean;
  isBase?: boolean;
  isFlap?: boolean;
}

export interface PackagingDimensions {
  length: number;    // L (depth of box or height of pouch)
  width: number;     // W (horizontal face width)
  depth: number;     // D (box height/thickness or pouch bottom expansion)
  thickness: number; // t (material caliper/thickness in mm)
  unit: MeasurementUnit;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'takeout' | 'pouches' | 'containers';
  description: string;
  defaultDimensions: PackagingDimensions;
  minDimensions: {
    length: number;
    width: number;
    depth: number;
    thickness: number;
  };
  maxDimensions: {
    length: number;
    width: number;
    depth: number;
    thickness: number;
  };
  generateDieline: (dims: PackagingDimensions) => DielineResult;
}

export interface DielineResult {
  templateId: string;
  templateName: string;
  dimensions: PackagingDimensions;
  lines: LineSegment[];
  panels: PanelFace[];
  totalBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}
