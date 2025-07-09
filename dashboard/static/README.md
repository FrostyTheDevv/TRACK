# Stream Tracker Dashboard

A modern, responsive dashboard for managing your multi-platform Discord stream tracking bot.

## Features

- **Real-time Monitoring**: Track live streams across Twitch, YouTube, TikTok, and Kick
- **Discord Integration**: Manage notification channels and settings
- **Beautiful UI**: Deep blue and black themed interface
- **Responsive Design**: Works on desktop and mobile devices
- **Live Updates**: Real-time stream status updates via WebSocket

## GitHub Pages Deployment

This dashboard is designed to be deployed as a static site on GitHub Pages.

### Setup

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Set source to `dashboard/static` folder
4. Update the API URL in `js/app.js` to point to your deployed bot API

### Configuration

Edit the `apiBaseUrl` in `js/app.js` to match your bot's API endpoint:

```javascript
this.apiBaseUrl = 'https://your-bot-api.herokuapp.com/api';
```

## Local Development

To run locally, simply serve the `static` folder with any web server:

```bash
# Using Python
cd dashboard/static
python -m http.server 8000

# Using Node.js http-server
npx http-server dashboard/static

# Using Live Server (VS Code extension)
# Open index.html and click "Go Live"
```

## Bot Integration

This dashboard connects to the Stream Tracker Discord bot via REST API and WebSocket. Make sure your bot includes CORS headers for your dashboard domain.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
