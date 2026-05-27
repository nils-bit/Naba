import type { Page } from 'playwright';
import type { PageMeta } from '../../types/crawl-result';

export async function extractPageMeta(page: Page): Promise<PageMeta> {
  return page.evaluate(() => {
    const getMeta = (name: string): string => {
      const el =
        document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);
      return el?.getAttribute('content') || '';
    };

    const favicon =
      (document.querySelector('link[rel="icon"]') as HTMLLinkElement)?.href ||
      (document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement)?.href ||
      '';

    return {
      title: document.title || '',
      description: getMeta('description') || getMeta('og:description') || '',
      ogImage: getMeta('og:image') || undefined,
      favicon: favicon || undefined,
      lang: document.documentElement.lang || 'en',
    };
  });
}
