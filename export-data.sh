#!/bin/bash
# export-data.sh - Manual data export script

echo "Fetching data from local bot..."
curl -f "http://localhost:3001/api/data-export/export" > dashboard/static/data/current.json

echo "Committing to git..."
git add dashboard/static/data/current.json
git commit -m "Update dashboard data $(date)"
git push origin main

echo "Data exported and pushed to GitHub!"
echo "Dashboard will update in ~2 minutes via GitHub Pages"
