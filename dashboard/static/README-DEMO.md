# 🎮 Stream Tracker Dashboard - GitHub Pages Demo

A live demo of the Stream Tracker Dashboard showcasing all features with sample data.

## 🌟 Features Demonstrated

- **Multi-Platform Support**: Twitch, YouTube, TikTok, Kick
- **Real-Time Monitoring**: Live viewer count updates
- **Discord Integration**: Channel management and notifications
- **Beautiful UI**: Modern dark theme with responsive design
- **Activity Tracking**: Stream events and bot activity logs
- **Statistics Dashboard**: Comprehensive analytics view

## 🚀 Live Demo

Visit: **[https://frostythedevv.github.io/Track](https://frostythedevv.github.io/Track)**

## 📱 What You'll See

### Dashboard Overview
- Live streamers with real-time viewer counts
- Platform distribution statistics
- Recent activity feed
- Bot status and health metrics

### Streamers Management
- Add/remove streamers from multiple platforms
- View follower counts and stream status
- Monitor last activity and stream titles

### Channel Configuration
- Discord server and channel management
- Notification settings and custom messages
- Subscription management

### Real-Time Updates
- Simulated live viewer count changes
- Activity feed updates
- Stream status changes

## 🎯 Demo Data Includes

- **5 Popular Streamers**: Ninja, MrBeast, Charli D'Amelio, Trainwreckstv, Pokimane
- **Multiple Platforms**: All major streaming platforms represented
- **Live Activity**: Realistic stream events and notifications
- **Discord Integration**: Sample servers and channels

## 🔧 Technical Features

- **Pure Static Site**: No backend required, perfect for GitHub Pages
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern JavaScript**: ES6+ features with clean, maintainable code
- **Real-Time Simulation**: Updates every 5 seconds to show live functionality
- **Interactive**: All buttons and forms work with demo data

## 🛠️ How It Works

This demo uses:
- **Demo Mode**: Enabled via `CONFIG.DEMO_MODE = true`
- **Mock Data**: Comprehensive sample data in `demo-data.js`
- **Simulated API**: Functions that mimic real API responses
- **Local Storage**: Persists demo changes during session

## 🎨 UI Highlights

- **Deep Blue Theme**: Professional color scheme
- **Font Awesome Icons**: Consistent iconography
- **Smooth Animations**: Hover effects and transitions
- **Accessible Design**: Proper ARIA labels and keyboard navigation
- **Mobile Optimized**: Touch-friendly interface

## 🔗 Related Projects

- **Discord Bot**: Full-featured multi-platform stream tracking bot
- **API Server**: RESTful API for dashboard communication
- **Real-Time Updates**: WebSocket integration for live data

## 📋 For Developers

### Running Locally
1. Clone the repository
2. Serve the static files: `python -m http.server 8000`
3. Open `http://localhost:8000`

### Deploying to GitHub Pages
1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push changes to trigger automatic deployment

### Converting to Production
1. Set `CONFIG.DEMO_MODE = false` in `config.js`
2. Update API URLs to your live bot endpoints
3. Deploy your Discord bot to a cloud service

## 🌐 Live Bot Requirements

To use this dashboard with a real bot, you'll need:
- Discord bot deployed to cloud service (Heroku, Railway, etc.)
- HTTPS API endpoints
- WebSocket support for real-time updates
- CORS enabled for GitHub Pages domain

## 📞 Support

This is a demonstration project. For questions about the full Stream Tracker bot:
- Check the main README.md
- Review the deployment guides
- See the issue tracker for known problems

## 🎉 Enjoy the Demo!

This dashboard shows the full potential of the Stream Tracker system. All the features you see here are available in the complete bot package!
