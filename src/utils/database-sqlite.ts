import path from 'path';
import { DataTypes, Model, Sequelize } from 'sequelize';
import { logger } from './logger';

// Initialize SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'data', 'stream-tracker.db'),
    logging: (msg) => logger.debug(msg),
    define: {
        timestamps: true,
        underscored: true
    }
});

// Streamer Model
export class Streamer extends Model {
    public id!: string;
    public platform!: string;
    public platformId!: string;
    public username!: string;
    public displayName!: string;
    public avatarUrl?: string;
    public isLive!: boolean;
    public lastChecked!: Date;
    public streamTitle?: string;
    public viewerCount?: number;
    public followers?: number;
}

Streamer.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    platform: {
        type: DataTypes.ENUM('twitch', 'youtube', 'tiktok', 'kick'),
        allowNull: false
    },
    platformId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isLive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastChecked: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    streamTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    viewerCount: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    followers: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Streamer',
    indexes: [
        { fields: ['platform', 'platform_id'] },
        { fields: ['username'] }
    ]
});

// Subscription Model
export class Subscription extends Model {
    public id!: string;
    public guildId!: string;
    public channelId!: string;
    public streamerId!: string;
    public isActive!: boolean;
    public customMessage?: string;
}

Subscription.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    streamerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Streamer,
            key: 'id'
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    customMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Subscription',
    indexes: [
        { fields: ['guild_id'] },
        { fields: ['channel_id'] },
        { fields: ['streamer_id'] }
    ]
});

// StreamEvent Model
export class StreamEvent extends Model {
    public id!: string;
    public streamerId!: string;
    public eventType!: 'live' | 'offline';
    public timestamp!: Date;
    public streamTitle?: string;
    public viewerCount?: number;
}

StreamEvent.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    streamerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Streamer,
            key: 'id'
        }
    },
    eventType: {
        type: DataTypes.ENUM('live', 'offline'),
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    streamTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    viewerCount: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'StreamEvent',
    indexes: [
        { fields: ['streamer_id'] },
        { fields: ['event_type'] },
        { fields: ['timestamp'] }
    ]
});

// Define associations
Streamer.hasMany(Subscription, { foreignKey: 'streamerId' });
Subscription.belongsTo(Streamer, { foreignKey: 'streamerId' });

Streamer.hasMany(StreamEvent, { foreignKey: 'streamerId' });
StreamEvent.belongsTo(Streamer, { foreignKey: 'streamerId' });

export async function connectDatabase(): Promise<void> {
    try {
        // Test the connection
        await sequelize.authenticate();
        logger.info('SQLite database connection established successfully');

        // Create data directory if it doesn't exist
        const fs = require('fs');
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Sync database (create tables if they don't exist)
        // Use alter: false to avoid excessive migrations on every startup
        await sequelize.sync({ alter: false });
        logger.info('Database tables synchronized');

    } catch (error) {
        logger.error('Unable to connect to SQLite database:', error);
        throw error;
    }
}

export { sequelize };
