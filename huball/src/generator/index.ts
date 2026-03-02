import { join } from 'node:path';
import type { CrawlResult, DetectedComponent } from '../types/crawl-result';
import type { DesignSystem } from '../types/design-system';
import type {
  ThemeConfig,
  GeneratedTheme,
  ModuleDefinition,
} from '../types/hubspot-theme';
import { generateThemeJson } from './theme-json';
import { generateFieldsJson } from './fields-json';
import { generateMainCss } from './css-generator';
import { generateMainJs } from './js-generator';
import { generateModule } from './module-generator';
import { generateTemplate } from './template-generator';
import { themePrefix } from '../utils/slugify';
import { writeThemeFile, writeThemeJson, ensureDir } from '../utils/fs';
import { DEFAULT_CONFIG } from '../config';

interface GenerateOptions {
  name: string;
  authorName?: string;
  authorUrl?: string;
}

/**
 * Generate a complete HubSpot theme from crawl results.
 */
export function generateTheme(
  crawlResult: CrawlResult,
  designSystem: DesignSystem,
  components: DetectedComponent[],
  options: GenerateOptions,
): GeneratedTheme {
  const prefix = themePrefix(options.name);

  const config: ThemeConfig = {
    name: options.name,
    label: options.name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    prefix,
    authorName: options.authorName || DEFAULT_CONFIG.authorName,
    authorUrl: options.authorUrl || DEFAULT_CONFIG.authorUrl,
    version: '1.0.0',
  };

  // Generate theme.json
  const themeJson = generateThemeJson(config);

  // Generate fields.json (global design tokens)
  const fieldsJson = generateFieldsJson(designSystem);

  // Generate CSS
  const mainCss = generateMainCss(designSystem, prefix);

  // Generate JS
  const mainJs = generateMainJs(prefix);

  // Generate modules — deduplicate by type
  const seenTypes = new Set<string>();
  const modules: ModuleDefinition[] = [];

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (seenTypes.has(comp.type)) continue;
    seenTypes.add(comp.type);

    const mod = generateModule(comp, i, prefix);
    modules.push(mod);
  }

  // Ensure header and footer modules exist
  if (!seenTypes.has('header')) {
    const defaultHeader: DetectedComponent = {
      type: 'header',
      selector: 'header',
      tagName: 'header',
      className: '',
      outerHTML: '',
      computedStyles: {},
      textContent: '',
      headings: [],
      paragraphs: [],
      images: [],
      links: [],
      buttons: [],
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      childCount: 0,
      hasBackgroundImage: false,
    };
    modules.push(generateModule(defaultHeader, 0, prefix));
  }

  if (!seenTypes.has('footer')) {
    const defaultFooter: DetectedComponent = {
      type: 'footer',
      selector: 'footer',
      tagName: 'footer',
      className: '',
      outerHTML: '',
      computedStyles: {},
      textContent: '',
      headings: [],
      paragraphs: [],
      images: [],
      links: [],
      buttons: [],
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      childCount: 0,
      hasBackgroundImage: false,
    };
    modules.push(generateModule(defaultFooter, 0, prefix));
  }

  // Generate template
  const templates = [
    generateTemplate('home', `${config.label} - Home`, components, modules, prefix),
  ];

  return {
    config,
    themeJson,
    fieldsJson,
    mainCss,
    mainJs,
    modules,
    templates,
  };
}

/**
 * Write a generated theme to disk.
 */
export async function writeThemeToDisk(
  theme: GeneratedTheme,
  outputDir: string,
  themeName: string,
): Promise<string> {
  const basePath = join(outputDir, themeName);
  await ensureDir(basePath);

  // theme.json
  await writeThemeJson(basePath, 'theme.json', theme.themeJson);

  // fields.json
  await writeThemeJson(basePath, 'fields.json', theme.fieldsJson);

  // CSS
  await writeThemeFile(basePath, 'css/main.css', theme.mainCss);

  // JS
  await writeThemeFile(basePath, 'js/main', theme.mainJs);

  // Modules
  for (const mod of theme.modules) {
    const modDir = `modules/${mod.dirName}`;
    await writeThemeJson(basePath, `${modDir}/meta.json`, mod.metaJson);
    await writeThemeJson(basePath, `${modDir}/fields.json`, mod.fieldsJson);
    await writeThemeFile(basePath, `${modDir}/module.html`, mod.moduleHtml);
    await writeThemeFile(basePath, `${modDir}/module.css`, mod.moduleCss);
    if (mod.moduleJs) {
      await writeThemeFile(basePath, `${modDir}/module.js`, mod.moduleJs);
    }
  }

  // Templates
  for (const tmpl of theme.templates) {
    await writeThemeFile(basePath, `templates/${tmpl.filename}`, tmpl.content);
  }

  return basePath;
}
