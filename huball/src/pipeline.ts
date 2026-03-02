import type { CrawlResult, DetectedComponent } from './types/crawl-result';
import type { DesignSystem } from './types/design-system';
import type { GeneratedTheme } from './types/hubspot-theme';
import { crawlPage } from './crawler/page-crawler';
import { buildDesignSystem } from './analyzer/design-system';
import { classifyComponents } from './analyzer/component-classifier';
import { generateTheme } from './generator/index';
import { themeNameFromUrl } from './utils/slugify';

export type PipelineStep = 'crawling' | 'analyzing' | 'generating' | 'complete';

export interface PipelineProgress {
  step: PipelineStep;
  message: string;
  data?: Record<string, unknown>;
}

export interface PipelineResult {
  crawlResult: CrawlResult;
  designSystem: DesignSystem;
  components: DetectedComponent[];
  theme: GeneratedTheme;
  themeName: string;
}

export interface PipelineOptions {
  url: string;
  themeName?: string;
  onProgress?: (progress: PipelineProgress) => void;
}

export async function runPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const { url, onProgress } = options;
  const themeName = options.themeName || themeNameFromUrl(url);

  // Step 1: Crawl
  onProgress?.({ step: 'crawling', message: 'Launching browser and crawling website...' });
  const crawlResult = await crawlPage(url);
  onProgress?.({
    step: 'crawling',
    message: `Found ${crawlResult.components.length} components, ${crawlResult.designTokens.colors.length} colors`,
    data: {
      componentCount: crawlResult.components.length,
      colorCount: crawlResult.designTokens.colors.length,
      fontCount: crawlResult.designTokens.fontFamilies.length,
      pageTitle: crawlResult.meta.title,
    },
  });

  // Step 2: Analyze
  onProgress?.({ step: 'analyzing', message: 'Analyzing design system...' });
  const designSystem = buildDesignSystem(crawlResult.designTokens);
  const classifiedComponents = classifyComponents(crawlResult.components);
  onProgress?.({
    step: 'analyzing',
    message: `${designSystem.colors.length} colors, ${designSystem.fonts.length} fonts, ${classifiedComponents.length} sections`,
    data: {
      colors: designSystem.colors,
      fonts: designSystem.fonts,
      spacing: designSystem.spacing,
      componentTypes: classifiedComponents.map((c) => c.type),
    },
  });

  // Step 3: Generate
  onProgress?.({ step: 'generating', message: 'Generating HubSpot theme...' });
  const theme = generateTheme(crawlResult, designSystem, classifiedComponents, {
    name: themeName,
  });
  onProgress?.({
    step: 'generating',
    message: `${theme.modules.length} modules, ${theme.templates.length} templates`,
    data: {
      moduleCount: theme.modules.length,
      templateCount: theme.templates.length,
      moduleNames: theme.modules.map((m) => m.label),
      themeName,
    },
  });

  // Complete
  onProgress?.({ step: 'complete', message: 'Migration complete!' });

  return { crawlResult, designSystem, components: classifiedComponents, theme, themeName };
}
