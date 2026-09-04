export type ElementType = 'text' | 'rect' | 'circle' | 'image';
export type AssetSource = 'platform' | 'licensed' | 'user' | 'ai';

export interface CoverElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill?: string;
  opacity?: number;
  assetSource?: AssetSource;
  
  // Text props
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  
  // Image props
  src?: string;
}

export interface KdpConfig {
  format: 'paperback' | 'hardcover';
  trimWidth: number;
  trimHeight: number;
  pageCount: number;
  bleed: number;
  paperType: 'white' | 'cream';
}

export interface CoverState {
  config: KdpConfig;
  elements: CoverElement[];
}
