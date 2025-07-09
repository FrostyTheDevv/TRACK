// Demo Data for Stream Tracker Dashboard
// This provides mock data when running in demo mode on GitHub Pages

const DEMO_DATA = {
    // Mock streamers data
    streamers: [
        {
            id: '1',
            platform: 'twitch',
            username: 'ninja',
            displayName: 'Ninja',
            avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-f3c6f0fe40b0a85e-300x300.png',
            isLive: true,
            followers: 18500000,
            lastChecked: new Date().toISOString(),
            streamTitle: 'FORTNITE with NEW UPDATE! Playing with Viewers!',
            viewerCount: 45230,
            streamUrl: 'https://twitch.tv/ninja'
        },
        {
            id: '2',
            platform: 'youtube',
            username: 'mrbeast',
            displayName: 'MrBeast',
            avatarUrl: 'https://yt3.googleusercontent.com/ytc/AGIKgqNRr7IEdQ7TplsO8BG-KjG19aCcCpVjiV9l36-9lQ=s240-c-k-c0x00ffffff-no-rj',
            isLive: false,
            followers: 112000000,
            lastChecked: new Date().toISOString(),
            streamTitle: 'Last stream: $456,000 Squid Game In Real Life!',
            viewerCount: 0
        },
        {
            id: '3',
            platform: 'tiktok',
            username: 'charlidamelio',
            displayName: 'Charli D\'Amelio',
            avatarUrl: 'https://p16-sign-sg.tiktokcdn.com/aweme/100x100/tos-alisg-avt-0068/7318147dcec8c93b8c6ad345d5703970.jpeg',
            isLive: true,
            followers: 151200000,
            lastChecked: new Date().toISOString(),
            streamTitle: 'Dancing and chatting with you guys! 💃',
            viewerCount: 12450,
            streamUrl: 'https://tiktok.com/@charlidamelio'
        },
        {
            id: '4',
            platform: 'kick',
            username: 'trainwreckstv',
            displayName: 'Trainwreckstv',
            avatarUrl: 'https://files.kick.com/images/user/134/profile_image/conversion/05920e90-88fa-43d6-8e6b-5bebe9ef82c3-fullsize.webp',
            isLive: false,
            followers: 890000,
            lastChecked: new Date().toISOString(),
            streamTitle: 'Last stream: SLOTS & CHILL - Viewer Interaction',
            viewerCount: 0
        },
        {
            id: '5',
            platform: 'twitch',
            username: 'pokimane',
            displayName: 'Pokimane',
            avatarUrl: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-7cb1800bb8c29b37-300x300.png',
            isLive: true,
            followers: 9300000,
            lastChecked: new Date().toISOString(),
            streamTitle: 'Cozy Valorant Ranked Grind 🌸',
            viewerCount: 18750,
            streamUrl: 'https://twitch.tv/pokimane'
        }
    ],

    // Mock subscriptions data
    subscriptions: [
        {
            id: 'sub1',
            guildId: '123456789012345678',
            guildName: 'Awesome Gaming Server',
            channelId: '234567890123456789',
            channelName: 'stream-notifications',
            streamerId: '1',
            streamerName: 'Ninja',
            platform: 'twitch',
            isActive: true,
            customMessage: '🔴 {streamer} is now live on {platform}! Come check it out: {url}',
            createdAt: '2024-01-15T10:30:00Z'
        },
        {
            id: 'sub2',
            guildId: '123456789012345678',
            guildName: 'Awesome Gaming Server',
            channelId: '345678901234567890',
            channelName: 'youtube-streams',
            streamerId: '2',
            streamerName: 'MrBeast',
            platform: 'youtube',
            isActive: true,
            customMessage: null,
            createdAt: '2024-01-20T14:15:00Z'
        },
        {
            id: 'sub3',
            guildId: '987654321098765432',
            guildName: 'Content Creator Hub',
            channelId: '456789012345678901',
            channelName: 'live-alerts',
            streamerId: '3',
            streamerName: 'Charli D\'Amelio',
            platform: 'tiktok',
            isActive: true,
            customMessage: '💃 {streamer} is dancing live! Join the fun!',
            createdAt: '2024-02-01T09:45:00Z'
        }
    ],

    // Mock events data
    events: [
        {
            id: 'evt1',
            streamerId: '1',
            streamerName: 'Ninja',
            platform: 'twitch',
            eventType: 'live',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            streamTitle: 'FORTNITE with NEW UPDATE! Playing with Viewers!',
            viewerCount: 45230
        },
        {
            id: 'evt2',
            streamerId: '3',
            streamerName: 'Charli D\'Amelio',
            platform: 'tiktok',
            eventType: 'live',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            streamTitle: 'Dancing and chatting with you guys! 💃',
            viewerCount: 12450
        },
        {
            id: 'evt3',
            streamerId: '4',
            streamerName: 'Trainwreckstv',
            platform: 'kick',
            eventType: 'offline',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            streamTitle: 'SLOTS & CHILL - Viewer Interaction',
            viewerCount: 0
        },
        {
            id: 'evt4',
            streamerId: '5',
            streamerName: 'Pokimane',
            platform: 'twitch',
            eventType: 'live',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
            streamTitle: 'Cozy Valorant Ranked Grind 🌸',
            viewerCount: 18750
        },
        {
            id: 'evt5',
            streamerId: '2',
            streamerName: 'MrBeast',
            platform: 'youtube',
            eventType: 'offline',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
            streamTitle: '$456,000 Squid Game In Real Life!',
            viewerCount: 0
        }
    ],

    // Mock statistics
    stats: {
        totalStreamers: 5,
        liveStreamers: 3,
        totalSubscriptions: 3,
        activeGuilds: 2,
        notificationsSent: 127,
        platformDistribution: [
            { platform: 'twitch', count: 2 },
            { platform: 'youtube', count: 1 },
            { platform: 'tiktok', count: 1 },
            { platform: 'kick', count: 1 }
        ]
    },

    // Mock guilds data
    guilds: [
        {
            id: '123456789012345678',
            name: 'Awesome Gaming Server',
            icon: 'https://cdn.discordapp.com/icons/123456789012345678/a_1234567890abcdef1234567890abcdef.webp',
            memberCount: 1250,
            subscriptionCount: 2,
            channels: [
                { id: '234567890123456789', name: 'stream-notifications', type: 'text' },
                { id: '345678901234567890', name: 'youtube-streams', type: 'text' },
                { id: '456789012345678901', name: 'general', type: 'text' }
            ]
        },
        {
            id: '987654321098765432',
            name: 'Content Creator Hub',
            icon: 'https://cdn.discordapp.com/icons/987654321098765432/b_0987654321fedcba0987654321fedcba.webp',
            memberCount: 890,
            subscriptionCount: 1,
            channels: [
                { id: '456789012345678901', name: 'live-alerts', type: 'text' },
                { id: '567890123456789012', name: 'chat', type: 'text' }
            ]
        }
    ]
};

// Simulate API response delays for realism
const simulateApiDelay = () => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
};

// Demo API functions that return mock data
const DemoAPI = {
    // Get all streamers
    async getStreamers() {
        await simulateApiDelay();
        return { data: DEMO_DATA.streamers };
    },

    // Get all subscriptions
    async getSubscriptions() {
        await simulateApiDelay();
        return { data: DEMO_DATA.subscriptions };
    },

    // Get events
    async getEvents() {
        await simulateApiDelay();
        return { data: DEMO_DATA.events };
    },

    // Get statistics
    async getStats() {
        await simulateApiDelay();
        return { data: DEMO_DATA.stats };
    },

    // Get guilds
    async getGuilds() {
        await simulateApiDelay();
        return { data: DEMO_DATA.guilds };
    },

    // Add streamer (demo - just adds to local array)
    async addStreamer(streamerData) {
        await simulateApiDelay();
        const newStreamer = {
            id: Date.now().toString(),
            ...streamerData,
            isLive: false,
            followers: Math.floor(Math.random() * 1000000),
            lastChecked: new Date().toISOString()
        };
        DEMO_DATA.streamers.push(newStreamer);
        return { data: newStreamer };
    },

    // Delete streamer (demo)
    async deleteStreamer(id) {
        await simulateApiDelay();
        const index = DEMO_DATA.streamers.findIndex(s => s.id === id);
        if (index > -1) {
            DEMO_DATA.streamers.splice(index, 1);
            return { success: true };
        }
        return { error: 'Streamer not found' };
    },

    // Add subscription (demo)
    async addSubscription(subData) {
        await simulateApiDelay();
        const newSub = {
            id: Date.now().toString(),
            ...subData,
            createdAt: new Date().toISOString()
        };
        DEMO_DATA.subscriptions.push(newSub);
        return { data: newSub };
    },

    // Delete subscription (demo)
    async deleteSubscription(id) {
        await simulateApiDelay();
        const index = DEMO_DATA.subscriptions.findIndex(s => s.id === id);
        if (index > -1) {
            DEMO_DATA.subscriptions.splice(index, 1);
            return { success: true };
        }
        return { error: 'Subscription not found' };
    }
};

// Export for use in the main app
if (typeof window !== 'undefined') {
    window.DEMO_DATA = DEMO_DATA;
    window.DemoAPI = DemoAPI;
}
