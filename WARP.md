# 🤖 WARP.md - AI Context File for mcpTAIGA

**Project:** Universal Taiga Project Agent (mcpTAIGA)  
**Created:** October 6, 2025  
**Last Updated:** October 8, 2025  
**Authors:** Frank Pulido & Warp AI Assistant

---

## 🎯 Project Overview

**What is this project?**

mcpTAIGA is an **intelligent MCP (Model Context Protocol) server** that analyzes your project's git history, roadmap, and architecture to automatically populate Taiga with properly structured tasks, epics, and sprints. It transforms hours of manual task creation into minutes of automated, intelligent project organization.

**Vision:** Transform project management from manual task creation to intelligent, automated project organization that understands your development history and structures your work across any technology stack.

**Tech Stack:**
- **Language:** Node.js 23.7 (ES Modules)
- **Framework:** MCP SDK (@modelcontextprotocol/sdk ^1.8.0)
- **Key Dependencies:**
  - axios ^1.8.4 (API communication)
  - zod ^3.24.2 (Schema validation)
  - dotenv ^16.4.7 (Environment configuration)
  - readline ^1.3.0 (Interactive CLI)

**Project Status:**
- **Current Phase:** Phase 3 - Content Source Expansion (Completed: Phase 3.2.2)
- **Last Milestone:** Solo Team Member Auto-Assignment + Bulk Assignment Utility
- **Next Milestone:** Phase 4 - Visual Sources Integration (Figma)
- **Production Status:** ✅ Active & Production Ready

---

## 📂 Project Structure

```
mcpTAIGA/
├── src/
│   ├── index.js              # MCP server entry point
│   ├── taigaService.js       # Taiga API client
│   └── taigaClient.js        # Direct Taiga interactions
│
├── agents/
│   ├── TaigaProjectAgent.js  # Main orchestrator
│   ├── ProjectDiscovery.js   # Auto-detect project types
│   ├── GitAnalyzer.js        # Git history analysis
│   └── TaskGenerators/
│       ├── BaseGenerator.js          # Common functionality
│       ├── GitHistoryGenerator.js    # ✅ Git → Taiga
│       ├── RoadmapGenerator.js       # ✅ Roadmap → Taiga
│       └── CodeReviewGenerator.js    # ✅ Code Quality → Taiga
│
├── utils/
│   ├── bulk-assign-tasks.js  # Bulk task assignment utility
│   └── README.md
│
├── docs/                      # External documentation
│   ├── notion/               # Notion exports
│   ├── api-docs/             # API documentation  
│   ├── tutorials/            # Guides
│   └── external/             # Other docs
│
├── start-agent.js            # Main entry point (Universal Agent)
├── package.json
└── .env                      # Taiga credentials
```

**Key Directories:**
- `src/` - MCP server implementation
- `agents/` - Universal agent architecture
- `agents/TaskGenerators/` - Modular task generation framework
- `utils/` - Utility scripts (bulk operations)
- `docs/` - External documentation and API caches

---

## 🔑 Important Context

### **Architecture Decisions**

1. **Modular Generator Framework**
   - **Rationale:** Extensible design allows adding new sources (Figma, Jira, etc.) without modifying core
   - **Pattern:** BaseGenerator provides common functionality, specific generators extend it

2. **Interactive Agent Pattern**
   - **Rationale:** User control and transparency - never assume, always ask
   - **Implementation:** Question-based flow with smart defaults per project type

3. **Multi-Source Intelligence**
   - **Rationale:** Complete project view requires git (past), roadmap (future), code review (present)
   - **Result:** 360° project intelligence in Taiga

4. **Solo Team Auto-Assignment**
   - **Rationale:** Single-member projects need all tasks assigned automatically
   - **Implementation:** 6-line elegant solution in BaseGenerator

### **Dependencies & APIs Used**

- **Taiga API:** Full CRUD operations for projects, epics, user stories, tasks
  - Docs: Available in Taiga workspace
  - Authentication: Username + password (stored in .env)
  
- **MCP SDK:** Model Context Protocol for AI integration
  - Enables natural language interaction with Taiga
  - Server runs on stdio transport

- **Git:** History analysis via git log commands
  - Extracts commits, authors, dates, messages
  - Groups into development phases automatically

### **Known Issues & Gotchas**

- **Rate Limiting:** Taiga API needs delays between bulk operations (100ms default)
- **Server Lifecycle:** MCP server must be running before agent starts
- **Author Matching:** Git author names must match Taiga user names for assignment
- **Roadmap Location:** RoadmapGenerator looks for files in project root (not in docs/)
- **Project Boundary:** CodeReviewGenerator validates project boundaries to prevent cross-contamination

---

## 🚀 Development Workflow

### **Common Commands**

```bash
# Start MCP Server
npm start

# Run Universal Agent (recommended)
npm run agent
# or
node start-agent.js

# Bulk Assignment Utility
npm run bulk-assign
# or
node utils/bulk-assign-tasks.js

# Test Generators
node test-roadmap-generator.js
node test-code-review-generator.js
```

### **Environment Setup**

**Required .env variables:**
```bash
TAIGA_URL=https://api.taiga.io
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
```

**Configuration files:**
- `.env` - Taiga credentials (NOT committed)
- `.env.example` - Template for new users
- `package.json` - Project dependencies and scripts

---

## 📚 Documentation Map

### **🚀 Start Here (For New AI Sessions):**

1. **README.md** - Complete project overview with examples
2. **ROADMAP_WARP_FRANK.md** - Development journey & current state (24KB!)
3. **AGENT_TEAM_OVERVIEW.md** - Architecture & generators explained

### **📖 Detailed Documentation:**

#### **Planning & Strategy:**
- `DOCUMENTATION_STRATEGY.md` - How we maintain context for AI sessions
- `ROADMAP_WARP_FRANK.md` - Complete development history

#### **Architecture:**
- `AGENT_TEAM_OVERVIEW.md` - Team of generators & their roles

#### **Implementation Summaries:**
- `PHASE_3.1_IMPLEMENTATION_SUMMARY.md` - RoadmapGenerator details
- `PHASE_3.2_IMPLEMENTATION_SUMMARY.md` - CodeReviewGenerator details

#### **Features:**
- `AUTHOR_ASSIGNMENT_FEATURE.md` - How git authors → Taiga users
- `BULK_ASSIGNMENT_INTEGRATION.md` - Bulk operations
- `SOLO_ASSIGNMENT_ENHANCEMENT.md` - Solo project logic

#### **Fixes & Enhancements:**
- `EMOJI_FIX_SUMMARY.md` - Emoji handling in markdown
- `ROADMAP_PARSER_FIX.md` - Parser improvements
- `CODEREVIEW_GENERATOR_ENHANCEMENT_SUMMARY.md` - Latest enhancements
- `TODAYS_ENHANCEMENT_SUMMARY.md` - Recent work

#### **Guides:**
- `GITHUB Taiga setup.md` - Git commit → Taiga integration (EN + ES)
- `crearMCP.md` - MCP creation guide (Spanish)

### **External Documentation:**
- `docs/` - Future home for Taiga API docs, Notion exports

---

## 🔄 Current Work

**Just Completed (October 8, 2025):**
- ✅ CodeReviewGenerator enhanced with proper User Story format
- ✅ Project boundary validation
- ✅ Backup directory exclusion
- ✅ Enhanced source attribution
- ✅ Created workflow system integration (docs/ structure, WARP.md)

**Next Up:**
1. Phase 4 - Figma Integration (FigmaGenerator)
2. Phase 5 - Advanced Intelligence (AI-powered analysis)
3. Phase 6 - Synchronization (Taiga ↔ Project bi-directional sync)

**Current Focus:**
- Using mcpTAIGA as central project management tool across all projects
- Maintaining comprehensive documentation for AI sessions

---

## 💡 For AI Sessions

### **Always Load First:**
1. This file (WARP.md) - Quick context
2. README.md - User documentation
3. ROADMAP_WARP_FRANK.md - Development history

### **Load When Needed:**
- AGENT_TEAM_OVERVIEW.md - Understanding architecture
- Specific implementation summaries - Deep dive on features
- Feature docs - How specific features work

### **Context Refresh Needed When:**
- Working on new generators
- Adding new features to existing generators
- Modifying agent flow or questions
- Updating documentation strategy

---

## 📝 Quick Reference

### **Key Files for Coding:**
- `agents/TaigaProjectAgent.js` - Main orchestrator (599 lines)
- `agents/TaskGenerators/BaseGenerator.js` - Common functionality
- `agents/TaskGenerators/*Generator.js` - Specific generators

### **Test Files:**
- `test-roadmap-generator.js` - Test RoadmapGenerator
- `test-code-review-generator.js` - Test CodeReviewGenerator

### **Utility Scripts:**
- `utils/bulk-assign-tasks.js` - Bulk task assignment
- `populate_taiga.js` - Legacy single-project script

---

## 🎯 Success Metrics

**Current Stats:**
- ✅ **3 Active Generators** (Git, Roadmap, Code Review)
- ✅ **Dogfooded Successfully** (manages its own development)
- ✅ **Multi-Framework Support** (Laravel, React, Node, Python, etc.)
- ✅ **100% Assignment Rate** (solo projects)
- ✅ **43 Items** parsed from ROADMAP_WARP_FRANK.md in test
- ✅ **Production Ready** since Phase 2.5

**Time Savings:**
- Manual task creation: 2-6 hours per project
- Automated with mcpTAIGA: 5 minutes
- **Efficiency gain: 98%+**

---

## 🌟 Project Highlights

**What Makes mcpTAIGA Special:**
1. **Universal** - Works with any technology stack
2. **Intelligent** - Auto-detects project type and adapts
3. **Multi-Source** - Git + Roadmap + Code Review = Complete picture
4. **Interactive** - Asks smart questions, respects user control
5. **Meta-Capable** - Successfully manages its own development
6. **Production Ready** - Tested on multiple real projects

**Live Example:**
- **Taiga Board:** https://tree.taiga.io/project/frankpulido-mcp-taiga/
- **Successfully populated** with its own development history

---

**Last Updated:** October 8, 2025  
**Current Phase:** Phase 3.2.2 Complete  
**Next Session Focus:** Continue using mcpTAIGA as central project management tool across all projects
