#!/usr/bin/env node

/**
 * Test RoadmapGenerator
 * 
 * Quick test to verify RoadmapGenerator extracts tasks correctly from the roadmap file
 */

import { RoadmapGenerator } from './agents/TaskGenerators/RoadmapGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRoadmapGenerator() {
  console.log('🧪 Testing RoadmapGenerator\n');
  
  const roadmapPath = path.join(__dirname, 'ROADMAP_WARP_FRANK.md');
  console.log(`📄 Roadmap file: ${roadmapPath}\n`);
  
  const config = {
    taigaProject: {
      id: 1,
      name: 'Test Project'
    }
  };
  
  const generator = new RoadmapGenerator(roadmapPath, config);
  
  try {
    console.log('⚙️ Generating tasks from roadmap...\n');
    const tasks = await generator.generateTasks();
    
    console.log('📊 Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Epics (Phases): ${tasks.epics.length}`);
    tasks.epics.forEach((epic, i) => {
      console.log(`\n  ${i + 1}. ${epic.title}`);
      console.log(`     Status: ${epic.status}`);
      console.log(`     Tags: ${epic.tags.join(', ')}`);
      console.log(`     Description length: ${epic.description.length} chars`);
    });
    
    console.log(`\n\n✨ User Stories (Features): ${tasks.userStories.length}`);
    tasks.userStories.slice(0, 5).forEach((story, i) => {
      console.log(`\n  ${i + 1}. ${story.title}`);
      console.log(`     Status: ${story.status}`);
      console.log(`     Tags: ${story.tags.join(', ')}`);
    });
    if (tasks.userStories.length > 5) {
      console.log(`\n  ... and ${tasks.userStories.length - 5} more`);
    }
    
    console.log(`\n\n📋 Tasks (Action Items): ${tasks.tasks.length}`);
    tasks.tasks.slice(0, 5).forEach((task, i) => {
      console.log(`\n  ${i + 1}. ${task.title}`);
      console.log(`     Status: ${task.status}`);
    });
    if (tasks.tasks.length > 5) {
      console.log(`\n  ... and ${tasks.tasks.length - 5} more`);
    }
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total items: ${tasks.epics.length + tasks.userStories.length + tasks.tasks.length}`);
    console.log('\n✅ RoadmapGenerator test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRoadmapGenerator();
