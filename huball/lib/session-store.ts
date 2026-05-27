import type { GeneratedTheme } from '@/src/types/hubspot-theme';
import type { DesignSystem } from '@/src/types/design-system';
import type { CrawlResult } from '@/src/types/crawl-result';

export interface MigrationSession {
  theme: GeneratedTheme;
  designSystem: DesignSystem;
  crawlResult: CrawlResult;
  themeName: string;
  createdAt: number;
}

const store = new Map<string, MigrationSession>();

// Clean up sessions older than 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of store) {
      if (now - session.createdAt > 30 * 60 * 1000) {
        store.delete(id);
      }
    }
  }, 5 * 60 * 1000);
}

export const sessionStore = {
  get: (id: string) => store.get(id),
  set: (id: string, session: MigrationSession) => store.set(id, session),
  delete: (id: string) => store.delete(id),
};
