import { Request, Response, Router } from 'express';
import { Streamer, Subscription } from '../../models';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/subscriptions - Get all subscriptions
router.get('/', async (req: Request, res: Response) => {
    try {
        const { guild_id, streamer_id, limit = 50, offset = 0 } = req.query;
        
        const filter: any = {};
        if (guild_id) filter.guildId = guild_id;
        if (streamer_id) filter.streamerId = streamer_id;

        const subscriptions = await Subscription.find(filter)
            .populate('streamerId')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string))
            .skip(parseInt(offset as string));

        const total = await Subscription.countDocuments(filter);

        return res.json({
            subscriptions,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: total > parseInt(offset as string) + parseInt(limit as string)
            }
        });
    } catch (error) {
        logger.error('Error fetching subscriptions:', error);
        return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

// GET /api/subscriptions/:id - Get specific subscription
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const subscription = await Subscription.findById(req.params.id).populate('streamerId');
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        return res.json(subscription);
    } catch (error) {
        logger.error('Error fetching subscription:', error);
        return res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// POST /api/subscriptions - Create new subscription
router.post('/', async (req: Request, res: Response) => {
    try {
        const { guildId, channelId, streamerId, notificationMessage, mentionRole, createdBy } = req.body;

        if (!guildId || !channelId || !streamerId || !createdBy) {
            return res.status(400).json({ 
                error: 'Guild ID, channel ID, streamer ID, and created by are required' 
            });
        }

        // Check if streamer exists
        const streamer = await Streamer.findById(streamerId);
        if (!streamer) {
            return res.status(404).json({ error: 'Streamer not found' });
        }

        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({
            guildId,
            channelId,
            streamerId
        });

        if (existingSubscription) {
            return res.status(409).json({ 
                error: 'Subscription already exists',
                subscription: existingSubscription
            });
        }

        // Create subscription
        const subscription = new Subscription({
            guildId,
            channelId,
            streamerId,
            notificationMessage,
            mentionRole,
            createdBy
        });

        await subscription.save();
        await subscription.populate('streamerId');

        return res.status(201).json(subscription);
    } catch (error) {
        logger.error('Error creating subscription:', error);
        return res.status(500).json({ error: 'Failed to create subscription' });
    }
});

// PUT /api/subscriptions/:id - Update subscription
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const subscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('streamerId');

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        return res.json(subscription);
    } catch (error) {
        logger.error('Error updating subscription:', error);
        return res.status(500).json({ error: 'Failed to update subscription' });
    }
});

// DELETE /api/subscriptions/:id - Delete subscription
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const subscription = await Subscription.findByIdAndDelete(req.params.id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        return res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        logger.error('Error deleting subscription:', error);
        return res.status(500).json({ error: 'Failed to delete subscription' });
    }
});

// GET /api/subscriptions/guild/:guildId - Get subscriptions for a guild
router.get('/guild/:guildId', async (req: Request, res: Response) => {
    try {
        const subscriptions = await Subscription.find({ 
            guildId: req.params.guildId,
            isActive: true
        }).populate('streamerId');

        return res.json(subscriptions);
    } catch (error) {
        logger.error('Error fetching guild subscriptions:', error);
        return res.status(500).json({ error: 'Failed to fetch guild subscriptions' });
    }
});

export { router as subscriptionsRouter };

