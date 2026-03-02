export interface CrawlResult {
  url: string;
  title: string;
  meta: PageMeta;
  designTokens: RawDesignTokens;
  components: DetectedComponent[];
  assets: AssetReference[];
  fonts: FontReference[];
}

export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
  favicon?: string;
  lang: string;
}

export interface RawDesignTokens {
  colors: TokenEntry[];
  fontFamilies: TokenEntry[];
  fontSizes: TokenEntry[];
  fontWeights: TokenEntry[];
  spacings: TokenEntry[];
  borderRadii: TokenEntry[];
  shadows: TokenEntry[];
}

export interface TokenEntry {
  value: string;
  count: number;
  contexts: string[];
}

export type ComponentType =
  | 'header'
  | 'hero'
  | 'text-block'
  | 'text-image'
  | 'card-grid'
  | 'stats'
  | 'cta-banner'
  | 'testimonial'
  | 'gallery'
  | 'form'
  | 'newsletter'
  | 'footer'
  | 'generic-section';

export interface DetectedComponent {
  type: ComponentType;
  selector: string;
  tagName: string;
  className: string;
  outerHTML: string;
  computedStyles: Record<string, string>;
  textContent: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  images: AssetReference[];
  links: { href: string; text: string }[];
  buttons: { text: string; href?: string }[];
  boundingBox: BoundingBox;
  childCount: number;
  hasBackgroundImage: boolean;
  backgroundImageUrl?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AssetReference {
  url: string;
  type: 'image' | 'font' | 'video' | 'favicon' | 'og-image';
  alt?: string;
  width?: number;
  height?: number;
  localPath?: string;
}

export interface FontReference {
  family: string;
  weights: number[];
  isGoogle: boolean;
  url?: string;
}

export interface CrawlOptions {
  timeout?: number;
  waitForNetworkIdle?: boolean;
  viewports?: { width: number; height: number }[];
}
