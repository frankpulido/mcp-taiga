#!/usr/bin/env node

/**
 * Add the 2 missing user stories that failed due to emoji issues
 */

import { TaigaService } from './src/taigaService.js';

async function fixMissingStories() {
  const taigaService = new TaigaService();
  
  try {
    console.log('🔧 Adding missing user stories...\n');
    
    // Get projects
    const projects = await taigaService.listProjects();
    const mcpProject = projects.find(p => p.slug === 'frankpulido-mcp-taiga');
    
    if (!mcpProject) {
      throw new Error('MCP Taiga project not found');
    }
    
    console.log(`✅ Found project: ${mcpProject.name}`);
    console.log(`📊 Project ID: ${mcpProject.id}\n`);
    
    // Get statuses
    const statuses = await taigaService.getUserStoryStatuses(mcpProject.id);
    const newStatusId = statuses.find(s => s.name.toLowerCase().includes('new') || s.order === 0)?.id;
    
    // Get project members
    const members = await taigaService.getProjectMembers(mcpProject.id);
    const assignedTo = members.length === 1 ? members[0].id : null;
    
    console.log(`👤 Assigned to: ${members[0]?.full_name || 'Unassigned'}\n`);
    
    // Define the 2 missing stories
    const missingStories = [
      {
        subject: 'Project Creation Capability (Added: October 7, 2025)',
        description: `Interactive Taiga project creation with smart defaults.

**Features:**
- Interactive project creation flow
- Name, description, privacy settings
- Kanban template with appropriate config
- Seamless Create → Populate workflow
- Automatic project URL display

**Implementation:**
- User-controlled creation
- Smart defaults
- URL generation

**Source:** Roadmap Feature Definition
**Files:** ROADMAP_WARP_FRANK.md`,
        status: newStatusId,
        project: mcpProject.id,
        tags: ['feature', 'low-priority', 'project-creation']
      },
      {
        subject: 'MCP Server Lifecycle Management (Added: October 7, 2025)',
        description: `Full MCP server lifecycle management with user control.

**Features:**
- Health checking on startup
- Auto-start with user consent
- Manual startup instructions
- Smart cleanup after completion
- Tracks whether agent started server

**Implementation:**
- User consent for auto-start
- Manual instructions if declined
- Verification before proceeding
- Cleanup on completion

**Source:** Roadmap Feature Definition
**Files:** ROADMAP_WARP_FRANK.md`,
        status: newStatusId,
        project: mcpProject.id,
        tags: ['feature', 'low-priority', 'server-management']
      }
    ];
    
    // Add assigned_to if solo project
    if (assignedTo) {
      missingStories.forEach(story => story.assigned_to = assignedTo);
    }
    
    // Create the stories
    console.log('🚀 Creating user stories...\n');
    
    for (const story of missingStories) {
      try {
        await taigaService.createUserStory(story);
        console.log(`✅ Created: ${story.subject}`);
        await delay(500);
      } catch (error) {
        console.error(`❌ Failed: ${story.subject}`);
        console.error(`   Error: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Done!');
    console.log(`🔗 View project: https://tree.taiga.io/project/${mcpProject.slug}/`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the fix
fixMissingStories();
