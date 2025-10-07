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
import { spawn, execSync } from 'child_process';

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
    this.serverStartedByUs = false;
    this.serverProcessPid = null;
  }

  /**
   * Main agent execution flow
   */
  async run() {
    try {
      console.log('🤖 Universal Taiga Project Agent');
      console.log('================================\n');
      
      // Step 0: Ensure MCP server is running
      await this.ensureMCPServerRunning();
      
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
      await this.cleanup();
    }
  }

  /**
   * Cleanup: stop server if we started it
   */
  async cleanup() {
    if (this.serverStartedByUs && this.isMCPServerRunning()) {
      console.log('\n🧹 Cleaning up...');
      const stopServer = await this.askBoolean('Stop MCP server (started by agent)?');
      
      if (stopServer) {
        console.log('🛑 Stopping MCP server...');
        try {
          execSync('pkill -f "npm start"');
          console.log('✅ Server stopped');
        } catch (error) {
          console.log('⚠️ Server may still be running');
        }
      } else {
        console.log('ℹ️ Server left running (you can stop it manually with: pkill -f "npm start")');
      }
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
    console.log(`  ${projects.length + 1}. 🆕 Create new project`);
    
    const projectChoice = await this.ask(`\nSelect project or create new (1-${projects.length + 1}):`);
    const choiceIndex = parseInt(projectChoice) - 1;
    
    let selectedProject;
    
    if (choiceIndex === projects.length) {
      // Create new project
      selectedProject = await this.createNewProject();
    } else if (choiceIndex >= 0 && choiceIndex < projects.length) {
      selectedProject = projects[choiceIndex];
    } else {
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
    
    // Import generators dynamically based on what's needed and what's available
    if (this.sources.git) {
      try {
        const { GitHistoryGenerator } = await import('./TaskGenerators/GitHistoryGenerator.js');
        this.generators.push(new GitHistoryGenerator(this.sources.git, this.config));
        console.log('✅ Git history generator loaded');
      } catch (error) {
        console.log('⚠️ Git history generator not available');
      }
    }
    
    if (this.config.generateCodeReview && this.config.projectDir) {
      try {
        const { CodeReviewGenerator } = await import('./TaskGenerators/CodeReviewGenerator.js');
        this.generators.push(new CodeReviewGenerator(this.config.projectDir, this.config));
        console.log('✅ Code review generator loaded');
      } catch (error) {
        console.log('⚠️ Code review generator not available (will be implemented in Phase 3)');
      }
    }
    
    if (this.generators.length === 0) {
      console.log('⚠️ No generators available - creating basic project structure only');
    } else {
      console.log(`✅ ${this.generators.length} generators ready`);
    }
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

  /**
   * Ensure MCP server is running, start if needed
   */
  async ensureMCPServerRunning() {
    console.log('🔍 Checking MCP server status...');
    
    if (this.isMCPServerRunning()) {
      console.log('✅ MCP server is already running');
      return;
    }
    
    console.log('⚠️ MCP server is not running');
    console.log('The Universal Taiga Agent requires the MCP server to communicate with Taiga.\n');
    
    const startServer = await this.askBoolean('Start MCP server automatically (`npm start`)?');
    
    if (startServer) {
      console.log('🚀 Starting MCP server...');
      try {
        await this.startMCPServer();
        this.serverStartedByUs = true;
        console.log('✅ MCP server started successfully');
      } catch (error) {
        console.error(`❌ Failed to start MCP server: ${error.message}`);
        throw new Error('MCP server startup failed');
      }
    } else {
      console.log('\n📝 Please start the MCP server manually:');
      console.log('   1. Open a new terminal window');
      console.log('   2. Navigate to this directory:');
      console.log(`      cd ${process.cwd()}`);
      console.log('   3. Run: npm start');
      console.log('   4. Return here and press Enter to continue\n');
      
      await this.ask('Press Enter when MCP server is running...');
      
      // Verify server is now running
      if (!this.isMCPServerRunning()) {
        throw new Error('MCP server is still not running. Please start it manually and try again.');
      }
      
      console.log('✅ MCP server detected, continuing...');
    }
  }

  /**
   * Check if MCP server is currently running
   */
  isMCPServerRunning() {
    try {
      // Check for npm start process
      const result = execSync('ps aux | grep "npm start" | grep -v grep', { encoding: 'utf8' });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start the MCP server
   */
  async startMCPServer() {
    return new Promise((resolve, reject) => {
      // Start npm start in background
      const mcpProcess = spawn('npm', ['start'], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd()
      });
      
      mcpProcess.unref(); // Allow parent to exit
      
      // Give server time to start
      setTimeout(() => {
        if (this.isMCPServerRunning()) {
          resolve();
        } else {
          reject(new Error('Server failed to start within timeout'));
        }
      }, 3000);
    });
  }

  /**
   * Create a new Taiga project interactively
   */
  async createNewProject() {
    console.log('\n🆕 Creating New Taiga Project');
    console.log('==============================');
    
    const projectName = await this.ask('Project name:');
    const projectDescription = await this.ask('Project description (optional):');
    const isPrivate = await this.askBoolean('Make project private?');
    
    console.log('\n🛠️ Creating project in Taiga...');
    
    try {
      const projectData = {
        name: projectName,
        description: projectDescription || `Project for ${projectName} development and management.`,
        is_private: isPrivate,
        creation_template: 1 // Kanban template
      };
      
      const newProject = await this.taigaService.createProject(projectData);
      
      console.log(`✅ Created project: ${newProject.name}`);
      console.log(`🔗 URL: https://tree.taiga.io/project/${newProject.slug}/`);
      console.log(`🏧 Slug: ${newProject.slug}`);
      
      // Small delay to let the project initialize
      await this.delay(2000);
      
      return newProject;
      
    } catch (error) {
      console.error(`❌ Failed to create project: ${error.message}`);
      throw new Error('Project creation failed. Please create manually in Taiga web interface.');
    }
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new TaigaProjectAgent();
  agent.run().catch(console.error);
}