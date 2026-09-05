export type GraphicItemType = 'image' | 'text' | 'icon' | 'barcode' | 'qrcode';

export interface GraphicItem {
  id: string;
  panelId: string;
  type: GraphicItemType;
  
  // Image & vector sources (data URLs or SVG strings)
  src?: string;
  fileName?: string;

  // Typography engine properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;

  // Code generator properties
  barcodeFormat?: 'CODE128' | 'EAN13' | 'UPC';
  barcodeValue?: string;
  qrContent?: string;

  // Spatial & transformation metrics
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  clipToPanel: boolean;
}
