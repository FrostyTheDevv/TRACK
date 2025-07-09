@echo off
echo 🎮 Stream Tracker Bot Setup
echo ==========================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

:: Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

:: Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please edit it with your configuration.
    echo 📍 Don't forget to add your Discord token, MongoDB URI, and API keys!
) else (
    echo ✅ .env file already exists
)

:: Create logs directory
if not exist logs mkdir logs
echo ✅ Logs directory created

:: Build the project
echo 🔨 Building the project...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Project built successfully

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Set up your MongoDB database
echo 3. Configure your Discord bot permissions
echo 4. Start the bot with: npm start
echo 5. For development: npm run dev
echo.
echo Dashboard:
echo - Local: cd dashboard/static ^&^& python -m http.server 8000
echo - GitHub Pages: Push to GitHub and enable Pages
echo.
echo Documentation:
echo - README.md - Complete project documentation
echo - DEPLOYMENT.md - Dashboard deployment guide
echo.
echo Happy streaming! 🚀
pause
