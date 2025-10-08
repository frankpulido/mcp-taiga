#!/usr/bin/env node

/**
 * Retry the 4 failed user stories that had emoji issues
 */

import { TaigaService } from './src/taigaService.js';

async function main() {
  console.log('🔄 Retrying Failed User Stories\n');
  
  const taigaService = new TaigaService();
  
  try {
    // Get projects
    const projects = await taigaService.listProjects();
    const mcpProject = projects.find(p => 
      p.name.toLowerCase().includes('universal') || 
      p.slug.includes('universal-taiga')
    );
    
    if (!mcpProject) {
      console.log('❌ Could not find Universal Taiga Project Agent');
      return;
    }
    
    console.log(`🎯 Project: ${mcpProject.name}\n`);
    
    // Get statuses
    const statuses = await taigaService.getUserStoryStatuses(mcpProject.id);
    const newStatusId = statuses.find(s => s.name.toLowerCase().includes('new') || s.order === 0)?.id;
    
    // The 4 failed items with emojis removed from titles
    const failedItems = [
      {
        title: 'Task Generation Framework',
        description: '**Task Generation Framework:**\n\n**Implementation:**\n- BaseGenerator.js         # Common functionality & patterns\n- GitHistoryGenerator.js   # Git → Taiga task conversion\n- ✅ RoadmapGenerator.js   # Roadmap → Taiga task conversion\n- [Future] FigmaGenerator.js\n- [Future] CodeReviewGenerator.js\n\n**Source:** Roadmap Feature Definition\n\n**Related Files:**\n- /Users/frankpulidoalvarez/Documents/developer/mcp-servers/mcpTAIGA/ROADMAP_WARP_FRANK.md',
        tags: ['feature', 'low-priority']
      },
      {
        title: 'Project Creation Capability (Added: October 7, 2025)',
        description: 'Frank: *"I think that the Universal Taiga MCP Agent should also offer the Taiga project creation"*\n\n**Implementation:**\n- Interactive Project Creation: Name, description, privacy settings\n- Smart Defaults: Kanban template, appropriate initial configuration\n- Seamless Integration: Create → Populate in single workflow\n- URL Generation: Automatic project link display\n\n**Source:** Roadmap Feature Definition\n\n**Related Files:**\n- /Users/frankpulidoalvarez/Documents/developer/mcp-servers/mcpTAIGA/ROADMAP_WARP_FRANK.md',
        tags: ['feature', 'low-priority']
      },
      {
        title: 'MCP Server Lifecycle Management (Added: October 7, 2025)',
        description: 'Frank: *"do you check that the mcp server is started? if it\'s not you should take care of it (npm start)"*\n\n**Implementation:**\n- Health Checking: Automatic server status detection\n- User-Controlled Startup: Asks permission before auto-starting\n- Manual Instructions: Clear guide for manual startup if preferred\n- Smart Cleanup: Offers to stop server if agent started it\n- Verification: Confirms server is running before proceeding\n\n**Source:** Roadmap Feature Definition\n\n**Related Files:**\n- /Users/frankpulidoalvarez/Documents/developer/mcp-servers/mcpTAIGA/ROADMAP_WARP_FRANK.md',
        tags: ['feature', 'low-priority']
      },
      {
        title: 'Comprehensive Documentation (Added: October 7, 2025)',
        description: 'Frank: *"I renamed README.md as README_ORIGINAL.md - It seems we need a README_NEW_2025_10_07.md"*\n\n**Implementation:**\n- Professional README.md: Complete rewrite with attractive formatting\n- Real-World Examples: AppointmentManager success story\n- Architecture Diagrams: Visual system design explanation\n- Troubleshooting Guide: Common issues and solutions\n- Contributing Guidelines: How to extend the agent\n- GitHub Integration Guide: `GITHUB Taiga setup.md` for commit automation\n\n**Source:** Roadmap Feature Definition\n\n**Related Files:**\n- /Users/frankpulidoalvarez/Documents/developer/mcp-servers/mcpTAIGA/ROADMAP_WARP_FRANK.md',
        tags: ['feature', 'low-priority']
      }
    ];
    
    console.log(`📝 Creating ${failedItems.length} failed user stories...\n`);
    
    for (const item of failedItems) {
      try {
        await taigaService.createUserStory({
          project: mcpProject.id,
          subject: item.title,
          description: item.description,
          status: newStatusId,
          tags: item.tags
        });
        
        console.log(`✅ Created: ${item.title}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed: ${item.title}`);
        console.error(`   Error: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Retry complete!\n');
    
    // Check final state
    const userStories = await taigaService.listUserStories(mcpProject.id);
    console.log(`📊 Total User Stories: ${userStories.length}`);
    console.log(`🔗 View: https://tree.taiga.io/project/${mcpProject.slug}/\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
