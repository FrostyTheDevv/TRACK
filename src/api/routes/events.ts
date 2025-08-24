import { Request, Response, Router } from 'express';
import { StreamEvent } from '../../models';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/events - Get stream events
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      streamer_id,
      event_type,
      limit = 50,
      offset = 0,
      start_date,
      end_date,
    } = req.query;

    const filter: Record<string, any> = {};
    if (streamer_id) filter.streamerId = streamer_id;
    if (event_type) filter.eventType = event_type;

    if (start_date || end_date) {
      filter.timestamp = {};
      if (start_date) filter.timestamp.$gte = new Date(start_date as string);
      if (end_date) filter.timestamp.$lte = new Date(end_date as string);
    }

    const lim = parseInt(limit as string, 10);
    const off = parseInt(offset as string, 10);

    const events = await StreamEvent.find(filter)
      .populate('streamerId')
      .sort({ timestamp: -1 })
      .limit(lim)
      .skip(off);

    const total = await StreamEvent.countDocuments(filter);

    return res.json({
      data: events,
      pagination: {
        total,
        limit: lim,
        offset: off,
        hasMore: total > off + lim,
      },
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get specific event
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await StreamEvent.findById(req.params.id).populate('streamerId');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json({ data: event });
  } catch (error) {
    logger.error('Error fetching event:', error);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// GET /api/events/streamer/:streamerId - Get events for specific streamer
router.get('/streamer/:streamerId', async (req: Request, res: Response) => {
  try {
    const { limit = 20, event_type } = req.query;

    const filter: Record<string, any> = { streamerId: req.params.streamerId };
    if (event_type) filter.eventType = event_type;

    const lim = parseInt(limit as string, 10);

    const events = await StreamEvent.find(filter)
      .sort({ timestamp: -1 })
      .limit(lim);

    return res.json({ data: events });
  } catch (error) {
    logger.error('Error fetching streamer events:', error);
    return res.status(500).json({ error: 'Failed to fetch streamer events' });
  }
});

// GET /api/events/stats/:streamerId - Get stream statistics for a streamer
router.get('/stats/:streamerId', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const d = parseInt(days as string, 10);
    const startDate = new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    const events = await StreamEvent.find({
      streamerId: req.params.streamerId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    const liveEvents = events.filter((e: any) => e.eventType === 'live');
    let totalStreamTime = 0;
    let currentStart: Date | null = null;

    for (const event of events) {
      if (event.eventType === 'live') {
        currentStart = event.timestamp;
      } else if (event.eventType === 'offline' && currentStart) {
        totalStreamTime += event.timestamp.getTime() - currentStart.getTime();
        currentStart = null;
      }
    }
    if (currentStart) {
      totalStreamTime += Date.now() - currentStart.getTime();
    }

    const stats = {
      totalStreams: liveEvents.length,
      totalStreamTimeMs: totalStreamTime,
      totalStreamTimeHours: Math.round((totalStreamTime / (1000 * 60 * 60)) * 100) / 100,
      averageStreamTimeHours:
        liveEvents.length > 0
          ? Math.round(((totalStreamTime / liveEvents.length) / (1000 * 60 * 60)) * 100) / 100
          : 0,
      daysCovered: d,
      streamsPerWeek: Math.round(((liveEvents.length / d) * 7) * 100) / 100,
    };

    return res.json({ data: stats });
  } catch (error) {
    logger.error('Error fetching stream stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stream stats' });
  }
});

export { router as eventsRouter };

