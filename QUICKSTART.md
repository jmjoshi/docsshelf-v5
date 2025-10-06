# Quick Start Guide

## Switch to v5 Workspace

**In VS Code:**
1. File ? Open Folder
2. Navigate to `C:\projects\docsshelf-v5`
3. Click "Select Folder"

OR use command palette:
- Press `Ctrl+K Ctrl+O`
- Select `C:\projects\docsshelf-v5`

## First Thing to Do

Fix the Metro config issue:

```powershell
# Option 1: Use default config
Remove-Item metro.config.js

# Option 2: Generate SDK 54 config
npx expo customize metro.config.js

# Then try starting
npx expo start
```

## What GitHub Copilot Knows

When you switch workspaces, I will have access to:
- All files in `C:\projects\docsshelf-v5`
- The `MIGRATION_README.md` with full context
- This `QUICKSTART.md`
- All terminal history in new workspace

## Continue Conversation

Just ask me to:
- "Fix the metro config issue"
- "Start the app"
- "Debug any errors"

I have full context of:
- Why we did fresh start
- What v4 issues were
- Current v5 status
- Next steps needed

## Current State Summary

? Project created  
? Dependencies installed (0 vulnerabilities)  
? Source code migrated  
? App configured  
? Metro config needs fix  
? Ready to test

**Next Command:** Fix metro.config.js and start app
