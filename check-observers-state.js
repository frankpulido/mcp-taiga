#!/usr/bin/env node

import { TaigaService } from './src/taigaService.js';

async function main() {
  const taigaService = new TaigaService();
  const projects = await taigaService.listProjects();
  const observersProject = projects.find(p => p.slug.includes('notifier') || p.name.toLowerCase().includes('observer'));
  
  if (!observersProject) {
    console.log('❌ Observers-Hexagonal project not found');
    console.log('\nAvailable projects:');
    projects.forEach((p, i) => console.log(`  ${i+1}. ${p.name} (${p.slug})`));
    return;
  }
  
  const userStories = await taigaService.listUserStories(observersProject.id);
  
  console.log(`\n📊 ${observersProject.name} Status:\n`);
  console.log(`   Project: ${observersProject.name}`);
  console.log(`   Slug: ${observersProject.slug}`);
  console.log(`   Total User Stories: ${userStories.length}\n`);
  
  if (userStories.length > 0) {
    console.log('📝 Current User Stories:');
    userStories.forEach((story, i) => {
      console.log(`   ${i + 1}. ${story.subject}`);
    });
  } else {
    console.log('📝 No user stories found yet');
  }
  
  console.log(`\n🔗 View: https://tree.taiga.io/project/${observersProject.slug}/\n`);
}

main();
