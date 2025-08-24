import { Request, Response, Router } from 'express';
import { Streamer, StreamEvent, Subscription } from '../../models';
import { logger } from '../../utils/logger';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Temporary in‑memory stores (swap with Mongo models later)
// ─────────────────────────────────────────────────────────────
type DashboardSettings = {
  checkInterval: number;
  notificationTemplate: string;
  mentionEveryone: boolean;
  deleteOffline: boolean;
};

const settingsStore: Map<string, DashboardSettings> = new Map(); // key: "global" or guildId
const logsBuffer: Array<{ level: string; message: string; timestamp: string }> = [];

// Optional: attach to logger to capture messages (pseudo-example)
// export const attachLogSink = () => {
//   logger.on('info', (msg) => logsBuffer.push({ level: 'info', message: msg, timestamp: new Date().toISOString() }));
// };

// Defaults
const DEFAULT_SETTINGS: DashboardSettings = {
  checkInterval: 5,
  notificationTemplate:
    '🔴 **{streamer}** is now live on {platform}!\n**Game:** {game}\n**Title:** {title}\n**Link:** {url}',
  mentionEveryone: false,
  deleteOffline: false,
};

// Utility
const getSettings = (guildId?: string): DashboardSettings => {
  const key = guildId || 'global';
  return settingsStore.get(key) ?? DEFAULT_SETTINGS;
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/stats
// ─────────────────────────────────────────────────────────────
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { guild_id } = req.query;

    const totalStreamers = await Streamer.countDocuments();
    const liveStreamers = await Streamer.countDocuments({ isLive: true });
    const totalSubscriptions = guild_id
      ? await Subscription.countDocuments({ guildId: guild_id })
      : await Subscription.countDocuments();

    const platformStats = await Streamer.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = await StreamEvent.countDocuments({ timestamp: { $gte: since } });
    const liveEvents = await StreamEvent.countDocuments({ eventType: 'live', timestamp: { $gte: since } });

    return res.json({
      data: {
        overview: {
          totalStreamers,
          liveStreamers,
          totalSubscriptions,
          recentEvents,
          liveEventsToday: liveEvents,
        },
        platforms: platformStats,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/live
// ─────────────────────────────────────────────────────────────
router.get('/live', async (req: Request, res: Response) => {
  try {
    const { guild_id } = req.query;

    let liveStreamers;
    if (guild_id) {
      const subs = await Subscription.find({ guildId: guild_id }).select('streamerId');
      const streamerIds = subs.map((s: any) => s.streamerId);
      liveStreamers = await Streamer.find({ isLive: true, _id: { $in: streamerIds } }).sort({
        lastStreamStarted: -1,
      });
    } else {
      liveStreamers = await Streamer.find({ isLive: true }).sort({ lastStreamStarted: -1 });
    }

    const withCounts = await Promise.all(
      liveStreamers.map(async (s: any) => {
        const subCount = await Subscription.countDocuments({
          streamerId: s._id,
          ...(guild_id ? { guildId: guild_id } : {}),
        });
        return { ...s.toObject(), subscriptionCount: subCount };
      })
    );

    return res.json({ data: withCounts });
  } catch (error) {
    logger.error('Error fetching live streamers:', error);
    return res.status(500).json({ error: 'Failed to fetch live streamers' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/recent-events
// ─────────────────────────────────────────────────────────────
router.get('/recent-events', async (req: Request, res: Response) => {
  try {
    const { limit = 20, guild_id } = req.query;

    let streamerIds: string[] | undefined;
    if (guild_id) {
      const subs = await Subscription.find({ guildId: guild_id }).select('streamerId');
      streamerIds = subs.map((s: any) => String(s.streamerId));
    }

    const filter: any = streamerIds ? { streamerId: { $in: streamerIds } } : {};
    const events = await StreamEvent.find(filter)
      .populate('streamerId')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string, 10));

    return res.json({ data: events });
  } catch (error) {
    logger.error('Error fetching recent events:', error);
    return res.status(500).json({ error: 'Failed to fetch recent events' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/guild/:guildId
// ─────────────────────────────────────────────────────────────
router.get('/guild/:guildId', async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;

    const subscriptions = await Subscription.find({ guildId }).populate('streamerId');

    // Group by channel
    const channelGroups = subscriptions.reduce((acc: any, sub: any) => {
      const channelId = sub.channelId;
      if (!acc[channelId]) acc[channelId] = { channelId, subscriptions: [] };
      acc[channelId].subscriptions.push(sub);
      return acc;
    }, {});

    const streamerIds = subscriptions.map((sub: any) => (sub.streamerId?._id ?? sub.streamerId));
    const liveStreamers = await Streamer.find({ _id: { $in: streamerIds }, isLive: true });

    const platformCounts: Record<string, number> = {};
    subscriptions.forEach((sub: any) => {
      const platform = sub.streamerId?.platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    return res.json({
      data: {
        subscriptions,
        channelGroups: Object.values(channelGroups),
        liveStreamers,
        platformStats: Object.entries(platformCounts).map(([platform, count]) => ({ _id: platform, count })),
        totalSubscriptions: subscriptions.length,
        totalLive: liveStreamers.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching guild dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch guild dashboard' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/dashboard/refresh
// ─────────────────────────────────────────────────────────────
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    // Hook your stream monitor here if you have one.
    return res.json({ data: { message: 'Refresh triggered successfully', timestamp: new Date() } });
  } catch (error) {
    logger.error('Error triggering refresh:', error);
    return res.status(500).json({ error: 'Failed to trigger refresh' });
  }
});

// ─────────────────────────────────────────────────────────────
// NEW: GET /api/dashboard/settings
// ─────────────────────────────────────────────────────────────
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const guildId = (req.query.guild_id as string) || undefined;
    const settings = getSettings(guildId);
    return res.json({ data: settings });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ─────────────────────────────────────────────────────────────
// NEW: PUT /api/dashboard/settings
// ─────────────────────────────────────────────────────────────
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const guildId = (req.query.guild_id as string) || undefined;
    const current = getSettings(guildId);

    const next: DashboardSettings = {
      checkInterval: Number.isFinite(req.body.checkInterval) ? req.body.checkInterval : current.checkInterval,
      notificationTemplate:
        typeof req.body.notificationTemplate === 'string'
          ? req.body.notificationTemplate
          : current.notificationTemplate,
      mentionEveryone:
        typeof req.body.mentionEveryone === 'boolean' ? req.body.mentionEveryone : current.mentionEveryone,
      deleteOffline:
        typeof req.body.deleteOffline === 'boolean' ? req.body.deleteOffline : current.deleteOffline,
    };

    settingsStore.set(guildId || 'global', next);
    return res.json({ data: next });
  } catch (error) {
    logger.error('Error saving settings:', error);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ─────────────────────────────────────────────────────────────
// NEW: GET /api/dashboard/logs
// ─────────────────────────────────────────────────────────────
router.get('/logs', async (_req: Request, res: Response) => {
  try {
    // Basic stub. If you have a Log model, fetch & normalize here.
    // You can push into logsBuffer from your logger to surface messages.
    return res.json({
      data: logsBuffer.slice(-500), // last 500 entries
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export { router as dashboardRouter };

