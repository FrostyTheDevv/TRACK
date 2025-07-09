import { Client, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/logger';
import { StreamCommands } from './commands/StreamCommands';

export class StreamBot {
    private client: Client;
    private commands: StreamCommands;

    constructor(client: Client) {
        this.client = client;
        this.commands = new StreamCommands();
    }

    async initialize(): Promise<void> {
        try {
            // Set up event listeners
            this.setupEventListeners();

            // Register slash commands
            await this.registerCommands();

            // Login to Discord
            await this.client.login(process.env.DISCORD_TOKEN);
            
            logger.info('Discord bot initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Discord bot:', error);
            throw error;
        }
    }

    private setupEventListeners(): void {
        this.client.once('ready', () => {
            logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            try {
                await this.commands.handleCommand(interaction);
            } catch (error) {
                logger.error('Error handling command:', error);
                
                const errorMessage = 'There was an error while executing this command!';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        });
    }

    private async registerCommands(): Promise<void> {
        const commands = [
            new SlashCommandBuilder()
                .setName('track')
                .setDescription('Add a streamer to track')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('Streaming platform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Twitch', value: 'twitch' },
                            { name: 'YouTube', value: 'youtube' },
                            { name: 'TikTok', value: 'tiktok' },
                            { name: 'Kick', value: 'kick' }
                        ))
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('Streamer username')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send notifications')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to mention when streamer goes live')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('untrack')
                .setDescription('Remove a streamer from tracking')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('Streaming platform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Twitch', value: 'twitch' },
                            { name: 'YouTube', value: 'youtube' },
                            { name: 'TikTok', value: 'tiktok' },
                            { name: 'Kick', value: 'kick' }
                        ))
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('Streamer username')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('streams')
                .setDescription('List all tracked streamers')
                .addBooleanOption(option =>
                    option.setName('live_only')
                        .setDescription('Show only live streamers')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('stream-settings')
                .setDescription('Configure stream notification settings')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Set Message', value: 'message' },
                            { name: 'Set Channel', value: 'channel' },
                            { name: 'Set Role', value: 'role' }
                        ))
        ];

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

        try {
            logger.info('Started refreshing application (/) commands.');

            if (process.env.DISCORD_GUILD_ID) {
                // Guild-specific commands for development
                await rest.put(
                    Routes.applicationGuildCommands(
                        process.env.DISCORD_CLIENT_ID!,
                        process.env.DISCORD_GUILD_ID
                    ),
                    { body: commands }
                );
                logger.info('Successfully reloaded guild application (/) commands.');
            } else {
                // Global commands for production
                await rest.put(
                    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
                    { body: commands }
                );
                logger.info('Successfully reloaded global application (/) commands.');
            }
        } catch (error) {
            logger.error('Failed to register commands:', error);
            throw error;
        }
    }
}
