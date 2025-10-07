#!/usr/bin/env node

/**
 * Script to populate Taiga project with AppointmentManager tasks
 * Based on git history and project roadmap
 */

import { TaigaService } from '/Users/frankpulidoalvarez/Documents/developer/mcp-servers/mcpTAIGA/src/taigaService.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class AppointmentManagerTaigaPopulator {
  constructor() {
    this.taigaService = new TaigaService();
    this.projectId = null;
    this.projectData = null;
    this.statuses = null;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Taiga Project Population...');
      
      // Get projects and find AppointmentManager project
      const projects = await this.taigaService.listProjects();
      console.log('Available projects:', projects.map(p => ({ name: p.name, slug: p.slug, id: p.id })));
      
      // You'll need to specify which project to use
      // For now, let's assume it's the first one or look for "appointment" in the name
      this.projectData = projects.find(p => 
        p.name.toLowerCase().includes('appointment') || 
        p.slug.toLowerCase().includes('appointment')
      ) || projects[0];
      
      if (!this.projectData) {
        throw new Error('No suitable project found');
      }
      
      this.projectId = this.projectData.id;
      console.log(`📋 Using project: ${this.projectData.name} (ID: ${this.projectId})`);
      
      // Get statuses
      this.statuses = await this.taigaService.getUserStoryStatuses(this.projectId);
      console.log('📊 Available statuses:', this.statuses.map(s => ({ name: s.name, id: s.id })));
      
    } catch (error) {
      console.error('Failed to initialize:', error.message);
      throw error;
    }
  }

  /**
   * Get git commit history organized by phases
   */
  getGitHistory() {
    try {
      console.log('📚 Analyzing git history...');
      
      // Get all commits with dates
      const gitLog = execSync(
        'git --no-pager log --pretty=format:"%h|%ad|%s|%an" --date=short --all',
        { encoding: 'utf8', cwd: '/Applications/XAMPP/xamppfiles/htdocs/developer/appointments-manager' }
      );
      
      const commits = gitLog.split('\n').map(line => {
        const [hash, date, message, author] = line.split('|');
        return { hash, date, message, author };
      });

      // Organize commits by phases based on content and dates
      return this.organizeCommitsByPhases(commits);
    } catch (error) {
      console.error('Failed to get git history:', error.message);
      return {};
    }
  }

  /**
   * Organize commits into logical phases
   */
  organizeCommitsByPhases(commits) {
    const phases = {
      'Phase 1: Authentication & Authorization': [],
      'Phase 2: Slot Seeder Service': [],
      'Phase 3: JSON Persistence Strategy': [],
      'Phase 4: Database Cleaning & CronJobs': [],
      'Phase 5: Vacation Management': [],
      'Phase 6: Customization System': [],
      'Deployment & Infrastructure': [],
      'Bug Fixes & Maintenance': []
    };

    commits.forEach(commit => {
      const msg = commit.message.toLowerCase();
      
      if (msg.includes('auth') || msg.includes('user') || msg.includes('login')) {
        phases['Phase 1: Authentication & Authorization'].push(commit);
      } else if (msg.includes('slot') && (msg.includes('seed') || msg.includes('service'))) {
        phases['Phase 2: Slot Seeder Service'].push(commit);
      } else if (msg.includes('json') || msg.includes('persistence') || msg.includes('job')) {
        phases['Phase 3: JSON Persistence Strategy'].push(commit);
      } else if (msg.includes('cron') || msg.includes('clean') || msg.includes('schedule')) {
        phases['Phase 4: Database Cleaning & CronJobs'].push(commit);
      } else if (msg.includes('vacation') || msg.includes('observer')) {
        phases['Phase 5: Vacation Management'].push(commit);
      } else if (msg.includes('custom') || msg.includes('parameter') || msg.includes('admin')) {
        phases['Phase 6: Customization System'].push(commit);
      } else if (msg.includes('railway') || msg.includes('deploy') || msg.includes('procfile') || msg.includes('composer')) {
        phases['Deployment & Infrastructure'].push(commit);
      } else if (msg.includes('fix') || msg.includes('debug') || msg.includes('cleaning')) {
        phases['Bug Fixes & Maintenance'].push(commit);
      }
    });

    return phases;
  }

  /**
   * Create epic user stories for each phase
   */
  async createPhaseEpics() {
    console.log('📝 Creating phase epics...');
    
    const phases = this.getGitHistory();
    const doneStatusId = this.statuses.find(s => s.name.toLowerCase().includes('done') || s.is_closed)?.id;
    const newStatusId = this.statuses.find(s => s.name.toLowerCase().includes('new') || s.order === 0)?.id;
    
    const epics = [];

    for (const [phaseName, commits] of Object.entries(phases)) {
      if (commits.length === 0) continue;
      
      const isCompleted = this.isPhaseCompleted(phaseName);
      const statusId = isCompleted ? doneStatusId : newStatusId;
      
      const description = this.createPhaseDescription(phaseName, commits);
      
      try {
        const epic = await this.taigaService.createUserStory({
          project: this.projectId,
          subject: phaseName,
          description: description,
          status: statusId,
          tags: ['epic', this.getPhaseTag(phaseName)]
        });
        
        console.log(`✅ Created epic: ${phaseName}`);
        epics.push({ ...epic, commits, phaseName });
        
        // Small delay to avoid rate limiting
        await this.delay(500);
        
      } catch (error) {
        console.error(`Failed to create epic ${phaseName}:`, error.message);
      }
    }
    
    return epics;
  }

  /**
   * Create tasks for individual commits within phases
   */
  async createCommitTasks(epics) {
    console.log('🔨 Creating individual commit tasks...');
    
    for (const epic of epics) {
      console.log(`Creating tasks for ${epic.phaseName}...`);
      
      // Create tasks for significant commits (skip minor fixes)
      const significantCommits = epic.commits.filter(commit => 
        !commit.message.toLowerCase().includes('comment') &&
        !commit.message.toLowerCase().includes('debug') &&
        !commit.message.toLowerCase().includes('test file') &&
        commit.message.length > 10
      );
      
      for (const commit of significantCommits.slice(0, 5)) { // Limit to avoid clutter
        try {
          await this.taigaService.createTask({
            project: this.projectId,
            subject: commit.message,
            description: `Git commit: ${commit.hash}\nDate: ${commit.date}\nAuthor: ${commit.author}`,
            user_story: epic.id,
            status: 1, // Assuming status 1 is "Done" for completed commits
            tags: ['git-commit', this.getPhaseTag(epic.phaseName)]
          });
          
          // Small delay
          await this.delay(300);
          
        } catch (error) {
          console.error(`Failed to create task for commit ${commit.hash}:`, error.message);
        }
      }
    }
  }

  /**
   * Create future tasks from CODE_REVIEW_FINDINGS.md
   */
  async createFutureTasks() {
    console.log('🚀 Creating future tasks from architectural review...');
    
    const futureTasks = [
      {
        subject: 'Complete AppointmentObserver Methods',
        description: 'Implement updated() and deleted() methods in AppointmentObserver to ensure data consistency when appointments are modified or deleted.',
        priority: 'High',
        tags: ['critical', 'observer-pattern', 'data-consistency']
      },
      {
        subject: 'Complete VacationObserver::updated() Method',
        description: 'Implement updated() method in VacationObserver to handle vacation date changes properly.',
        priority: 'High',
        tags: ['critical', 'observer-pattern', 'vacation-management']
      },
      {
        subject: 'Fix Method Signature Bugs in Slot Models',
        description: 'Fix calculatedEndTime() method calls in AvailableTimeSlot and AvailableTimeSlotDiagnosis models.',
        priority: 'Critical',
        tags: ['bug', 'critical', 'slot-management']
      },
      {
        subject: 'HTTP Verb Consistency in API Routes',
        description: 'Update routes to use proper REST verbs (DELETE instead of POST for deletions, PUT for updates).',
        priority: 'Medium',
        tags: ['api-design', 'rest', 'consistency']
      },
      {
        subject: 'Phase 7: iCal Integration Planning',
        description: 'Plan and design iCal/ICS subscribable calendar feeds for practitioners using spatie/icalendar-generator package.',
        priority: 'Medium',
        tags: ['phase-7', 'ical', 'calendar-integration']
      },
      {
        subject: 'Phase 8: Superadmin Architecture Design',
        description: 'Design multi-tenant management architecture for superadmin functionality.',
        priority: 'Low',
        tags: ['phase-8', 'superadmin', 'architecture']
      },
      {
        subject: 'Add Comprehensive Test Coverage',
        description: 'Implement comprehensive test coverage for complex observer interactions and service layer.',
        priority: 'Medium',
        tags: ['testing', 'quality', 'coverage']
      }
    ];

    const newStatusId = this.statuses.find(s => s.name.toLowerCase().includes('new') || s.order === 0)?.id;
    
    for (const task of futureTasks) {
      try {
        await this.taigaService.createUserStory({
          project: this.projectId,
          subject: task.subject,
          description: task.description,
          status: newStatusId,
          tags: task.tags
        });
        
        console.log(`✅ Created future task: ${task.subject}`);
        await this.delay(400);
        
      } catch (error) {
        console.error(`Failed to create future task ${task.subject}:`, error.message);
      }
    }
  }

  /**
   * Helper methods
   */
  isPhaseCompleted(phaseName) {
    const completedPhases = [
      'Phase 1: Authentication & Authorization',
      'Phase 2: Slot Seeder Service',
      'Phase 3: JSON Persistence Strategy',
      'Phase 4: Database Cleaning & CronJobs',
      'Phase 5: Vacation Management'
    ];
    return completedPhases.includes(phaseName);
  }

  getPhaseTag(phaseName) {
    return phaseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  createPhaseDescription(phaseName, commits) {
    const description = `## ${phaseName}

### Implementation Details
${this.getPhaseDetails(phaseName)}

### Git Commits (${commits.length} commits)
${commits.slice(0, 10).map(c => `- \`${c.hash}\` (${c.date}): ${c.message}`).join('\n')}

### Status: ${this.isPhaseCompleted(phaseName) ? '✅ Completed' : '🚧 In Progress'}
`;
    return description;
  }

  getPhaseDetails(phaseName) {
    const details = {
      'Phase 1: Authentication & Authorization': 'Laravel Sanctum implementation with role-based access control (admin/practitioner), Form Request authorization, and API token authentication.',
      'Phase 2: Slot Seeder Service': 'AvailableTimeSlotSeederService for intelligent slot generation with vacation/holiday awareness.',
      'Phase 3: JSON Persistence Strategy': 'Observer-triggered JSON file generation with Strategy pattern (LocalFileStrategy/RemoteApiStrategy) and queue-based regeneration.',
      'Phase 4: Database Cleaning & CronJobs': 'Artisan commands for daily slot cleanup and yearly holiday management with Laravel scheduling.',
      'Phase 5: Vacation Management': 'Vacation model with VacationObserver for automatic slot management and PractitionerVacationController with full CRUD operations.',
      'Phase 6: Customization System': 'Practitioner-specific configurations with custom_settings JSON field and admin interface for parameter management.'
    };
    return details[phaseName] || 'Implementation details for this phase.';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      await this.initialize();
      
      console.log('🎯 Starting Taiga project population...');
      
      // Step 1: Create phase epics
      const epics = await this.createPhaseEpics();
      
      // Step 2: Create commit tasks (optional - might create too many)
      // await this.createCommitTasks(epics);
      
      // Step 3: Create future tasks
      await this.createFutureTasks();
      
      console.log('🎉 Taiga project population completed successfully!');
      console.log(`📋 Project: ${this.projectData.name} (${this.projectData.slug})`);
      console.log('🔗 Check your Taiga project to see the populated tasks.');
      
    } catch (error) {
      console.error('❌ Failed to populate Taiga project:', error.message);
      throw error;
    }
  }
}

// Execute the script
const populator = new AppointmentManagerTaigaPopulator();
populator.run().catch(console.error);