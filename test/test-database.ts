import dotenv from 'dotenv';
import { Streamer, StreamEvent, Subscription } from '../src/models';
import { connectDatabase } from '../src/utils/database';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
    try {
        logger.info('🔍 Testing database connection...');
        
        await connectDatabase();
        logger.info('✅ Database connected successfully!');
        
        // Test creating models using our abstracted interface
        const testStreamer = await Streamer.create({
            username: 'test_streamer',
            displayName: 'Test Streamer',
            platform: 'twitch',
            platformId: 'test123',
            isLive: false,
            lastChecked: new Date(),
            metadata: { test: true }
        });
        
        logger.info(`✅ Test streamer created with ID: ${testStreamer.id}`);
        
        // Test finding the streamer
        const foundStreamer = await Streamer.findOne({ username: 'test_streamer' });
        if (!foundStreamer) {
            throw new Error('Could not find created streamer');
        }
        logger.info(`🔍 Found streamer: ${foundStreamer.username} on ${foundStreamer.platform}`);
        
        // Test updating the streamer
        await Streamer.update(
            { isLive: true, lastChecked: new Date() },
            { where: { username: 'test_streamer' } }
        );
        logger.info('📝 Updated streamer status');
        
        // Test creating a subscription
        const testSubscription = await Subscription.create({
            guildId: 'test_guild_123',
            channelId: 'test_channel_456',
            streamerId: testStreamer.id,
            isActive: true
        });
        logger.info(`✅ Test subscription created with ID: ${testSubscription.id}`);
        
        // Test creating a stream event
        const testEvent = await StreamEvent.create({
            streamerId: testStreamer.id,
            eventType: 'stream_start',
            timestamp: new Date(),
            metadata: { title: 'Test Stream', viewers: 100 }
        });
        logger.info(`✅ Test stream event created with ID: ${testEvent.id}`);
        
        // Test finding multiple records
        const allStreamers = await Streamer.findAll();
        logger.info(`📊 Total streamers in database: ${allStreamers.length}`);
        
        // Clean up test data in correct order (dependencies first)
        await StreamEvent.destroy({ where: { streamerId: testStreamer.id } });
        await Subscription.destroy({ where: { guildId: 'test_guild_123' } });
        await Streamer.destroy({ where: { username: 'test_streamer' } });
        logger.info('🧹 Cleaned up test data');
        
        logger.info('🎉 All database tests passed!');
        
    } catch (error) {
        logger.error('❌ Database test failed:', error);
        
        const databaseType = process.env.DATABASE_TYPE || 'memory';
        
        if (databaseType === 'mongodb' && error instanceof Error && error.message.includes('ECONNREFUSED')) {
            logger.error('');
            logger.error('🔧 MongoDB connection failed. You can:');
            logger.error('');
            logger.error('Option 1 - Use SQLite (Recommended):');
            logger.error('Set DATABASE_TYPE=sqlite in .env file');
            logger.error('');
            logger.error('Option 2 - Use In-Memory Storage:');
            logger.error('Set DATABASE_TYPE=memory in .env file');
            logger.error('');
            logger.error('Option 3 - Set up MongoDB:');
            logger.error('1. MongoDB Atlas: https://www.mongodb.com/atlas');
            logger.error('2. Local MongoDB: winget install MongoDB.Server');
            logger.error('');
        }
        
        process.exit(1);
    }
}

// Run the test
testDatabaseConnection();
