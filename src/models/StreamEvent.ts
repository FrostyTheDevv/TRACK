import mongoose, { Document, Schema } from 'mongoose';

export interface IStreamEvent extends Document {
    streamerId: mongoose.Types.ObjectId;
    eventType: 'live' | 'offline' | 'title_change' | 'game_change';
    streamTitle?: string;
    streamUrl?: string;
    streamThumbnail?: string;
    gameName?: string;
    viewerCount?: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}

const StreamEventSchema = new Schema<IStreamEvent>({
    streamerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Streamer', 
        required: true 
    },
    eventType: { 
        type: String, 
        required: true, 
        enum: ['live', 'offline', 'title_change', 'game_change'] 
    },
    streamTitle: { type: String },
    streamUrl: { type: String },
    streamThumbnail: { type: String },
    gameName: { type: String },
    viewerCount: { type: Number },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: false,
    collection: 'stream_events'
});

// Create indexes for efficient querying
StreamEventSchema.index({ streamerId: 1, timestamp: -1 });
StreamEventSchema.index({ eventType: 1, timestamp: -1 });
StreamEventSchema.index({ timestamp: 1 });

export const StreamEvent = mongoose.model<IStreamEvent>('StreamEvent', StreamEventSchema);
