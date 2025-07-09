import { Request, Response, Router } from 'express';
import { StreamService } from '../../services/StreamService';
import { logger } from '../../utils/logger';

const router = Router();

// Get scraper health status
router.get('/health', async (req: Request, res: Response) => {
    try {
        // This would need to be passed from the main application
        // For now, return a placeholder
        res.json({
            status: 'healthy',
            scrapers: {
                kick: true,
                tiktok: true
            },
            message: 'Scraper health check endpoint'
        });
    } catch (error) {
        logger.error('Error checking scraper health:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test a specific scraper
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { platform, username } = req.body;

        if (!platform || !username) {
            return res.status(400).json({ 
                error: 'Platform and username are required',
                required: { platform: 'kick | tiktok', username: 'string' }
            });
        }

        if (!['kick', 'tiktok'].includes(platform)) {
            return res.status(400).json({ 
                error: 'Invalid platform',
                supported: ['kick', 'tiktok']
            });
        }

        // Create a temporary stream service for testing
        const streamService = StreamService.getInstance();
        
        // Use the public getStreamerData method
        const result = await streamService.getStreamerData(platform, username);

        await streamService.close();

        return res.json({
            platform,
            username,
            result: result || { error: 'No data found or scraper failed' },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error testing scraper:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get scraper configuration
router.get('/config', async (req: Request, res: Response) => {
    try {
        const config = {
            enableKick: process.env.KICK_API_KEY !== undefined || true, // Scrapers don't need API keys
            enableTikTok: process.env.TIKTOK_API_KEY !== undefined || true,
            scrapeInterval: parseInt(process.env.STREAM_CHECK_INTERVAL || '5'),
            platforms: {
                kick: {
                    method: 'web_scraping',
                    reliability: 'medium',
                    features: ['live_status', 'viewer_count', 'title']
                },
                tiktok: {
                    method: 'web_scraping',
                    reliability: 'low',
                    features: ['live_status', 'title'],
                    notes: 'TikTok has anti-bot measures, may be unreliable'
                }
            }
        };

        res.json(config);
    } catch (error) {
        logger.error('Error getting scraper config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get scraping statistics
router.get('/stats', async (req: Request, res: Response) => {
    try {
        // This would ideally come from a metrics service
        const stats = {
            totalChecks: 0, // Would track total scraping attempts
            successfulChecks: 0,
            failedChecks: 0,
            platforms: {
                kick: {
                    checks: 0,
                    successes: 0,
                    failures: 0,
                    avgResponseTime: 0
                },
                tiktok: {
                    checks: 0,
                    successes: 0,
                    failures: 0,
                    avgResponseTime: 0
                }
            },
            lastCheck: new Date().toISOString()
        };

        res.json(stats);
    } catch (error) {
        logger.error('Error getting scraper stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
