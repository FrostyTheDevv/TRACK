import { logger } from './logger';

// Check which database to use based on environment
const databaseType = process.env.DATABASE_TYPE || 'memory';

logger.info(`Database type selected: ${databaseType}`);

export async function connectDatabase(): Promise<void> {
    try {
        if (databaseType === 'memory') {
            // Use in-memory storage (no external dependencies)
            const { connectDatabase: connectMemory } = await import('./database-memory');
            await connectMemory();
        } else if (databaseType === 'sqlite') {
            // Use SQLite (file-based, persistent)
            const { connectDatabase: connectSQLite } = await import('./database-sqlite');
            await connectSQLite();
        } else {
            // Use MongoDB (requires MongoDB server)
            const mongoose = await import('mongoose');
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stream-tracker';
            
            logger.info(`Attempting to connect to MongoDB at: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
            
            await mongoose.default.connect(mongoUri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            mongoose.default.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
            });
            
            mongoose.default.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });
            
            mongoose.default.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
            });
            
            logger.info('Connected to MongoDB successfully');
        }
    } catch (error) {
        logger.error(`Failed to connect to ${databaseType} database:`, error);
        
        if (databaseType === 'mongodb') {
            if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
                logger.error('💡 MongoDB connection refused. You can:');
                logger.error('   1. Install and start MongoDB locally, OR');
                logger.error('   2. Set up MongoDB Atlas (free cloud database), OR');
                logger.error('   3. Use memory storage by setting DATABASE_TYPE=memory in .env');
                logger.error('   📖 Memory storage requires no installation but data is lost on restart');
            }
        }
        
        throw error;
    }
}
