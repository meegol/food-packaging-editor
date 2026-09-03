export interface GraphicItem {
  id: string;
  panelId: string;
  type: 'image';
  src: string;
  fileName: string;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  clipToPanel: boolean;
}
