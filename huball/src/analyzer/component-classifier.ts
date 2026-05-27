import type { DetectedComponent, ComponentType } from '../types/crawl-result';

/**
 * Re-classify components with cross-component context.
 * The initial classification in the browser is per-element,
 * but some patterns only emerge when looking at the full page.
 */
export function classifyComponents(
  components: DetectedComponent[],
): DetectedComponent[] {
  const classified = [...components];

  // Ensure only one header (first one)
  let foundHeader = false;
  for (const comp of classified) {
    if (comp.type === 'header') {
      if (foundHeader) {
        comp.type = 'generic-section';
      }
      foundHeader = true;
    }
  }

  // Ensure only one footer (last one)
  let lastFooterIndex = -1;
  for (let i = classified.length - 1; i >= 0; i--) {
    if (classified[i].type === 'footer') {
      if (lastFooterIndex === -1) {
        lastFooterIndex = i;
      } else {
        classified[i].type = 'generic-section';
      }
    }
  }

  // If no header found, check first element
  if (!foundHeader && classified.length > 0) {
    const first = classified[0];
    if (first.links.length > 2 && first.boundingBox.height < 200) {
      first.type = 'header';
    }
  }

  // If no footer found, check last element
  if (lastFooterIndex === -1 && classified.length > 0) {
    const last = classified[classified.length - 1];
    if (last.links.length > 2) {
      last.type = 'footer';
    }
  }

  // If no hero found, upgrade first non-header section with h1
  const hasHero = classified.some((c) => c.type === 'hero');
  if (!hasHero) {
    for (const comp of classified) {
      if (comp.type !== 'header' && comp.type !== 'footer') {
        if (comp.headings.some((h) => h.level === 1) || comp.hasBackgroundImage) {
          comp.type = 'hero';
          break;
        }
      }
    }
  }

  return classified;
}

/**
 * Get a human-readable label for a component type.
 */
export function componentTypeLabel(type: ComponentType): string {
  const labels: Record<ComponentType, string> = {
    header: 'Header',
    hero: 'Hero Banner',
    'text-block': 'Text Block',
    'text-image': 'Text with Image',
    'card-grid': 'Card Grid',
    stats: 'Statistics',
    'cta-banner': 'Call to Action',
    testimonial: 'Testimonials',
    gallery: 'Gallery',
    form: 'Form Section',
    newsletter: 'Newsletter Signup',
    footer: 'Footer',
    'generic-section': 'Content Section',
  };
  return labels[type] || 'Section';
}
