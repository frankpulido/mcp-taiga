#!/usr/bin/env node

/**
 * Universal Taiga Project Agent
 * 
 * A flexible agent that can populate any Taiga project with tasks from multiple sources:
 * - Git history analysis
 * - Project roadmaps
 * - Figma designs
 * - Code review findings
 * - Architecture documentation
 */

import { TaigaService } from '../src/taigaService.js';
import { GitAnalyzer } from './GitAnalyzer.js';
import { ProjectDiscovery } from './ProjectDiscovery.js';
import { BaseGenerator } from './TaskGenerators/BaseGenerator.js';
import readline from 'readline';
import path from 'path';
import fs from 'fs';

export class TaigaProjectAgent {
  constructor() {
    this.taigaService = new TaigaService();
    this.config = {};
    this.sources = {};
    this.generators = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main agent execution flow
   */
  async run() {
    try {
      console.log('🤖 Universal Taiga Project Agent');
      console.log('================================\n');
      
      // Step 1: Interactive project discovery
      await this.discoverProject();
      
      // Step 2: Initialize sources
      await this.initializeSources();
      
      // Step 3: Set up task generators
      await this.setupGenerators();
      
      // Step 4: Preview what will be created
      await this.previewTasks();
      
      // Step 5: Execute population
      await this.populateProject();
      
      // Step 6: Summary and next steps
      this.showSummary();
      
    } catch (error) {
      console.error('❌ Agent execution failed:', error.message);
      throw error;
    } finally {
      this.rl.close();
    }
  }

  /**
   * Interactive project discovery
   */
  async discoverProject() {
    console.log('🔍 Project Discovery Phase\n');
    
    // Essential questions
    this.config.projectDir = await this.ask('📁 Project directory (absolute path, or press Enter to skip):');
    this.config.projectDir = this.config.projectDir.trim() || null;
    
    if (this.config.projectDir && !fs.existsSync(this.config.projectDir)) {
      console.log('⚠️ Directory not found, continuing without project files...');
      this.config.projectDir = null;
    }
    
    // Taiga credentials
    console.log('\n🔐 Taiga Configuration:');
    const useEnvCredentials = await this.ask('Use existing .env credentials? (y/N):');
    
    if (!useEnvCredentials.toLowerCase().startsWith('y')) {
      this.config.taigaUrl = await this.ask('Taiga API URL:') || 'https://api.taiga.io/api/v1';
      this.config.taigaUsername = await this.ask('Taiga username:');
      this.config.taigaPassword = await this.ask('Taiga password:');
    }
    
    // Project analysis
    if (this.config.projectDir) {
      console.log('\n📊 Analyzing project structure...');
      const discovery = new ProjectDiscovery(this.config.projectDir);
      this.config.projectInfo = await discovery.analyze();
      
      console.log(`✅ Detected: ${this.config.projectInfo.type} project`);
      console.log(`📦 Framework: ${this.config.projectInfo.framework || 'Generic'}`);
      
      if (this.config.projectInfo.hasGit) {
        this.config.useGit = await this.askBoolean('📚 Analyze git history for completed tasks?');
      }
      
      if (this.config.projectInfo.hasRoadmap) {
        this.config.useRoadmap = await this.askBoolean(`📋 Found roadmap file. Use it for future tasks?`);
      }
    }
    
    // Additional sources
    console.log('\n🎨 Additional Task Sources:');
    this.config.figmaUrl = await this.ask('Figma URL (optional):');
    this.config.generateCodeReview = await this.askBoolean('🔍 Generate code review tasks?');
    this.config.customRoadmapFile = await this.ask('📄 Custom roadmap file path (optional):');
  }

  /**
   * Initialize all data sources
   */
  async initializeSources() {
    console.log('\n⚙️ Initializing data sources...');
    
    if (this.config.projectDir && this.config.useGit) {
      this.sources.git = new GitAnalyzer(this.config.projectDir);
      console.log('✅ Git analyzer ready');
    }
    
    if (this.config.useRoadmap || this.config.customRoadmapFile) {
      const roadmapPath = this.config.customRoadmapFile || 
        this.config.projectInfo?.roadmapFiles?.[0];
      
      if (roadmapPath && fs.existsSync(roadmapPath)) {
        // We'll implement RoadmapAnalyzer next
        console.log(`✅ Roadmap analyzer ready: ${path.basename(roadmapPath)}`);
      }
    }
    
    // Initialize Taiga connection
    await this.initializeTaiga();
  }

  /**
   * Initialize Taiga connection and project selection
   */
  async initializeTaiga() {
    console.log('\n🔗 Connecting to Taiga...');
    
    const projects = await this.taigaService.listProjects();
    
    if (projects.length === 0) {
      throw new Error('No accessible Taiga projects found');
    }
    
    console.log('\n📋 Available Taiga projects:');
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (${project.slug})`);
    });
    
    const projectChoice = await this.ask(`\nSelect project (1-${projects.length}):`);
    const selectedProject = projects[parseInt(projectChoice) - 1];
    
    if (!selectedProject) {
      throw new Error('Invalid project selection');
    }
    
    this.config.taigaProject = selectedProject;
    console.log(`✅ Selected: ${selectedProject.name}`);
    
    // Get project statuses
    this.config.statuses = await this.taigaService.getUserStoryStatuses(selectedProject.id);
    console.log(`📊 Available statuses: ${this.config.statuses.map(s => s.name).join(', ')}`);
  }

  /**
   * Set up task generators based on available sources
   */
  async setupGenerators() {
    console.log('\n🏭 Setting up task generators...');
    
    // Import generators dynamically based on what's needed
    if (this.sources.git) {
      const { GitHistoryGenerator } = await import('./TaskGenerators/GitHistoryGenerator.js');
      this.generators.push(new GitHistoryGenerator(this.sources.git, this.config));
    }
    
    if (this.config.generateCodeReview && this.config.projectDir) {
      const { CodeReviewGenerator } = await import('./TaskGenerators/CodeReviewGenerator.js');
      this.generators.push(new CodeReviewGenerator(this.config.projectDir, this.config));
    }
    
    console.log(`✅ ${this.generators.length} generators ready`);
  }

  /**
   * Preview what tasks will be created
   */
  async previewTasks() {
    console.log('\n👀 Generating task preview...');
    
    let totalTasks = 0;
    
    for (const generator of this.generators) {
      const tasks = await generator.generateTasks();
      console.log(`\n📝 ${generator.constructor.name}:`);
      console.log(`   - ${tasks.epics?.length || 0} epics`);
      console.log(`   - ${tasks.userStories?.length || 0} user stories`);
      console.log(`   - ${tasks.tasks?.length || 0} tasks`);
      
      totalTasks += (tasks.epics?.length || 0) + 
                    (tasks.userStories?.length || 0) + 
                    (tasks.tasks?.length || 0);
    }
    
    console.log(`\n📊 Total items to create: ${totalTasks}`);
    
    const proceed = await this.askBoolean('\n✅ Proceed with population?');
    if (!proceed) {
      console.log('❌ Population cancelled by user');
      process.exit(0);
    }
  }

  /**
   * Execute the actual population
   */
  async populateProject() {
    console.log('\n🚀 Starting project population...');
    
    for (const generator of this.generators) {
      console.log(`\n📝 Executing ${generator.constructor.name}...`);
      await generator.execute(this.taigaService, this.config.taigaProject);
      
      // Rate limiting between generators
      await this.delay(1000);
    }
  }

  /**
   * Show summary and next steps
   */
  showSummary() {
    console.log('\n🎉 Project population completed!');
    console.log(`📋 Project: ${this.config.taigaProject.name}`);
    console.log(`🔗 URL: https://tree.taiga.io/project/${this.config.taigaProject.slug}/`);
    console.log('\n📚 Next steps:');
    console.log('   1. Review created tasks in Taiga');
    console.log('   2. Adjust priorities and sprint assignments');
    console.log('   3. Add team members if needed');
    console.log('   4. Start your first sprint! 🏃‍♂️');
  }

  /**
   * Helper methods
   */
  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question + ' ', resolve);
    });
  }

  async askBoolean(question) {
    const answer = await this.ask(question + ' (y/N):');
    return answer.toLowerCase().startsWith('y');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new TaigaProjectAgent();
  agent.run().catch(console.error);
}