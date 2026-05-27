import { chromium, type Browser, type Page } from 'playwright';
import { DEFAULT_CONFIG } from '../config';
import { debug } from '../utils/logger';

export async function createBrowser(): Promise<Browser> {
  debug('Launching browser...');
  return chromium.launch({ headless: true });
}

export async function createPage(
  browser: Browser,
  url: string,
  viewport = { width: 1920, height: 1080 },
): Promise<Page> {
  const context = await browser.newContext({
    viewport,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Polyfill esbuild's __name helper which gets injected into page.evaluate() callbacks
  // but doesn't exist in the browser context
  await page.addInitScript(() => {
    (globalThis as any).__name = (fn: any, _name: string) => fn;
  });

  debug(`Navigating to ${url} (${viewport.width}x${viewport.height})`);
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: DEFAULT_CONFIG.crawl.timeout,
  });

  // Wait a bit for any lazy-loaded content
  await page.waitForTimeout(1000);

  return page;
}

export async function closeBrowser(browser: Browser): Promise<void> {
  debug('Closing browser');
  await browser.close();
}
