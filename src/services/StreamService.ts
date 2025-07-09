import axios from 'axios';
import { logger } from '../utils/logger';
import { ScrapedStreamData, ScraperManager } from './scrapers/ScraperManager';

export interface StreamerData {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    followers?: number;
    isLive: boolean;
    streamTitle?: string;
    streamUrl?: string;
    thumbnailUrl?: string;
    viewerCount?: number;
    startedAt?: Date;
}

export class StreamService {
    private static instance: StreamService | null = null;
    private twitchToken: string | null = null;
    private twitchTokenExpiry: Date | null = null;
    private scraperManager: ScraperManager;
    private isInitialized: boolean = false;

    private constructor() {
        // Initialize scraper manager for platforms without official APIs
        this.scraperManager = new ScraperManager({
            enableKick: true,
            enableTikTok: true,
            scrapeInterval: 2,
            maxRetries: 3,
            timeout: 30000
        });
    }

    public static getInstance(): StreamService {
        if (!StreamService.instance) {
            StreamService.instance = new StreamService();
        }
        return StreamService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        
        try {
            await this.initializeScrapers();
            this.isInitialized = true;
        } catch (error) {
            logger.error('Failed to initialize StreamService:', error);
            throw error;
        }
    }

    private async initializeScrapers(): Promise<void> {
        try {
            await this.scraperManager.init();
            logger.info('Stream scrapers initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize stream scrapers:', error);
        }
    }

    async close(): Promise<void> {
        await this.scraperManager.close();
    }

    async getStreamerData(platform: string, username: string): Promise<StreamerData | null> {
        try {
            switch (platform) {
                case 'twitch':
                    return await this.getTwitchStreamerData(username);
                case 'youtube':
                    return await this.getYouTubeStreamerData(username);
                case 'tiktok':
                    return await this.getTikTokStreamerData(username);
                case 'kick':
                    return await this.getKickStreamerData(username);
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        } catch (error) {
            logger.error(`Error fetching streamer data for ${username} on ${platform}:`, error);
            return null;
        }
    }

    async checkStreamStatus(platform: string, platformId: string, username: string): Promise<StreamerData | null> {
        try {
            switch (platform) {
                case 'twitch':
                    return await this.getTwitchStreamStatus(platformId, username);
                case 'youtube':
                    return await this.getYouTubeStreamStatus(platformId, username);
                case 'tiktok':
                    return await this.getTikTokStreamStatus(platformId, username);
                case 'kick':
                    return await this.getKickStreamStatus(platformId, username);
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        } catch (error) {
            logger.error(`Error checking stream status for ${username} (${platformId}) on ${platform}:`, error);
            return null;
        }
    }

    private async getTwitchStreamerData(username: string): Promise<StreamerData | null> {
        const token = await this.getTwitchToken();
        if (!token) return null;

        try {
            // Get user data
            const userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!userResponse.data.data || userResponse.data.data.length === 0) {
                return null;
            }

            const user = userResponse.data.data[0];

            // Check if user is live
            const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                }
            });

            const isLive = streamResponse.data.data && streamResponse.data.data.length > 0;
            const streamData = isLive ? streamResponse.data.data[0] : null;

            // Get follower count
            const followersResponse = await axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                }
            });

            return {
                id: user.id,
                displayName: user.display_name,
                username: user.login,
                avatarUrl: user.profile_image_url,
                followers: followersResponse.data.total || 0,
                isLive,
                streamTitle: streamData?.title,
                streamUrl: `https://twitch.tv/${user.login}`,
                thumbnailUrl: streamData?.thumbnail_url?.replace('{width}', '1920').replace('{height}', '1080'),
                viewerCount: streamData?.viewer_count,
                startedAt: streamData ? new Date(streamData.started_at) : undefined
            };
        } catch (error) {
            logger.error('Error fetching Twitch streamer data:', error);
            return null;
        }
    }

    private async getTwitchStreamStatus(platformId: string, username: string): Promise<StreamerData | null> {
        const token = await this.getTwitchToken();
        if (!token) return null;

        try {
            const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${platformId}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                }
            });

            const isLive = streamResponse.data.data && streamResponse.data.data.length > 0;
            const streamData = isLive ? streamResponse.data.data[0] : null;

            return {
                id: platformId,
                displayName: streamData?.user_name || username,
                username,
                isLive,
                streamTitle: streamData?.title,
                streamUrl: `https://twitch.tv/${username}`,
                thumbnailUrl: streamData?.thumbnail_url?.replace('{width}', '1920').replace('{height}', '1080'),
                viewerCount: streamData?.viewer_count,
                startedAt: streamData ? new Date(streamData.started_at) : undefined
            };
        } catch (error) {
            logger.error('Error checking Twitch stream status:', error);
            return null;
        }
    }

    private async getTwitchToken(): Promise<string | null> {
        if (this.twitchToken && this.twitchTokenExpiry && new Date() < this.twitchTokenExpiry) {
            return this.twitchToken;
        }

        try {
            const response = await axios.post('https://id.twitch.tv/oauth2/token', {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            });

            this.twitchToken = response.data.access_token;
            this.twitchTokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000); // Refresh 1 minute early

            return this.twitchToken;
        } catch (error) {
            logger.error('Error getting Twitch token:', error);
            return null;
        }
    }

    private async getYouTubeStreamerData(username: string): Promise<StreamerData | null> {
        // TODO: Implement YouTube API integration
        logger.warn('YouTube API integration not yet implemented');
        return null;
    }

    private async getYouTubeStreamStatus(platformId: string, username: string): Promise<StreamerData | null> {
        // TODO: Implement YouTube stream status check
        logger.warn('YouTube stream status check not yet implemented');
        return null;
    }

    private async getTikTokStreamerData(username: string): Promise<StreamerData | null> {
        try {
            const scrapedData = await this.scraperManager.checkStreamStatus('tiktok', username);
            if (!scrapedData) return null;

            return this.convertScrapedToStreamerData(scrapedData, `https://tiktok.com/@${username}`);
        } catch (error) {
            logger.error(`Error fetching TikTok streamer data for ${username}:`, error);
            return null;
        }
    }

    private async getTikTokStreamStatus(platformId: string, username: string): Promise<StreamerData | null> {
        try {
            const scrapedData = await this.scraperManager.checkStreamStatus('tiktok', username);
            if (!scrapedData) return null;

            return this.convertScrapedToStreamerData(scrapedData, `https://tiktok.com/@${username}`);
        } catch (error) {
            logger.error(`Error checking TikTok stream status for ${username}:`, error);
            return null;
        }
    }

    private async getKickStreamerData(username: string): Promise<StreamerData | null> {
        try {
            const scrapedData = await this.scraperManager.checkStreamStatus('kick', username);
            if (!scrapedData) return null;

            return this.convertScrapedToStreamerData(scrapedData, `https://kick.com/${username}`);
        } catch (error) {
            logger.error(`Error fetching Kick streamer data for ${username}:`, error);
            return null;
        }
    }

    private async getKickStreamStatus(platformId: string, username: string): Promise<StreamerData | null> {
        try {
            const scrapedData = await this.scraperManager.checkStreamStatus('kick', username);
            if (!scrapedData) return null;

            return this.convertScrapedToStreamerData(scrapedData, `https://kick.com/${username}`);
        } catch (error) {
            logger.error(`Error checking Kick stream status for ${username}:`, error);
            return null;
        }
    }

    private convertScrapedToStreamerData(scrapedData: ScrapedStreamData, streamUrl: string): StreamerData {
        return {
            id: scrapedData.username,
            displayName: scrapedData.username,
            username: scrapedData.username,
            isLive: scrapedData.isLive,
            streamTitle: scrapedData.title,
            streamUrl,
            thumbnailUrl: scrapedData.thumbnailUrl,
            viewerCount: scrapedData.viewerCount,
            startedAt: scrapedData.isLive ? new Date() : undefined
        };
    }
}
