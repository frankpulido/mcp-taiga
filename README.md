# 🤖 Universal Taiga Project Agent

> **Transform any codebase into an organized Taiga project in minutes**

An intelligent MCP (Model Context Protocol) server that analyzes your project's git history, roadmap, and architecture to automatically populate Taiga with properly structured tasks, epics, and sprints.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

---

## ✨ **What Makes This Special**

### **Before This Tool:**
❌ Manual task creation (hours of tedious work)  
❌ Lost context from development history  
❌ No connection between git and project management  
❌ Starting from zero with each new project  

### **With Universal Taiga Agent:**
✅ **Automatic analysis** of git history → organized epics  
✅ **Intelligent detection** of project type (Laravel, React, Node.js, etc.)  
✅ **Multi-source integration** (git + roadmaps + code review)  
✅ **One-click project creation** with full context preservation  

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v14 or higher)
- npm
- A [Taiga](https://taiga.io) account
- Git repository (optional but recommended)

### **Installation**

```bash
# Clone this repository
git clone https://github.com/frankpulido/mcp-taiga.git
cd mcp-taiga

# Install dependencies
npm install

# Configure your Taiga credentials
cp .env.example .env
# Edit .env with your credentials
```

### **Quick Run**

```bash
# Launch the Universal Agent
node start-agent.js
```

**That's it!** The agent will:
1. ✅ Check/start the MCP server
2. 🔍 Detect your project type
3. 📊 Analyze git history  
4. 🎯 Create/select Taiga project
5. 🚀 Populate with intelligent task organization

---

## 🎯 **Key Features**

### **🧠 Intelligent Project Discovery**
- **Auto-detects** project type (Laravel, React, Vue, Node.js, Python, Docker)
- **Framework-aware** task suggestions
- **Smart roadmap parsing** from PROJECT_ROADMAP.md, TODO.md, etc.

### **📚 Multi-Source Task Generation**
| Source | What It Creates |
|--------|-----------------|
| **Git History** | Epics from development phases, completed tasks with dates |
| **Roadmap Files** | Future features, planned improvements, strategic goals |
| **Code Analysis** | Technical debt, missing tests, security improvements |
| **Figma** | UI implementation tasks *(Phase 4)* |

### **🏗️ Project Creation & Management**
- **Interactive project creation** with smart defaults
- **Status-aware population** (git history = "Done", future = "New")
- **Rich task descriptions** with commit history and technical context
- **Automatic tagging** by priority, framework, and source

### **⚡ Developer-Friendly**
- **Preview before population** - see what will be created
- **User-controlled server** - choose auto-start or manual
- **Graceful error handling** - continues working even if features are missing
- **Rate-limited API calls** - respects Taiga's limits

---

## 📖 **Usage Examples**

### **Example 1: New Laravel Project**

```bash
node start-agent.js

# Agent asks:
📁 Project directory: /path/to/your/laravel-project
✅ Detected: Laravel project
📚 Analyze git history? (y/N): y
🔍 Generate code review tasks? (y/N): y

# Creates:
✅ 5 epics from git history
✅ 12 completed tasks with dates
✅ 7 future tasks (missing policies, tests, etc.)
```

### **Example 2: Meta-Management (The MCP Itself)**

```bash
node start-agent.js

# Point to this project's directory
📁 Project directory: /path/to/mcp-taiga

# Agent finds:
✅ Git history (enhancement commits)
✅ ROADMAP_WARP_FRANK.md (Phase 3-7 planning)
✅ GitHub integration guide

# Result: https://tree.taiga.io/project/your-slug/
```

### **Example 3: No Git, Just Roadmap**

```bash
node start-agent.js

# Agent asks:
📁 Project directory: [press Enter to skip]
📄 Custom roadmap file: /path/to/PROJECT_PLAN.md

# Creates tasks from:
✅ Roadmap phases
✅ Strategic planning documents
✅ Feature specifications
```

---

## 🏗️ **Architecture**

```
Universal Taiga Agent
├── 🤖 Interactive Orchestrator
│   ├── Project Discovery (auto-detect type)
│   ├── Source Analysis (git, docs, code)
│   └── Smart Question Flow
│
├── 🏭 Task Generators
│   ├── GitHistoryGenerator ✅
│   ├── RoadmapGenerator (Phase 3)
│   ├── CodeReviewGenerator (Phase 3)
│   └── FigmaGenerator (Phase 4)
│
├── 🔄 MCP Server Management
│   ├── Health checking
│   ├── Auto-start with consent
│   └── Lifecycle management
│
└── 📊 Taiga Integration
    ├── Project creation
    ├── User story/task generation
    └── Status & tag management
```

---

## ⚙️ **Configuration**

### **Environment Variables (.env)**

```bash
# Taiga API Configuration
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password

# Optional: OpenAI for enhanced features
# OPENAI_API_KEY=your_openai_api_key
```

### **Project Templates**

The agent supports project-specific templates in `templates/`:
- `laravel.json` - Laravel-specific task patterns
- `react.json` - React component and testing tasks
- `node.json` - Node.js API and middleware tasks
- `generic.json` - Universal fallback template

---

## 🔗 **GitHub ↔ Taiga Integration**

Enable automatic task status updates from git commits!

### **Setup (5 minutes)**

1. **In Taiga Admin** → Integrations → GitHub
2. **Copy** the webhook URL and secret key
3. **In GitHub** → Settings → Webhooks → Add webhook
4. **Use this commit syntax:**

```bash
git commit -m "Fixed authentication bug TG-123 #closed"
git commit -m "Started API refactor TG-45 #in-progress"
```

📖 **Full guide**: See `GITHUB Taiga setup.md`

---

## 🗺️ **Roadmap**

### **✅ Completed**
- ✅ **Phase 1**: Core MCP functionality
- ✅ **Phase 2**: Universal agent architecture  
- ✅ **Project creation** with interactive flow
- ✅ **Git history analysis** and task generation
- ✅ **Server lifecycle management**

### **🚧 In Progress**
- 🚧 **Phase 3**: RoadmapGenerator & CodeReviewGenerator
- 🚧 **Documentation**: API docs and integration guides
- 🚧 **Testing**: Comprehensive test suite

### **📋 Planned**
- 📋 **Phase 4**: Figma design integration
- 📋 **Phase 5**: AI-enhanced estimation and planning
- 📋 **Phase 6**: Bidirectional git synchronization
- 📋 **Phase 7**: Multi-platform support (Jira, GitHub, Notion)

📖 **Full roadmap**: See `ROADMAP_WARP_FRANK.md`

---

## 💡 **Real-World Example**

### **AppointmentManager Project Success**

**Challenge**: Complex Laravel healthcare system with 83 commits, sophisticated architecture, but zero project organization.

**Solution**: Ran Universal Agent

**Results**:
- ✅ **8 epic user stories** created from git phases
- ✅ **7 future tasks** generated from architectural review
- ✅ **Complete context preservation** with commit history
- ✅ **Rich descriptions** including technical decisions and rationale

**Time saved**: ~4 hours of manual organization → 2 minutes automated

🔗 **See it live**: [AppointmentManager Taiga Board](https://tree.taiga.io/project/frankpulido-appointment-manager/)

---

## 🤝 **Contributing**

Contributions are welcome! The architecture is designed for easy extension:

### **Adding a New Generator**

```javascript
// agents/TaskGenerators/YourGenerator.js
import { BaseGenerator } from './BaseGenerator.js';

export class YourGenerator extends BaseGenerator {
  async generateTasks() {
    return {
      epics: [...],
      userStories: [...],
      tasks: [...]
    };
  }
}
```

### **Areas for Contribution**
- 🔧 **New generators** (Roadmap, CodeReview, Figma)
- 🎨 **Framework templates** (Django, Rails, Go, Rust)
- 🌍 **Translations** (currently ES + EN)
- 🧪 **Testing** (unit and integration tests)
- 📚 **Documentation** (guides, tutorials, examples)

---

## 📚 **Documentation**

- 📖 **[Full Roadmap](ROADMAP_WARP_FRANK.md)** - Vision, phases, and strategic planning
- 🔗 **[GitHub Integration Guide](GITHUB%20Taiga%20setup.md)** - Git ↔ Taiga sync
- 🏗️ **[Architecture Decisions](CODE_REVIEW_FINDINGS.md)** - For AppointmentManager
- 🚀 **[Original README](README_ORIGINAL.md)** - Basic MCP documentation

---

## 🙏 **Credits & Acknowledgments**

**Original MCP**: [adriaPedralbes/mcpTaiga](https://github.com/adriapedralbes)

**Universal Agent Enhancement**: Frank Pulido + Warp AI Assistant (October 2025)

**Inspiration**: The need for intelligent project management that understands code, not just tasks.

---

## 📝 **License**

ISC License - See LICENSE file for details

---

## 🐛 **Troubleshooting**

### **Server Won't Start**
```bash
# Check if port is in use
lsof -i :8080

# Kill conflicting process
kill -9 <PID>

# Try manual start
npm start
```

### **Authentication Fails**
```bash
# Verify credentials
cat .env

# Test API connection
curl -X POST https://api.taiga.io/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password","type":"normal"}'
```

### **Generator Not Found**
This is normal! Some generators are planned for Phase 3+. The agent will skip missing generators gracefully.

---

## 💬 **Support**

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/frankpulido/mcp-taiga/issues)
- 💡 **Feature requests**: [GitHub Discussions](https://github.com/frankpulido/mcp-taiga/discussions)
- 📧 **Contact**: frankpulido@me.com

---

<p align="center">
  <strong>Built with ❤️ for developers who value intelligent project management</strong>
</p>

<p align="center">
  <sub>⭐ Star this repo if it helped you organize your projects!</sub>
</p>