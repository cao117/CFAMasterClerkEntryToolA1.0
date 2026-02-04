# Sync Local Dev to Local Master

Execute the following steps in order. Each step requires user confirmation before proceeding.

## Step 1: Switch to Local Dev Branch
- Run `git branch --show-current` to show current branch
- Ask user: "Switch to local dev branch to check for uncommitted changes? (yes/no)"
- If confirmed, run `git checkout dev`
- If not confirmed, abort the entire operation

## Step 2: Check for Uncommitted Changes (STRICT)
- Run `git status --short` to check for any uncommitted changes
- If ANY uncommitted changes exist:
  - Display all changed files
  - Warn user: "UNCOMMITTED CHANGES DETECTED. You must commit or discard these changes before syncing to master. Use /pushremotedev first to commit your work."
  - Ask user: "Acknowledge and exit? (yes)"
  - Abort operation - no other option allowed
- If no uncommitted changes, continue to next step

## Step 3: Check if Dev is Ahead of Master
- Run `git log master..dev --oneline` to see commits on dev not in master
- If no commits (empty output):
  - Inform user: "Local dev has no new commits ahead of master. Nothing to sync."
  - End operation
- If commits exist, display them and continue

## Step 4: Switch to Local Master
- Ask user: "Switch to local master branch? (yes/no)"
- If confirmed, run `git checkout master`
- If not confirmed, abort the entire operation

## Step 5: Merge Dev into Master (Fast-Forward Only)
- Ask user: "Merge dev into master (fast-forward)? (yes/no)"
- If confirmed, run `git merge dev --ff-only`
- If merge fails (not fast-forward possible):
  - Warn user: "Fast-forward merge not possible. Master has diverged from dev. Please resolve manually."
  - Abort operation
- If not confirmed, abort the entire operation

## Step 6: Complete
- Run `git log --oneline -5` to show recent commits
- Run `git status` to show final state
- Inform user: "Complete. Local master is now synced with dev. You are on local master branch."
