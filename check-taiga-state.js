#!/usr/bin/env node

import { TaigaService } from './src/taigaService.js';

async function main() {
  const taigaService = new TaigaService();
  const projects = await taigaService.listProjects();
  const mcpProject = projects.find(p => p.slug.includes('universal-taiga'));
  
  if (!mcpProject) {
    console.log('Project not found');
    return;
  }
  
  const userStories = await taigaService.listUserStories(mcpProject.id);
  
  console.log(`\n📊 Universal Taiga Project Agent Status:\n`);
  console.log(`   Project: ${mcpProject.name}`);
  console.log(`   Slug: ${mcpProject.slug}`);
  console.log(`   Total User Stories: ${userStories.length}\n`);
  
  console.log(`📝 All User Stories:`);
  userStories.forEach((story, i) => {
    console.log(`   ${i + 1}. ${story.subject}`);
  });
  
  console.log(`\n🔗 View: https://tree.taiga.io/project/${mcpProject.slug}/\n`);
}

main();
