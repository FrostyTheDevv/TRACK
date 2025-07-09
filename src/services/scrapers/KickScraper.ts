import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../../utils/logger';

export interface ScrapedStreamData {
  username: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
  category?: string;
  platform: 'kick' | 'tiktok';
}

interface HTTPCheckResult {
  username: string;
  isLive: boolean | undefined;
  title?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
  category?: string;
  platform: 'kick' | 'tiktok';
}

export class KickScraper {
  private browser: Browser | null = null;
  private userAgent: string;

  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async init(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          `--user-agent=${this.userAgent}`
        ]
      });
      logger.info('Kick scraper initialized');
    } catch (error) {
      logger.error('Failed to initialize Kick scraper:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Kick scraper closed');
    }
  }

  async checkStreamStatus(username: string): Promise<ScrapedStreamData> {
    const result: ScrapedStreamData = {
      username,
      isLive: false,
      platform: 'kick'
    };

    try {
      // Method 1: Try direct HTTP request first (faster)
      const httpResult = await this.checkViaHTTP(username);
      if (httpResult.isLive !== undefined) {
        return {
          ...httpResult,
          isLive: httpResult.isLive || false
        };
      }

      // Method 2: Fall back to browser scraping if HTTP fails
      if (!this.browser) {
        await this.init();
      }

      const browserResult = await this.checkViaBrowser(username);
      return browserResult;
    } catch (error) {
      logger.error(`Error checking Kick stream for ${username}:`, error);
      return result;
    }
  }

  private async checkViaHTTP(username: string): Promise<HTTPCheckResult> {
    const result: HTTPCheckResult = {
      username,
      isLive: false,
      platform: 'kick'
    };

    try {
      const url = `https://kick.com/${username}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Referer': 'https://kick.com/',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Check for live indicators in the HTML
      const isLive = this.detectLiveStatus($);
      
      if (isLive) {
        result.isLive = true;
        result.title = this.extractTitle($);
        result.viewerCount = this.extractViewerCount($);
        result.thumbnailUrl = this.extractThumbnail($);
        result.category = this.extractCategory($);
      }

      logger.info(`Kick HTTP check for ${username}: ${isLive ? 'LIVE' : 'OFFLINE'}`);
      return result;
    } catch (error) {
      logger.warn(`Kick HTTP check failed for ${username}:`, error);
      return { ...result, isLive: undefined }; // Signal to try browser method
    }
  }

  private async checkViaBrowser(username: string): Promise<ScrapedStreamData> {
    const result: ScrapedStreamData = {
      username,
      isLive: false,
      platform: 'kick'
    };

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page: Page = await this.browser.newPage();

    try {
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      const url = `https://kick.com/${username}`;
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for live status
      const isLive = await page.evaluate(() => {
        // Look for live indicators
        const liveIndicators = [
          '.live-status',
          '[data-testid="live-badge"]',
          '.stream-status',
          '.live-indicator'
        ];

        for (const selector of liveIndicators) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.toLowerCase().includes('live')) {
            return true;
          }
        }

        // Check for video player
        const videoPlayer = document.querySelector('video');
        if (videoPlayer && !videoPlayer.paused) {
          return true;
        }

        // Check for offline message
        const offlineText = document.body.textContent?.toLowerCase() || '';
        if (offlineText.includes('offline') || offlineText.includes('not streaming')) {
          return false;
        }

        return false;
      });

      if (isLive) {
        result.isLive = true;
        
        result.title = await page.evaluate(() => {
          const titleSelectors = ['h1', '.stream-title', '[data-testid="stream-title"]'];
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
              return element.textContent.trim();
            }
          }
          return undefined;
        });

        result.viewerCount = await page.evaluate(() => {
          const viewerSelectors = ['.viewer-count', '[data-testid="viewer-count"]'];
          for (const selector of viewerSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
              const match = element.textContent.match(/(\d+)/);
              return match ? parseInt(match[1]) : undefined;
            }
          }
          return undefined;
        });
      }

      logger.info(`Kick browser check for ${username}: ${isLive ? 'LIVE' : 'OFFLINE'}`);
      return result;
    } catch (error) {
      logger.error(`Browser scraping failed for Kick user ${username}:`, error);
      return result;
    } finally {
      await page.close();
    }
  }

  private detectLiveStatus($: cheerio.CheerioAPI): boolean {
    // Look for various live indicators in the HTML
    const liveIndicators = [
      'live',
      'streaming',
      'online'
    ];

    const pageText = $('body').text().toLowerCase();
    const hasLiveIndicator = liveIndicators.some(indicator => 
      pageText.includes(indicator) && !pageText.includes('offline')
    );

    // Check for video elements
    const hasVideo = $('video').length > 0;
    
    // Check for specific live classes/attributes
    const hasLiveClass = $('[class*="live"], [data-live="true"]').length > 0;

    return hasLiveIndicator || (hasVideo && hasLiveClass);
  }

  private extractTitle($: cheerio.CheerioAPI): string | undefined {
    const titleSelectors = [
      'h1',
      '.stream-title',
      '[data-testid="stream-title"]',
      'title'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 0 && title !== 'Kick') {
        return title;
      }
    }

    return undefined;
  }

  private extractViewerCount($: cheerio.CheerioAPI): number | undefined {
    const viewerSelectors = [
      '.viewer-count',
      '[data-testid="viewer-count"]'
    ];

    for (const selector of viewerSelectors) {
      const text = $(selector).first().text();
      const match = text.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractThumbnail($: cheerio.CheerioAPI): string | undefined {
    const thumbnailSelectors = [
      'video[poster]',
      '.stream-thumbnail img',
      '[data-testid="stream-thumbnail"] img'
    ];

    for (const selector of thumbnailSelectors) {
      const src = $(selector).attr('src') || $(selector).attr('poster');
      if (src) {
        return src.startsWith('http') ? src : `https://kick.com${src}`;
      }
    }

    return undefined;
  }

  private extractCategory($: cheerio.CheerioAPI): string | undefined {
    const categorySelectors = [
      '.stream-category',
      '[data-testid="stream-category"]',
      '.category-name'
    ];

    for (const selector of categorySelectors) {
      const category = $(selector).first().text().trim();
      if (category && category.length > 0) {
        return category;
      }
    }

    return undefined;
  }
}
