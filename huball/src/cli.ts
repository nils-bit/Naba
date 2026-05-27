import { Command } from 'commander';
import { setVerbose, heading, info, success, error, spinner } from './utils/logger';
import { themeNameFromUrl } from './utils/slugify';
import { crawlPage } from './crawler/page-crawler';
import { buildDesignSystem } from './analyzer/design-system';
import { classifyComponents } from './analyzer/component-classifier';
import { generateTheme, writeThemeToDisk } from './generator/index';
import { deployTheme } from './deployer/index';

const program = new Command();

program
  .name('huball')
  .description('Migrate websites to HubSpot CMS')
  .version('0.1.0');

program
  .command('migrate <url>')
  .description('Crawl a website and generate a HubSpot CMS theme')
  .option('-n, --name <name>', 'Theme name (default: derived from domain)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--pages <mode>', 'Page mode: "single" or "full"', 'single')
  .option('--deploy', 'Deploy to HubSpot after generation', false)
  .option('--portal <id>', 'HubSpot portal ID')
  .option('--token <token>', 'HubSpot private app token')
  .option('--verbose', 'Verbose logging', false)
  .action(async (url: string, options) => {
    if (options.verbose) setVerbose(true);

    const themeName = options.name || themeNameFromUrl(url);

    heading(`Huball — Migrating to HubSpot CMS`);
    info(`Source: ${url}`);
    info(`Theme: ${themeName}`);
    info(`Mode: ${options.pages}`);
    console.log();

    try {
      // Step 1: Crawl
      const crawlSpinner = spinner('Crawling website...');
      const crawlResult = await crawlPage(url);
      crawlSpinner.succeed(
        `Crawled: ${crawlResult.components.length} components, ${crawlResult.designTokens.colors.length} colors, ${crawlResult.designTokens.fontFamilies.length} fonts`,
      );

      // Step 2: Analyze
      const analyzeSpinner = spinner('Analyzing design system...');
      const designSystem = buildDesignSystem(crawlResult.designTokens);
      const classifiedComponents = classifyComponents(crawlResult.components);
      analyzeSpinner.succeed(
        `Design system: ${designSystem.colors.length} colors, ${designSystem.fonts.length} fonts`,
      );

      // Step 3: Generate
      const genSpinner = spinner('Generating HubSpot theme...');
      const theme = generateTheme(crawlResult, designSystem, classifiedComponents, {
        name: themeName,
      });
      genSpinner.succeed(
        `Generated: ${theme.modules.length} modules, ${theme.templates.length} templates`,
      );

      // Step 4: Write to disk
      const writeSpinner = spinner('Writing theme files...');
      const outputPath = await writeThemeToDisk(theme, options.output, themeName);
      writeSpinner.succeed(`Theme written to: ${outputPath}`);

      // Step 5: Deploy (if requested)
      if (options.deploy) {
        const token = options.token || process.env.HUBSPOT_TOKEN;
        const portalId = options.portal || process.env.HUBSPOT_PORTAL_ID;

        if (!token || !portalId) {
          error('Deploy requires --token and --portal (or HUBSPOT_TOKEN and HUBSPOT_PORTAL_ID env vars)');
          process.exit(1);
        }

        console.log();
        heading('Deploying to HubSpot');
        const result = await deployTheme({
          token,
          portalId,
          themeDir: outputPath,
          themeName,
        });

        info(`Environment: ${result.environment}`);
        info(`Design Manager: ${result.designManagerUrl}`);
      }

      console.log();
      success('Migration complete!');
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('deploy <themeDir>')
  .description('Deploy an existing theme directory to HubSpot')
  .option('--portal <id>', 'HubSpot portal ID')
  .option('--token <token>', 'HubSpot private app token')
  .option('--name <name>', 'Theme name (default: directory name)')
  .option('--env <environment>', 'Target environment', 'draft')
  .option('--verbose', 'Verbose logging', false)
  .action(async (themeDir: string, options) => {
    if (options.verbose) setVerbose(true);

    const token = options.token || process.env.HUBSPOT_TOKEN;
    const portalId = options.portal || process.env.HUBSPOT_PORTAL_ID;

    if (!token || !portalId) {
      error('Deploy requires --token and --portal (or HUBSPOT_TOKEN and HUBSPOT_PORTAL_ID env vars)');
      process.exit(1);
    }

    const { basename } = await import('node:path');
    const themeName = options.name || basename(themeDir);

    heading('Huball — Deploy to HubSpot');
    info(`Theme: ${themeName}`);
    info(`Source: ${themeDir}`);
    console.log();

    try {
      const result = await deployTheme({
        token,
        portalId,
        themeDir,
        themeName,
        environment: options.env,
      });

      console.log();
      success('Deployment complete!');
      info(`Environment: ${result.environment}`);
      info(`Assets uploaded: ${result.assetsUploaded}`);
      info(`Design Manager: ${result.designManagerUrl}`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('preview <url>')
  .description('Crawl and show analysis without generating')
  .option('--verbose', 'Verbose logging', false)
  .action(async (url: string, options) => {
    if (options.verbose) setVerbose(true);

    heading('Huball — Website Analysis');
    info(`Analyzing: ${url}`);
    console.log();

    try {
      const crawlSpinner = spinner('Crawling...');
      const result = await crawlPage(url);
      crawlSpinner.succeed('Crawl complete');

      const designSystem = buildDesignSystem(result.designTokens);

      heading('Design Tokens');
      info(`Colors: ${designSystem.colors.map((c) => `${c.label} (${c.value})`).join(', ')}`);
      info(`Fonts: ${designSystem.fonts.map((f) => `${f.role}: ${f.family}`).join(', ')}`);
      info(`Spacing: ${designSystem.spacing.values.join(', ')}${designSystem.spacing.unit}`);

      heading('Components Detected');
      for (const comp of result.components) {
        info(`${comp.type}: ${comp.headings[0]?.text || comp.textContent.slice(0, 60)}...`);
      }

      heading('Assets');
      info(`Images: ${result.assets.filter((a) => a.type === 'image').length}`);
      info(`Fonts: ${result.fonts.length}`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

export { program };
