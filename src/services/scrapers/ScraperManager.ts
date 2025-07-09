import { logger } from '../../utils/logger';
import { KickScraper, ScrapedStreamData } from './KickScraper';
import { TikTokScraper } from './TikTokScraper';

export interface ScraperConfig {
  enableKick: boolean;
  enableTikTok: boolean;
  scrapeInterval: number; // in minutes
  maxRetries: number;
  timeout: number; // in milliseconds
}

export class ScraperManager {
  private kickScraper: KickScraper;
  private tiktokScraper: TikTokScraper;
  private config: ScraperConfig;
  private isRunning: boolean = false;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      enableKick: true,
      enableTikTok: true,
      scrapeInterval: 2, // Check every 2 minutes
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    this.kickScraper = new KickScraper();
    this.tiktokScraper = new TikTokScraper();
  }

  async init(): Promise<void> {
    try {
      if (this.config.enableKick) {
        await this.kickScraper.init();
        logger.info('Kick scraper initialized');
      }

      if (this.config.enableTikTok) {
        await this.tiktokScraper.init();
        logger.info('TikTok scraper initialized');
      }

      this.isRunning = true;
      logger.info('Scraper manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scraper manager:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    this.isRunning = false;

    if (this.config.enableKick) {
      await this.kickScraper.close();
    }

    if (this.config.enableTikTok) {
      await this.tiktokScraper.close();
    }

    logger.info('Scraper manager closed');
  }

  async checkStreamStatus(platform: 'kick' | 'tiktok', username: string): Promise<ScrapedStreamData | null> {
    if (!this.isRunning) {
      logger.warn('Scraper manager is not running');
      return null;
    }

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        let result: ScrapedStreamData;

        switch (platform) {
          case 'kick':
            if (!this.config.enableKick) {
              logger.warn('Kick scraping is disabled');
              return null;
            }
            result = await this.kickScraper.checkStreamStatus(username);
            break;

          case 'tiktok':
            if (!this.config.enableTikTok) {
              logger.warn('TikTok scraping is disabled');
              return null;
            }
            result = await this.tiktokScraper.checkStreamStatus(username);
            break;

          default:
            logger.error(`Unsupported platform: ${platform}`);
            return null;
        }

        logger.info(`Stream check for ${platform}/${username}: ${result.isLive ? 'LIVE' : 'OFFLINE'}`);
        return result;
      } catch (error) {
        retries++;
        logger.error(`Error checking ${platform} stream for ${username} (attempt ${retries}/${this.config.maxRetries}):`, error);

        if (retries >= this.config.maxRetries) {
          logger.error(`Max retries reached for ${platform}/${username}`);
          return null;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }

    return null;
  }

  async checkMultipleStreams(streams: Array<{ platform: 'kick' | 'tiktok'; username: string }>): Promise<ScrapedStreamData[]> {
    const results: ScrapedStreamData[] = [];
    
    // Process streams in batches to avoid overwhelming the scrapers
    const batchSize = 3;
    for (let i = 0; i < streams.length; i += batchSize) {
      const batch = streams.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (stream) => {
        const result = await this.checkStreamStatus(stream.platform, stream.username);
        return result;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          logger.error(`Failed to check stream ${batch[index].platform}/${batch[index].username}:`, result.status === 'rejected' ? result.reason : 'Unknown error');
        }
      });

      // Wait between batches to be respectful to the platforms
      if (i + batchSize < streams.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  isInitialized(): boolean {
    return this.isRunning;
  }

  getConfig(): ScraperConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Scraper config updated:', this.config);
  }

  async healthCheck(): Promise<{ kick: boolean; tiktok: boolean; overall: boolean }> {
    const health = {
      kick: false,
      tiktok: false,
      overall: false
    };

    try {
      if (this.config.enableKick) {
        // Test with a known streamer or empty check
        const kickTest = await this.kickScraper.checkStreamStatus('test_user_health_check');
        health.kick = kickTest.platform === 'kick'; // If it returns data, scraper is working
      } else {
        health.kick = true; // Consider disabled as healthy
      }

      if (this.config.enableTikTok) {
        const tiktokTest = await this.tiktokScraper.checkStreamStatus('test_user_health_check');
        health.tiktok = tiktokTest.platform === 'tiktok';
      } else {
        health.tiktok = true; // Consider disabled as healthy
      }

      health.overall = health.kick && health.tiktok && this.isRunning;
    } catch (error) {
      logger.error('Health check failed:', error);
      health.overall = false;
    }

    return health;
  }
}

export { ScrapedStreamData } from './KickScraper';
