# GitHub Actions Data Bridge Setup

This approach uses GitHub Actions to periodically fetch data from your self-hosted bot and serve it via GitHub Pages.

## How It Works

1. **Your Bot** runs locally with a simple data export endpoint
2. **GitHub Actions** fetches data every 5 minutes
3. **JSON files** are committed to your repo
4. **Dashboard** reads JSON files directly (no API calls needed)

## Step 1: Add Data Export to Your Bot

Add this to your bot's API server:

```typescript
// In src/api/routes/data-export.ts
import { Router } from 'express';
import { Streamer, Subscription, StreamEvent } from '../../models';

const router = Router();

router.get('/export', async (req, res) => {
    try {
        const streamers = await Streamer.find();
        const subscriptions = await Subscription.find();
        const events = await StreamEvent.find().sort({ timestamp: -1 }).limit(50);
        
        const exportData = {
            timestamp: new Date().toISOString(),
            streamers: streamers,
            subscriptions: subscriptions,
            events: events,
            stats: {
                totalStreamers: streamers.length,
                liveStreamers: streamers.filter(s => s.isLive).length,
                totalSubscriptions: subscriptions.length,
                recentEvents: events.length
            }
        };
        
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

export { router as dataExportRouter };
```

## Step 2: GitHub Action Workflow

Create `.github/workflows/fetch-data.yml`:

```yaml
name: Fetch Bot Data

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Fetch data from bot
        run: |
          curl -f "http://YOUR_PUBLIC_IP:3001/api/data-export/export" > dashboard/static/data/current.json
          
      - name: Commit data
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add dashboard/static/data/current.json
          git diff --staged --quiet || git commit -m "Update bot data $(date)"
          git push
```

## Step 3: Update Dashboard to Read JSON Files

```javascript
// In dashboard/static/js/app.js
async loadInitialData() {
    if (CONFIG.DEMO_MODE) {
        this.loadDemoData();
        return;
    }

    try {
        // Fetch data from committed JSON file
        const response = await fetch('./data/current.json');
        const data = await response.json();
        
        this.data.streamers = data.streamers;
        this.data.subscriptions = data.subscriptions;
        this.data.events = data.events;
        this.data.stats = data.stats;
        
        this.renderAllData();
    } catch (error) {
        console.error('Failed to load data:', error);
        this.loadDemoData(); // Fallback to demo
    }
}
```

## Requirements

- Your bot must be accessible via public IP (router port forwarding)
- HTTP endpoint is fine (HTTPS not required for data export)
- GitHub Actions will handle the data fetching

## Pros
- ✅ No external dependencies
- ✅ Works with GitHub Pages
- ✅ Real data from your bot
- ✅ Simple setup

## Cons
- ⚠️ 5-minute data delay
- ⚠️ Requires public IP access
- ⚠️ No real-time updates
