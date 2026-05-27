export interface ThemeConfig {
  name: string;
  label: string;
  prefix: string;
  authorName: string;
  authorUrl: string;
  version: string;
}

export interface ModuleDefinition {
  dirName: string;
  label: string;
  metaJson: ModuleMeta;
  fieldsJson: HubSpotField[];
  moduleHtml: string;
  moduleCss: string;
  moduleJs?: string;
}

export interface ModuleMeta {
  label: string;
  is_available_for_new_content: boolean;
  global?: boolean;
  icon?: string;
  content_types?: string[];
  categories?: string[];
}

export type HubSpotFieldType =
  | 'text'
  | 'richtext'
  | 'image'
  | 'link'
  | 'url'
  | 'color'
  | 'font'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'group'
  | 'alignment'
  | 'spacing'
  | 'background_image';

export interface HubSpotField {
  type: HubSpotFieldType;
  name: string;
  label: string;
  required?: boolean;
  default?: unknown;
  help_text?: string;
  children?: HubSpotField[];
  choices?: { label: string; value: string }[];
}

export interface GeneratedTheme {
  config: ThemeConfig;
  themeJson: Record<string, unknown>;
  fieldsJson: HubSpotField[];
  mainCss: string;
  mainJs: string;
  modules: ModuleDefinition[];
  templates: GeneratedTemplate[];
}

export interface GeneratedTemplate {
  filename: string;
  label: string;
  content: string;
}
