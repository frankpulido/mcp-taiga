# 🛠️ Utilities

**Maintenance and management tools for the Universal Taiga Agent**

---

## 📋 **Available Utilities**

### **1. Bulk Task Assignment** (`bulk-assign-tasks.js`)

Automatically assigns all unassigned tasks to team members.

#### **Use Cases:**
- ✅ **Fix existing projects** with unassigned tasks
- ✅ **Solo projects** - Assign everything to yourself
- ✅ **Post-migration cleanup** - After importing tasks from other systems
- ✅ **Batch updates** - When adding a new team member

#### **Features:**
- Interactive project selection
- Shows team members and assignment target
- Preview before making changes
- Detailed success/failure reporting
- Rate-limited API calls (safe for large projects)
- Works with solo and multi-member teams

#### **Usage:**

```bash
# Option 1: Direct execution
node utils/bulk-assign-tasks.js

# Option 2: Via npm script (recommended)
npm run bulk-assign

# Option 3: Make executable and run
chmod +x utils/bulk-assign-tasks.js
./utils/bulk-assign-tasks.js
```

#### **Interactive Flow:**

```
1. 🔗 Connects to Taiga
2. 📋 Shows list of projects
3. 👥 Displays team members
4. 📊 Shows unassigned tasks count
5. ✅ Asks for confirmation
6. 🚀 Assigns all tasks
7. 📈 Shows summary report
```

#### **Example Session:**

```bash
$ npm run bulk-assign

🔧 Bulk Task Assignment Tool

🔗 Connecting to Taiga...
✅ Connected successfully

📋 Available projects:
  1. APPOINTMENT MANAGER (frankpulido-appointment-manager)
  2. MCP Taiga (frankpulido-mcp-taiga)

Select project number: 1

✅ Selected: APPOINTMENT MANAGER

👥 Fetching project members...
📊 Team size: 1 member(s)
   - Frank Pulido (frankpulido@me.com)

🎯 Target assignee: Frank Pulido

📊 Fetching user stories...
   Total user stories: 30
   Already assigned: 5
   Unassigned: 25

📝 Unassigned tasks:
   1. Phase 1: Authentication & Authorization
   2. Phase 2: Slot Seeder
   ... (23 more)

✅ Assign 25 tasks to Frank Pulido? (y/N): y

🚀 Updating tasks...

✅ Assigned: Phase 1: Authentication & Authorization
✅ Assigned: Phase 2: Slot Seeder
... (23 more)

==================================================
📊 Summary:
   ✅ Successfully assigned: 25
   ❌ Failed: 0
   📈 New assignment rate: 100%
==================================================

🔗 View project: https://tree.taiga.io/project/frankpulido-appointment-manager/

🎉 Bulk assignment complete!
```

#### **Solo vs Multi-Member Teams:**

**Solo Projects (1 member):**
- Automatically assigns ALL unassigned tasks to that member
- No confirmation needed for multi-member warning
- Perfect for personal projects

**Multi-Member Teams (2+ members):**
- Assigns all tasks to the FIRST member
- Shows warning and asks for confirmation
- You may want to use selective assignment instead

#### **Error Handling:**

The tool gracefully handles:
- ✅ API rate limits (300ms delay between requests)
- ✅ Version conflicts (fetches current version before update)
- ✅ Network errors (shows clear error messages)
- ✅ Invalid selections (validates project choice)

#### **Safety Features:**

- **Preview before execution** - See what will be assigned
- **Confirmation required** - Must explicitly confirm
- **Non-destructive** - Only updates `assigned_to` field
- **Detailed logging** - See exactly what happened
- **Rollback-friendly** - Changes can be manually undone in Taiga UI

---

## 🎯 **When to Use Each Tool**

### **Universal Agent** (`npm run agent`)
Use when:
- Creating new projects from scratch
- Populating projects with git history, roadmaps, code reviews
- Initial project setup

### **Bulk Assignment** (`npm run bulk-assign`)
Use when:
- Fixing existing projects with unassigned tasks
- After running the agent on an existing project
- Cleaning up after imports or migrations
- Assigning tasks in solo projects

---

## 🚀 **Best Practices**

### **1. Run Bulk Assignment After Agent Population**

```bash
# Step 1: Populate project
npm run agent

# Step 2: Fix any unassigned tasks (if needed)
npm run bulk-assign
```

### **2. Solo Projects: Let Auto-Assignment Handle It**

If you're using the enhanced agent (with solo auto-assignment), new tasks are automatically assigned. Use bulk-assign only for:
- Fixing old tasks created before the enhancement
- Projects populated with the original (non-enhanced) agent

### **3. Multi-Member Teams: Be Selective**

For teams with multiple people:
- Review unassigned tasks first
- Manually assign in Taiga UI for precision
- Use bulk-assign only when appropriate (e.g., all tasks for one sprint)

### **4. Large Projects: Monitor Progress**

The tool rate-limits to 300ms between requests:
- 25 tasks ≈ 7.5 seconds
- 100 tasks ≈ 30 seconds
- Be patient, it's protecting your API quota!

---

## 📊 **Technical Details**

### **API Operations:**

1. **GET** `/users/me` - Authenticate
2. **GET** `/projects` - List projects
3. **GET** `/projects/{id}` - Get team members
4. **GET** `/userstories?project={id}` - List stories
5. **GET** `/userstories/{storyId}` - Get story version
6. **PATCH** `/userstories/{storyId}` - Update assignment

### **Version Handling:**

Taiga requires version numbers for updates to prevent conflicts:

```javascript
// Get current version
const story = await client.get(`/userstories/${id}`);

// Update with version
await client.patch(`/userstories/${id}`, {
  assigned_to: userId,
  version: story.version  // ← Required!
});
```

### **Rate Limiting:**

```javascript
await delay(300); // 300ms between requests
// = ~3.3 requests per second
// = ~200 requests per minute
```

This is conservative and safe for Taiga's API limits.

---

## 🔧 **Customization**

Want to modify the tool? Here's the structure:

```javascript
class BulkAssignmentFixer {
  async run()                    // Main flow
  async updateUserStory()        // API update logic
  async ask()                    // User input
  async askBoolean()             // Yes/no questions
  delay()                        // Rate limiting
}
```

**Customization ideas:**
- Change rate limit: Adjust `delay(300)` value
- Filter tasks: Add custom filtering before assignment
- Batch processing: Group updates into batches
- Assignment rules: Assign based on task tags/status

---

## 📝 **Troubleshooting**

### **"Failed to connect to Taiga"**
- Check `.env` credentials
- Verify Taiga API is accessible
- Test with `npm start` first

### **"Request failed with status code 400"**
- Usually means missing version number
- Tool should handle this automatically now
- Report if issue persists

### **"Request failed with status code 403"**
- Insufficient permissions
- You must be project admin to assign tasks
- Check your role in the project

### **"All tasks are already assigned"**
- Good news! Nothing to do
- Tool detected 0 unassigned tasks
- Your project is clean

---

## 🎉 **Success Stories**

### **AppointmentManager Project**
- **Before:** 25 unassigned tasks (83%)
- **After:** 0 unassigned tasks (0%)
- **Time:** 7.5 seconds
- **Result:** 100% assignment rate ✅

### **MCP Taiga (Self-Management)**
- **Before:** 0 tasks (new clean project)
- **After:** 43 tasks, all assigned (100%)
- **Time:** ~30 seconds  
- **Result:** Perfect organization with improved parser ✅
- **Link:** https://tree.taiga.io/project/frankpulido-mcp-taiga/

---

## 📚 **Related Documentation**

- **Main README**: `../README.md`
- **Author Assignment**: `../AUTHOR_ASSIGNMENT_FEATURE.md`
- **Solo Assignment**: `../SOLO_ASSIGNMENT_ENHANCEMENT.md`
- **Roadmap**: `../ROADMAP_WARP_FRANK.md`

---

## 🙏 **Credits**

**Utility Created:** October 7, 2025  
**Author:** Frank Pulido + Warp AI Assistant  
**Status:** Production Ready  
**Tested On:** AppointmentManager (30 tasks assigned successfully)

---

**💡 Tip:** Bookmark this file for quick reference when managing your Taiga projects!
