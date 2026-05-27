import type { DesignSystem, NamedColor, DesignFont, SpacingScale } from '@/src/types/design-system';
import type { ThemeConfig } from '@/src/types/hubspot-theme';

export type MigrationStatus =
  | 'connecting'
  | 'crawling'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'error';

export interface StepMessage {
  step: string;
  message: string;
  timestamp: number;
}

export interface CrawlSummary {
  componentCount: number;
  colorCount: number;
  fontCount: number;
  pageTitle: string;
}

export interface AnalysisSummary {
  colors: NamedColor[];
  fonts: DesignFont[];
  spacing: SpacingScale;
  componentTypes: string[];
}

export interface ThemeSummary {
  moduleCount: number;
  templateCount: number;
  moduleNames: string[];
  themeName: string;
}

export interface MigrationState {
  status: MigrationStatus;
  sessionId: string | null;
  crawlSummary: CrawlSummary | null;
  analysisSummary: AnalysisSummary | null;
  themeSummary: ThemeSummary | null;
  error: string | null;
  messages: StepMessage[];
}

export interface DeployStatus {
  status: 'idle' | 'deploying' | 'complete' | 'error';
  message: string;
  designManagerUrl: string | null;
}
