import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../../utils/logger';
import { ScrapedStreamData } from './KickScraper';

export class TikTokScraper {
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
          '--disable-web-security',
          '--disable-features=site-per-process',
          `--user-agent=${this.userAgent}`
        ]
      });
      logger.info('TikTok scraper initialized');
    } catch (error) {
      logger.error('Failed to initialize TikTok scraper:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('TikTok scraper closed');
    }
  }

  async checkStreamStatus(username: string): Promise<ScrapedStreamData> {
    const result: ScrapedStreamData = {
      username,
      isLive: false,
      platform: 'tiktok'
    };

    try {
      // Method 1: Try mobile web version first (more reliable)
      const mobileResult = await this.checkViaMobile(username);
      if (mobileResult.isLive) {
        return mobileResult;
      }

      // Method 2: Try desktop version if mobile fails
      const desktopResult = await this.checkViaDesktop(username);
      return desktopResult;
    } catch (error) {
      logger.error(`Error checking TikTok stream for ${username}:`, error);
      return result;
    }
  }

  private async checkViaMobile(username: string): Promise<ScrapedStreamData> {
    const result: ScrapedStreamData = {
      username,
      isLive: false,
      platform: 'tiktok'
    };

    try {
      const url = `https://m.tiktok.com/@${username}/live`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://m.tiktok.com/',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Check for live indicators
      const isLive = this.detectLiveStatusMobile($);
      
      if (isLive) {
        result.isLive = true;
        result.title = this.extractTitleMobile($);
        result.viewerCount = this.extractViewerCountMobile($);
      }

      logger.info(`TikTok mobile check for ${username}: ${isLive ? 'LIVE' : 'OFFLINE'}`);
      return result;
    } catch (error) {
      logger.warn(`TikTok mobile check failed for ${username}:`, error);
      return result;
    }
  }

  private async checkViaDesktop(username: string): Promise<ScrapedStreamData> {
    const result: ScrapedStreamData = {
      username,
      isLive: false,
      platform: 'tiktok'
    };

    if (!this.browser) {
      await this.init();
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page: Page = await this.browser.newPage();

    try {
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Block images and other resources to speed up loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if(req.resourceType() === 'stylesheet' || req.resourceType() === 'image'){
          req.abort();
        } else {
          req.continue();
        }
      });

      const url = `https://www.tiktok.com/@${username}/live`;
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for live status
      const streamData = await page.evaluate(() => {
        // Look for live indicators
        const liveIndicators = [
          '[data-e2e="live-badge"]',
          '.live-indicator',
          '.live-status',
          'span:contains("LIVE")',
          '.live-room-header'
        ];

        let isLive = false;
        let title = '';
        let viewerCount = 0;

        // Check for live badge
        for (const selector of liveIndicators) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.toLowerCase().includes('live')) {
            isLive = true;
            break;
          }
        }

        // Check for video player (live streams have video elements)
        const videoElements = document.querySelectorAll('video');
        if (videoElements.length > 0 && !isLive) {
          // Check if any video is playing (live content)
          for (let i = 0; i < videoElements.length; i++) {
            const video = videoElements[i];
            if (!video.paused && video.duration === Infinity) {
              isLive = true;
              break;
            }
          }
        }

        // Extract title if live
        if (isLive) {
          const titleSelectors = [
            '[data-e2e="live-title"]',
            '.live-title',
            'h1',
            '.room-title'
          ];

          for (const selector of titleSelectors) {
            const titleElement = document.querySelector(selector);
            if (titleElement?.textContent) {
              title = titleElement.textContent.trim();
              break;
            }
          }

          // Extract viewer count
          const viewerSelectors = [
            '[data-e2e="live-viewer-count"]',
            '.viewer-count',
            '.live-viewer-count'
          ];

          for (const selector of viewerSelectors) {
            const viewerElement = document.querySelector(selector);
            if (viewerElement?.textContent) {
              const match = viewerElement.textContent.match(/(\d+)/);
              if (match) {
                viewerCount = parseInt(match[1]);
                break;
              }
            }
          }
        }

        return { isLive, title: title || undefined, viewerCount: viewerCount || undefined };
      });

      result.isLive = streamData.isLive;
      if (streamData.isLive) {
        result.title = streamData.title;
        result.viewerCount = streamData.viewerCount;
      }

      logger.info(`TikTok desktop check for ${username}: ${streamData.isLive ? 'LIVE' : 'OFFLINE'}`);
      return result;
    } catch (error) {
      logger.error(`Browser scraping failed for TikTok user ${username}:`, error);
      return result;
    } finally {
      await page.close();
    }
  }

  private detectLiveStatusMobile($: cheerio.CheerioAPI): boolean {
    // Look for live indicators in mobile HTML
    const liveTexts = ['live', 'streaming', 'on air'];
    const pageText = $('body').text().toLowerCase();
    
    // Check for specific live elements
    const hasLiveElement = $('[data-e2e="live-badge"], .live-badge, .live-indicator').length > 0;
    
    // Check for video element (indicates live stream)
    const hasVideo = $('video').length > 0;
    
    // Check if page contains live-related text but not "not live" or "offline"
    const hasLiveText = liveTexts.some(text => 
      pageText.includes(text) && 
      !pageText.includes('not live') && 
      !pageText.includes('offline')
    );

    return hasLiveElement || (hasVideo && hasLiveText);
  }

  private extractTitleMobile($: cheerio.CheerioAPI): string | undefined {
    const titleSelectors = [
      '[data-e2e="live-title"]',
      '.live-title',
      'h1',
      'title'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 0 && !title.includes('TikTok')) {
        return title;
      }
    }

    return undefined;
  }

  private extractViewerCountMobile($: cheerio.CheerioAPI): number | undefined {
    const viewerSelectors = [
      '[data-e2e="live-viewer-count"]',
      '.viewer-count',
      '.live-viewer-count'
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
}
