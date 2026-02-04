# Push Local Dev to Remote Dev

Execute the following steps in order. Each step requires user confirmation before proceeding.

## Step 1: Switch to Local Dev Branch
- Run `git branch --show-current` to show current branch
- Ask user: "Switch to local dev branch? (yes/no)"
- If confirmed, run `git checkout dev`
- If not confirmed, abort the entire operation

## Step 2: Show Changed Files
- Run `git status --short` to show all changed files
- Display the list to user
- If no changes exist, inform user "No changes to commit" and end operation

## Step 3: Stage All Files
- Ask user: "Stage all these files? (yes/no)"
- If confirmed, run `git add -A`
- If not confirmed, abort the entire operation

## Step 4: Get Commit Message
- Ask user: "Enter your commit message:"
- Wait for user input
- Display the message back: "Your commit message: [message]"
- Ask user: "Confirm this commit message? (yes/no)"
- If not confirmed, ask for commit message again (repeat step 4)

## Step 5: Commit
- Run `git commit -m "[user's message]"`
- Show commit result

## Step 6: Push to Remote Dev
- Ask user: "Push to remote dev (origin/dev)? (yes/no)"
- If confirmed, run `git push origin dev`
- If not confirmed, inform user "Changes committed locally but not pushed" and end
- If push fails due to conflicts, warn user: "Push failed - remote has changes. Please pull first or resolve manually."

## Step 7: Complete
- Run `git status` to show final state
- Inform user: "Complete. You are on local dev branch."
