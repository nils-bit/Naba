export interface HuballConfig {
  authorName: string;
  authorUrl: string;
  defaultOutput: string;
  crawl: {
    timeout: number;
    retries: number;
    viewports: { width: number; height: number }[];
    waitForNetworkIdle: boolean;
  };
  deploy: {
    environment: 'draft' | 'published';
    rateLimit: { maxPerInterval: number; interval: number };
    extractionTimeout: number;
  };
}

export const DEFAULT_CONFIG: HuballConfig = {
  authorName: 'Huball',
  authorUrl: 'https://github.com/huball',
  defaultOutput: './output',
  crawl: {
    timeout: 30000,
    retries: 3,
    viewports: [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 812 },
    ],
    waitForNetworkIdle: true,
  },
  deploy: {
    environment: 'draft',
    rateLimit: { maxPerInterval: 180, interval: 10000 },
    extractionTimeout: 300000,
  },
};
