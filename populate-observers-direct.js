#!/usr/bin/env node

/**
 * Direct (non-interactive) population of Observers-Hexagonal Taiga project
 * Bypasses all interactive prompts and goes straight to population
 */

import { TaigaService } from './src/taigaService.js';
import { GitAnalyzer } from './agents/GitAnalyzer.js';
import { GitHistoryGenerator } from './agents/TaskGenerators/GitHistoryGenerator.js';
import { RoadmapGenerator } from './agents/TaskGenerators/RoadmapGenerator.js';

class DirectPopulator {
  constructor() {
    this.taigaService = new TaigaService();
  }

  async run() {
    try {
      console.log('🚀 Direct Population: Observers-Hexagonal\n');
      console.log('═'.repeat(60));
      
      // Step 1: Get Taiga project
      console.log('\n📋 Finding Taiga project...');
      const projects = await this.taigaService.listProjects();
      const project = projects.find(p => 
        p.slug.includes('notifier') || 
        p.name.toLowerCase().includes('observer')
      );
      
      if (!project) {
        throw new Error('Observers-Hexagonal project not found in Taiga');
      }
      
      console.log(`✅ Found: ${project.name} (${project.slug})`);
      
      // Step 2: Get statuses
      const statuses = await this.taigaService.getUserStoryStatuses(project.id);
      console.log(`📊 Statuses: ${statuses.map(s => s.name).join(', ')}`);
      
      const config = {
        taigaProject: project,
        statuses: statuses
      };
      
      // Step 3: Set up Git Analyzer
      console.log('\n📚 Analyzing git repository...');
      const projectPath = '/Users/frankpulidoalvarez/Documents/developer/observers-hexagonal';
      const gitAnalyzer = new GitAnalyzer(projectPath);
      
      // Step 4: Generate tasks from git history
      console.log('\n🏭 Setting up Git History Generator...');
      const gitGenerator = new GitHistoryGenerator(gitAnalyzer, config);
      const gitTasks = await gitGenerator.generateTasks();
      
      console.log('\n📊 Git History Analysis Results:');
      console.log(`   Epics: ${gitTasks.epics.length}`);
      console.log(`   User Stories: ${gitTasks.userStories.length}`);
      console.log(`   Tasks: ${gitTasks.tasks.length}`);
      
      // Step 5: Generate tasks from roadmap (README_dev.md)
      console.log('\n📄 Analyzing README_dev.md...');
      let roadmapTasks = { epics: [], userStories: [], tasks: [] };
      try {
        const roadmapPath = projectPath + '/README_dev.md';
        const roadmapGenerator = new RoadmapGenerator(roadmapPath, config);
        roadmapTasks = await roadmapGenerator.generateTasks();
        
        console.log('\n📊 Roadmap Analysis Results:');
        console.log(`   Epics: ${roadmapTasks.epics.length}`);
        console.log(`   User Stories: ${roadmapTasks.userStories.length}`);
        console.log(`   Tasks: ${roadmapTasks.tasks.length}`);
      } catch (error) {
        console.log(`⚠️  Roadmap parsing encountered issues: ${error.message}`);
        console.log('   Continuing with git history only...');
      }
      
      // Step 6: Summary
      const totalItems = (gitTasks.epics?.length || 0) + 
                        (gitTasks.userStories?.length || 0) + 
                        (gitTasks.tasks?.length || 0) +
                        (roadmapTasks.epics?.length || 0) +
                        (roadmapTasks.userStories?.length || 0) +
                        (roadmapTasks.tasks?.length || 0);
      
      console.log('\n═'.repeat(60));
      console.log(`📊 Total items to create: ${totalItems}`);
      console.log('═'.repeat(60));
      
      if (totalItems === 0) {
        console.log('\n⚠️  No tasks generated. Check git history and roadmap files.');
        return;
      }
      
      console.log('\n⏳ Waiting 3 seconds before population (Ctrl+C to cancel)...');
      await this.delay(3000);
      
      // Step 7: Execute population
      console.log('\n🚀 Starting population...\n');
      
      if (gitTasks.epics.length > 0 || gitTasks.userStories.length > 0 || gitTasks.tasks.length > 0) {
        console.log('📝 Populating from Git History...');
        await gitGenerator.execute(this.taigaService, project);
        console.log('✅ Git history tasks created\n');
      }
      
      if (roadmapTasks.epics?.length > 0 || roadmapTasks.userStories?.length > 0 || roadmapTasks.tasks?.length > 0) {
        console.log('📝 Populating from Roadmap...');
        const roadmapPath = projectPath + '/README_dev.md';
        const roadmapGenerator = new RoadmapGenerator(roadmapPath, config);
        await roadmapGenerator.execute(this.taigaService, project);
        console.log('✅ Roadmap tasks created\n');
      }
      
      // Step 8: Verify
      console.log('🔍 Verifying population...');
      const finalStories = await this.taigaService.listUserStories(project.id);
      
      console.log('\n═'.repeat(60));
      console.log('🎉 POPULATION COMPLETE!');
      console.log('═'.repeat(60));
      console.log(`📊 Total User Stories in project: ${finalStories.length}`);
      console.log(`🔗 View: https://tree.taiga.io/project/${project.slug}/`);
      console.log('═'.repeat(60));
      console.log();
      
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute
const populator = new DirectPopulator();
populator.run();
