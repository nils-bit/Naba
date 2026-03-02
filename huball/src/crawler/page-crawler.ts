import type { CrawlResult, CrawlOptions } from '../types/crawl-result';
import { createBrowser, createPage, closeBrowser } from './browser';
import { extractDesignTokens } from './extractors/design-tokens';
import { detectComponents } from './extractors/components';
import { extractPageMeta } from './extractors/content';
import { extractAssets, extractFonts } from './extractors/assets';
import { debug } from '../utils/logger';

export async function crawlPage(
  url: string,
  options?: CrawlOptions,
): Promise<CrawlResult> {
  const browser = await createBrowser();

  try {
    const page = await createPage(browser, url);

    debug('Extracting design tokens...');
    const designTokens = await extractDesignTokens(page);

    debug('Detecting components...');
    const components = await detectComponents(page);

    debug('Extracting page metadata...');
    const meta = await extractPageMeta(page);

    debug('Extracting assets...');
    const assets = await extractAssets(page);

    debug('Extracting fonts...');
    const fonts = await extractFonts(page);

    return {
      url,
      title: meta.title,
      meta,
      designTokens,
      components,
      assets,
      fonts,
    };
  } finally {
    await closeBrowser(browser);
  }
}
