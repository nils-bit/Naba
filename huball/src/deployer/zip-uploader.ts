import { createReadStream } from 'node:fs';
import { join, basename } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import archiver from 'archiver';
import { Writable } from 'node:stream';
import type { HubSpotApiClient } from './api-client';
import { debug, info } from '../utils/logger';

/**
 * ZIP a local theme directory into a Buffer.
 */
export async function zipThemeDirectory(themeDir: string): Promise<Buffer> {
  const chunks: Buffer[] = [];

  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  const archive = archiver('zip', { zlib: { level: 9 } });

  const done = new Promise<void>((resolve, reject) => {
    writable.on('finish', resolve);
    archive.on('error', reject);
  });

  archive.pipe(writable);

  // Walk the theme directory and add all files
  await addDirectoryToArchive(archive, themeDir, '');

  await archive.finalize();
  await done;

  return Buffer.concat(chunks);
}

async function addDirectoryToArchive(
  archive: archiver.Archiver,
  baseDir: string,
  relativePath: string,
): Promise<void> {
  const currentDir = join(baseDir, relativePath);
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await addDirectoryToArchive(archive, baseDir, entryRelative);
    } else if (entry.isFile()) {
      archive.file(join(currentDir, entry.name), { name: entryRelative });
    }
  }
}

/**
 * Upload a theme directory to HubSpot via ZIP upload + extraction.
 *
 * 1. ZIP the theme directory
 * 2. Upload the ZIP via Source Code API
 * 3. Trigger extraction
 * 4. Poll until extraction is complete
 */
export async function uploadThemeZip(
  client: HubSpotApiClient,
  themeDir: string,
  themeName: string,
  extractionTimeout: number = 300000,
): Promise<void> {
  // 1. ZIP
  info('Creating theme ZIP...');
  const zipBuffer = await zipThemeDirectory(themeDir);
  debug(`ZIP size: ${(zipBuffer.length / 1024).toFixed(1)} KB`);

  // 2. Upload
  const zipPath = `${themeName}.zip`;
  info('Uploading ZIP to HubSpot...');
  await client.uploadZip(zipPath, zipBuffer);

  // 3. Extract
  info('Extracting theme...');
  await client.extractZip(zipPath);

  // 4. Wait for extraction by validating a known file
  info('Waiting for extraction to complete...');
  await waitForExtraction(client, themeName, extractionTimeout);
}

/**
 * Poll until the theme.json file is accessible (meaning extraction is done).
 */
async function waitForExtraction(
  client: HubSpotApiClient,
  themeName: string,
  timeout: number,
): Promise<void> {
  const checkPath = `${themeName}/theme.json`;
  const start = Date.now();
  const pollInterval = 3000;

  while (Date.now() - start < timeout) {
    try {
      await client.validateFile('draft', checkPath);
      debug('Extraction confirmed — theme.json is accessible');
      return;
    } catch {
      debug('Extraction not yet complete, polling...');
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(
    `Theme extraction timed out after ${timeout / 1000}s. Check the Design Manager for status.`,
  );
}
