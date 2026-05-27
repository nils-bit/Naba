import type { RawDesignTokens } from '../types/crawl-result';
import type { DesignSystem, NamedColor, DesignFont } from '../types/design-system';

/**
 * Parse an rgb/rgba string into { r, g, b, a } (0-255 for r,g,b; 0-1 for a).
 */
function parseColor(value: string): { r: number; g: number; b: number; a: number } | null {
  const rgbaMatch = value.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/,
  );
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) =>
        Math.round(c)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/**
 * Calculate perceived lightness (0-100).
 */
function lightness(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 2.55;
}

/**
 * Calculate saturation (0-100).
 */
function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return 0;
  return ((max - min) / max) * 100;
}

/**
 * Simple color distance (Euclidean in RGB space).
 */
function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

/**
 * Cluster colors that are visually similar (distance < threshold).
 */
function clusterColors(
  colors: { value: string; count: number; contexts: string[] }[],
  threshold = 30,
): { hex: string; count: number; contexts: string[] }[] {
  const clusters: { hex: string; rgb: { r: number; g: number; b: number }; count: number; contexts: string[] }[] =
    [];

  for (const entry of colors) {
    const parsed = parseColor(entry.value);
    if (!parsed || parsed.a < 0.1) continue; // Skip fully transparent

    const hex = rgbToHex(parsed.r, parsed.g, parsed.b);

    // Find closest existing cluster
    let merged = false;
    for (const cluster of clusters) {
      if (colorDistance(parsed, cluster.rgb) < threshold) {
        // Merge into existing cluster (keep the more frequent one's hex)
        if (entry.count > cluster.count) {
          cluster.hex = hex;
          cluster.rgb = parsed;
        }
        cluster.count += entry.count;
        cluster.contexts.push(...entry.contexts);
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({
        hex,
        rgb: parsed,
        count: entry.count,
        contexts: [...entry.contexts],
      });
    }
  }

  return clusters.sort((a, b) => b.count - a.count);
}

/**
 * Assign semantic roles to colors.
 */
function assignColorRoles(
  clustered: { hex: string; count: number; contexts: string[] }[],
): NamedColor[] {
  const named: NamedColor[] = [];
  const used = new Set<string>();

  // Find background color (most used bg: context, light color)
  const bgCandidate = clustered.find((c) => {
    const parsed = parseColor(`#${c.hex.slice(1)}`) || parseColor(c.hex);
    // Try to parse hex
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const l = lightness(r, g, b);
    return l > 85 && c.contexts.some((ctx) => ctx.startsWith('bg:'));
  });

  if (bgCandidate) {
    named.push({ name: 'background', label: 'Background', value: bgCandidate.hex, usage: ['background'] });
    used.add(bgCandidate.hex);
  }

  // Find primary text color (most used text: context, dark color)
  const textCandidate = clustered.find((c) => {
    if (used.has(c.hex)) return false;
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const l = lightness(r, g, b);
    return l < 30 && c.contexts.some((ctx) => ctx.startsWith('text:'));
  });

  if (textCandidate) {
    named.push({ name: 'text_primary', label: 'Text Primary', value: textCandidate.hex, usage: ['text'] });
    used.add(textCandidate.hex);
  }

  // Find primary/accent color (most saturated non-gray color)
  const accentCandidate = clustered.find((c) => {
    if (used.has(c.hex)) return false;
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const sat = saturation(r, g, b);
    return sat > 30;
  });

  if (accentCandidate) {
    named.push({ name: 'primary', label: 'Primary', value: accentCandidate.hex, usage: ['accent', 'buttons'] });
    used.add(accentCandidate.hex);
  }

  // Find secondary color (second most saturated)
  const secondaryCandidate = clustered.find((c) => {
    if (used.has(c.hex)) return false;
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const sat = saturation(r, g, b);
    return sat > 20;
  });

  if (secondaryCandidate) {
    named.push({ name: 'secondary', label: 'Secondary', value: secondaryCandidate.hex, usage: ['secondary'] });
    used.add(secondaryCandidate.hex);
  }

  // Fill in defaults if roles are missing
  if (!named.find((c) => c.name === 'background')) {
    named.push({ name: 'background', label: 'Background', value: '#ffffff', usage: ['background'] });
  }
  if (!named.find((c) => c.name === 'text_primary')) {
    named.push({ name: 'text_primary', label: 'Text Primary', value: '#1a1a1a', usage: ['text'] });
  }
  if (!named.find((c) => c.name === 'primary')) {
    named.push({ name: 'primary', label: 'Primary', value: '#2563eb', usage: ['accent'] });
  }
  if (!named.find((c) => c.name === 'secondary')) {
    named.push({ name: 'secondary', label: 'Secondary', value: '#64748b', usage: ['secondary'] });
  }

  // Add a light gray for sections
  const lightGray = clustered.find((c) => {
    if (used.has(c.hex)) return false;
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const l = lightness(r, g, b);
    const sat = saturation(r, g, b);
    return l > 85 && l < 98 && sat < 15;
  });

  named.push({
    name: 'surface',
    label: 'Surface',
    value: lightGray?.hex || '#f8fafc',
    usage: ['section-bg'],
  });

  return named;
}

/**
 * Build a curated design system from raw extracted tokens.
 */
export function buildDesignSystem(tokens: RawDesignTokens): DesignSystem {
  // Colors
  const clusteredColors = clusterColors(tokens.colors);
  const colors = assignColorRoles(clusteredColors);

  // Fonts — pick top 2 families
  const fonts: DesignFont[] = [];
  const topFamilies = tokens.fontFamilies.slice(0, 3);

  if (topFamilies.length > 0) {
    const bodyFamily = topFamilies[0];
    const headingFamily = topFamilies.length > 1 ? topFamilies[1] : topFamilies[0];

    // Get related font sizes for each role
    const allSizes = tokens.fontSizes.map((s) => s.value);

    fonts.push({
      role: 'heading',
      family: cleanFontFamily(headingFamily.value),
      fallback: 'sans-serif',
      weights: extractWeights(tokens.fontWeights),
      sizes: allSizes.filter((s) => parseInt(s) >= 20).slice(0, 5),
      isGoogle: isGoogleFont(headingFamily.value),
    });

    fonts.push({
      role: 'body',
      family: cleanFontFamily(bodyFamily.value),
      fallback: 'sans-serif',
      weights: extractWeights(tokens.fontWeights),
      sizes: allSizes.filter((s) => parseInt(s) < 20).slice(0, 5),
      isGoogle: isGoogleFont(bodyFamily.value),
    });
  } else {
    // Defaults
    fonts.push(
      {
        role: 'heading',
        family: 'Inter',
        fallback: 'sans-serif',
        weights: [400, 600, 700],
        sizes: ['32px', '28px', '24px', '20px'],
        isGoogle: true,
      },
      {
        role: 'body',
        family: 'Inter',
        fallback: 'sans-serif',
        weights: [400, 500],
        sizes: ['16px', '14px', '18px'],
        isGoogle: true,
      },
    );
  }

  // Spacing scale — extract common values, round to nice numbers
  const spacingValues = tokens.spacings
    .map((s) => parseInt(s.value))
    .filter((v) => v > 0 && v < 200);
  const uniqueSpacing = [...new Set(spacingValues)]
    .map((v) => Math.round(v / 4) * 4) // Round to nearest 4px
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b)
    .slice(0, 10);

  // Border radius
  const radiusValues = tokens.borderRadii
    .map((r) => r.value)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);

  // Shadows
  const shadowValues = tokens.shadows
    .map((s) => s.value)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3);

  return {
    colors,
    fonts,
    spacing: {
      unit: 'px',
      values: uniqueSpacing.length > 0 ? uniqueSpacing : [4, 8, 16, 24, 32, 48, 64],
    },
    borderRadius: {
      values: radiusValues.length > 0 ? radiusValues : ['4px', '8px'],
    },
    shadows: shadowValues,
    breakpoints: [
      { name: 'mobile', minWidth: 0, maxWidth: 767 },
      { name: 'tablet', minWidth: 768, maxWidth: 1023 },
      { name: 'desktop', minWidth: 1024 },
    ],
  };
}

function cleanFontFamily(raw: string): string {
  // Take the first family name, strip quotes
  return raw.split(',')[0].trim().replace(/["']/g, '');
}

function isGoogleFont(family: string): boolean {
  const clean = cleanFontFamily(family).toLowerCase();
  const systemFonts = [
    'arial',
    'helvetica',
    'times new roman',
    'times',
    'courier new',
    'courier',
    'georgia',
    'verdana',
    'system-ui',
    '-apple-system',
    'blinkmacsystemfont',
    'segoe ui',
    'roboto',
  ];
  return !systemFonts.includes(clean);
}

function extractWeights(weightEntries: { value: string; count: number }[]): number[] {
  const weights = weightEntries
    .map((w) => parseInt(w.value))
    .filter((w) => w > 0 && w <= 900);
  const unique = [...new Set(weights)].sort((a, b) => a - b);
  return unique.length > 0 ? unique : [400, 600, 700];
}
