import { RateLimiter } from './rate-limiter';
import { debug } from '../utils/logger';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

export interface ApiError {
  status: number;
  message: string;
  category?: string;
}

export class HubSpotApiClient {
  private rateLimiter: RateLimiter;

  constructor(
    private token: string,
    private portalId: string,
  ) {
    this.rateLimiter = new RateLimiter();
  }

  // ---- Source Code API ----

  /**
   * Upload a single file to the CMS Source Code API.
   */
  async uploadFile(
    environment: 'draft' | 'published',
    path: string,
    content: Buffer,
    filename: string,
  ): Promise<void> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/source-code/${environment}/content/${path}`;

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(content)]), filename);

    await this.request('PUT', url, formData);
    debug(`Uploaded: ${path}`);
  }

  /**
   * Upload a ZIP file containing a theme.
   */
  async uploadZip(path: string, zipBuffer: Buffer): Promise<void> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/source-code/draft/content/${path}`;

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(zipBuffer)]), path.split('/').pop() || 'theme.zip');

    await this.request('PUT', url, formData);
    debug(`Uploaded ZIP: ${path}`);
  }

  /**
   * Extract a previously uploaded ZIP file.
   */
  async extractZip(path: string): Promise<void> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/source-code/extract/${path}`;
    await this.request('POST', url);
    debug(`Extract initiated: ${path}`);
  }

  /**
   * Validate a file in the CMS.
   */
  async validateFile(
    environment: 'draft' | 'published',
    path: string,
  ): Promise<{ errors: string[] }> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/source-code/${environment}/validate/${path}`;
    return this.request('POST', url);
  }

  /**
   * Delete a file from the CMS.
   */
  async deleteFile(environment: 'draft' | 'published', path: string): Promise<void> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/source-code/${environment}/content/${path}`;
    await this.request('DELETE', url);
    debug(`Deleted: ${path}`);
  }

  // ---- Files API (images/assets) ----

  /**
   * Upload a file to the HubSpot file manager.
   */
  async uploadAsset(
    fileBuffer: Buffer,
    filename: string,
    folderPath: string,
  ): Promise<{ id: string; url: string }> {
    const url = `${HUBSPOT_API_BASE}/files/v3/files`;

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(fileBuffer)]), filename);
    formData.append('fileName', filename);
    formData.append('folderPath', folderPath);
    formData.append(
      'options',
      JSON.stringify({
        access: 'PUBLIC_NOT_INDEXED',
        overwrite: true,
        duplicateValidationStrategy: 'NONE',
      }),
    );

    const result = await this.request('POST', url, formData);
    return { id: result.id, url: result.url };
  }

  // ---- Pages API ----

  /**
   * Create a page in HubSpot.
   */
  async createPage(data: {
    name: string;
    slug: string;
    templatePath: string;
  }): Promise<{ id: string }> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/pages/site-pages`;
    return this.request('POST', url, JSON.stringify(data), {
      'Content-Type': 'application/json',
    });
  }

  // ---- URL Redirects API ----

  /**
   * Create a 301 redirect.
   */
  async createRedirect(
    routePrefix: string,
    destination: string,
  ): Promise<{ id: string }> {
    const url = `${HUBSPOT_API_BASE}/cms/v3/url-redirects`;
    return this.request(
      'POST',
      url,
      JSON.stringify({
        routePrefix,
        destination,
        redirectStyle: 301,
      }),
      { 'Content-Type': 'application/json' },
    );
  }

  // ---- Internal request handler ----

  private async request(
    method: string,
    url: string,
    body?: FormData | string,
    extraHeaders?: Record<string, string>,
  ): Promise<any> {
    await this.rateLimiter.acquire();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      ...extraHeaders,
    };

    let retries = 3;
    while (retries > 0) {
      debug(`${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
      });

      if (response.ok) {
        const text = await response.text();
        if (!text) return {};
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      }

      // Rate limited
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10');
        debug(`Rate limited. Retrying after ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        retries--;
        continue;
      }

      // Server error — retry
      if (response.status >= 500) {
        debug(`Server error ${response.status}. Retrying...`);
        await sleep(2000 * (4 - retries));
        retries--;
        continue;
      }

      // Client error — don't retry
      const errorBody = await response.text().catch(() => '');
      let errorMsg = `HubSpot API error ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.message || errorMsg;
      } catch {
        if (errorBody) errorMsg += `: ${errorBody.slice(0, 200)}`;
      }

      if (response.status === 401) {
        throw new Error(
          'Invalid or expired HubSpot token. Create a private app at: Settings > Integrations > Private Apps',
        );
      }

      throw new Error(errorMsg);
    }

    throw new Error('Max retries exceeded for HubSpot API request');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
