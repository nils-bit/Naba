import archiver from 'archiver';
import { Writable } from 'node:stream';
import type { GeneratedTheme } from '@/src/types/hubspot-theme';

export async function zipThemeFromMemory(
  theme: GeneratedTheme,
  themeName: string,
): Promise<Buffer> {
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

  // theme.json
  archive.append(JSON.stringify(theme.themeJson, null, 2), {
    name: `${themeName}/theme.json`,
  });

  // fields.json
  archive.append(JSON.stringify(theme.fieldsJson, null, 2), {
    name: `${themeName}/fields.json`,
  });

  // CSS
  archive.append(theme.mainCss, { name: `${themeName}/css/main.css` });

  // JS
  archive.append(theme.mainJs, { name: `${themeName}/js/main.js` });

  // Modules
  for (const mod of theme.modules) {
    const modDir = `${themeName}/modules/${mod.dirName}`;
    archive.append(JSON.stringify(mod.metaJson, null, 2), { name: `${modDir}/meta.json` });
    archive.append(JSON.stringify(mod.fieldsJson, null, 2), { name: `${modDir}/fields.json` });
    archive.append(mod.moduleHtml, { name: `${modDir}/module.html` });
    archive.append(mod.moduleCss, { name: `${modDir}/module.css` });
    if (mod.moduleJs) {
      archive.append(mod.moduleJs, { name: `${modDir}/module.js` });
    }
  }

  // Templates
  for (const tmpl of theme.templates) {
    archive.append(tmpl.content, { name: `${themeName}/templates/${tmpl.filename}` });
  }

  await archive.finalize();
  await done;

  return Buffer.concat(chunks);
}
