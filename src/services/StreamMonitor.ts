import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import * as cron from 'node-cron';
import { Streamer, StreamEvent, Subscription } from '../models';
import { logger } from '../utils/logger';
import { StreamerData, StreamService } from './StreamService';

export class StreamMonitor {
    private client: Client;
    public streamService: StreamService;
    private isRunning: boolean = false;
    private cronJob: cron.ScheduledTask | null = null;

    constructor(client: Client) {
        this.client = client;
        this.streamService = StreamService.getInstance();
    }

    start(): void {
        if (this.isRunning) {
            logger.warn('Stream monitor is already running');
            return;
        }

        const interval = process.env.STREAM_CHECK_INTERVAL || '5';
        const cronExpression = `*/${interval} * * * *`; // Every N minutes

        this.cronJob = cron.schedule(cronExpression, () => {
            this.checkAllStreams();
        });

        this.isRunning = true;
        logger.info(`Stream monitor started with ${interval} minute intervals`);

        // Do an initial check
        setTimeout(() => this.checkAllStreams(), 5000);
    }

    stop(): void {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
        }
        this.isRunning = false;
        logger.info('Stream monitor stopped');
    }

    private async checkAllStreams(): Promise<void> {
        try {
            const streamers = await Streamer.find();
            logger.debug(`Checking ${streamers.length} streamers for status updates`);

            const checkPromises = streamers.map((streamer: any) => this.checkStreamerStatus(streamer));
            await Promise.allSettled(checkPromises);
        } catch (error) {
            logger.error('Error checking all streams:', error);
        }
    }

    private async checkStreamerStatus(streamer: any): Promise<void> {
        try {
            const currentStatus = await this.streamService.checkStreamStatus(
                streamer.platform,
                streamer.platformId,
                streamer.username
            );

            if (!currentStatus) {
                logger.debug(`Could not fetch status for ${streamer.displayName} (${streamer.platform})`);
                return;
            }

            // Update streamer data
            const wasLive = streamer.isLive;
            const isNowLive = currentStatus.isLive;

            streamer.isLive = isNowLive;
            streamer.lastChecked = new Date();

            if (isNowLive) {
                const titleChanged = streamer.lastStreamTitle !== currentStatus.streamTitle;
                
                streamer.lastStreamTitle = currentStatus.streamTitle;
                streamer.lastStreamUrl = currentStatus.streamUrl;
                streamer.lastStreamThumbnail = currentStatus.thumbnailUrl;
                
                if (!wasLive) {
                    streamer.lastStreamStarted = currentStatus.startedAt || new Date();
                }

                // Create stream event for going live
                if (!wasLive) {
                    await this.createStreamEvent(streamer.id, 'live', currentStatus);
                    await this.sendLiveNotifications(streamer, currentStatus);
                } else if (titleChanged) {
                    await this.createStreamEvent(streamer.id, 'title_change', currentStatus);
                }
            } else if (wasLive) {
                // Stream went offline
                await this.createStreamEvent(streamer.id, 'offline', currentStatus);
            }

            await streamer.save();
            
            if (!wasLive && isNowLive) {
                logger.info(`${streamer.displayName} (${streamer.platform}) went live: ${currentStatus.streamTitle}`);
            } else if (wasLive && !isNowLive) {
                logger.info(`${streamer.displayName} (${streamer.platform}) went offline`);
            }

        } catch (error) {
            logger.error(`Error checking status for ${streamer.displayName}:`, error);
        }
    }

    private async createStreamEvent(streamerId: string, eventType: 'live' | 'offline' | 'title_change', data: StreamerData): Promise<void> {
        try {
            const streamEvent = new StreamEvent({
                streamerId,
                eventType,
                streamTitle: data.streamTitle,
                streamUrl: data.streamUrl,
                streamThumbnail: data.thumbnailUrl,
                viewerCount: data.viewerCount,
                metadata: {
                    startedAt: data.startedAt
                }
            });

            await streamEvent.save();
        } catch (error) {
            logger.error('Error creating stream event:', error);
        }
    }

    private async sendLiveNotifications(streamer: any, streamData: StreamerData): Promise<void> {
        try {
            const subscriptions = await Subscription.find({ 
                streamerId: streamer.id, 
                isActive: true 
            });

            const notificationPromises = subscriptions.map((subscription: any) => 
                this.sendNotificationToChannel(subscription, streamer, streamData)
            );

            await Promise.allSettled(notificationPromises);
        } catch (error) {
            logger.error('Error sending live notifications:', error);
        }
    }

    private async sendNotificationToChannel(subscription: any, streamer: any, streamData: StreamerData): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(subscription.channelId) as TextChannel;
            if (!channel || !channel.isTextBased()) {
                logger.warn(`Invalid channel ${subscription.channelId} for notification`);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x1a237e) // Deep blue
                .setTitle(`🔴 ${streamer.displayName} is now live!`)
                .setDescription(streamData.streamTitle || 'No title available')
                .setURL(streamData.streamUrl || `https://${streamer.platform}.tv/${streamer.username}`)
                .addFields([
                    { 
                        name: 'Platform', 
                        value: streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1), 
                        inline: true 
                    },
                    { 
                        name: 'Viewers', 
                        value: streamData.viewerCount?.toLocaleString() || 'Unknown', 
                        inline: true 
                    }
                ])
                .setThumbnail(streamer.avatarUrl || null)
                .setImage(streamData.thumbnailUrl || null)
                .setTimestamp(streamData.startedAt || new Date())
                .setFooter({ text: 'Stream Tracker' });

            let content = '';
            if (subscription.mentionRole) {
                content = `<@&${subscription.mentionRole}>`;
            }

            // Replace placeholders in custom message if set
            if (subscription.notificationMessage) {
                const customMessage = subscription.notificationMessage
                    .replace('{streamer}', streamer.displayName)
                    .replace('{platform}', streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1))
                    .replace('{title}', streamData.streamTitle || 'No title')
                    .replace('{url}', streamData.streamUrl || `https://${streamer.platform}.tv/${streamer.username}`);
                
                content = content ? `${content}\n${customMessage}` : customMessage;
            }

            await channel.send({ 
                content: content || undefined, 
                embeds: [embed] 
            });

            logger.debug(`Sent live notification for ${streamer.displayName} to channel ${channel.name}`);
        } catch (error) {
            logger.error(`Error sending notification to channel ${subscription.channelId}:`, error);
        }
    }
}
