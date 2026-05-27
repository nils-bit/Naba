import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeThemeFile(
  basePath: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = join(basePath, relativePath);
  await ensureDir(dirname(fullPath));
  await writeFile(fullPath, content, 'utf-8');
}

export async function writeThemeJson(
  basePath: string,
  relativePath: string,
  data: unknown,
): Promise<void> {
  await writeThemeFile(basePath, relativePath, JSON.stringify(data, null, 2));
}
