import type { Page } from 'playwright';
import type { DetectedComponent, ComponentType } from '../../types/crawl-result';

export async function detectComponents(page: Page): Promise<DetectedComponent[]> {
  return page.evaluate(() => {
    const components: DetectedComponent[] = [];

    const getHeadings = (el: Element): { level: number; text: string }[] => {
      const headings: { level: number; text: string }[] = [];
      for (let i = 1; i <= 6; i++) {
        el.querySelectorAll(`h${i}`).forEach((h) => {
          const text = h.textContent?.trim();
          if (text) headings.push({ level: i, text });
        });
      }
      return headings;
    }

    const getParagraphs = (el: Element): string[] => {
      return Array.from(el.querySelectorAll('p'))
        .map((p) => p.textContent?.trim() || '')
        .filter((t) => t.length > 10);
    }

    const getImages = (el: Element): { url: string; type: 'image'; alt?: string; width?: number; height?: number }[] => {
      return Array.from(el.querySelectorAll('img')).map((img) => ({
        url: img.src,
        type: 'image' as const,
        alt: img.alt || undefined,
        width: img.naturalWidth || undefined,
        height: img.naturalHeight || undefined,
      }));
    }

    const getLinks = (el: Element): { href: string; text: string }[] => {
      return Array.from(el.querySelectorAll('a'))
        .map((a) => ({
          href: a.href,
          text: a.textContent?.trim() || '',
        }))
        .filter((l) => l.text && l.href);
    }

    const getButtons = (el: Element): { text: string; href?: string }[] => {
      const buttons: { text: string; href?: string }[] = [];
      el.querySelectorAll('button, a[class*="btn"], a[class*="button"], [role="button"]').forEach((btn) => {
        const text = btn.textContent?.trim();
        if (text) {
          buttons.push({
            text,
            href: btn instanceof HTMLAnchorElement ? btn.href : undefined,
          });
        }
      });
      return buttons;
    }

    const hasBackgroundImage = (el: Element): { has: boolean; url?: string } => {
      const styles = window.getComputedStyle(el);
      const bgImage = styles.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(["']?(.+?)["']?\)/);
        return { has: true, url: match?.[1] };
      }
      return { has: false };
    }

    const classifyElement = (el: Element, index: number, _total: number): ComponentType => {
      const tag = el.tagName.toLowerCase();
      const cls = (el.className || '').toString().toLowerCase();
      const headings = getHeadings(el);
      const images = getImages(el);
      const buttons = getButtons(el);
      const bgImg = hasBackgroundImage(el);
      const rect = el.getBoundingClientRect();
      const childDivs = el.querySelectorAll(':scope > div, :scope > article, :scope > li');

      // Header/Nav detection
      if (tag === 'header' || tag === 'nav' || cls.includes('header') || cls.includes('navbar')) {
        return 'header';
      }

      // Footer detection
      if (tag === 'footer' || cls.includes('footer')) {
        return 'footer';
      }

      // Hero: first content section with h1, large height, or bg image
      if (
        index === 0 &&
        (headings.some((h) => h.level === 1) || bgImg.has || rect.height > window.innerHeight * 0.5)
      ) {
        return 'hero';
      }

      // Form section
      if (el.querySelector('form') || cls.includes('form') || cls.includes('contact')) {
        return 'form';
      }

      // Newsletter (email input without full form)
      if (el.querySelector('input[type="email"]') || cls.includes('newsletter') || cls.includes('subscribe')) {
        return 'newsletter';
      }

      // Card grid: 3+ similar children
      if (childDivs.length >= 3) {
        const firstChildTag = childDivs[0]?.tagName;
        const allSameTag = Array.from(childDivs).every((c) => c.tagName === firstChildTag);
        if (allSameTag) {
          return 'card-grid';
        }
      }

      // Stats: numbers with labels
      if (cls.includes('stat') || cls.includes('counter') || cls.includes('number')) {
        return 'stats';
      }

      // Testimonial
      if (
        cls.includes('testimonial') ||
        cls.includes('review') ||
        cls.includes('quote') ||
        el.querySelector('blockquote')
      ) {
        return 'testimonial';
      }

      // Gallery
      if (cls.includes('gallery') || (images.length >= 4 && headings.length <= 1)) {
        return 'gallery';
      }

      // CTA banner: heading + buttons, colored bg
      if (headings.length <= 2 && buttons.length >= 1 && images.length === 0) {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgb(255, 255, 255)') {
          return 'cta-banner';
        }
      }

      // Text + Image
      if (headings.length > 0 && images.length === 1) {
        return 'text-image';
      }

      // Pure text block
      if (headings.length > 0 && images.length === 0) {
        return 'text-block';
      }

      return 'generic-section';
    }

    // Find all top-level sections
    const topLevelSelectors = [
      'body > header',
      'body > nav',
      'body > main > *',
      'body > section',
      'body > div > header',
      'body > div > nav',
      'body > div > main > *',
      'body > div > section',
      'body > div > div > header',
      'body > div > div > section',
      'body > div > div > main > *',
      'body > footer',
      'body > div > footer',
      'body > div > div > footer',
    ];

    let sections: Element[] = [];

    for (const selector of topLevelSelectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        sections.push(...Array.from(found));
      }
    }

    // Deduplicate (parent selectors may overlap)
    sections = [...new Set(sections)];

    // Filter out invisible/tiny elements
    sections = sections.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.height > 20 && rect.width > 100;
    });

    // Sort by DOM position
    sections.sort((a, b) => {
      const posA = a.compareDocumentPosition(b);
      return posA & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    for (let i = 0; i < sections.length; i++) {
      const el = sections[i];
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const bgImg = hasBackgroundImage(el);
      const type = classifyElement(el, i, sections.length);

      components.push({
        type,
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
        tagName: el.tagName.toLowerCase(),
        className: (el.className || '').toString(),
        outerHTML: el.outerHTML.slice(0, 5000), // Limit size
        computedStyles: {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          padding: styles.padding,
          margin: styles.margin,
          display: styles.display,
          flexDirection: styles.flexDirection,
          textAlign: styles.textAlign,
          maxWidth: styles.maxWidth,
          minHeight: styles.minHeight,
        },
        textContent: el.textContent?.trim().slice(0, 500) || '',
        headings: getHeadings(el),
        paragraphs: getParagraphs(el),
        images: getImages(el),
        links: getLinks(el),
        buttons: getButtons(el),
        boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        childCount: el.children.length,
        hasBackgroundImage: bgImg.has,
        backgroundImageUrl: bgImg.url,
      });
    }

    return components;
  });
}
