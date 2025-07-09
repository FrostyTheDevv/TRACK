# GitHub Pages Deployment Guide

This guide will help you deploy the Stream Tracker Dashboard to GitHub Pages for free hosting.

## Prerequisites

1. A GitHub account
2. Your Discord bot deployed and running on a cloud service (Heroku, Railway, etc.)
3. Your bot's API URL accessible from the internet

## Step 1: Update Configuration

### 1.1 Update API URLs in the Dashboard

Edit `dashboard/static/js/config.js` and update the production API URLs:

```javascript
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'  // Local development
        : 'https://YOUR-BOT-API-URL.herokuapp.com/api', // 👈 UPDATE THIS
    
    SOCKET_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'  // Local development
        : 'https://YOUR-BOT-API-URL.herokuapp.com', // 👈 UPDATE THIS
};
```

Replace `YOUR-BOT-API-URL.herokuapp.com` with your actual bot's API URL.

### 1.2 Update Jekyll Configuration

Edit `dashboard/static/_config.yml`:

```yaml
baseurl: "/YOUR-REPO-NAME"  # 👈 UPDATE THIS (usually "Track")
url: "https://frostythedevv.github.io"  # 👈 UPDATE THIS
```

## Step 2: Configure Your Bot for CORS

Make sure your Discord bot's API server allows requests from your GitHub Pages domain.

In your bot's `src/api/server.ts`, update the CORS configuration:

```typescript
this.app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://frostythedevv.github.io'  // 👈 ADD THIS
    ],
    credentials: true
}));
```

## Step 3: Deploy to GitHub

### 3.1 Push Your Code to GitHub

```bash
git add .
git commit -m "Set up GitHub Pages deployment"
git push origin main
```

### 3.2 Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. The workflow will automatically deploy your dashboard

## Step 4: Access Your Dashboard

After deployment, your dashboard will be available at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
```

For example: `https://frostythedevv.github.io/Track`

## Step 5: Bot Deployment Requirements

For the dashboard to work properly, your Discord bot needs to be deployed to a cloud service that provides:

1. **HTTPS endpoints** (required for GitHub Pages to connect)
2. **WebSocket support** (for real-time updates)
3. **CORS enabled** for your GitHub Pages domain
4. **24/7 uptime** (recommended)

### Recommended Bot Hosting Services:

1. **Heroku** (Free tier available)
   - Easy deployment with Git
   - Automatic HTTPS
   - WebSocket support

2. **Railway** (Free tier available)
   - Simple deployment
   - Automatic HTTPS
   - Good for Node.js apps

3. **Render** (Free tier available)
   - Zero-config deployment
   - Automatic HTTPS
   - WebSocket support

## Step 6: Environment Variables for Production

Make sure your bot has these environment variables set in production:

```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://YOUR-USERNAME.github.io
DATABASE_TYPE=sqlite
DISCORD_BOT_TOKEN=your_bot_token
# ... other API keys
```

## Troubleshooting

### Dashboard shows "Bot Offline"
- Check if your bot is running and accessible
- Verify the API URLs in `config.js` are correct
- Check browser console for CORS errors

### Real-time updates not working
- Ensure WebSocket connections are allowed
- Check if your hosting service supports WebSockets
- Verify Socket.IO is properly configured

### GitHub Pages not updating
- Check the Actions tab for deployment status
- Ensure the workflow has proper permissions
- Verify the source is set to "GitHub Actions"

## Local Development

To test locally while connected to your production bot:

1. Update `config.js` temporarily to point to your production API
2. Serve the static files: `python -m http.server 8000` (in `dashboard/static/`)
3. Access at `http://localhost:8000`

## Security Notes

- Never commit API keys or sensitive tokens to the repository
- Use environment variables for sensitive configuration
- Ensure your bot validates and sanitizes all API inputs
- Consider rate limiting for your API endpoints

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Verify network requests in the browser's Network tab
3. Check your bot's logs for API errors
4. Ensure all URLs and configurations are correct
