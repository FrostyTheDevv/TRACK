# 🎮 Stream Tracker Discord Bot & Dashboard

A comprehensive Discord bot that tracks live streams across multiple platforms (Twitch, YouTube, TikTok, Kick) with a beautiful web dashboard that can be deployed to GitHub Pages.

![Dashboard Preview](https://img.shields.io/badge/Status-Ready_for_Deployment-brightgreen)
![Platform](https://img.shields.io/badge/Platform-Multi--Platform-blue)
![Database](https://img.shields.io/badge/Database-SQLite-orange)

## 🚀 Quick Start

### Option 1: Demo Mode (GitHub Pages) - **Recommended for First Try**
Perfect for showcasing the dashboard with mock data:

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings (Pages → Source: Deploy from branch → main → /dashboard/static)
3. **Access your dashboard** at: `https://yourusername.github.io/repository-name/dashboard/static/`

That's it! The dashboard will run in demo mode with simulated live stream data.

### Option 2: Real Data Mode
Connect to a self-hosted bot for live stream tracking:

1. **Set up the bot** (see [REAL_DATA_SETUP.md](REAL_DATA_SETUP.md))
2. **Configure GitHub Actions** to fetch data from your bot
3. **Update dashboard settings** to use real data

📖 **Full deployment guides available**: [DEPLOYMENT.md](DEPLOYMENT.md) | [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)

## ✨ Features

### 🤖 Discord Bot
- **Multi-Platform Support**: Track streamers on Twitch, YouTube, TikTok, and Kick
- **Real-time Notifications**: Instant Discord notifications when streamers go live
- **Customizable Messages**: Personalized notification templates
- **Multiple Channels**: Support for multiple Discord notification channels
- **Slash Commands**: Modern Discord slash command interface

### 🌐 Web Dashboard
- **Static Site**: Deployable to GitHub Pages for free hosting
- **Real-time Updates**: Live stream status via WebSocket
- **Modern UI**: Deep blue and black themed responsive design
- **Complete Management**: Add/remove streamers, configure settings
- **Activity Logs**: Monitor bot activity and stream events

### 🔧 Technical Features
- **RESTful API**: Complete API for dashboard integration
- **MongoDB Storage**: Persistent data storage
- **Error Handling**: Comprehensive logging and error management
- **Rate Limiting**: Proper API rate limiting for external services
- **TypeScript**: Full type safety and modern JavaScript features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Discord bot token
- Platform API keys (Twitch, YouTube, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Track
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build and start**
   ```bash
   npm run build
   npm start
   ```

5. **Development mode**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_guild_id_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/stream-tracker

# API Configuration
PORT=3001
NODE_ENV=development

# Platform API Keys
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
YOUTUBE_API_KEY=your_youtube_api_key_here
TIKTOK_API_KEY=your_tiktok_api_key_here
KICK_API_KEY=your_kick_api_key_here

# Dashboard Configuration
CORS_ORIGIN=http://localhost:8000
```

### Getting API Keys

#### Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the token to `DISCORD_TOKEN`
5. Copy the application ID to `DISCORD_CLIENT_ID`

#### Twitch API
1. Go to [Twitch Developers](https://dev.twitch.tv/)
2. Register your application
3. Get Client ID and Client Secret

#### YouTube API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create credentials (API Key)

#### Other Platforms
- **TikTok**: Contact TikTok for Business API access
- **Kick**: Check Kick's developer documentation

## 📱 Dashboard Deployment

The dashboard is a static site that can be deployed to GitHub Pages for free:

### GitHub Pages Setup

1. **Fork this repository**
2. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to Pages section
   - Set source to "Deploy from a branch"
   - Select branch: `main`
   - Set folder: `/dashboard/static`

3. **Update API URL**
   - Edit `dashboard/static/js/app.js`
   - Change `apiBaseUrl` to your deployed bot's API URL

4. **Access your dashboard**
   - Visit `https://yourusername.github.io/Track/`

### Local Dashboard Development

```bash
# Serve dashboard locally
cd dashboard/static
python -m http.server 8000

# Or use any static file server
npx http-server dashboard/static
```

## 🎯 Usage

### Discord Commands

```
/stream add <platform> <username> [channel]
/stream remove <platform> <username>
/stream list
/stream test <platform> <username>
```

### Dashboard Features

1. **Dashboard**: Overview of all tracked streamers and live streams
2. **Streamers**: Add, edit, and remove tracked streamers
3. **Channels**: Manage Discord notification channels
4. **Settings**: Configure bot behavior and notification templates
5. **Logs**: Monitor bot activity and troubleshoot issues

## 🏗️ Project Structure

```
Track/
├── src/
│   ├── bot/                    # Discord bot logic
│   │   ├── StreamBot.ts       # Main bot class
│   │   └── commands/          # Slash commands
│   ├── api/                   # REST API server
│   │   ├── server.ts         # Express server
│   │   └── routes/           # API endpoints
│   ├── services/             # Business logic
│   │   ├── StreamMonitor.ts  # Stream checking service
│   │   └── StreamService.ts  # Platform integrations
│   ├── models/               # Database models
│   └── utils/                # Utilities
├── dashboard/
│   └── static/               # Static dashboard files
│       ├── index.html       # Main dashboard page
│       ├── css/style.css    # Styling
│       └── js/app.js        # Dashboard logic
├── .env.example             # Environment template
├── tsconfig.json           # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔌 API Endpoints

### Streamers
- `GET /api/streamers` - Get all tracked streamers
- `POST /api/streamers` - Add new streamer
- `DELETE /api/streamers/:id` - Remove streamer

### Channels
- `GET /api/channels` - Get notification channels
- `POST /api/channels` - Add notification channel
- `DELETE /api/channels/:id` - Remove channel

### Streams
- `GET /api/streams/live` - Get currently live streams
- `GET /api/stats` - Get bot statistics

### Settings
- `GET /api/settings` - Get bot settings
- `PUT /api/settings` - Update bot settings

## 🎨 Customization

### Color Scheme
The dashboard uses a Deep Blue and Black theme defined in CSS variables:

```css
:root {
    --primary-blue: #1a237e;
    --deep-blue: #0d47a1;
    --light-blue: #1976d2;
    --accent-blue: #2196f3;
    --black: #000000;
    --dark-gray: #212121;
}
```

### Notification Templates
Customize notification messages in the dashboard settings using these variables:
- `{streamer}` - Streamer name
- `{platform}` - Platform name
- `{game}` - Game/category
- `{title}` - Stream title
- `{url}` - Stream URL

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check Discord token validity
   - Verify bot permissions in Discord server
   - Check console logs for errors

2. **Streams not detected**
   - Verify platform API keys
   - Check API rate limits
   - Review streamer usernames for typos

3. **Dashboard not loading**
   - Check API URL configuration
   - Verify CORS settings
   - Check browser console for errors

### Debugging

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

Check logs:
```bash
tail -f logs/combined.log
```

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

If you need help:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Open an issue on GitHub
4. Join our Discord server (if available)

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) for Discord bot framework
- [Twitch API](https://dev.twitch.tv/) for stream data
- [YouTube Data API](https://developers.google.com/youtube/v3) for YouTube integration
- Font Awesome for icons
- Inter font family for typography
