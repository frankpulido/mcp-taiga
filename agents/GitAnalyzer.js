import { execSync } from 'child_process';
import path from 'path';

/**
 * Analyzes git repository history and structure
 */
export class GitAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.commits = [];
    this.branches = [];
    this.phases = {};
  }

  /**
   * Analyze the git repository
   */
  async analyze() {
    try {
      this.getCommitHistory();
      this.getBranches();
      this.organizeIntoPhases();
      
      return {
        commits: this.commits,
        branches: this.branches,
        phases: this.phases
      };
    } catch (error) {
      console.error('Git analysis failed:', error.message);
      return {
        commits: [],
        branches: [],
        phases: {}
      };
    }
  }

  /**
   * Get commit history with metadata
   */
  getCommitHistory() {
    try {
      const gitLog = execSync(
        'git --no-pager log --pretty=format:"%h|%ad|%s|%an" --date=short --all',
        { encoding: 'utf8', cwd: this.projectPath }
      );
      
      this.commits = gitLog.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, date, message, author] = line.split('|');
          return { 
            hash: hash?.trim(), 
            date: date?.trim(), 
            message: message?.trim(), 
            author: author?.trim() 
          };
        })
        .filter(commit => commit.hash && commit.message);
        
    } catch (error) {
      console.error('Failed to get git history:', error.message);
      this.commits = [];
    }
  }

  /**
   * Get all branches
   */
  getBranches() {
    try {
      const branchOutput = execSync(
        'git branch -a --format="%(refname:short)|%(committerdate:short)"',
        { encoding: 'utf8', cwd: this.projectPath }
      );
      
      this.branches = branchOutput.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, date] = line.split('|');
          return { 
            name: name?.trim().replace('origin/', ''), 
            date: date?.trim() 
          };
        })
        .filter(branch => branch.name && !branch.name.startsWith('HEAD'));
        
    } catch (error) {
      console.error('Failed to get branches:', error.message);
      this.branches = [];
    }
  }

  /**
   * Organize commits into logical phases based on content and patterns
   */
  organizeIntoPhases() {
    // Initialize phase categories
    this.phases = {
      'Authentication & Authorization': [],
      'Core Features': [],
      'Database & Models': [],
      'API Development': [],
      'Frontend Integration': [],
      'Testing & Quality': [],
      'Performance & Optimization': [],
      'Deployment & Infrastructure': [],
      'Bug Fixes & Maintenance': [],
      'Documentation': [],
      'Other': []
    };

    // Phase detection patterns
    const phasePatterns = {
      'Authentication & Authorization': [
        /auth/i, /login/i, /token/i, /sanctum/i, /jwt/i, /permission/i, /role/i, /policy/i
      ],
      'Core Features': [
        /feature/i, /implement/i, /add.*feature/i, /new.*functionality/i
      ],
      'Database & Models': [
        /model/i, /migration/i, /schema/i, /database/i, /eloquent/i, /seed/i, /factory/i
      ],
      'API Development': [
        /api/i, /endpoint/i, /route/i, /controller/i, /request/i, /response/i, /rest/i
      ],
      'Frontend Integration': [
        /frontend/i, /ui/i, /component/i, /view/i, /template/i, /css/i, /js/i, /react/i, /vue/i
      ],
      'Testing & Quality': [
        /test/i, /spec/i, /coverage/i, /quality/i, /lint/i, /format/i, /phpunit/i, /jest/i
      ],
      'Performance & Optimization': [
        /performance/i, /optimize/i, /cache/i, /queue/i, /speed/i, /memory/i, /n\+1/i
      ],
      'Deployment & Infrastructure': [
        /deploy/i, /docker/i, /ci\/cd/i, /build/i, /production/i, /staging/i, /env/i, /config/i
      ],
      'Bug Fixes & Maintenance': [
        /fix/i, /bug/i, /hotfix/i, /patch/i, /repair/i, /resolve/i, /issue/i
      ],
      'Documentation': [
        /doc/i, /readme/i, /comment/i, /documentation/i, /guide/i, /wiki/i
      ]
    };

    // Categorize commits
    this.commits.forEach(commit => {
      let categorized = false;
      
      for (const [phase, patterns] of Object.entries(phasePatterns)) {
        if (patterns.some(pattern => pattern.test(commit.message))) {
          this.phases[phase].push(commit);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        this.phases['Other'].push(commit);
      }
    });

    // Remove empty phases
    Object.keys(this.phases).forEach(phase => {
      if (this.phases[phase].length === 0) {
        delete this.phases[phase];
      }
    });
  }

  /**
   * Get feature branches (branches that likely represent completed features)
   */
  getFeatureBranches() {
    return this.branches.filter(branch => 
      branch.name.includes('feature/') || 
      branch.name.includes('feat/') ||
      branch.name.includes('develop')
    );
  }

  /**
   * Get commits by date range
   */
  getCommitsByDateRange(startDate, endDate) {
    return this.commits.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= new Date(startDate) && commitDate <= new Date(endDate);
    });
  }

  /**
   * Get commit statistics
   */
  getStatistics() {
    return {
      totalCommits: this.commits.length,
      totalBranches: this.branches.length,
      phases: Object.keys(this.phases).length,
      dateRange: this.commits.length > 0 ? {
        earliest: this.commits[this.commits.length - 1]?.date,
        latest: this.commits[0]?.date
      } : null,
      topContributors: this.getTopContributors(),
      phaseDistribution: Object.fromEntries(
        Object.entries(this.phases).map(([phase, commits]) => [phase, commits.length])
      )
    };
  }

  /**
   * Get top contributors by commit count
   */
  getTopContributors() {
    const contributors = {};
    
    this.commits.forEach(commit => {
      if (commit.author) {
        contributors[commit.author] = (contributors[commit.author] || 0) + 1;
      }
    });
    
    return Object.entries(contributors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, commits: count }));
  }

  /**
   * Suggest epic structure based on git analysis
   */
  suggestEpicStructure() {
    const epics = [];
    
    // Create epics from phases with significant commit count
    Object.entries(this.phases).forEach(([phase, commits]) => {
      if (commits.length >= 3) { // Only create epics for substantial phases
        epics.push({
          title: phase,
          description: `Phase containing ${commits.length} commits`,
          commits: commits.slice(0, 10), // Limit to first 10 commits
          status: 'completed', // Assuming git history represents completed work
          tags: [phase.toLowerCase().replace(/\s+/g, '-'), 'git-history']
        });
      }
    });
    
    // Create epics from feature branches
    const featureBranches = this.getFeatureBranches();
    featureBranches.forEach(branch => {
      epics.push({
        title: `Feature: ${branch.name.replace('feature/', '').replace(/[-_]/g, ' ')}`,
        description: `Feature branch completed on ${branch.date}`,
        commits: [],
        status: 'completed',
        tags: ['feature-branch', 'git-history']
      });
    });
    
    return epics;
  }
}