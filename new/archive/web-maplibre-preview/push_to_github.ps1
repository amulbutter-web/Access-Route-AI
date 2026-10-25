# =============================================================
# AccessRoute AI — Person 01 GitHub Push Script
# Run this from PowerShell AFTER checking your Git identity.
# =============================================================

$ErrorActionPreference = "Stop"

# ── STEP 0: Pre-flight — check Git is installed ───────────────
Write-Host "`n[0/7] Checking Git installation..." -ForegroundColor Cyan
git --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# ── STEP 1: Identity check ────────────────────────────────────
Write-Host "`n[1/7] Checking Git identity..." -ForegroundColor Cyan
$gitName  = git config user.name
$gitEmail = git config user.email
Write-Host "  user.name  = $gitName"
Write-Host "  user.email = $gitEmail"
Write-Host ""
Write-Host "  Expected: name and email matching your GitHub account 'amulbutter-web'."
$confirm = Read-Host "  Is this correct? (y/n)"
if ($confirm -ne "y") {
    Write-Host ""
    Write-Host "  Fix your identity first:" -ForegroundColor Yellow
    Write-Host '  git config --global user.name  "Your Name"'
    Write-Host '  git config --global user.email "your@email.com"'
    Write-Host "  Then re-run this script." -ForegroundColor Yellow
    exit 1
}

# ── STEP 2: Clone the repo ────────────────────────────────────
Write-Host "`n[2/7] Cloning Access-Route-AI repository..." -ForegroundColor Cyan
$cloneDir = "$env:USERPROFILE\Desktop\Access-Route-AI"

if (Test-Path $cloneDir) {
    Write-Host "  Directory already exists at $cloneDir" -ForegroundColor Yellow
    $useExisting = Read-Host "  Use existing clone? (y = yes, n = delete and re-clone)"
    if ($useExisting -ne "y") {
        Remove-Item -Recurse -Force $cloneDir
        git clone https://github.com/amulbutter-web/Access-Route-AI.git $cloneDir
    }
} else {
    git clone https://github.com/amulbutter-web/Access-Route-AI.git $cloneDir
}

Set-Location $cloneDir

# ── STEP 3: Verify remote and branch ─────────────────────────
Write-Host "`n[3/7] Verifying remote and branch..." -ForegroundColor Cyan
git remote -v
$branch = git branch --show-current
Write-Host "  Current branch: $branch"

if ($branch -ne "main" -and $branch -ne "master") {
    Write-Host "  WARNING: You are not on main or master. Current branch: $branch" -ForegroundColor Yellow
    $branchConfirm = Read-Host "  Continue on this branch? (y/n)"
    if ($branchConfirm -ne "y") { exit 1 }
}

# ── STEP 4: Create frontend/ folder and copy files ───────────
Write-Host "`n[4/7] Copying Person 01 frontend files into frontend/ subfolder..." -ForegroundColor Cyan

$srcDir  = "$env:USERPROFILE\.gemini\antigravity\scratch\AccessRoute_AI_Person01"
$destDir = "$cloneDir\frontend"

if (-not (Test-Path $srcDir)) {
    Write-Host "ERROR: Source directory not found at $srcDir" -ForegroundColor Red
    Write-Host "Make sure the Person 01 package files are at that path." -ForegroundColor Yellow
    exit 1
}

New-Item -ItemType Directory -Path $destDir -Force | Out-Null

# Copy all files except the push script itself
Get-ChildItem $srcDir -Recurse | Where-Object {
    $_.Name -ne "push_to_github.ps1"
} | ForEach-Object {
    $relative  = $_.FullName.Substring($srcDir.Length + 1)
    $destPath  = Join-Path $destDir $relative
    $destParent = Split-Path $destPath -Parent
    if (-not (Test-Path $destParent)) {
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }
    if (-not $_.PSIsContainer) {
        Copy-Item $_.FullName $destPath -Force
    }
}

Write-Host "  Files copied to $destDir" -ForegroundColor Green

# ── STEP 5: git status check ──────────────────────────────────
Write-Host "`n[5/7] Running git status to review changes..." -ForegroundColor Cyan
git status

Write-Host ""
$statusConfirm = Read-Host "  Review the files above. Do they look correct? (y/n)"
if ($statusConfirm -ne "y") {
    Write-Host "  Aborting — no changes committed. Fix the issue and re-run." -ForegroundColor Yellow
    exit 1
}

# ── STEP 6: Staged commits (one per logical group) ───────────
Write-Host "`n[6/7] Staging and committing in logical groups..." -ForegroundColor Cyan

# --- Commit 1: Project config and tooling ---
Write-Host "  Commit 1/6: Project config and tooling" -ForegroundColor White
git add frontend/package.json
git add frontend/tsconfig.json
git add frontend/vite.config.ts
git add frontend/.gitignore
git add frontend/.env.example
git commit -m "chore: add frontend project config — package.json, tsconfig, vite, gitignore, env.example"

# --- Commit 2: Shared TypeScript types ---
Write-Host "  Commit 2/6: Shared TypeScript types" -ForegroundColor White
git add frontend/src/types/index.ts
git commit -m "feat: add shared TypeScript types — Place, RouteRequest, RouteResponse, Evidence, ApiState"

# --- Commit 3: Documentation ---
Write-Host "  Commit 3/6: Documentation" -ForegroundColor White
git add frontend/docs/PRD.md
git add frontend/docs/UX_STATES.md
git add frontend/docs/DEMO_SCRIPT.md
git add frontend/docs/ACCESSIBILITY_TEST_REPORT.md
git commit -m "docs: add Person 01 docs — PRD, UX states (11 states), demo script, accessibility test report"

# --- Commit 4: API client service ---
Write-Host "  Commit 4/6: API client service" -ForegroundColor White
git add frontend/src/services/apiClient.ts
git commit -m "feat: add frontend API client — fetchPlaces, fetchRoute with timeout and error handling"

# --- Commit 5: React components ---
Write-Host "  Commit 5/6: React UI components" -ForegroundColor White
git add frontend/src/components/RouteSelector.tsx
git add frontend/src/components/RouteResult.tsx
git add frontend/src/features/map/MapView.tsx
git add frontend/src/App.tsx
git add frontend/src/main.tsx
git add frontend/index.html
git commit -m "feat: add React UI components — RouteSelector, RouteResult, MapView, App shell with accessible states"

# --- Commit 6: Styles, README, agent prompt ---
Write-Host "  Commit 6/6: Styles, README, agent prompt" -ForegroundColor White
git add frontend/src/styles/globals.css
git add frontend/README.md
git add frontend/AGENT_PROMPT.md
git commit -m "style: add global CSS with design tokens, responsive layout, reduced-motion, WCAG AA contrast"

Write-Host ""
Write-Host "  All commits made locally." -ForegroundColor Green

# ── STEP 7: Final check and push ─────────────────────────────
Write-Host "`n[7/7] Final review before push..." -ForegroundColor Cyan
git log --oneline -8
Write-Host ""
Write-Host "  Remote: $(git remote get-url origin)"
Write-Host "  Branch: $(git branch --show-current)"
Write-Host ""
$pushConfirm = Read-Host "  Ready to push? (y/n)"
if ($pushConfirm -ne "y") {
    Write-Host "  Push cancelled. Your commits are saved locally." -ForegroundColor Yellow
    Write-Host "  Run 'git push origin $branch' manually when ready."
    exit 0
}

git push origin (git branch --show-current)

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  SUCCESS! Pushed to GitHub." -ForegroundColor Green
    Write-Host "  Verify at: https://github.com/amulbutter-web/Access-Route-AI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  POST-PUSH CHECKLIST:" -ForegroundColor Yellow
    Write-Host "  [ ] Open GitHub and confirm all 6 commits appear under the correct account"
    Write-Host "  [ ] Check frontend/ folder exists in the repo"
    Write-Host "  [ ] Confirm .env is NOT present (only .env.example)"
    Write-Host "  [ ] Share frontend/src/types/index.ts with Persons 2, 3, and 4"
} else {
    Write-Host ""
    Write-Host "  PUSH FAILED." -ForegroundColor Red
    Write-Host "  Common fixes:"
    Write-Host "  1. Wrong GitHub account in browser — sign out and sign in as amulbutter-web"
    Write-Host "  2. Credential manager cached old account — run: git credential reject"
    Write-Host "  3. No push access — confirm you own this repo"
    Write-Host "  4. Push rejected (remote has diverged) — run: git pull --rebase origin main"
    Write-Host "     Then re-run: git push origin main"
    Write-Host ""
    Write-Host "  NEVER use git push --force without team agreement." -ForegroundColor Red
}
