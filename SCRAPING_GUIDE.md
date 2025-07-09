# Web Scraping Implementation for Kick and TikTok

This documentation covers the web scraping implementation for Kick and TikTok live stream detection, since both platforms have limited or no official APIs for live stream status.

## Overview

The scraping system consists of:
- **KickScraper**: Handles Kick.com live stream detection
- **TikTokScraper**: Handles TikTok live stream detection  
- **ScraperManager**: Coordinates both scrapers and provides a unified interface

## Architecture

```
StreamService
    ├── TwitchAPI (Official API)
    ├── YouTubeAPI (Official API)
    └── ScraperManager
         ├── KickScraper (Web Scraping)
         └── TikTokScraper (Web Scraping)
```

## Features

### KickScraper
- **Dual Method Approach**: HTTP requests first, Puppeteer fallback
- **Data Extraction**: Live status, stream title, viewer count, thumbnails
- **Reliability**: Medium-High (Kick has less anti-bot protection)
- **Speed**: Fast HTTP requests, slower browser fallback

### TikTokScraper
- **Mobile-First**: Tries mobile site first (more reliable)
- **Desktop Fallback**: Browser automation for desktop site
- **Data Extraction**: Live status, stream title, viewer count
- **Reliability**: Low-Medium (TikTok has strong anti-bot measures)
- **Speed**: Slower due to anti-bot circumvention

## Technical Implementation

### Dependencies
```json
{
  "puppeteer": "Browser automation",
  "axios": "HTTP requests", 
  "cheerio": "HTML parsing"
}
```

### Environment Variables
```env
# Scraping is enabled by default, no API keys needed
STREAM_CHECK_INTERVAL=5  # Check every 5 minutes
```

### API Endpoints

#### Test Scrapers
```http
POST /api/scrapers/test
Content-Type: application/json

{
  "platform": "kick",
  "username": "streamer_name"
}
```

#### Health Check
```http
GET /api/scrapers/health
```

#### Configuration
```http
GET /api/scrapers/config
```

#### Statistics
```http
GET /api/scrapers/stats
```

## Usage Examples

### Direct Scraper Usage
```typescript
import { ScraperManager } from './services/scrapers/ScraperManager';

const scraperManager = new ScraperManager({
  enableKick: true,
  enableTikTok: true,
  scrapeInterval: 2,
  maxRetries: 3
});

await scraperManager.init();

// Check single stream
const result = await scraperManager.checkStreamStatus('kick', 'username');

// Check multiple streams
const streams = [
  { platform: 'kick', username: 'streamer1' },
  { platform: 'tiktok', username: 'streamer2' }
];
const results = await scraperManager.checkMultipleStreams(streams);

await scraperManager.close();
```

### Through StreamService
```typescript
import { StreamService } from './services/StreamService';

const streamService = new StreamService();

// Works seamlessly with other platforms
const kickData = await streamService.getStreamerData('kick', 'username');
const tiktokData = await streamService.getStreamerData('tiktok', 'username');

await streamService.close();
```

## Reliability & Limitations

### Kick.com
- **Reliability**: ~85% success rate
- **Speed**: 2-5 seconds per check
- **Limitations**: 
  - May occasionally fail during site updates
  - Rate limiting possible with excessive requests
- **Best Practices**: 
  - Check every 2-5 minutes per streamer
  - Use HTTP method first

### TikTok
- **Reliability**: ~60% success rate
- **Speed**: 5-15 seconds per check
- **Limitations**:
  - Strong anti-bot detection
  - Frequent site structure changes
  - May require CAPTCHA solving
  - Geographic restrictions
- **Best Practices**:
  - Check every 5+ minutes per streamer
  - Limit concurrent requests
  - Consider as supplementary to main platforms

## Error Handling

### Retry Logic
- 3 retry attempts with exponential backoff
- Different strategies for different error types
- Graceful degradation when scrapers fail

### Monitoring
- Health checks for each scraper
- Success/failure statistics
- Performance metrics tracking

### Fallback Strategies
- Kick: HTTP → Browser → Disable temporarily
- TikTok: Mobile → Desktop → Disable temporarily

## Anti-Detection Measures

### User Agent Rotation
```typescript
// Realistic browser user agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1) Safari/604.1'
];
```

### Request Headers
```typescript
const headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Referer': 'https://platform.com/',
  'Connection': 'keep-alive'
};
```

### Rate Limiting
- Batch processing (3 streams at a time)
- Delays between requests
- Respect for robots.txt guidelines

## Legal Considerations

### Terms of Service
- Scraping public data only
- No circumvention of paid content
- Respectful request patterns
- No data storage beyond operational needs

### Best Practices
- Check platform ToS regularly
- Implement opt-out mechanisms
- Monitor for cease-and-desist requests
- Consider fair use principles

## Performance Optimization

### Caching
- Stream status cached for 1-2 minutes
- Avoid redundant checks for same streamer
- Cache negative results to prevent spam

### Resource Management
- Browser instance pooling
- Memory cleanup after checks
- Timeout controls for stuck requests

### Concurrent Processing
```typescript
// Process in batches to avoid overwhelming platforms
const batchSize = 3;
const results = await Promise.allSettled(batchPromises);
```

## Monitoring & Maintenance

### Key Metrics
- Success rate per platform
- Average response time
- Error patterns and frequency
- Resource usage (memory, CPU)

### Maintenance Tasks
- Regular testing with known streamers
- Updating selectors when sites change
- Performance tuning based on metrics
- User agent and header updates

### Alerting
- Scraper failure alerts
- Performance degradation warnings
- Success rate drop notifications

## Future Improvements

### Planned Features
- Machine learning for better element detection
- Proxy rotation support
- CAPTCHA solving integration
- Mobile app API reverse engineering

### Platform Expansion
- Instagram Live scraping
- Facebook Gaming detection
- Other streaming platforms as needed

### Performance
- Edge computing for faster checks
- CDN-based scraping infrastructure
- Real-time WebSocket monitoring

## Troubleshooting

### Common Issues

1. **Scraper Returns No Data**
   - Check if platform changed their HTML structure
   - Verify user agent is not blocked
   - Test with known live streamers

2. **High Failure Rate**
   - Reduce check frequency
   - Update user agents
   - Check for IP blocking

3. **Slow Performance**
   - Monitor browser memory usage
   - Restart browser instances periodically
   - Optimize selector strategies

### Debug Mode
```typescript
const scraperManager = new ScraperManager({
  // Enable debug logging
  logLevel: 'debug'
});
```

### Testing
```bash
# Test individual scrapers
npm run test:scrapers

# Test specific platform
npm run test:kick
npm run test:tiktok
```

## Conclusion

The web scraping implementation provides reliable live stream detection for platforms without official APIs. While more complex than API-based solutions, it extends the bot's coverage to important streaming platforms and maintains good performance through careful optimization and error handling.

Regular maintenance and monitoring are essential for long-term reliability, as streaming platforms frequently update their interfaces and anti-bot measures.
