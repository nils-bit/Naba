/**
 * Token bucket rate limiter for HubSpot API.
 * Default: 180 requests per 10 seconds (slightly under the 190 limit).
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: (() => void)[] = [];

  constructor(
    private maxTokens: number = 180,
    private intervalMs: number = 10000,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.intervalMs) {
      const intervals = Math.floor(elapsed / this.intervalMs);
      this.tokens = Math.min(this.maxTokens, this.tokens + intervals * this.maxTokens);
      this.lastRefill += intervals * this.intervalMs;
    }
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Wait until next refill
    const waitTime = this.intervalMs - (Date.now() - this.lastRefill);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.refill();
        this.tokens--;
        resolve();
      }, waitTime);
    });
  }
}
