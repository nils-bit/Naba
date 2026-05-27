export interface DesignSystem {
  colors: NamedColor[];
  fonts: DesignFont[];
  spacing: SpacingScale;
  borderRadius: RadiusScale;
  shadows: string[];
  breakpoints: Breakpoint[];
}

export interface NamedColor {
  name: string;
  label: string;
  value: string;
  usage: string[];
}

export interface DesignFont {
  role: 'heading' | 'body';
  family: string;
  fallback: string;
  weights: number[];
  sizes: string[];
  isGoogle: boolean;
}

export interface SpacingScale {
  unit: string;
  values: number[];
}

export interface RadiusScale {
  values: string[];
}

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}
