import type { Page } from 'playwright';
import type { RawDesignTokens } from '../../types/crawl-result';

export async function extractDesignTokens(page: Page): Promise<RawDesignTokens> {
  return page.evaluate(() => {
    const colors = new Map<string, { count: number; contexts: string[] }>();
    const fontFamilies = new Map<string, { count: number; contexts: string[] }>();
    const fontSizes = new Map<string, { count: number; contexts: string[] }>();
    const fontWeights = new Map<string, { count: number; contexts: string[] }>();
    const spacings = new Map<string, { count: number; contexts: string[] }>();
    const borderRadii = new Map<string, { count: number; contexts: string[] }>();
    const shadows = new Map<string, { count: number; contexts: string[] }>();

    const addToken = (
      map: Map<string, { count: number; contexts: string[] }>,
      value: string,
      context: string,
    ) => {
      if (!value || value === 'none' || value === 'normal' || value === 'auto') return;
      const existing = map.get(value);
      if (existing) {
        existing.count++;
        if (!existing.contexts.includes(context) && existing.contexts.length < 5) {
          existing.contexts.push(context);
        }
      } else {
        map.set(value, { count: 1, contexts: [context] });
      }
    }

    const describeElement = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.')
        : '';
      return `${tag}${cls}`;
    }

    const elements = document.querySelectorAll('body *');

    for (const el of elements) {
      // Skip invisible elements
      if (el instanceof HTMLElement && (el.offsetWidth === 0 || el.offsetHeight === 0)) continue;
      // Skip script/style/meta
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'meta', 'link', 'noscript', 'br', 'hr'].includes(tag)) continue;

      const styles = window.getComputedStyle(el);
      const desc = describeElement(el);

      // Colors
      const color = styles.color;
      if (color && color !== 'rgba(0, 0, 0, 0)') {
        addToken(colors, color, `text:${desc}`);
      }

      const bgColor = styles.backgroundColor;
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        addToken(colors, bgColor, `bg:${desc}`);
      }

      const borderColor = styles.borderColor;
      if (
        borderColor &&
        borderColor !== 'rgba(0, 0, 0, 0)' &&
        borderColor !== styles.color
      ) {
        addToken(colors, borderColor, `border:${desc}`);
      }

      // Fonts
      addToken(fontFamilies, styles.fontFamily, desc);
      addToken(fontSizes, styles.fontSize, desc);
      addToken(fontWeights, styles.fontWeight, desc);

      // Spacing (only non-zero values)
      for (const prop of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']) {
        const val = styles.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
        if (val && val !== '0px') {
          addToken(spacings, val, `padding:${desc}`);
        }
      }
      for (const prop of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight']) {
        const val = styles.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
        if (val && val !== '0px' && val !== 'auto') {
          addToken(spacings, val, `margin:${desc}`);
        }
      }

      // Border radius
      const radius = styles.borderRadius;
      if (radius && radius !== '0px') {
        addToken(borderRadii, radius, desc);
      }

      // Shadows
      const shadow = styles.boxShadow;
      if (shadow && shadow !== 'none') {
        addToken(shadows, shadow, desc);
      }
    }

    const mapToArray = (map: Map<string, { count: number; contexts: string[] }>) => {
      return Array.from(map.entries())
        .map(([value, data]) => ({ value, count: data.count, contexts: data.contexts }))
        .sort((a, b) => b.count - a.count);
    }

    return {
      colors: mapToArray(colors),
      fontFamilies: mapToArray(fontFamilies),
      fontSizes: mapToArray(fontSizes),
      fontWeights: mapToArray(fontWeights),
      spacings: mapToArray(spacings),
      borderRadii: mapToArray(borderRadii),
      shadows: mapToArray(shadows),
    };
  });
}
