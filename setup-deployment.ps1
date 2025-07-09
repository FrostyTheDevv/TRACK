# PowerShell setup script for Stream Tracker deployment
param(
    [Parameter(Mandatory=$true)]
    [string]$PublicIP
)

Write-Host "🚀 Stream Tracker - Deployment Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Write-Host "📝 Updating GitHub Actions workflow with IP: $PublicIP" -ForegroundColor Yellow

# Update the GitHub Actions workflow file
$workflowPath = ".github\workflows\fetch-data.yml"
if (Test-Path $workflowPath) {
    $content = Get-Content $workflowPath -Raw
    $content = $content -replace "YOUR_PUBLIC_IP", $PublicIP
    Set-Content $workflowPath $content
    Write-Host "✅ Updated .github\workflows\fetch-data.yml" -ForegroundColor Green
} else {
    Write-Host "❌ Workflow file not found: $workflowPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push to GitHub"
Write-Host "2. Enable GitHub Pages in repository settings"
Write-Host "3. Set up port forwarding for port 3001"
Write-Host "4. Update CORS_ORIGIN in .env to your GitHub Pages URL"
Write-Host "5. Set DEMO_MODE to false in dashboard/static/js/config.js"
Write-Host ""
Write-Host "📖 See REAL_DATA_SETUP.md for detailed instructions" -ForegroundColor Cyan
