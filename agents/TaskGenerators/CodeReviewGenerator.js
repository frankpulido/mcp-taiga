import { BaseGenerator } from './BaseGenerator.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Generates tasks from code review and technical debt analysis
 * Detects missing tests, documentation, security issues, and code quality problems
 */
export class CodeReviewGenerator extends BaseGenerator {
  constructor(projectPath, config) {
    super(projectPath, config);
    this.projectPath = path.resolve(projectPath); // Always use absolute path
    this.validateProjectPath();
    this.codeMetrics = {
      totalFiles: 0,
      linesOfCode: 0,
      filesWithoutTests: [],
      filesWithoutDocs: [],
      securityIssues: [],
      complexityIssues: [],
      dependencyIssues: []
    };
  }

  /**
   * Validate that the project path exists and is a valid project directory
   */
  validateProjectPath() {
    if (!fs.existsSync(this.projectPath)) {
      throw new Error(`Project path does not exist: ${this.projectPath}`);
    }
    
    const stat = fs.statSync(this.projectPath);
    if (!stat.isDirectory()) {
      throw new Error(`Project path is not a directory: ${this.projectPath}`);
    }
    
    console.log(`📂 Code Review Generator initialized for: ${this.projectPath}`);
  }

  /**
   * Generate tasks from code review analysis
   */
  async generateTasks() {
    console.log('🔍 Analyzing codebase for code review tasks...');
    
    // Analyze the codebase
    await this.analyzeCodebase();
    
    const userStories = [];
    const tasks = [];

    // Generate test coverage tasks
    if (this.codeMetrics.filesWithoutTests.length > 0) {
      const testTasks = this.generateTestTasks();
      userStories.push(...testTasks.userStories);
      tasks.push(...testTasks.tasks);
    }

    // Generate documentation tasks
    if (this.codeMetrics.filesWithoutDocs.length > 0) {
      const docTasks = this.generateDocumentationTasks();
      userStories.push(...docTasks.userStories);
      tasks.push(...docTasks.tasks);
    }

    // Generate security improvement tasks
    if (this.codeMetrics.securityIssues.length > 0) {
      const securityTasks = this.generateSecurityTasks();
      userStories.push(...securityTasks.userStories);
      tasks.push(...securityTasks.tasks);
    }

    // Generate code quality tasks
    const qualityTasks = this.generateQualityTasks();
    userStories.push(...qualityTasks.userStories);
    tasks.push(...qualityTasks.tasks);

    // Framework-specific tasks
    const frameworkTasks = this.generateFrameworkSpecificTasks();
    userStories.push(...frameworkTasks.userStories);
    tasks.push(...frameworkTasks.tasks);

    return {
      epics: [],
      userStories: userStories.slice(0, 15), // Limit to prevent overwhelming
      tasks: tasks.slice(0, 20)
    };
  }

  /**
   * Analyze the codebase structure and metrics
   */
  async analyzeCodebase() {
    const extensions = this.getRelevantExtensions();
    
    // Find all source files
    const sourceFiles = this.findSourceFiles(this.projectPath, extensions);
    this.codeMetrics.totalFiles = sourceFiles.length;

    // Analyze each file
    for (const file of sourceFiles) {
      this.analyzeFile(file);
    }

    // Check for missing test directories
    this.checkTestCoverage();

    // Check for security patterns
    this.checkSecurityPatterns();

    // Check dependencies
    this.checkDependencies();
  }

  /**
   * Get relevant file extensions based on project type
   */
  getRelevantExtensions() {
    const framework = this.config.projectInfo?.framework?.toLowerCase() || '';
    
    const extensionMap = {
      'laravel': ['.php', '.blade.php'],
      'react': ['.js', '.jsx', '.ts', '.tsx'],
      'vue': ['.js', '.vue', '.ts'],
      'node': ['.js', '.ts', '.mjs'],
      'python': ['.py'],
      'django': ['.py', '.html'],
      'default': ['.js', '.ts', '.jsx', '.tsx', '.php', '.py', '.java', '.go', '.rb']
    };

    return extensionMap[framework] || extensionMap.default;
  }

  /**
   * Find all source files recursively within project boundaries
   */
  findSourceFiles(dir, extensions, files = []) {
    if (!fs.existsSync(dir)) return files;

    // Ensure we don't scan outside project boundaries
    if (!this.isWithinProjectBoundaries(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip common directories
      if (entry.isDirectory()) {
        if (!this.shouldSkipDirectory(entry.name)) {
          this.findSourceFiles(fullPath, extensions, files);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirname) {
    const skipDirs = [
      'node_modules', 'vendor', 'dist', 'build', '.git', 
      '.idea', '.vscode', 'coverage', '.next', 'out',
      '__pycache__', 'venv', 'env', '.pytest_cache'
    ];
    
    // Skip backup directories
    const backupPatterns = [
      /^\*backup/,     // *backup 1, *backup 2, etc.
      /backup$/,       // anything ending with 'backup'
      /^backup/,       // anything starting with 'backup'
      /\.backup/,      // .backup directories
      /backup-\d+/     // backup-1, backup-2, etc.
    ];
    
    const isBackupDir = backupPatterns.some(pattern => pattern.test(dirname));
    
    return skipDirs.includes(dirname) || dirname.startsWith('.') || isBackupDir;
  }

  /**
   * Check if path is within project boundaries
   */
  isWithinProjectBoundaries(dirPath) {
    const normalizedProjectPath = path.resolve(this.projectPath);
    const normalizedDirPath = path.resolve(dirPath);
    
    // Ensure the directory is within or is the project directory
    return normalizedDirPath.startsWith(normalizedProjectPath);
  }

  /**
   * Analyze individual file
   */
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      this.codeMetrics.linesOfCode += lines.length;

      // Check for missing tests
      if (!this.hasCorrespondingTest(filePath) && !filePath.includes('test')) {
        this.codeMetrics.filesWithoutTests.push(filePath);
      }

      // Check for missing documentation
      if (!this.hasAdequateDocumentation(content, filePath)) {
        this.codeMetrics.filesWithoutDocs.push(filePath);
      }

      // Check for complexity issues
      if (this.hasComplexityIssues(content)) {
        this.codeMetrics.complexityIssues.push(filePath);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  /**
   * Check if file has corresponding test
   */
  hasCorrespondingTest(filePath) {
    const testPatterns = [
      filePath.replace(/\.(js|ts|jsx|tsx|php|py)$/, '.test.$1'),
      filePath.replace(/\.(js|ts|jsx|tsx|php|py)$/, '.spec.$1'),
      filePath.replace('/src/', '/tests/'),
      filePath.replace('/app/', '/tests/')
    ];

    return testPatterns.some(pattern => fs.existsSync(pattern));
  }

  /**
   * Check if file has adequate documentation
   */
  hasAdequateDocumentation(content, filePath) {
    const ext = path.extname(filePath);
    
    // Different comment patterns for different languages
    const docPatterns = {
      '.js': /\/\*\*[\s\S]*?\*\//,
      '.ts': /\/\*\*[\s\S]*?\*\//,
      '.jsx': /\/\*\*[\s\S]*?\*\//,
      '.tsx': /\/\*\*[\s\S]*?\*\//,
      '.php': /\/\*\*[\s\S]*?\*\//,
      '.py': /\"\"\"[\s\S]*?\"\"\"|'''[\s\S]*?'''/
    };

    const pattern = docPatterns[ext];
    if (!pattern) return true; // Unknown type, assume it's fine

    // Check if file has at least one documentation block
    return pattern.test(content);
  }

  /**
   * Check for complexity issues
   */
  hasComplexityIssues(content) {
    const lines = content.split('\n');
    
    // Check for very long functions (>50 lines)
    let functionLength = 0;
    let inFunction = false;
    
    for (const line of lines) {
      if (line.match(/function\s+\w+|=>\s*{|^\s*\w+\s*\(/)) {
        inFunction = true;
        functionLength = 0;
      }
      
      if (inFunction) {
        functionLength++;
        if (functionLength > 50) {
          return true;
        }
      }
      
      if (line.includes('}') && inFunction) {
        inFunction = false;
      }
    }

    return false;
  }

  /**
   * Check test coverage
   */
  checkTestCoverage() {
    const testDirs = ['tests', 'test', '__tests__', 'spec'];
    const hasTestDir = testDirs.some(dir => 
      fs.existsSync(path.join(this.projectPath, dir))
    );

    if (!hasTestDir) {
      this.codeMetrics.filesWithoutTests.push('NO_TEST_DIRECTORY');
    }
  }

  /**
   * Check for common security patterns
   */
  checkSecurityPatterns() {
    const securityChecks = [
      {
        name: 'Hardcoded Credentials',
        pattern: /(password|api_key|secret)\s*=\s*['"]/i,
        severity: 'high'
      },
      {
        name: 'SQL Injection Risk',
        pattern: /\$_(GET|POST|REQUEST)\[.*?\].*?(SELECT|INSERT|UPDATE|DELETE)/i,
        severity: 'critical'
      },
      {
        name: 'Eval Usage',
        pattern: /\beval\s*\(/,
        severity: 'high'
      }
    ];

    const sourceFiles = this.findSourceFiles(
      this.projectPath, 
      this.getRelevantExtensions()
    ).slice(0, 100); // Limit for performance

    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        
        for (const check of securityChecks) {
          if (check.pattern.test(content)) {
            this.codeMetrics.securityIssues.push({
              file,
              issue: check.name,
              severity: check.severity
            });
          }
        }
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  /**
   * Check dependencies for issues
   */
  checkDependencies() {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const composerJsonPath = path.join(this.projectPath, 'composer.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        // Check for outdated structure
        if (!packageJson.scripts || Object.keys(packageJson.scripts).length < 3) {
          this.codeMetrics.dependencyIssues.push('Missing npm scripts');
        }
      } catch (error) {
        // Invalid package.json
      }
    }

    if (fs.existsSync(composerJsonPath)) {
      try {
        const composerJson = JSON.parse(fs.readFileSync(composerJsonPath, 'utf-8'));
        
        // Check for missing autoload
        if (!composerJson.autoload) {
          this.codeMetrics.dependencyIssues.push('Missing composer autoload');
        }
      } catch (error) {
        // Invalid composer.json
      }
    }
  }

  /**
   * Generate test coverage tasks
   */
  generateTestTasks() {
    const userStories = [];
    const tasks = [];

    if (this.codeMetrics.filesWithoutTests.includes('NO_TEST_DIRECTORY')) {
      userStories.push({
        title: 'As a developer, I would like to have a comprehensive testing infrastructure so that I can ensure code quality and prevent regressions',
        description: this.formatDescription(
          `**User Story:** As a developer, I would like to have a comprehensive testing infrastructure so that I can ensure code quality and prevent regressions.\n\n` +
          `**Current State:** No test directory found\n\n` +
          `**Acceptance Criteria:**\n` +
          `- Set up testing framework (Jest, PHPUnit, pytest, etc.)\n` +
          `- Create test directory structure\n` +
          `- Add test scripts to package.json/composer.json\n` +
          `- Configure CI/CD for automated testing\n\n` +
          `**Priority:** High - Testing is essential for code quality`,
          { source: 'Code Review Analysis', files: ['Project Root'] }
        ),
        status: 'new',
        tags: this.generateTags('testing infrastructure', 'high-priority')
      });
    }

    // Generate tasks for files without tests (sample of 10)
    const sampleFiles = this.codeMetrics.filesWithoutTests
      .filter(f => f !== 'NO_TEST_DIRECTORY')
      .slice(0, 10);

    for (const file of sampleFiles) {
      const fileName = path.basename(file);
      tasks.push({
        title: `Add tests for ${fileName}`,
        description: this.formatDescription(
          `Create unit tests for ${fileName}\n\n` +
          `**File:** ${file}\n` +
          `**Test Coverage:** 0%\n` +
          `**Suggested Tests:**\n` +
          `- Happy path scenarios\n` +
          `- Edge cases\n` +
          `- Error handling`,
          { source: 'Code Review Analysis', files: [file] }
        ),
        status: 'new',
        tags: this.generateTags('testing', 'medium-priority')
      });
    }

    return { userStories, tasks };
  }

  /**
   * Generate documentation tasks
   */
  generateDocumentationTasks() {
    const userStories = [];
    const tasks = [];

    if (this.codeMetrics.filesWithoutDocs.length > 10) {
      userStories.push({
        title: 'As a developer, I would like comprehensive code documentation so that new team members can understand the codebase quickly',
        description: this.formatDescription(
          `**User Story:** As a developer, I would like comprehensive code documentation so that new team members can understand the codebase quickly.\n\n` +
          `**Current State:** ${this.codeMetrics.filesWithoutDocs.length} files lack proper documentation\n\n` +
          `**Acceptance Criteria:**\n` +
          `- Add JSDoc/PHPDoc/docstrings to all public functions\n` +
          `- Document complex algorithms and business logic\n` +
          `- Add inline comments for non-obvious code\n` +
          `- Generate API documentation`,
          { source: 'Code Review Analysis', files: ['Multiple files - see individual tasks'] }
        ),
        status: 'new',
        tags: this.generateTags('documentation', 'medium-priority')
      });
    }

    // Sample files for individual tasks
    const sampleFiles = this.codeMetrics.filesWithoutDocs.slice(0, 5);
    
    for (const file of sampleFiles) {
      tasks.push({
        title: `Document ${path.basename(file)}`,
        description: this.formatDescription(
          `Add documentation to ${path.basename(file)}`,
          { source: 'Code Review Analysis', files: [file] }
        ),
        status: 'new',
        tags: this.generateTags('documentation', 'low-priority')
      });
    }

    return { userStories, tasks };
  }

  /**
   * Generate security improvement tasks
   */
  generateSecurityTasks() {
    const userStories = [];
    const tasks = [];

    const criticalIssues = this.codeMetrics.securityIssues.filter(i => i.severity === 'critical');
    const highIssues = this.codeMetrics.securityIssues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      userStories.push({
        title: 'As a security-conscious developer, I would like all critical security vulnerabilities fixed so that the application is protected from attacks',
        description: this.formatDescription(
          `**User Story:** As a security-conscious developer, I would like all critical security vulnerabilities fixed so that the application is protected from attacks.\n\n` +
          `**Critical Issues Found:** ${criticalIssues.length}\n\n` +
          `**Issues:**\n${criticalIssues.map(i => `- ${i.issue} in ${path.basename(i.file)}`).join('\n')}`,
          { source: 'Security Analysis', files: criticalIssues.map(i => i.file) }
        ),
        status: 'new',
        tags: ['security', 'critical', 'bug']
      });
    }

    for (const issue of highIssues.slice(0, 5)) {
      tasks.push({
        title: `Security: Fix ${issue.issue}`,
        description: this.formatDescription(
          `Fix ${issue.issue} in ${path.basename(issue.file)}`,
          { source: 'Security Analysis', files: [issue.file] }
        ),
        status: 'new',
        tags: ['security', 'high-priority']
      });
    }

    return { userStories, tasks };
  }

  /**
   * Generate code quality tasks
   */
  generateQualityTasks() {
    const userStories = [];
    const tasks = [];

    if (this.codeMetrics.complexityIssues.length > 0) {
      userStories.push({
        title: 'As a maintainer, I would like complex functions refactored into smaller, more manageable pieces so that the code is easier to understand and maintain',
        description: this.formatDescription(
          `**User Story:** As a maintainer, I would like complex functions refactored into smaller, more manageable pieces so that the code is easier to understand and maintain.\n\n` +
          `**Files with complexity issues:** ${this.codeMetrics.complexityIssues.length}\n\n` +
          `**Acceptance Criteria:**\n` +
          `- Break down large functions into smaller ones\n` +
          `- Extract reusable logic\n` +
          `- Improve code readability\n` +
          `- Follow Single Responsibility Principle`,
          { source: 'Code Quality Analysis', files: this.codeMetrics.complexityIssues }
        ),
        status: 'new',
        tags: this.generateTags('refactoring', 'medium-priority')
      });
    }

    return { userStories, tasks };
  }

  /**
   * Generate framework-specific tasks
   */
  generateFrameworkSpecificTasks() {
    const userStories = [];
    const tasks = [];
    
    const framework = this.config.projectInfo?.framework?.toLowerCase() || '';

    if (framework === 'laravel') {
      tasks.push({
        title: 'Implement Laravel Policies',
        description: this.formatDescription(
          'Add authorization policies for models using Laravel Policy classes',
          { source: 'Framework Best Practices' }
        ),
        status: 'new',
        tags: ['laravel', 'security', 'medium-priority']
      });

      tasks.push({
        title: 'Add Form Request Validation',
        description: this.formatDescription(
          'Extract validation logic into Form Request classes',
          { source: 'Framework Best Practices' }
        ),
        status: 'new',
        tags: ['laravel', 'validation', 'low-priority']
      });
    } else if (framework.includes('react')) {
      tasks.push({
        title: 'Add PropTypes/TypeScript Validation',
        description: this.formatDescription(
          'Add prop validation to all React components',
          { source: 'Framework Best Practices' }
        ),
        status: 'new',
        tags: ['react', 'validation', 'medium-priority']
      });
    }

    return { userStories, tasks };
  }
}
