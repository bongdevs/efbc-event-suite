# EFBC Event Suite - Push to GitHub Script
# This script commits all changes and pushes to the GitHub repository

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "EFBC Event Suite - Push to GitHub" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check git status
Write-Host "[1/6] Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Step 2: Configure git user if needed (optional)
Write-Host "[2/6] Configuring git user (if needed)..." -ForegroundColor Yellow
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host "Git user.name not set. Setting to 'Jahid Hasan'..." -ForegroundColor Green
    git config user.name "Jahid Hasan"
}

if (-not $userEmail) {
    Write-Host "Git user.email not set. Setting to 'jahid@bongdevs.com'..." -ForegroundColor Green
    git config user.email "jahid@bongdevs.com"
}

Write-Host "Git configured as:" $(git config user.name) "<$(git config user.email)>" -ForegroundColor Green
Write-Host ""

# Step 3: Initialize repo if needed
Write-Host "[3/6] Initializing git repository (if needed)..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    Write-Host ".git folder not found. Initializing..." -ForegroundColor Green
    git init
    git branch -M main
} else {
    Write-Host ".git folder already exists." -ForegroundColor Green
}
Write-Host ""

# Step 4: Stage and commit
Write-Host "[4/6] Staging files and committing..." -ForegroundColor Yellow
git add -A
$statusBefore = git status --porcelain
if ($statusBefore) {
    Write-Host "Files staged. Creating commit..." -ForegroundColor Green
    git commit -m "EFBC Event Suite: UI improvements, color settings, API fixes, and documentation

- Improved modal and table styling with zebra striping and hover effects
- Added admin color settings for table customization
- Fixed API base URL handling and fallback logic
- Added sorting icons and functionality to frontend tables
- Created comprehensive README documentation
- Added .gitignore for clean repository"
    Write-Host "Commit created successfully." -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Add remote and push
Write-Host "[5/6] Adding remote and pushing to GitHub..." -ForegroundColor Yellow
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    Write-Host "Adding GitHub remote..." -ForegroundColor Green
    git remote add origin https://github.com/bongdevs/efbc-event-suite.git
} else {
    Write-Host "Remote 'origin' already exists: $remoteExists" -ForegroundColor Green
}

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin main
Write-Host ""

# Step 6: Verify
Write-Host "[6/6] Verifying push..." -ForegroundColor Yellow
git ls-remote --heads origin main
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Push completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository: https://github.com/bongdevs/efbc-event-suite" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Rebuild admin bundle (if needed):" -ForegroundColor White
Write-Host "   cd admin && npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the plugin in WordPress admin" -ForegroundColor White
Write-Host ""
