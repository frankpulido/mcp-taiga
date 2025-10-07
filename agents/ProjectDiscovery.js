import fs from 'fs';
import path from 'path';

/**
 * Analyzes project structure to determine type, framework, and available sources
 */
export class ProjectDiscovery {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.info = {
      type: 'unknown',
      framework: null,
      hasGit: false,
      hasRoadmap: false,
      roadmapFiles: [],
      packageFiles: [],
      configFiles: []
    };
  }

  /**
   * Analyze project structure and detect project type
   */
  async analyze() {
    try {
      const files = fs.readdirSync(this.projectPath);
      
      // Check for version control
      this.info.hasGit = files.includes('.git');
      
      // Detect project type and framework
      this.detectProjectType(files);
      
      // Find documentation files
      this.findDocumentationFiles(files);
      
      // Find package files
      this.findPackageFiles(files);
      
      return this.info;
    } catch (error) {
      console.error('Failed to analyze project:', error.message);
      return this.info;
    }
  }

  /**
   * Detect project type based on files present
   */
  detectProjectType(files) {
    const detectors = [
      {
        type: 'laravel',
        framework: 'Laravel',
        indicators: ['artisan', 'composer.json', 'app/Http', 'routes/web.php']
      },
      {
        type: 'react',
        framework: 'React',
        indicators: ['package.json', 'src/App.js', 'public/index.html']
      },
      {
        type: 'vue',
        framework: 'Vue.js',
        indicators: ['package.json', 'vue.config.js', 'src/main.js']
      },
      {
        type: 'node',
        framework: 'Node.js',
        indicators: ['package.json', 'server.js', 'app.js', 'index.js']
      },
      {
        type: 'python',
        framework: 'Python',
        indicators: ['requirements.txt', 'setup.py', 'main.py', 'app.py']
      },
      {
        type: 'docker',
        framework: 'Docker',
        indicators: ['Dockerfile', 'docker-compose.yml']
      }
    ];

    for (const detector of detectors) {
      const matches = detector.indicators.filter(indicator => {
        if (indicator.includes('/')) {
          return fs.existsSync(path.join(this.projectPath, indicator));
        }
        return files.includes(indicator);
      });

      if (matches.length >= 2) {
        this.info.type = detector.type;
        this.info.framework = detector.framework;
        break;
      }
    }

    // Fallback detection
    if (this.info.type === 'unknown') {
      if (files.includes('package.json')) {
        this.info.type = 'javascript';
        this.info.framework = 'JavaScript';
      } else if (files.includes('composer.json')) {
        this.info.type = 'php';
        this.info.framework = 'PHP';
      }
    }
  }

  /**
   * Find documentation and roadmap files
   */
  findDocumentationFiles(files) {
    const documentationPatterns = [
      /readme\.md/i,
      /roadmap\.md/i,
      /project[_-]?roadmap\.md/i,
      /changelog\.md/i,
      /todo\.md/i,
      /features\.md/i,
      /architecture\.md/i,
      /design\.md/i
    ];

    const documentationFiles = files.filter(file => 
      documentationPatterns.some(pattern => pattern.test(file))
    );

    // Check for roadmap-specific files
    const roadmapFiles = documentationFiles.filter(file =>
      /roadmap|todo|features/i.test(file)
    );

    if (roadmapFiles.length > 0) {
      this.info.hasRoadmap = true;
      this.info.roadmapFiles = roadmapFiles.map(file => 
        path.join(this.projectPath, file)
      );
    }

    // Store all documentation
    this.info.documentationFiles = documentationFiles;
  }

  /**
   * Find package and config files
   */
  findPackageFiles(files) {
    const packagePatterns = [
      'package.json',
      'composer.json',
      'requirements.txt',
      'Pipfile',
      'Cargo.toml',
      'go.mod'
    ];

    const configPatterns = [
      'webpack.config.js',
      'vite.config.js',
      'next.config.js',
      'nuxt.config.js',
      'vue.config.js',
      'angular.json',
      '.env',
      '.env.example'
    ];

    this.info.packageFiles = files.filter(file => 
      packagePatterns.includes(file)
    );

    this.info.configFiles = files.filter(file => 
      configPatterns.includes(file)
    );
  }

  /**
   * Get project-specific task suggestions
   */
  getProjectSpecificTasks() {
    const tasks = [];

    switch (this.info.type) {
      case 'laravel':
        tasks.push(
          'Review and implement missing Policies',
          'Add comprehensive test coverage',
          'Optimize database queries (N+1 prevention)',
          'Add API documentation',
          'Implement queue monitoring',
          'Add security audit tasks'
        );
        break;
        
      case 'react':
        tasks.push(
          'Add component unit tests',
          'Implement accessibility improvements',
          'Optimize bundle size',
          'Add error boundaries',
          'Implement performance monitoring'
        );
        break;
        
      case 'node':
        tasks.push(
          'Add API endpoint tests',
          'Implement error handling middleware',
          'Add request validation',
          'Optimize database connections',
          'Add security headers'
        );
        break;
    }

    return tasks;
  }
}