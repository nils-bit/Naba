import type { Page } from 'playwright';
import type { AssetReference, FontReference } from '../../types/crawl-result';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { debug } from '../../utils/logger';

export async function extractAssets(page: Page): Promise<AssetReference[]> {
  return page.evaluate(() => {
    const assets: AssetReference[] = [];
    const seen = new Set<string>();

    // Images
    document.querySelectorAll('img').forEach((img) => {
      if (img.src && !seen.has(img.src)) {
        seen.add(img.src);
        assets.push({
          url: img.src,
          type: 'image',
          alt: img.alt || undefined,
          width: img.naturalWidth || undefined,
          height: img.naturalHeight || undefined,
        });
      }
    });

    // Background images
    document.querySelectorAll('*').forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const match = bg.match(/url\(["']?(.+?)["']?\)/);
        if (match?.[1] && !seen.has(match[1])) {
          seen.add(match[1]);
          assets.push({ url: match[1], type: 'image' });
        }
      }
    });

    // Favicon
    const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]') as HTMLLinkElement;
    if (faviconEl?.href && !seen.has(faviconEl.href)) {
      seen.add(faviconEl.href);
      assets.push({ url: faviconEl.href, type: 'favicon' });
    }

    // OG image
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage && !seen.has(ogImage)) {
      seen.add(ogImage);
      assets.push({ url: ogImage, type: 'og-image' });
    }

    return assets;
  });
}

export async function extractFonts(page: Page): Promise<FontReference[]> {
  return page.evaluate(() => {
    const fonts: FontReference[] = [];
    const seen = new Set<string>();

    // Check for Google Fonts in link tags
    document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      const familyMatch = href.match(/family=([^&:]+)/);
      if (familyMatch) {
        const families = familyMatch[1].split('|');
        for (const raw of families) {
          const family = decodeURIComponent(raw.replace(/\+/g, ' ').split(':')[0]);
          if (!seen.has(family)) {
            seen.add(family);
            // Extract weights if present
            const weightMatch = raw.match(/:(\d[\d,;]*)/);
            const weights = weightMatch
              ? weightMatch[1]
                  .split(/[,;]/)
                  .map(Number)
                  .filter((w) => w > 0)
              : [400];
            fonts.push({ family, weights, isGoogle: true, url: href });
          }
        }
      }
    });

    // Check @font-face rules in stylesheets
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSFontFaceRule) {
              const family = rule.style.fontFamily?.replace(/['"]/g, '');
              const weight = parseInt(rule.style.fontWeight) || 400;
              if (family && !seen.has(family)) {
                seen.add(family);
                fonts.push({ family, weights: [weight], isGoogle: false });
              } else if (family) {
                const existing = fonts.find((f) => f.family === family);
                if (existing && !existing.weights.includes(weight)) {
                  existing.weights.push(weight);
                }
              }
            }
          }
        } catch {
          // CORS may prevent reading cross-origin stylesheets
        }
      }
    } catch {
      // Stylesheet access may fail
    }

    return fonts;
  });
}

export async function downloadAssets(
  assets: AssetReference[],
  outputDir: string,
): Promise<AssetReference[]> {
  const imgDir = join(outputDir, 'img');
  await mkdir(imgDir, { recursive: true });

  const downloaded: AssetReference[] = [];

  for (const asset of assets) {
    try {
      if (!asset.url || asset.url.startsWith('data:')) continue;

      const response = await fetch(asset.url);
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      let filename = basename(new URL(asset.url).pathname);
      if (!extname(filename)) filename += '.png';

      // Sanitize filename
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      const localPath = join(imgDir, filename);
      await writeFile(localPath, buffer);

      downloaded.push({ ...asset, localPath: `img/${filename}` });
      debug(`Downloaded: ${filename}`);
    } catch {
      debug(`Failed to download: ${asset.url}`);
    }
  }

  return downloaded;
}
