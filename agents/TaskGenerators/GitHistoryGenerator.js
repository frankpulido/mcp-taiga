import { BaseGenerator } from './BaseGenerator.js';

/**
 * Generates tasks from git history analysis
 */
export class GitHistoryGenerator extends BaseGenerator {
  constructor(gitAnalyzer, config) {
    super(gitAnalyzer, config);
    this.gitData = null;
  }

  /**
   * Generate tasks from git analysis
   */
  async generateTasks() {
    // Analyze git repository
    this.gitData = await this.source.analyze();
    
    const epics = this.createPhaseEpics();
    const userStories = this.createFeatureStories();
    const tasks = this.createSignificantCommitTasks();

    return {
      epics,
      userStories,
      tasks
    };
  }

  /**
   * Create epics from git phases
   */
  createPhaseEpics() {
    const epics = [];

    Object.entries(this.gitData.phases).forEach(([phase, commits]) => {
      if (commits.length < 2) return; // Skip phases with too few commits

      const description = this.formatDescription(
        `Development phase containing ${commits.length} commits.\\n\\n` +
        `This phase represents completed work in the ${phase.toLowerCase()} area of the project.`,
        {
          source: 'Git History Analysis',
          commits: commits.slice(0, 8) // Show first 8 commits
        }
      );

      epics.push({
        title: `Epic: ${phase}`,
        description,
        status: 'completed', // Git history represents completed work
        tags: this.generateTags(phase, 'epic-git-phase'),
        commits
      });
    });

    return epics;
  }

  /**
   * Create user stories from feature branches
   */
  createFeatureStories() {
    const stories = [];
    const featureBranches = this.source.getFeatureBranches();

    featureBranches.forEach(branch => {
      const featureName = branch.name
        .replace(/^(feature\/|feat\/|develop)/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      const description = this.formatDescription(
        `Feature branch representing completed functionality.\\n\\n` +
        `This feature was developed on branch \`${branch.name}\` and completed on ${branch.date}.`,
        {
          source: 'Git Branch Analysis',
          date: branch.date
        }
      );

      stories.push({
        title: `Feature: ${featureName}`,
        description,
        status: 'completed',
        tags: this.generateTags(featureName, 'feature-branch')
      });
    });

    return stories;
  }

  /**
   * Create tasks from significant commits
   */
  createSignificantCommitTasks() {
    const tasks = [];
    const significantCommits = this.getSignificantCommits();

    // Group significant commits by date (daily summaries)
    const commitsByDate = this.groupCommitsByDate(significantCommits);

    Object.entries(commitsByDate).forEach(([date, commits]) => {
      if (commits.length === 1) {
        // Single significant commit - create individual task
        const commit = commits[0];
        
        const description = this.formatDescription(
          `Significant development work completed on ${date}.\\n\\n` +
          `**Commit Message:** ${commit.message}`,
          {
            source: 'Git Commit Analysis',
            date: commit.date,
            author: commit.author,
            commits: [commit]
          }
        );

        tasks.push({
          title: this.sanitizeCommitMessage(commit.message),
          description,
          status: 'completed',
          tags: this.generateTags(commit.message, 'git-commit')
        });
        
      } else if (commits.length > 1) {
        // Multiple commits on same date - create summary task
        const description = this.formatDescription(
          `Multiple development tasks completed on ${date}.\\n\\n` +
          `Total commits: ${commits.length}`,
          {
            source: 'Git Daily Summary',
            date: date,
            commits: commits.slice(0, 5) // Show first 5 commits
          }
        );

        const mainTopics = this.extractMainTopics(commits);
        const title = `Daily Development: ${mainTopics.join(', ')}`;

        tasks.push({
          title: title.length > 80 ? title.substring(0, 77) + '...' : title,
          description,
          status: 'completed',
          tags: this.generateTags(mainTopics.join(' '), 'daily-summary')
        });
      }
    });

    return tasks.slice(0, 20); // Limit to avoid overwhelming
  }

  /**
   * Get commits that represent significant work
   */
  getSignificantCommits() {
    return this.gitData.commits.filter(commit => {
      const message = commit.message.toLowerCase();
      
      // Filter out minor commits
      const skipPatterns = [
        /^(fix|fixed) typo/,
        /^update/,
        /^minor/,
        /^small/,
        /^cleanup/,
        /^style/,
        /^comment/,
        /^remove comment/,
        /^formatting/,
        /^lint/,
        /test file/,
        /debug/,
        /wip/
      ];

      if (skipPatterns.some(pattern => pattern.test(message))) {
        return false;
      }

      // Include commits with significant keywords
      const significantPatterns = [
        /^(add|added|implement|create|build)/,
        /^(fix|fixed|resolve|solve)/,
        /^(feature|feat)/,
        /^(refactor|restructure)/,
        /^(improve|enhance|optimize)/,
        /complete/,
        /finish/
      ];

      return significantPatterns.some(pattern => pattern.test(message)) ||
             commit.message.length > 30; // Longer messages tend to be more significant
    });
  }

  /**
   * Group commits by date
   */
  groupCommitsByDate(commits) {
    const grouped = {};
    
    commits.forEach(commit => {
      const date = commit.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(commit);
    });

    return grouped;
  }

  /**
   * Extract main topics from multiple commits
   */
  extractMainTopics(commits) {
    const topics = new Set();
    
    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      
      // Extract key terms
      if (message.includes('auth')) topics.add('Authentication');
      if (message.includes('api')) topics.add('API');
      if (message.includes('database') || message.includes('model')) topics.add('Database');
      if (message.includes('ui') || message.includes('frontend')) topics.add('Frontend');
      if (message.includes('test')) topics.add('Testing');
      if (message.includes('deploy') || message.includes('build')) topics.add('Deployment');
      if (message.includes('fix') || message.includes('bug')) topics.add('Bug Fixes');
      if (message.includes('feature') || message.includes('implement')) topics.add('Features');
    });

    return Array.from(topics).slice(0, 3); // Max 3 topics
  }

  /**
   * Clean up commit message for use as task title
   */
  sanitizeCommitMessage(message) {
    // Capitalize first letter
    let cleaned = message.charAt(0).toUpperCase() + message.slice(1);
    
    // Remove common prefixes
    cleaned = cleaned.replace(/^(feat|feature|fix|add|implement|create):\s*/i, '');
    
    // Truncate if too long
    if (cleaned.length > 80) {
      cleaned = cleaned.substring(0, 77) + '...';
    }
    
    return cleaned;
  }
}