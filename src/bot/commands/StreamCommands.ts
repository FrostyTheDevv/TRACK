import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Streamer, Subscription } from '../../models';
import { StreamService } from '../../services/StreamService';
import { logger } from '../../utils/logger';

export class StreamCommands {
    private streamService: StreamService;

    constructor() {
        this.streamService = StreamService.getInstance();
    }

    async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        const { commandName } = interaction;

        switch (commandName) {
            case 'track':
                await this.handleTrackCommand(interaction);
                break;
            case 'untrack':
                await this.handleUntrackCommand(interaction);
                break;
            case 'streams':
                await this.handleStreamsCommand(interaction);
                break;
            case 'stream-settings':
                await this.handleSettingsCommand(interaction);
                break;
            default:
                await interaction.reply({ content: 'Unknown command!', ephemeral: true });
        }
    }

    private async handleTrackCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command can only be used in servers!', ephemeral: true });
            return;
        }

        // Check permissions
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ content: 'You need Manage Channels permission to use this command!', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const platform = interaction.options.getString('platform', true) as 'twitch' | 'youtube' | 'tiktok' | 'kick';
        const username = interaction.options.getString('username', true);
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const role = interaction.options.getRole('role');

        try {
            // Find or create streamer
            let streamer = await Streamer.findOne({ platform, username: username.toLowerCase() });
            
            if (!streamer) {
                // Fetch streamer data from platform API
                const streamerData = await this.streamService.getStreamerData(platform, username);
                if (!streamerData) {
                    await interaction.editReply(`❌ Could not find streamer **${username}** on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
                    return;
                }

                streamer = new Streamer({
                    username: username.toLowerCase(),
                    displayName: streamerData.displayName,
                    platform,
                    platformId: streamerData.id,
                    avatarUrl: streamerData.avatarUrl,
                    followers: streamerData.followers || 0
                });
                await streamer.save();
            }

            // Check if subscription already exists
            const existingSubscription = await Subscription.findOne({
                guildId: interaction.guild.id,
                channelId: channel!.id,
                streamerId: streamer.id
            });

            if (existingSubscription) {
                await interaction.editReply(`⚠️ Already tracking **${streamer.displayName}** in ${channel}`);
                return;
            }

            // Create subscription
            const subscription = new Subscription({
                guildId: interaction.guild.id,
                channelId: channel!.id,
                streamerId: streamer.id,
                mentionRole: role?.id,
                createdBy: interaction.user.id
            });
            await subscription.save();

            const embed = new EmbedBuilder()
                .setColor(0x1a237e) // Deep blue
                .setTitle('✅ Streamer Added')
                .setDescription(`Now tracking **${streamer.displayName}** on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
                .addFields([
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Mention Role', value: role ? `${role}` : 'None', inline: true },
                    { name: 'Followers', value: streamer.followers.toLocaleString(), inline: true }
                ])
                .setThumbnail(streamer.avatarUrl || null)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            logger.info(`Added tracking for ${streamer.displayName} (${platform}) in guild ${interaction.guild.id}`);
        } catch (error) {
            logger.error('Error in track command:', error);
            await interaction.editReply('❌ An error occurred while adding the streamer.');
        }
    }

    private async handleUntrackCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command can only be used in servers!', ephemeral: true });
            return;
        }

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ content: 'You need Manage Channels permission to use this command!', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const platform = interaction.options.getString('platform', true);
        const username = interaction.options.getString('username', true);

        try {
            const streamer = await Streamer.findOne({ platform, username: username.toLowerCase() });
            if (!streamer) {
                await interaction.editReply(`❌ Streamer **${username}** not found on ${platform}`);
                return;
            }

            const result = await Subscription.deleteMany({
                guildId: interaction.guild.id,
                streamerId: streamer.id
            });

            if (result.deletedCount === 0) {
                await interaction.editReply(`⚠️ **${streamer.displayName}** is not being tracked in this server`);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x000000) // Black
                .setTitle('✅ Streamer Removed')
                .setDescription(`Stopped tracking **${streamer.displayName}** on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
                .addFields([
                    { name: 'Subscriptions Removed', value: result.deletedCount.toString(), inline: true }
                ])
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            logger.info(`Removed tracking for ${streamer.displayName} (${platform}) in guild ${interaction.guild.id}`);
        } catch (error) {
            logger.error('Error in untrack command:', error);
            await interaction.editReply('❌ An error occurred while removing the streamer.');
        }
    }

    private async handleStreamsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command can only be used in servers!', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const liveOnly = interaction.options.getBoolean('live_only') || false;

        try {
            const subscriptions = await Subscription.find({ guildId: interaction.guild.id })
                .populate('streamerId')
                .exec();

            if (subscriptions.length === 0) {
                await interaction.editReply('📭 No streamers are being tracked in this server.');
                return;
            }

            let streamers = subscriptions.map((sub: any) => sub.streamerId as any);
            
            if (liveOnly) {
                streamers = streamers.filter((streamer: any) => streamer.isLive);
            }

            if (streamers.length === 0) {
                await interaction.editReply(liveOnly ? '📴 No streamers are currently live.' : '📭 No streamers found.');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x1a237e)
                .setTitle(liveOnly ? '🔴 Live Streamers' : '📺 Tracked Streamers')
                .setDescription(`Showing ${streamers.length} streamer${streamers.length !== 1 ? 's' : ''}`)
                .setTimestamp();

            const streamerList = streamers.slice(0, 10).map((streamer: any, index: number) => {
                const status = streamer.isLive ? '🔴 LIVE' : '⚫ Offline';
                const platform = streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1);
                const lastStream = streamer.lastStreamTitle ? `\n└ ${streamer.lastStreamTitle}` : '';
                
                return `**${index + 1}.** ${status} **${streamer.displayName}** (${platform})${lastStream}`;
            }).join('\n\n');

            embed.addFields([{ name: 'Streamers', value: streamerList }]);

            if (streamers.length > 10) {
                embed.setFooter({ text: `And ${streamers.length - 10} more...` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error in streams command:', error);
            await interaction.editReply('❌ An error occurred while fetching streamers.');
        }
    }

    private async handleSettingsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({ content: '⚙️ Settings command coming soon!', ephemeral: true });
    }
}
