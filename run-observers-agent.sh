#!/bin/bash

# Automated script to populate observers-hexagonal Taiga project

cd /Users/frankpulidoalvarez/Documents/developer/mcp-servers/mcpTAIGA

# Inputs for the agent:
# 1. Project directory: /Users/frankpulidoalvarez/Documents/developer/observers-hexagonal
# 2. Use existing .env credentials: y
# 3. Analyze git history: y
# 4. Figma URL: (skip)
# 5. Generate code review: y
# 6. Custom roadmap: /Users/frankpulidoalvarez/Documents/developer/observers-hexagonal/README_dev.md
# 7. Select project: 5 (observers-hexagonal NOTIFIER)
# 8. Confirm population: y

printf "/Users/frankpulidoalvarez/Documents/developer/observers-hexagonal\ny\ny\n\ny\n/Users/frankpulidoalvarez/Documents/developer/observers-hexagonal/README_dev.md\n5\ny\n" | node start-agent.js
