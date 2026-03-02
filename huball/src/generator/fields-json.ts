import type { DesignSystem } from '../types/design-system';
import type { HubSpotField } from '../types/hubspot-theme';

export function generateFieldsJson(designSystem: DesignSystem): HubSpotField[] {
  const colorFields: HubSpotField[] = designSystem.colors.map((color) => ({
    type: 'color',
    name: `color_${color.name}`,
    label: color.label,
    default: { color: color.value, opacity: 100 },
  }));

  const fontFields: HubSpotField[] = designSystem.fonts.map((font) => ({
    type: 'font',
    name: `font_${font.role}`,
    label: `${font.role === 'heading' ? 'Heading' : 'Body'} Font`,
    default: {
      font: font.family,
      fallback: font.fallback,
      font_set: font.isGoogle ? 'GOOGLE' : 'DEFAULT',
      size: parseInt(font.sizes[0]) || (font.role === 'heading' ? 32 : 16),
      size_unit: 'px',
    },
  }));

  const spacingField: HubSpotField = {
    type: 'number',
    name: 'section_spacing',
    label: 'Section Spacing',
    default: designSystem.spacing.values[Math.floor(designSystem.spacing.values.length / 2)] || 48,
    help_text: 'Vertical spacing between sections (px)',
  };

  const maxWidthField: HubSpotField = {
    type: 'number',
    name: 'max_content_width',
    label: 'Max Content Width',
    default: 1200,
    help_text: 'Maximum width of content area (px)',
  };

  const borderRadiusField: HubSpotField = {
    type: 'number',
    name: 'border_radius',
    label: 'Border Radius',
    default: parseInt(designSystem.borderRadius.values[0]) || 8,
    help_text: 'Default border radius for cards and buttons (px)',
  };

  return [
    {
      type: 'group',
      name: 'colors',
      label: 'Colors',
      children: colorFields,
    },
    {
      type: 'group',
      name: 'typography',
      label: 'Typography',
      children: fontFields,
    },
    {
      type: 'group',
      name: 'layout',
      label: 'Layout',
      children: [spacingField, maxWidthField, borderRadiusField],
    },
  ];
}
