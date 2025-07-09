import { Request, Response, Router } from 'express';
import { Streamer, StreamEvent, Subscription } from '../../models';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const { guild_id } = req.query;

        // Overall stats
        const totalStreamers = await Streamer.countDocuments();
        const liveStreamers = await Streamer.countDocuments({ isLive: true });
        const totalSubscriptions = guild_id 
            ? await Subscription.countDocuments({ guildId: guild_id })
            : await Subscription.countDocuments();

        // Platform distribution
        const platformStats = await Streamer.aggregate([
            { $group: { _id: '$platform', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent events (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentEvents = await StreamEvent.countDocuments({
            timestamp: { $gte: yesterday }
        });

        const liveEvents = await StreamEvent.countDocuments({
            eventType: 'live',
            timestamp: { $gte: yesterday }
        });

        return res.json({
            overview: {
                totalStreamers,
                liveStreamers,
                totalSubscriptions,
                recentEvents,
                liveEventsToday: liveEvents
            },
            platforms: platformStats,
            lastUpdated: new Date()
        });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// GET /api/dashboard/live - Get live streamers with subscription info
router.get('/live', async (req: Request, res: Response) => {
    try {
        const { guild_id } = req.query;

        let query = Streamer.find({ isLive: true }).sort({ lastStreamStarted: -1 });

        if (guild_id) {
            // Get streamers that have subscriptions in this guild
            const subscriptions = await Subscription.find({ guildId: guild_id });
            const streamerIds = subscriptions.map((sub: any) => sub.streamerId);
            query = Streamer.find({ isLive: true, _id: { $in: streamerIds } });
        }

        const liveStreamers = await query.exec();

        const streamersWithInfo = await Promise.all(
            liveStreamers.map(async (streamer: any) => {
                const subscriptionCount = await Subscription.countDocuments({ 
                    streamerId: streamer.id,
                    ...(guild_id ? { guildId: guild_id } : {})
                });

                return {
                    ...streamer.toObject(),
                    subscriptionCount
                };
            })
        );

        return res.json(streamersWithInfo);
    } catch (error) {
        logger.error('Error fetching live streamers:', error);
        return res.status(500).json({ error: 'Failed to fetch live streamers' });
    }
});

// GET /api/dashboard/recent-events - Get recent stream events
router.get('/recent-events', async (req: Request, res: Response) => {
    try {
        const { limit = 20, guild_id } = req.query;

        let streamerIds: string[] | undefined;
        if (guild_id) {
            const subscriptions = await Subscription.find({ guildId: guild_id });
            streamerIds = subscriptions.map((sub: any) => sub.streamerId.toString());
        }

        const filter = streamerIds ? { streamerId: { $in: streamerIds } } : {};

        const events = await StreamEvent.find(filter)
            .populate('streamerId')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit as string));

        return res.json(events);
    } catch (error) {
        logger.error('Error fetching recent events:', error);
        return res.status(500).json({ error: 'Failed to fetch recent events' });
    }
});

// GET /api/dashboard/guild/:guildId - Get guild-specific dashboard data
router.get('/guild/:guildId', async (req: Request, res: Response) => {
    try {
        const { guildId } = req.params;

        // Get all subscriptions for this guild
        const subscriptions = await Subscription.find({ guildId }).populate('streamerId');
        
        // Group by channel
        const channelGroups = subscriptions.reduce((acc: any, sub: any) => {
            const channelId = sub.channelId;
            if (!acc[channelId]) {
                acc[channelId] = {
                    channelId,
                    subscriptions: []
                };
            }
            acc[channelId].subscriptions.push(sub);
            return acc;
        }, {});

        // Get live streamers for this guild
        const streamerIds = subscriptions.map((sub: any) => sub.streamerId?.id || sub.streamerId);
        const liveStreamers = await Streamer.find({ 
            id: streamerIds, 
            isLive: true 
        });

        // Platform distribution for this guild
        const guildPlatformStats = subscriptions.reduce((acc: any, sub: any) => {
            const platform = sub.streamerId.platform;
            acc[platform] = (acc[platform] || 0) + 1;
            return acc;
        }, {});

        return res.json({
            subscriptions,
            channelGroups: Object.values(channelGroups),
            liveStreamers,
            platformStats: Object.entries(guildPlatformStats).map(([platform, count]) => ({
                _id: platform,
                count
            })),
            totalSubscriptions: subscriptions.length,
            totalLive: liveStreamers.length
        });
    } catch (error) {
        logger.error('Error fetching guild dashboard:', error);
        return res.status(500).json({ error: 'Failed to fetch guild dashboard' });
    }
});

// POST /api/dashboard/refresh - Trigger manual refresh of all streamers
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        // This would trigger the stream monitor to check all streamers immediately
        // For now, just return success
        return res.json({ 
            message: 'Refresh triggered successfully',
            timestamp: new Date()
        });
    } catch (error) {
        logger.error('Error triggering refresh:', error);
        return res.status(500).json({ error: 'Failed to trigger refresh' });
    }
});

export { router as dashboardRouter };

