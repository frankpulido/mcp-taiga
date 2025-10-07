/**
 * Base class for all task generators
 * Provides common functionality and interface
 */
export class BaseGenerator {
  constructor(source, config) {
    this.source = source;
    this.config = config;
    this.generatedTasks = {
      epics: [],
      userStories: [],
      tasks: []
    };
  }

  /**
   * Generate tasks from the source (abstract method)
   * Should be implemented by subclasses
   */
  async generateTasks() {
    throw new Error('generateTasks() must be implemented by subclasses');
  }

  /**
   * Execute the generation and create tasks in Taiga
   */
  async execute(taigaService, project) {
    const tasks = await this.generateTasks();
    
    // Get status mappings
    const statuses = this.config.statuses;
    const doneStatusId = statuses.find(s => s.name.toLowerCase().includes('done') || s.is_closed)?.id;
    const newStatusId = statuses.find(s => s.name.toLowerCase().includes('new') || s.order === 0)?.id;
    
    // Create epics (as user stories)
    for (const epic of tasks.epics || []) {
      try {
        const statusId = epic.status === 'completed' ? doneStatusId : newStatusId;
        
        await taigaService.createUserStory({
          project: project.id,
          subject: epic.title,
          description: epic.description,
          status: statusId,
          tags: epic.tags || []
        });
        
        console.log(`✅ Created epic: ${epic.title}`);
        await this.delay(500);
        
      } catch (error) {
        console.error(`Failed to create epic ${epic.title}:`, error.message);
      }
    }
    
    // Create user stories
    for (const story of tasks.userStories || []) {
      try {
        const statusId = story.status === 'completed' ? doneStatusId : newStatusId;
        
        await taigaService.createUserStory({
          project: project.id,
          subject: story.title,
          description: story.description,
          status: statusId,
          tags: story.tags || []
        });
        
        console.log(`✅ Created user story: ${story.title}`);
        await this.delay(400);
        
      } catch (error) {
        console.error(`Failed to create user story ${story.title}:`, error.message);
      }
    }
    
    // Note: Individual tasks would need user story IDs, which we'd need to track
    // For now, we'll create them as user stories too
    for (const task of tasks.tasks || []) {
      try {
        const statusId = task.status === 'completed' ? doneStatusId : newStatusId;
        
        await taigaService.createUserStory({
          project: project.id,
          subject: task.title,
          description: task.description,
          status: statusId,
          tags: task.tags || []
        });
        
        console.log(`✅ Created task: ${task.title}`);
        await this.delay(300);
        
      } catch (error) {
        console.error(`Failed to create task ${task.title}:`, error.message);
      }
    }
  }

  /**
   * Helper methods
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate tags based on content
   */
  generateTags(content, type = 'general') {
    const tags = [type];
    
    // Add framework-specific tags
    if (this.config.projectInfo?.framework) {
      tags.push(this.config.projectInfo.framework.toLowerCase());
    }
    
    // Add priority tags based on keywords
    const highPriorityKeywords = ['critical', 'urgent', 'security', 'bug', 'fix'];
    const mediumPriorityKeywords = ['feature', 'enhancement', 'improvement'];
    
    const contentLower = content.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => contentLower.includes(keyword))) {
      tags.push('high-priority');
    } else if (mediumPriorityKeywords.some(keyword => contentLower.includes(keyword))) {
      tags.push('medium-priority');
    } else {
      tags.push('low-priority');
    }
    
    return tags;
  }

  /**
   * Format description with metadata
   */
  formatDescription(baseDescription, metadata = {}) {
    let description = baseDescription;
    
    if (metadata.source) {
      description += `\n\n**Source:** ${metadata.source}`;
    }
    
    if (metadata.date) {
      description += `\n**Date:** ${metadata.date}`;
    }
    
    if (metadata.author) {
      description += `\n**Author:** ${metadata.author}`;
    }
    
    if (metadata.commits && metadata.commits.length > 0) {
      description += '\n\n**Related Commits:**\n';
      metadata.commits.forEach(commit => {
        description += `- \`${commit.hash}\` (${commit.date}): ${commit.message}\n`;
      });
    }
    
    if (metadata.files && metadata.files.length > 0) {
      description += '\n\n**Related Files:**\n';
      metadata.files.forEach(file => {
        description += `- ${file}\n`;
      });
    }
    
    return description;
  }

  /**
   * Determine task status based on heuristics
   */
  determineStatus(item) {
    // If it comes from git history, it's likely completed
    if (item.source === 'git' || item.commits?.length > 0) {
      return 'completed';
    }
    
    // If it contains future-oriented language
    const futureKeywords = ['todo', 'plan', 'should', 'will', 'need to', 'implement'];
    if (futureKeywords.some(keyword => 
      item.title?.toLowerCase().includes(keyword) || 
      item.description?.toLowerCase().includes(keyword)
    )) {
      return 'new';
    }
    
    // Default to new for ambiguous cases
    return 'new';
  }
}