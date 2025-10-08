#!/usr/bin/env node

/**
 * Bulk Assignment Script for Unassigned Tasks
 * 
 * This script:
 * 1. Connects to a Taiga project
 * 2. Finds all unassigned user stories/tasks
 * 3. If project has only 1 member, assigns all to that member
 * 4. Provides detailed output of changes
 */

import readline from 'readline';
import { TaigaService } from '../src/taigaService.js';

class BulkAssignmentFixer {
  constructor() {
    this.taigaService = new TaigaService();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    try {
      console.log('🔧 Bulk Task Assignment Tool\n');
      console.log('This tool will assign all unassigned tasks to the sole team member\n');

      // Test connection to Taiga
      console.log('🔗 Connecting to Taiga...');
      try {
        await this.taigaService.getCurrentUser();
        console.log('✅ Connected successfully\n');
      } catch (error) {
        throw new Error('Failed to connect to Taiga. Check your .env credentials.');
      }

      // Get project list
      const projects = await this.taigaService.listProjects();
      
      console.log('📋 Available projects:');
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (${project.slug})`);
      });

      const projectIndex = await this.ask('\nSelect project number:');
      const selectedProject = projects[parseInt(projectIndex) - 1];

      if (!selectedProject) {
        throw new Error('Invalid project selection');
      }

      console.log(`\n✅ Selected: ${selectedProject.name}`);

      // Get project members
      console.log('\n👥 Fetching project members...');
      const members = await this.taigaService.getProjectMembers(selectedProject.id);
      
      console.log(`📊 Team size: ${members.length} member(s)`);
      members.forEach(member => {
        console.log(`   - ${member.full_name || member.username} (${member.email})`);
      });

      if (members.length === 0) {
        throw new Error('No team members found in project');
      }

      if (members.length > 1) {
        console.log('\n⚠️  This project has multiple members.');
        const proceed = await this.askBoolean('Assign ALL unassigned tasks to first member?');
        if (!proceed) {
          console.log('❌ Operation cancelled');
          this.rl.close();
          return;
        }
      }

      const targetMember = members[0];
      console.log(`\n🎯 Target assignee: ${targetMember.full_name || targetMember.username}`);

      // Get all user stories
      console.log('\n📊 Fetching user stories...');
      const userStories = await this.taigaService.listUserStories(selectedProject.id);
      
      const unassigned = userStories.filter(story => !story.assigned_to);
      const assigned = userStories.filter(story => story.assigned_to);

      console.log(`   Total user stories: ${userStories.length}`);
      console.log(`   Already assigned: ${assigned.length}`);
      console.log(`   Unassigned: ${unassigned.length}`);

      if (unassigned.length === 0) {
        console.log('\n✅ All tasks are already assigned! Nothing to do.');
        this.rl.close();
        return;
      }

      console.log('\n📝 Unassigned tasks:');
      unassigned.forEach((story, index) => {
        console.log(`   ${index + 1}. ${story.subject}`);
      });

      const confirm = await this.askBoolean(`\n✅ Assign ${unassigned.length} tasks to ${targetMember.full_name || targetMember.username}?`);
      
      if (!confirm) {
        console.log('❌ Operation cancelled');
        this.rl.close();
        return;
      }

      // Update tasks
      console.log('\n🚀 Updating tasks...\n');
      let successCount = 0;
      let failCount = 0;

      for (const story of unassigned) {
        try {
          await this.updateUserStory(story.id, { assigned_to: targetMember.id });
          console.log(`✅ Assigned: ${story.subject}`);
          successCount++;
          await this.delay(300); // Rate limiting
        } catch (error) {
          console.error(`❌ Failed to assign: ${story.subject}`);
          console.error(`   Error: ${error.message}`);
          failCount++;
        }
      }

      console.log('\n' + '='.repeat(50));
      console.log('📊 Summary:');
      console.log(`   ✅ Successfully assigned: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   📈 New assignment rate: ${Math.round((assigned.length + successCount) / userStories.length * 100)}%`);
      console.log('='.repeat(50));

      console.log(`\n🔗 View project: https://tree.taiga.io/project/${selectedProject.slug}/`);
      console.log('\n🎉 Bulk assignment complete!');

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Update a user story
   */
  async updateUserStory(storyId, updates) {
    const { createAuthenticatedClient } = await import('../src/taigaAuth.js');
    const client = await createAuthenticatedClient();
    
    // First get the current story to get its version
    const getResponse = await client.get(`/userstories/${storyId}`);
    const currentStory = getResponse.data;
    
    // Now update with version number included
    const updateData = {
      ...updates,
      version: currentStory.version
    };
    
    const response = await client.patch(`/userstories/${storyId}`, updateData);
    return response.data;
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

// Run the script
const fixer = new BulkAssignmentFixer();
fixer.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
