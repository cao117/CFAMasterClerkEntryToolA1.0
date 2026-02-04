# Push Local Master to Remote Master

Execute the following steps in order. Each step requires user confirmation before proceeding.

## Step 1: Switch to Local Master Branch
- Run `git branch --show-current` to show current branch
- Ask user: "Switch to local master branch? (yes/no)"
- If confirmed, run `git checkout master`
- If not confirmed, abort the entire operation

## Step 2: Check for Uncommitted Changes (STRICT)
- Run `git status --short` to check for any uncommitted changes
- If ANY uncommitted changes exist:
  - Display all changed files
  - Warn user: "UNCOMMITTED CHANGES DETECTED on master. Master should not have direct changes. Something is wrong with your workflow."
  - Ask user: "Acknowledge and exit? (yes)"
  - Abort operation - no other option allowed
- If no uncommitted changes, continue to next step

## Step 3: Check if Master is Ahead of Remote
- Run `git log origin/master..master --oneline` to see commits to push
- Display the commits that will be pushed
- If no commits (empty output):
  - Inform user: "Local master has no new commits to push to remote. Nothing to do."
  - End operation

## Step 4: Push to Remote Master
- Ask user: "Push to remote master (origin/master)? This will update the main branch on GitHub. (yes/no)"
- If confirmed, run `git push origin master`
- If push fails:
  - Warn user: "Push failed. Remote master may have changes. Please investigate manually."
  - Abort operation
- If not confirmed, inform user "Push cancelled" and end

## Step 5: Complete
- Run `git status` to show final state
- Run `git log --oneline -3` to show recent commits
- Inform user: "Complete. Remote master is now updated. You are on local master branch."
