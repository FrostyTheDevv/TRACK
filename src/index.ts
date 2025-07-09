import { Client } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { APIServer } from './api/server';
import { StreamBot } from './bot/StreamBot';
import { StreamMonitor } from './services/StreamMonitor';
import { StreamService } from './services/StreamService';
import { connectDatabase } from './utils/database';
import { logger } from './utils/logger';

async function main() {
    try {
        // Connect to database
        await connectDatabase();
        logger.info('Connected to database');

        // Initialize shared StreamService (singleton)
        const streamService = StreamService.getInstance();
        await streamService.initialize();

        // Initialize Discord bot
        const client = new Client({
            intents: [
                'Guilds',
                'GuildMessages',
                'MessageContent',
                'GuildMembers'
            ]
        });

        // Initialize stream bot
        const streamBot = new StreamBot(client);
        await streamBot.initialize();

        // Start API server
        const apiServer = new APIServer();
        await apiServer.start();

        // Initialize stream monitor
        const streamMonitor = new StreamMonitor(client);
        streamMonitor.start();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('Shutting down gracefully...');
            streamMonitor.stop();
            await apiServer.stop();
            
            // Close scrapers if they exist
            if (streamMonitor.streamService) {
                await streamMonitor.streamService.close();
            }
            
            client.destroy();
            process.exit(0);
        });

        logger.info('Stream Tracker Bot is now running!');
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
}

main();
