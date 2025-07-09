import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
    guildId: string;
    channelId: string;
    streamerId: mongoose.Types.ObjectId;
    notificationMessage?: string;
    mentionRole?: string;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    streamerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Streamer', 
        required: true 
    },
    notificationMessage: { 
        type: String, 
        default: '🔴 **{streamer}** is now live on {platform}!\n\n**{title}**\n{url}' 
    },
    mentionRole: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
}, {
    timestamps: true,
    collection: 'subscriptions'
});

// Create compound index to prevent duplicate subscriptions
SubscriptionSchema.index({ guildId: 1, channelId: 1, streamerId: 1 }, { unique: true });
SubscriptionSchema.index({ streamerId: 1 });
SubscriptionSchema.index({ isActive: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
