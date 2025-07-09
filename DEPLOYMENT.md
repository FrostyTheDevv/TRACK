# Static Dashboard Deployment Guide

This guide explains how to deploy the Stream Tracker dashboard as a static site on GitHub Pages.

## 🚀 GitHub Pages Deployment

### Step 1: Repository Setup

1. **Fork or create a repository** with your Stream Tracker code
2. **Push your code** to the main branch

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select:
   - **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**

### Step 3: Configure Dashboard

1. **Edit the API URL** in `dashboard/static/js/app.js`:
   ```javascript
   // Change this line to your deployed bot's API URL
   this.apiBaseUrl = 'https://your-bot-api.herokuapp.com/api';
   ```

2. **Update CORS settings** in your bot's API server to allow your GitHub Pages domain:
   ```javascript
   // In your bot's API server
   const corsOptions = {
     origin: [
       'http://localhost:8000',
       'https://yourusername.github.io'
     ]
   };
   ```

### Step 4: Access Your Dashboard

Your dashboard will be available at:
```
https://yourusername.github.io/Track/dashboard/static/
```

Or if you set up the redirect (which we have), simply:
```
https://yourusername.github.io/Track/
```

## 🔧 Alternative Deployment Options

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: (none - it's static)
3. Set publish directory: `dashboard/static`
4. Deploy

### Vercel
1. Import your GitHub repository to Vercel
2. Set output directory: `dashboard/static`
3. Deploy

### Custom Domain
If you have a custom domain:

1. **Create CNAME file** in `dashboard/static/CNAME`:
   ```
   yourdomain.com
   ```

2. **Configure DNS** to point to GitHub Pages:
   ```
   CNAME record: www -> yourusername.github.io
   A records: @ -> 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   ```

## 🛠️ Local Development

### Using Python
```bash
cd dashboard/static
python -m http.server 8000
# Visit http://localhost:8000
```

### Using Node.js
```bash
npx http-server dashboard/static -p 8000
# Visit http://localhost:8000
```

### Using PHP
```bash
cd dashboard/static
php -S localhost:8000
# Visit http://localhost:8000
```

### Using Live Server (VS Code)
1. Install Live Server extension
2. Right-click on `dashboard/static/index.html`
3. Select "Open with Live Server"

## 🔐 Security Considerations

### API URL Configuration
- **Development**: Use `http://localhost:3001/api`
- **Production**: Use your deployed bot's HTTPS URL
- **Never expose sensitive tokens** in the frontend code

### CORS Configuration
Make sure your bot's API server allows requests from your dashboard domain:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:8000',           // Local development
    'https://yourusername.github.io'  // GitHub Pages
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

## 📱 Mobile Responsiveness

The dashboard is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets
- Mobile phones

## 🐛 Troubleshooting

### Dashboard not loading
1. Check browser console for errors
2. Verify API URL is correct
3. Check if bot API is running and accessible
4. Verify CORS settings

### Real-time updates not working
1. Check if Socket.IO is loading from CDN
2. Verify WebSocket connection in browser dev tools
3. Check bot's Socket.IO server configuration

### Styles not loading
1. Check if CSS file path is correct
2. Verify Font Awesome CDN is accessible
3. Check for browser cache issues (hard refresh)

## 📊 Performance Tips

### Optimize loading
- Enable GitHub Pages caching
- Use CDN for external libraries
- Minimize API calls

### Monitor usage
- Use browser dev tools to monitor network requests
- Check API response times
- Monitor WebSocket connection stability
