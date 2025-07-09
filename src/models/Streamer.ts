import mongoose, { Document, Schema } from 'mongoose';

export interface IStreamer extends Document {
    username: string;
    displayName: string;
    platform: 'twitch' | 'youtube' | 'tiktok' | 'kick';
    platformId: string;
    isLive: boolean;
    lastStreamTitle?: string;
    lastStreamUrl?: string;
    lastStreamThumbnail?: string;
    lastStreamStarted?: Date;
    lastChecked: Date;
    followers: number;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const StreamerSchema = new Schema<IStreamer>({
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    platform: { 
        type: String, 
        required: true, 
        enum: ['twitch', 'youtube', 'tiktok', 'kick'] 
    },
    platformId: { type: String, required: true, unique: true },
    isLive: { type: Boolean, default: false },
    lastStreamTitle: { type: String },
    lastStreamUrl: { type: String },
    lastStreamThumbnail: { type: String },
    lastStreamStarted: { type: Date },
    lastChecked: { type: Date, default: Date.now },
    followers: { type: Number, default: 0 },
    avatarUrl: { type: String },
}, {
    timestamps: true,
    collection: 'streamers'
});

// Create compound index for platform and platformId
StreamerSchema.index({ platform: 1, platformId: 1 }, { unique: true });
StreamerSchema.index({ isLive: 1 });
StreamerSchema.index({ lastChecked: 1 });

export const Streamer = mongoose.model<IStreamer>('Streamer', StreamerSchema);
