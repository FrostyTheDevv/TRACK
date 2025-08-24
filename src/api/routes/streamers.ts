import { Request, Response, Router } from 'express';
import { Streamer, Subscription } from '../../models';
import { StreamService } from '../../services/StreamService';
import { logger } from '../../utils/logger';

const router = Router();
const streamService = StreamService.getInstance();

// GET /api/streamers - Get all streamers (optionally filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { platform, live_only, limit = 50, offset = 0 } = req.query;

    const filter: Record<string, any> = {};
    if (platform) filter.platform = platform;
    if (live_only === 'true') filter.isLive = true;

    const lim = parseInt(limit as string, 10);
    const off = parseInt(offset as string, 10);

    const streamers = await Streamer.find(filter)
      .sort({ lastChecked: -1 })
      .limit(lim)
      .skip(off);

    const total = await Streamer.countDocuments(filter);

    return res.json({
      data: streamers, // ← normalized for the dashboard
      pagination: {
        total,
        limit: lim,
        offset: off,
        hasMore: total > off + lim
      }
    });
  } catch (error) {
    logger.error('Error fetching streamers:', error);
    return res.status(500).json({ error: 'Failed to fetch streamers' });
  }
});

// GET /api/streamers/:id - Get specific streamer
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const streamer = await Streamer.findById(req.params.id);
    if (!streamer) return res.status(404).json({ error: 'Streamer not found' });

    const subscriptionCount = await Subscription.countDocuments({ streamerId: streamer.id });

    return res.json({
      data: {
        ...streamer.toObject(),
        subscriptionCount
      }
    });
  } catch (error) {
    logger.error('Error fetching streamer:', error);
    return res.status(500).json({ error: 'Failed to fetch streamer' });
  }
});

// POST /api/streamers - Add new streamer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { platform, username } = req.body;

    if (!platform || !username) {
      return res.status(400).json({ error: 'Platform and username are required' });
    }

    const existingStreamer = await Streamer.findOne({
      platform,
      username: username.toLowerCase()
    });
    if (existingStreamer) {
      return res.status(409).json({
        error: 'Streamer already exists',
        data: existingStreamer
      });
    }

    const streamerData = await streamService.getStreamerData(platform, username);
    if (!streamerData) {
      return res.status(404).json({ error: 'Streamer not found on platform' });
    }

    const streamer = new Streamer({
      username: username.toLowerCase(),
      displayName: streamerData.displayName,
      platform,
      platformId: streamerData.id,
      isLive: streamerData.isLive,
      lastStreamTitle: streamerData.streamTitle,
      lastStreamUrl: streamerData.streamUrl,
      lastStreamThumbnail: streamerData.thumbnailUrl,
      lastStreamStarted: streamerData.startedAt,
      avatarUrl: streamerData.avatarUrl,
      followers: streamerData.followers || 0
    });

    await streamer.save();

    return res.status(201).json({ data: streamer });
  } catch (error) {
    logger.error('Error creating streamer:', error);
    return res.status(500).json({ error: 'Failed to create streamer' });
  }
});

// PUT /api/streamers/:id - Update streamer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const streamer = await Streamer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!streamer) return res.status(404).json({ error: 'Streamer not found' });
    return res.json({ data: streamer });
  } catch (error) {
    logger.error('Error updating streamer:', error);
    return res.status(500).json({ error: 'Failed to update streamer' });
  }
});

// DELETE /api/streamers/:id - Delete streamer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const streamer = await Streamer.findById(req.params.id);
    if (!streamer) return res.status(404).json({ error: 'Streamer not found' });

    await Subscription.deleteMany({ streamerId: streamer.id });
    await streamer.deleteOne();

    return res.json({ ok: true });
  } catch (error) {
    logger.error('Error deleting streamer:', error);
    return res.status(500).json({ error: 'Failed to delete streamer' });
  }
});

// POST /api/streamers/:id/check - Manually check stream status
router.post('/:id/check', async (req: Request, res: Response) => {
  try {
    const streamer = await Streamer.findById(req.params.id);
    if (!streamer) return res.status(404).json({ error: 'Streamer not found' });

    const currentStatus = await streamService.checkStreamStatus(
      streamer.platform,
      streamer.platformId,
      streamer.username
    );
    if (!currentStatus) {
      return res.status(503).json({ error: 'Unable to check stream status' });
    }

    streamer.isLive = currentStatus.isLive;
    streamer.lastStreamTitle = currentStatus.streamTitle;
    streamer.lastStreamUrl = currentStatus.streamUrl;
    streamer.lastStreamThumbnail = currentStatus.thumbnailUrl;
    streamer.lastChecked = new Date();
    if (currentStatus.isLive && !streamer.lastStreamStarted) {
      streamer.lastStreamStarted = currentStatus.startedAt || new Date();
    }

    await streamer.save();
    return res.json({ data: streamer });
  } catch (error) {
    logger.error('Error checking stream status:', error);
    return res.status(500).json({ error: 'Failed to check stream status' });
  }
});

// (Optional) GET /api/streamers/live - live-only list
router.get('/live', async (_req: Request, res: Response) => {
  try {
    const lives = await Streamer.find({ isLive: true }).sort({ lastChecked: -1 });
    return res.json({ data: lives });
  } catch (error) {
    logger.error('Error fetching live streamers:', error);
    return res.status(500).json({ error: 'Failed to fetch live streamers' });
  }
});

export { router as streamersRouter };

