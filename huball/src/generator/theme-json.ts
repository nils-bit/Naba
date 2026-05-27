import type { ThemeConfig } from '../types/hubspot-theme';

export function generateThemeJson(config: ThemeConfig): Record<string, unknown> {
  return {
    label: config.label,
    preview_path: './templates/home.html',
    screenshot_path: './img/screenshot.png',
    enable_domain_stylesheets: false,
    responsive_breakpoints: [
      {
        name: 'mobile',
        mediaQuery: '(max-width: 767px)',
        previewWidth: { value: 375, units: 'px' },
      },
      {
        name: 'tablet',
        mediaQuery: '(min-width: 768px) and (max-width: 1023px)',
        previewWidth: { value: 768, units: 'px' },
      },
    ],
    author: {
      name: config.authorName,
      url: config.authorUrl,
    },
    is_available_for_new_content: true,
  };
}
