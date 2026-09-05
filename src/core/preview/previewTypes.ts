export type ViewAngle = 'isometric' | 'front' | 'top' | 'side';

export type MaterialFinish = 'kraft' | 'white' | 'dark' | 'cream';

export type StudioLighting = 'dark' | 'light' | 'transparent';

export interface ProjectedGraphic {
  id: string;
  type: 'image' | 'text' | 'icon' | 'barcode' | 'qrcode';
  src?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // Transform in face coordinate system (normalized 0..1 or localized mm)
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // in degrees
  clipToFace?: boolean;
}

export interface AssembledFaceData {
  id: string;
  name: string;
  panelId: string;
  
  // 4 corner vertices for quadrilateral projection in 2D SVG canvas [p0, p1, p2, p3]
  // Ordered: Top-Left, Top-Right, Bottom-Right, Bottom-Left
  points: { x: number; y: number }[];
  
  // Lighting factor: 1.0 = normal, 1.15 = highlighted top face, 0.85 = shaded side face, 0.7 = dark side
  lighting: number;
  
  // Optional SVG path string if the face is not a strict quad (e.g., curved front scoop or pillow)
  pathD?: string;
  
  // User graphics mapped onto this face
  graphics: ProjectedGraphic[];
}

export interface AssembledModelResult {
  templateId: string;
  viewAngle: ViewAngle;
  width: number;
  height: number;
  faces: AssembledFaceData[];
  
  // Ground shadow parameters
  shadow: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    opacity: number;
  };
  
  // Extra template-specific elements (e.g. French fries inside scoop, macarons inside sleeve, bread slices inside bread bag)
  decorations?: React.ReactNode;
}

export interface PreviewSettings {
  viewAngle: ViewAngle;
  material: MaterialFinish;
  lighting: StudioLighting;
  openness: number; // 0 (closed) to 1 (fully open/extended)
  showShadow: boolean;
  zoom: number;
}
