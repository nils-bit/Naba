import { readFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { readdir } from 'node:fs/promises';
import type { HubSpotApiClient } from './api-client';
import { debug, info } from '../utils/logger';

export interface AssetMap {
  /** Maps local relative path → HubSpot CDN URL */
  [localPath: string]: string;
}

/**
 * Upload all images from the theme's img/ directory to HubSpot File Manager.
 * Returns a map of local relative paths to CDN URLs.
 */
export async function uploadThemeAssets(
  client: HubSpotApiClient,
  themeDir: string,
  themeName: string,
): Promise<AssetMap> {
  const imgDir = join(themeDir, 'img');
  const assetMap: AssetMap = {};

  let files: string[];
  try {
    files = await readdir(imgDir);
  } catch {
    debug('No img/ directory found — skipping asset upload');
    return assetMap;
  }

  const imageFiles = files.filter((f) => isImageFile(f));

  if (imageFiles.length === 0) {
    debug('No image files found in img/');
    return assetMap;
  }

  info(`Uploading ${imageFiles.length} assets to HubSpot...`);
  const folderPath = `/huball/${themeName}`;

  for (const filename of imageFiles) {
    const filePath = join(imgDir, filename);
    const buffer = await readFile(filePath);

    try {
      const result = await client.uploadAsset(buffer, filename, folderPath);
      assetMap[`img/${filename}`] = result.url;
      debug(`Uploaded asset: ${filename} → ${result.url}`);
    } catch (err) {
      debug(`Failed to upload ${filename}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return assetMap;
}

function isImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif'].includes(ext);
}

/**
 * Replace local image paths in module defaults with CDN URLs.
 */
export function rewriteAssetUrls(
  moduleHtml: string,
  assetMap: AssetMap,
): string {
  let result = moduleHtml;
  for (const [localPath, cdnUrl] of Object.entries(assetMap)) {
    // Replace both relative and absolute references
    result = result.replaceAll(localPath, cdnUrl);
    result = result.replaceAll(`/${localPath}`, cdnUrl);
  }
  return result;
}
