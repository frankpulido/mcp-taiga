#!/usr/bin/env node

/**
 * Test CodeReviewGenerator
 * 
 * Validates code review analysis and task generation
 */

import { CodeReviewGenerator } from './agents/TaskGenerators/CodeReviewGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCodeReviewGenerator() {
  console.log('🧪 Testing CodeReviewGenerator\n');
  
  const projectPath = __dirname; // Test on itself
  console.log(`📁 Project directory: ${projectPath}\n`);
  
  const config = {
    taigaProject: {
      id: 1,
      name: 'Test Project'
    },
    projectInfo: {
      type: 'Node.js',
      framework: 'Node',
      hasGit: true
    }
  };
  
  const generator = new CodeReviewGenerator(projectPath, config);
  
  try {
    console.log('⚙️ Analyzing codebase...\n');
    const tasks = await generator.generateTasks();
    
    console.log('📊 Code Metrics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Total Files: ${generator.codeMetrics.totalFiles}`);
    console.log(`  Lines of Code: ${generator.codeMetrics.linesOfCode}`);
    console.log(`  Files Without Tests: ${generator.codeMetrics.filesWithoutTests.length}`);
    console.log(`  Files Without Docs: ${generator.codeMetrics.filesWithoutDocs.length}`);
    console.log(`  Security Issues: ${generator.codeMetrics.securityIssues.length}`);
    console.log(`  Complexity Issues: ${generator.codeMetrics.complexityIssues.length}`);
    
    console.log('\n📊 Generated Tasks:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ User Stories: ${tasks.userStories.length}`);
    tasks.userStories.forEach((story, i) => {
      console.log(`\n  ${i + 1}. ${story.title}`);
      console.log(`     Status: ${story.status}`);
      console.log(`     Tags: ${story.tags.join(', ')}`);
    });
    
    console.log(`\n\n📋 Tasks: ${tasks.tasks.length}`);
    tasks.tasks.slice(0, 5).forEach((task, i) => {
      console.log(`\n  ${i + 1}. ${task.title}`);
      console.log(`     Tags: ${task.tags.join(', ')}`);
    });
    if (tasks.tasks.length > 5) {
      console.log(`\n  ... and ${tasks.tasks.length - 5} more`);
    }
    
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total items: ${tasks.userStories.length + tasks.tasks.length}`);
    console.log('\n✅ CodeReviewGenerator test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCodeReviewGenerator();
