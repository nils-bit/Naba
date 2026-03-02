import type { DetectedComponent } from '../types/crawl-result';

/**
 * Analyze the page structure and return an ordered list of sections
 * with their roles (header, body sections, footer).
 */
export interface PageStructure {
  header?: DetectedComponent;
  bodySections: DetectedComponent[];
  footer?: DetectedComponent;
}

export function analyzePageStructure(
  components: DetectedComponent[],
): PageStructure {
  const header = components.find((c) => c.type === 'header');
  const footer = components.find((c) => c.type === 'footer');
  const bodySections = components.filter(
    (c) => c.type !== 'header' && c.type !== 'footer',
  );

  return { header, bodySections, footer };
}
