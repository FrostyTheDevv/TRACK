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
            end_date
        } = req.query;
        
        const filter: any = {};
        if (streamer_id) filter.streamerId = streamer_id;
        if (event_type) filter.eventType = event_type;
        
        if (start_date || end_date) {
            filter.timestamp = {};
            if (start_date) filter.timestamp.$gte = new Date(start_date as string);
            if (end_date) filter.timestamp.$lte = new Date(end_date as string);
        }

        const events = await StreamEvent.find(filter)
            .populate('streamerId')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit as string))
            .skip(parseInt(offset as string));

        const total = await StreamEvent.countDocuments(filter);

        return res.json({
            events,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: total > parseInt(offset as string) + parseInt(limit as string)
            }
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
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        return res.json(event);
    } catch (error) {
        logger.error('Error fetching event:', error);
        return res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// GET /api/events/streamer/:streamerId - Get events for specific streamer
router.get('/streamer/:streamerId', async (req: Request, res: Response) => {
    try {
        const { limit = 20, event_type } = req.query;
        
        const filter: any = { streamerId: req.params.streamerId };
        if (event_type) filter.eventType = event_type;

        const events = await StreamEvent.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit as string));

        return res.json(events);
    } catch (error) {
        logger.error('Error fetching streamer events:', error);
        return res.status(500).json({ error: 'Failed to fetch streamer events' });
    }
});

// GET /api/events/stats/:streamerId - Get stream statistics for a streamer
router.get('/stats/:streamerId', async (req: Request, res: Response) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        const events = await StreamEvent.find({
            streamerId: req.params.streamerId,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });

        // Calculate statistics
        const liveEvents = events.filter((e: any) => e.eventType === 'live');
        const offlineEvents = events.filter((e: any) => e.eventType === 'offline');
        
        let totalStreamTime = 0;
        let currentStreamStart: Date | null = null;

        for (const event of events) {
            if (event.eventType === 'live') {
                currentStreamStart = event.timestamp;
            } else if (event.eventType === 'offline' && currentStreamStart) {
                totalStreamTime += event.timestamp.getTime() - currentStreamStart.getTime();
                currentStreamStart = null;
            }
        }

        // If currently live, add time since last stream started
        if (currentStreamStart) {
            totalStreamTime += Date.now() - currentStreamStart.getTime();
        }

        const stats = {
            totalStreams: liveEvents.length,
            totalStreamTimeMs: totalStreamTime,
            totalStreamTimeHours: Math.round(totalStreamTime / (1000 * 60 * 60) * 100) / 100,
            averageStreamTimeHours: liveEvents.length > 0 
                ? Math.round((totalStreamTime / liveEvents.length) / (1000 * 60 * 60) * 100) / 100 
                : 0,
            daysCovered: parseInt(days as string),
            streamsPerWeek: Math.round((liveEvents.length / parseInt(days as string)) * 7 * 100) / 100
        };

        return res.json(stats);
    } catch (error) {
        logger.error('Error fetching stream stats:', error);
        return res.status(500).json({ error: 'Failed to fetch stream stats' });
    }
});

export { router as eventsRouter };

