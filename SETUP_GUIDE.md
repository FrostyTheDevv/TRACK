# MongoDB Setup Guide

This project can use either a local MongoDB installation or MongoDB Atlas (cloud database). Here are instructions for both:

## Option 1: MongoDB Atlas (Recommended - Easier Setup)

1. **Create a MongoDB Atlas Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose the FREE tier (M0 Sandbox)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Set up Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set database user privileges to "Read and write to any database"
   - Click "Add User"

4. **Set up Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your database user credentials

6. **Update .env File**
   - Copy `.env.example` to `.env`
   - Replace the MONGODB_URI with your Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stream-tracker?retryWrites=true&w=majority
   ```

## Option 2: Local MongoDB Installation

1. **Install MongoDB**
   - Download from https://www.mongodb.com/try/download/community
   - Or use winget: `winget install MongoDB.Server`

2. **Start MongoDB Service**
   ```powershell
   # Start as Windows service
   net start MongoDB
   
   # Or start manually
   mongod --dbpath "C:\data\db"
   ```

3. **Update .env File**
   - Copy `.env.example` to `.env`
   - Keep the default local connection:
   ```
   MONGODB_URI=mongodb://localhost:27017/stream-tracker
   ```

## Testing the Connection

After setting up either option:

1. Copy `.env.example` to `.env` and fill in your database URL
2. Run the application: `npm start`
3. Check the logs for successful database connection

## Discord Bot Setup

To get your Discord bot token:

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to the "Bot" section
4. Create a bot and copy the token
5. Add the token to your `.env` file as `DISCORD_TOKEN`

## API Keys (Optional)

For full functionality, you'll need API keys from:
- Twitch: https://dev.twitch.tv/
- YouTube: https://console.developers.google.com/
- TikTok: https://developers.tiktok.com/
- Kick: Currently using web scraping (no API key needed)

Add these to your `.env` file when available.
