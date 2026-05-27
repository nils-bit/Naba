import type { ModuleDefinition, GeneratedTemplate } from '../types/hubspot-theme';
import type { DetectedComponent } from '../types/crawl-result';
import { analyzePageStructure } from '../analyzer/page-structure';

/**
 * Generate a HubL page template with drag-and-drop areas.
 */
export function generateTemplate(
  pageName: string,
  label: string,
  components: DetectedComponent[],
  modules: ModuleDefinition[],
  prefix: string,
): GeneratedTemplate {
  const structure = analyzePageStructure(components);

  // Build the DnD area content from body sections
  const dndModules = structure.bodySections
    .map((comp) => {
      const mod = modules.find((m) => m.dirName === `${comp.type}.module`);
      if (!mod) return null;
      return { component: comp, module: mod };
    })
    .filter(Boolean) as { component: DetectedComponent; module: ModuleDefinition }[];

  const dndSections = dndModules
    .map(
      ({ module }) => `      {% dnd_section %}
        {% dnd_row %}
          {% dnd_column width="12" %}
            {% dnd_module path="../modules/${module.dirName}" %}
            {% end_dnd_module %}
          {% end_dnd_column %}
        {% end_dnd_row %}
      {% end_dnd_section %}`,
    )
    .join('\n\n');

  // Check if we have Google Fonts to load
  const hasGoogleFonts = true; // We always generate a main.css that may use them

  const content = `<!--
  templateType: page
  isAvailableForNewContent: true
  enableDomainStylesheets: false
  label: ${label}
-->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {{ standard_header_includes }}
  {{ require_css(get_asset_url("../css/main.css")) }}
</head>
<body>

  {# ---- Header (outside DnD area) ---- #}
  {% module "header" path="../modules/header.module" label="Header" %}

  {# ---- Main Content (drag-and-drop area) ---- #}
  <main>
    {% dnd_area "main_content" label="Main Content" %}

${dndSections}

    {% end_dnd_area %}
  </main>

  {# ---- Footer (outside DnD area) ---- #}
  {% module "footer" path="../modules/footer.module" label="Footer" %}

  {{ require_js(get_asset_url("../js/main.js")) }}
  {{ standard_footer_includes }}
</body>
</html>`;

  return {
    filename: `${pageName}.html`,
    label,
    content,
  };
}
