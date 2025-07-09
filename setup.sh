#!/bin/bash

# Stream Tracker Bot - Quick Setup Script

echo "🎮 Stream Tracker Bot Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "📍 Don't forget to add your Discord token, MongoDB URI, and API keys!"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Project built successfully"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up your MongoDB database"
echo "3. Configure your Discord bot permissions"
echo "4. Start the bot with: npm start"
echo "5. For development: npm run dev"
echo ""
echo "Dashboard:"
echo "- Local: cd dashboard/static && python -m http.server 8000"
echo "- GitHub Pages: Push to GitHub and enable Pages"
echo ""
echo "Documentation:"
echo "- README.md - Complete project documentation"
echo "- DEPLOYMENT.md - Dashboard deployment guide"
echo ""
echo "Happy streaming! 🚀"
