import { Request, Response, Router } from 'express';
import { Streamer, StreamEvent, Subscription } from '../../models';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/data-export/export - Export all data for GitHub Pages
router.get('/export', async (req: Request, res: Response) => {
    try {
        logger.debug('Exporting data for GitHub Pages dashboard');

        // Get all streamers
        const streamers = await Streamer.find();
        
        // Get all subscriptions with basic info
        const subscriptions = await Subscription.find();
        
        // Get recent events (last 50)
        const events = await StreamEvent.find()
            .sort({ timestamp: -1 })
            .limit(50);

        // Calculate statistics
        const stats = {
            totalStreamers: streamers.length,
            liveStreamers: streamers.filter((s: any) => s.isLive).length,
            totalSubscriptions: subscriptions.length,
            recentEvents: events.length,
            platformDistribution: streamers.reduce((acc: any, streamer: any) => {
                acc[streamer.platform] = (acc[streamer.platform] || 0) + 1;
                return acc;
            }, {}),
            lastUpdated: new Date().toISOString()
        };

        const exportData = {
            timestamp: new Date().toISOString(),
            streamers: streamers.map((s: any) => ({
                id: s.id,
                platform: s.platform,
                username: s.username,
                displayName: s.displayName,
                avatarUrl: s.avatarUrl,
                isLive: s.isLive,
                streamTitle: s.streamTitle,
                viewerCount: s.viewerCount,
                followers: s.followers,
                lastChecked: s.lastChecked,
                lastStreamStarted: s.lastStreamStarted,
                lastStreamUrl: s.lastStreamUrl
            })),
            subscriptions: subscriptions.map((s: any) => ({
                id: s.id,
                guildId: s.guildId,
                channelId: s.channelId,
                streamerId: s.streamerId,
                isActive: s.isActive,
                customMessage: s.customMessage,
                createdAt: s.createdAt
            })),
            events: events.map((e: any) => ({
                id: e.id,
                streamerId: e.streamerId,
                eventType: e.eventType,
                timestamp: e.timestamp,
                streamTitle: e.streamTitle,
                viewerCount: e.viewerCount,
                createdAt: e.createdAt
            })),
            stats
        };

        // Set headers for GitHub Actions
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache'
        });

        res.json(exportData);
        logger.debug(`Exported ${streamers.length} streamers, ${subscriptions.length} subscriptions, ${events.length} events`);

    } catch (error) {
        logger.error('Error exporting data:', error);
        res.status(500).json({
            error: 'Failed to export data',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/data-export/health - Simple health check for GitHub Actions
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Stream Tracker Bot Data Export'
    });
});

export { router as dataExportRouter };
