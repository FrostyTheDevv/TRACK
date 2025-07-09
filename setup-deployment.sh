#!/bin/bash

# Setup script for Stream Tracker deployment
echo "🚀 Stream Tracker - Deployment Setup"
echo "======================================"

# Check if we have an IP address argument
if [ "$1" == "" ]; then
    echo "Usage: ./setup-deployment.sh YOUR_PUBLIC_IP_OR_DOMAIN"
    echo "Example: ./setup-deployment.sh 123.456.789.012"
    echo "Example: ./setup-deployment.sh mydomain.ddns.net"
    exit 1
fi

PUBLIC_IP=$1

echo "📝 Updating GitHub Actions workflow with IP: $PUBLIC_IP"

# Update the GitHub Actions workflow file
sed -i "s/YOUR_PUBLIC_IP/$PUBLIC_IP/g" .github/workflows/fetch-data.yml

echo "✅ Updated .github/workflows/fetch-data.yml"

echo ""
echo "🔧 Next steps:"
echo "1. Commit and push to GitHub"
echo "2. Enable GitHub Pages in repository settings"
echo "3. Set up port forwarding for port 3001"
echo "4. Update CORS_ORIGIN in .env to your GitHub Pages URL"
echo "5. Set DEMO_MODE to false in dashboard/static/js/config.js"
echo ""
echo "📖 See REAL_DATA_SETUP.md for detailed instructions"
