#!/usr/bin/env node

/**
 * Populate Taiga with RoadmapGenerator tasks
 * 
 * Quick script to check current Taiga state and populate with roadmap tasks
 */

import { TaigaService } from './src/taigaService.js';
import { RoadmapGenerator } from './agents/TaskGenerators/RoadmapGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Taiga Roadmap Population Script\n');
  
  const taigaService = new TaigaService();
  
  try {
    // List projects
    console.log('📋 Fetching Taiga projects...');
    const projects = await taigaService.listProjects();
    
    console.log(`\n✅ Found ${projects.length} projects:\n`);
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (${project.slug})`);
    });
    
    // Find or select the Universal Taiga Project Agent
    const mcpProject = projects.find(p => 
      p.name.toLowerCase().includes('universal') || 
      p.slug.includes('universal-taiga')
    );
    
    if (!mcpProject) {
      console.log('\n❌ Could not find "Universal Taiga Project Agent" project');
      console.log('Please create it first or specify the project name');
      return;
    }
    
    console.log(`\n🎯 Selected project: ${mcpProject.name}`);
    console.log(`   Slug: ${mcpProject.slug}`);
    console.log(`   ID: ${mcpProject.id}`);
    
    // Check current tasks
    console.log('\n📊 Checking current project state...');
    
    const userStories = await taigaService.listUserStories(mcpProject.id);
    
    console.log(`\n📈 Current Taiga State:`);
    console.log(`   User Stories: ${userStories.length}`);
    console.log();
    
    if (userStories.length > 0) {
      console.log('📝 Existing User Stories:');
      userStories.slice(0, 5).forEach(story => {
        console.log(`   - ${story.subject}`);
      });
      if (userStories.length > 5) {
        console.log(`   ... and ${userStories.length - 5} more`);
      }
      console.log();
    }
    
    // Generate tasks from roadmap
    const roadmapPath = path.join(__dirname, 'ROADMAP_WARP_FRANK.md');
    console.log(`📄 Reading roadmap: ${roadmapPath}\n`);
    
    // Get statuses
    const statuses = await taigaService.getUserStoryStatuses(mcpProject.id);
    
    const config = {
      taigaProject: mcpProject,
      statuses: statuses
    };
    
    const generator = new RoadmapGenerator(roadmapPath, config);
    const generatedTasks = await generator.generateTasks();
    
    console.log('📊 Generated from Roadmap:');
    console.log(`   Epics: ${generatedTasks.epics.length}`);
    console.log(`   User Stories: ${generatedTasks.userStories.length}`);
    console.log(`   Tasks: ${generatedTasks.tasks.length}`);
    console.log(`   ─────────────────────`);
    console.log(`   Total: ${generatedTasks.epics.length + generatedTasks.userStories.length + generatedTasks.tasks.length}\n`);
    
    // Ask for confirmation
    console.log('❓ Do you want to populate Taiga with these tasks?');
    console.log('   (Press Ctrl+C to cancel, or wait 5 seconds to proceed...)\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🚀 Starting population...\n');
    
    // Execute population
    await generator.execute(taigaService, mcpProject);
    
    console.log('\n✅ Population complete!\n');
    
    // Check new state
    const newUserStories = await taigaService.listUserStories(mcpProject.id);
    
    console.log('📈 New Taiga State:');
    console.log(`   User Stories: ${newUserStories.length} (+${newUserStories.length - userStories.length})`);
    console.log();
    
    console.log(`🔗 View project: https://tree.taiga.io/project/${mcpProject.slug}/\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
