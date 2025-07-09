<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Stream Tracker Discord Bot - Copilot Instructions

This is a comprehensive Discord bot for tracking live streams across multiple platforms (Twitch, YouTube, TikTok, Kick) with a static web dashboard.

## Project Structure

- **Backend**: Node.js/TypeScript Discord bot with Express API
- **Frontend**: Static HTML/CSS/JavaScript dashboard (deployable to GitHub Pages)
- **Database**: MongoDB for storing streamers, subscriptions, and events
- **Real-time**: Socket.IO for live dashboard updates

## Key Features

1. **Multi-platform Stream Tracking**: Integrates with Twitch, YouTube, TikTok, and Kick APIs
2. **Discord Integration**: Sends notifications when streamers go live
3. **Web Dashboard**: Static site for managing streamers and settings
4. **Real-time Updates**: WebSocket connections for live data
5. **RESTful API**: Complete API for dashboard interaction

## Code Style & Patterns

- Use TypeScript with strict type checking
- Follow async/await patterns for API calls
- Implement proper error handling and logging
- Use MongoDB with Mongoose for data modeling
- Follow REST API conventions for endpoints
- Use Socket.IO for real-time communication

## Color Scheme

The UI uses a Deep Blue and Black theme:
- Primary Blue: #1a237e
- Deep Blue: #0d47a1  
- Light Blue: #1976d2
- Accent Blue: #2196f3
- Black: #000000
- Dark Gray: #212121

## Environment Variables

The project uses these key environment variables:
- Discord bot tokens and IDs
- Platform API keys (Twitch, YouTube, TikTok, Kick)
- MongoDB connection string
- Server configuration (ports, CORS settings)

## Dependencies

Key packages used:
- discord.js for Discord bot functionality
- express for REST API server
- mongoose for MongoDB integration
- socket.io for real-time updates
- axios for external API calls
- node-cron for scheduled tasks
- winston for logging

## GitHub Pages Deployment

The dashboard is designed as a static site that can be deployed to GitHub Pages. The frontend connects to the bot's API via REST and WebSocket endpoints.

When working on this project:
1. Maintain separation between bot logic and API endpoints
2. Ensure CORS is properly configured for dashboard access
3. Use proper TypeScript types for all API responses
4. Follow Discord.js best practices for bot commands
5. Implement rate limiting for external API calls
6. Use proper error handling for all async operations
