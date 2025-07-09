// Simple in-memory database for testing (no external dependencies)
import { logger } from './logger';

// In-memory storage
const streamers = new Map();
const subscriptions = new Map();
const streamEvents = new Map();

export interface StreamerData {
    id: string;
    platform: string;
    platformId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isLive: boolean;
    lastChecked: Date;
    streamTitle?: string;
    viewerCount?: number;
    followers?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SubscriptionData {
    id: string;
    guildId: string;
    channelId: string;
    streamerId: string;
    isActive: boolean;
    customMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StreamEventData {
    id: string;
    streamerId: string;
    eventType: 'live' | 'offline';
    timestamp: Date;
    streamTitle?: string;
    viewerCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Simple model classes that mimic Mongoose/Sequelize behavior
export class Streamer {
    static async findById(id: string): Promise<StreamerData | null> {
        return streamers.get(id) || null;
    }

    static async findOne(query: any): Promise<StreamerData | null> {
        for (const [id, streamer] of streamers) {
            if (this.matchesQuery(streamer, query)) {
                return streamer;
            }
        }
        return null;
    }

    static async find(query: any = {}): Promise<StreamerData[]> {
        const results: StreamerData[] = [];
        for (const [id, streamer] of streamers) {
            if (this.matchesQuery(streamer, query)) {
                results.push(streamer);
            }
        }
        return results;
    }

    static async create(data: Partial<StreamerData>): Promise<StreamerData> {
        const id = data.id || this.generateId();
        const now = new Date();
        const streamer: StreamerData = {
            id,
            platform: data.platform!,
            platformId: data.platformId!,
            username: data.username!,
            displayName: data.displayName!,
            avatarUrl: data.avatarUrl,
            isLive: data.isLive || false,
            lastChecked: data.lastChecked || now,
            streamTitle: data.streamTitle,
            viewerCount: data.viewerCount,
            followers: data.followers,
            createdAt: data.createdAt || now,
            updatedAt: now
        };
        streamers.set(id, streamer);
        return streamer;
    }

    static async countDocuments(query: any = {}): Promise<number> {
        let count = 0;
        for (const [id, streamer] of streamers) {
            if (this.matchesQuery(streamer, query)) {
                count++;
            }
        }
        return count;
    }

    // Sequelize-compatible methods
    static async findAll(options: any = {}): Promise<StreamerData[]> {
        return this.find(options.where || {});
    }

    static async update(values: any, options: any): Promise<number[]> {
        let updated = 0;
        for (const [id, streamer] of streamers) {
            if (this.matchesQuery(streamer, options.where || {})) {
                const updatedStreamer = { ...streamer, ...values, updatedAt: new Date() };
                streamers.set(id, updatedStreamer);
                updated++;
            }
        }
        return [updated];
    }

    static async destroy(options: any): Promise<number> {
        let deleted = 0;
        for (const [id, streamer] of streamers) {
            if (this.matchesQuery(streamer, options.where || {})) {
                streamers.delete(id);
                deleted++;
            }
        }
        return deleted;
    }

    private static matchesQuery(item: any, query: any): boolean {
        for (const [key, value] of Object.entries(query)) {
            if (item[key] !== value) {
                return false;
            }
        }
        return true;
    }

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

export class Subscription {
    static async findById(id: string): Promise<SubscriptionData | null> {
        return subscriptions.get(id) || null;
    }

    static async findOne(query: any): Promise<SubscriptionData | null> {
        for (const [id, subscription] of subscriptions) {
            if (this.matchesQuery(subscription, query)) {
                return subscription;
            }
        }
        return null;
    }

    static async find(query: any = {}): Promise<SubscriptionData[]> {
        const results: SubscriptionData[] = [];
        for (const [id, subscription] of subscriptions) {
            if (this.matchesQuery(subscription, query)) {
                results.push(subscription);
            }
        }
        return results;
    }

    static async create(data: Partial<SubscriptionData>): Promise<SubscriptionData> {
        const id = data.id || this.generateId();
        const now = new Date();
        const subscription: SubscriptionData = {
            id,
            guildId: data.guildId!,
            channelId: data.channelId!,
            streamerId: data.streamerId!,
            isActive: data.isActive !== false,
            customMessage: data.customMessage,
            createdAt: data.createdAt || now,
            updatedAt: now
        };
        subscriptions.set(id, subscription);
        return subscription;
    }

    static async countDocuments(query: any = {}): Promise<number> {
        let count = 0;
        for (const [id, subscription] of subscriptions) {
            if (this.matchesQuery(subscription, query)) {
                count++;
            }
        }
        return count;
    }

    // Sequelize-compatible methods
    static async findAll(options: any = {}): Promise<SubscriptionData[]> {
        return this.find(options.where || {});
    }

    static async update(values: any, options: any): Promise<number[]> {
        let updated = 0;
        for (const [id, subscription] of subscriptions) {
            if (this.matchesQuery(subscription, options.where || {})) {
                const updatedSubscription = { ...subscription, ...values, updatedAt: new Date() };
                subscriptions.set(id, updatedSubscription);
                updated++;
            }
        }
        return [updated];
    }

    static async destroy(options: any): Promise<number> {
        let deleted = 0;
        for (const [id, subscription] of subscriptions) {
            if (this.matchesQuery(subscription, options.where || {})) {
                subscriptions.delete(id);
                deleted++;
            }
        }
        return deleted;
    }

    private static matchesQuery(item: any, query: any): boolean {
        for (const [key, value] of Object.entries(query)) {
            if (item[key] !== value) {
                return false;
            }
        }
        return true;
    }

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

export class StreamEvent {
    static async findById(id: string): Promise<StreamEventData | null> {
        return streamEvents.get(id) || null;
    }

    static async find(query: any = {}): Promise<StreamEventData[]> {
        const results: StreamEventData[] = [];
        for (const [id, event] of streamEvents) {
            if (this.matchesQuery(event, query)) {
                results.push(event);
            }
        }
        return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    static async create(data: Partial<StreamEventData>): Promise<StreamEventData> {
        const id = data.id || this.generateId();
        const now = new Date();
        const event: StreamEventData = {
            id,
            streamerId: data.streamerId!,
            eventType: data.eventType!,
            timestamp: data.timestamp || now,
            streamTitle: data.streamTitle,
            viewerCount: data.viewerCount,
            createdAt: data.createdAt || now,
            updatedAt: now
        };
        streamEvents.set(id, event);
        return event;
    }

    static async countDocuments(query: any = {}): Promise<number> {
        let count = 0;
        for (const [id, streamEvent] of streamEvents) {
            if (this.matchesQuery(streamEvent, query)) {
                count++;
            }
        }
        return count;
    }

    // Sequelize-compatible methods
    static async findAll(options: any = {}): Promise<StreamEventData[]> {
        return this.find(options.where || {});
    }

    static async update(values: any, options: any): Promise<number[]> {
        let updated = 0;
        for (const [id, streamEvent] of streamEvents) {
            if (this.matchesQuery(streamEvent, options.where || {})) {
                const updatedStreamEvent = { ...streamEvent, ...values, updatedAt: new Date() };
                streamEvents.set(id, updatedStreamEvent);
                updated++;
            }
        }
        return [updated];
    }

    static async destroy(options: any): Promise<number> {
        let deleted = 0;
        for (const [id, streamEvent] of streamEvents) {
            if (this.matchesQuery(streamEvent, options.where || {})) {
                streamEvents.delete(id);
                deleted++;
            }
        }
        return deleted;
    }

    private static matchesQuery(item: any, query: any): boolean {
        for (const [key, value] of Object.entries(query)) {
            if (item[key] !== value) {
                return false;
            }
        }
        return true;
    }

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

export async function connectDatabase(): Promise<void> {
    logger.info('Using in-memory database (no external dependencies required)');
    logger.info('📝 Note: Data will be lost when the application restarts');
    logger.info('🔄 For persistent storage, consider setting up SQLite or MongoDB');
}
