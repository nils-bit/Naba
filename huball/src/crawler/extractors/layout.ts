import type { Page } from 'playwright';

export interface LayoutInfo {
  maxContentWidth: number;
  usesFlexbox: boolean;
  usesGrid: boolean;
  hasFixedHeader: boolean;
  hasSidebar: boolean;
}

export async function extractLayout(page: Page): Promise<LayoutInfo> {
  return page.evaluate(() => {
    let maxContentWidth = 0;
    let usesFlexbox = false;
    let usesGrid = false;
    let hasFixedHeader = false;
    let hasSidebar = false;

    const elements = document.querySelectorAll('body *');

    for (const el of elements) {
      const styles = window.getComputedStyle(el);

      // Check layout modes
      if (styles.display === 'flex' || styles.display === 'inline-flex') usesFlexbox = true;
      if (styles.display === 'grid' || styles.display === 'inline-grid') usesGrid = true;

      // Check for fixed header
      if (
        (el.tagName === 'HEADER' || el.tagName === 'NAV') &&
        (styles.position === 'fixed' || styles.position === 'sticky')
      ) {
        hasFixedHeader = true;
      }

      // Check for sidebar
      if (el.tagName === 'ASIDE' || (el.className || '').toString().toLowerCase().includes('sidebar')) {
        hasSidebar = true;
      }

      // Track max content width
      const mw = parseInt(styles.maxWidth);
      if (mw > 0 && mw < 2000 && mw > maxContentWidth) {
        maxContentWidth = mw;
      }
    }

    return {
      maxContentWidth: maxContentWidth || 1200,
      usesFlexbox,
      usesGrid,
      hasFixedHeader,
      hasSidebar,
    };
  });
}
