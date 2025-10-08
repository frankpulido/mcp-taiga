import { BaseGenerator } from './BaseGenerator.js';
import fs from 'fs';

/**
 * Generates tasks from roadmap/planning documents
 * Supports: PROJECT_ROADMAP.md, ROADMAP.md, TODO.md, FEATURES.md
 */
export class RoadmapGenerator extends BaseGenerator {
  constructor(roadmapPath, config) {
    super(roadmapPath, config);
    this.roadmapContent = null;
    this.roadmapPath = roadmapPath;
  }

  /**
   * Generate tasks from roadmap analysis
   */
  async generateTasks() {
    // Read roadmap file
    this.roadmapContent = fs.readFileSync(this.roadmapPath, 'utf-8');
    
    const epics = this.extractPhases();
    const userStories = this.extractFeatures();
    const tasks = this.extractTodoItems();

    return {
      epics,
      userStories,
      tasks
    };
  }

  /**
   * Extract phases/epics from roadmap
   */
  extractPhases() {
    const epics = [];
    const phasePattern = /###?\s+[\*\s]*[✅🚧📋⚡🎨🎯🔄🌐]?\s*(Phase \d+[^:\n]*):?\s*([^\n]+)/gi;
    
    let match;
    while ((match = phasePattern.exec(this.roadmapContent)) !== null) {
      const fullTitle = match[1].trim();
      const subtitle = match[2] ? match[2].trim() : '';
      const phaseNumber = fullTitle.match(/Phase (\d+)/i)?.[1];
      
      // Find the content for this phase
      const startIndex = match.index;
      const nextPhaseMatch = this.roadmapContent.slice(startIndex + match[0].length).search(/###?\s+[\*\s]*[✅🚧📋]?\s*Phase \d+/i);
      const endIndex = nextPhaseMatch === -1 ? this.roadmapContent.length : startIndex + match[0].length + nextPhaseMatch;
      
      const phaseContent = this.roadmapContent.slice(startIndex, endIndex);
      
      // Extract goals and features
      const goalMatch = phaseContent.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
      const timelineMatch = phaseContent.match(/\*\*Timeline:\*\*\s*([^\n]+)/i);
      
      // Determine status from emoji
      let status = 'new';
      if (match[0].includes('✅')) {
        status = 'completed';
      } else if (match[0].includes('🚧')) {
        status = 'in-progress';
      }
      
      // Extract bullet points as sub-tasks
      const bullets = this.extractBulletPoints(phaseContent);
      
      const description = this.formatDescription(
        `${subtitle}\n\n${goalMatch ? '**Goal:** ' + goalMatch[1] : ''}\n\n` +
        `${timelineMatch ? '**Timeline:** ' + timelineMatch[1] : ''}\n\n` +
        `**Key Features:**\n${bullets.slice(0, 8).map(b => `- ${b}`).join('\n')}`,
        {
          source: 'Roadmap Analysis',
          files: [this.roadmapPath]
        }
      );

      const sanitizedTitle = this.sanitizeTitle(`${fullTitle}${subtitle ? ': ' + subtitle : ''}`);
      if (sanitizedTitle) {
        epics.push({
          title: sanitizedTitle,
          description,
          status,
          tags: this.generateTags(fullTitle + ' ' + subtitle, `phase-${phaseNumber}`)
        });
      }
    }

    return epics;
  }

  /**
   * Extract features as user stories
   */
  extractFeatures() {
    const features = [];
    
    // Pattern for feature subsections (#### level)
    const featurePattern = /####\s+[\*\s]*[✨🔧📊🎨⚡]?\s*([^:\n]+):?\s*([^\n]*)/g;
    
    let match;
    while ((match = featurePattern.exec(this.roadmapContent)) !== null) {
      const title = match[1].trim();
      const subtitle = match[2] ? match[2].trim() : '';
      
      // Skip if this is a phase, section header, or generic heading
      const skipPatterns = [
        'phase',
        'next steps',
        'what we built',
        'features implemented',
        'key features',
        'current state',
        'success criteria',
        'technical details',
        'for solo',
        'for multi',
        'real-world',
        'the breakthrough',
        'results achieved',
        'key insights',
        'the vision',
        'architectural revolution',
        'meta-achievement',
        'universal questions',
        'agent core',
        'intelligence features',
        'task generation',
        'documentation',
        'integration',
        'benefits',
        'impact',
        'lessons learned',
        'foundation',
        'success',
        'architecture'
      ];
      
      const titleLower = title.toLowerCase();
      if (skipPatterns.some(pattern => titleLower.includes(pattern))) {
        continue;
      }
      
      // Skip if title is too short (likely a fragment)
      if (title.length < 10) {
        continue;
      }
      
      // Only include if it looks like actual work (contains action words or technical terms)
      const workIndicators = [
        'implement', 'create', 'build', 'add', 'develop', 'design',
        'refactor', 'fix', 'update', 'improve', 'enhance', 'optimize',
        'integrate', 'deploy', 'test', 'configure', 'setup', 'install',
        'generator', 'analyzer', 'parser', 'handler', 'manager', 'service',
        'api', 'database', 'interface', 'component', 'module', 'system',
        'authentication', 'authorization', 'validation', 'migration'
      ];
      
      const hasWorkIndicator = workIndicators.some(word => 
        titleLower.includes(word) || subtitle.toLowerCase().includes(word)
      );
      
      if (!hasWorkIndicator) {
        continue;
      }
      
      // Find content for this feature
      const startIndex = match.index;
      const nextFeatureMatch = this.roadmapContent.slice(startIndex + match[0].length).search(/####\s+/);
      const endIndex = nextFeatureMatch === -1 ? 
        Math.min(startIndex + match[0].length + 500, this.roadmapContent.length) : 
        startIndex + match[0].length + nextFeatureMatch;
      
      const featureContent = this.roadmapContent.slice(startIndex, endIndex);
      
      // Extract implementation details
      const bullets = this.extractBulletPoints(featureContent);
      const codeBlocks = this.extractCodeBlocks(featureContent);
      
      // Determine status
      let status = 'new';
      if (match[0].includes('✅')) {
        status = 'completed';
      }
      
      const description = this.formatDescription(
        `${subtitle}\n\n` +
        `**Implementation:**\n${bullets.slice(0, 5).map(b => `- ${b}`).join('\n')}\n\n` +
        `${codeBlocks.length > 0 ? '**Technical Details:**\n```\n' + codeBlocks[0].slice(0, 300) + '\n```' : ''}`,
        {
          source: 'Roadmap Feature Definition',
          files: [this.roadmapPath]
        }
      );

      const sanitizedTitle = this.sanitizeTitle(title + (subtitle ? ': ' + subtitle : ''));
      if (sanitizedTitle) {
        features.push({
          title: sanitizedTitle,
          description,
          status,
          tags: this.generateTags(title, 'feature')
        });
      }
    }

    return features.slice(0, 15); // Limit to avoid overwhelming
  }

  /**
   * Extract TODO items and action items
   */
  extractTodoItems() {
    const tasks = [];
    
    // Pattern for TODO items, action items, or checkboxes
    const todoPatterns = [
      /[-*]\s+\[[ x]\]\s+(.+)/gi,  // Checkbox items
      /[-*]\s+(?:TODO|FIXME|TODO:|ACTION:|NEXT:)\s+(.+)/gi,  // Explicit todos
      /\d+\.\s+\*\*(.+?)\*\*:\s+(.+)/g  // Numbered items with bold title
    ];

    todoPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.roadmapContent)) !== null) {
        const title = match[1].trim();
        const description = match[2] ? match[2].trim() : '';
        
        // Skip if too short or looks like a header
        if (title.length < 10 || title.includes('##')) {
          continue;
        }
        
        // Skip status descriptions (not actual tasks)
        const statusDescriptions = [
          'solid', 'success', 'ready', 'complete', 'working',
          'architecture', 'experience', 'preservation', 'creation',
          'management', 'tracking', 'visibility'
        ];
        
        const titleLower = title.toLowerCase();
        const isStatusDescription = statusDescriptions.every(word => !titleLower.includes(word)) === false;
        
        if (isStatusDescription && !title.match(/implement|create|add|fix|refactor|test/i)) {
          continue;
        }
        
        // Determine if completed
        const status = match[0].includes('[x]') || match[0].includes('[X]') ? 'completed' : 'new';
        
        const sanitizedTitle = this.sanitizeTitle(title);
        if (sanitizedTitle) {
          tasks.push({
            title: sanitizedTitle,
            description: this.formatDescription(
              description || title,
              { source: 'Roadmap Action Items' }
            ),
            status,
            tags: this.generateTags(title, 'action-item')
          });
        }
      }
    });

    return tasks.slice(0, 20); // Limit to most important
  }

  /**
   * Extract bullet points from text
   */
  extractBulletPoints(text) {
    const bullets = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        const content = trimmed.slice(1).trim();
        if (content && !content.startsWith('[') && content.length > 5) {
          // Remove markdown formatting
          const cleaned = content
            .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold
            .replace(/\*(.+?)\*/g, '$1')      // Remove italic
            .replace(/`(.+?)`/g, '$1');       // Remove code marks
          
          bullets.push(cleaned);
        }
      }
    }
    
    return bullets;
  }

  /**
   * Extract code blocks from text
   */
  extractCodeBlocks(text) {
    const codeBlocks = [];
    const codeBlockPattern = /```[\s\S]*?\n([\s\S]*?)```/g;
    
    let match;
    while ((match = codeBlockPattern.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    return codeBlocks;
  }

  /**
   * Sanitize title for Taiga
   * Removes emojis, markdown formatting, and enforces length limits
   */
  sanitizeTitle(title) {
    // Remove ALL emoji and special Unicode characters that might cause API issues
    // Using a much more comprehensive approach
    let cleaned = title
      // First pass: Remove common emoji ranges
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // Misc Symbols and Pictographs
      .replace(/[\u{1FA00}-\u{1FAFF}]/gu, '')  // Extended Symbols
      .replace(/[\u{2600}-\u{27BF}]/gu, '')    // Misc symbols (includes 🔄)
      .replace(/[\u{1F000}-\u{1F64F}]/gu, '')  // Emoticons
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // Transport
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // Supplemental Symbols
      // Second pass: Remove specific problem characters
      .replace(/[🆕🔄✅🚧📋⚡🎨🎯🔗🌐⚙️🛠️]/g, '')  // Common roadmap emojis
      // Remove variation selectors (emoji modifiers)
      .replace(/[\uFE00-\uFE0F]/g, '')
      .replace(/[\u200D]/g, '')  // Zero-width joiner
      // Remove checkbox markers
      .replace(/\[[ xX]\]/gi, '')
      // Remove ALL asterisks (bold/italic markdown)
      .replace(/\*+/g, '')
      // Remove code markers
      .replace(/`+/g, '')
      // Remove underscores used for emphasis
      .replace(/_+/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Remove leading/trailing special characters
      .replace(/^[:;,\-\s]+|[:;,\-\s]+$/g, '')
      .trim();
    
    // If title ends with just ': ' or is too short after cleaning, it's probably junk
    if (cleaned.endsWith(':') || cleaned.length < 3) {
      return null; // Signal that this should be skipped
    }
    
    // Enforce Taiga's 100 character limit
    return cleaned.slice(0, 100);
  }


  /**
   * Detect completion status from various indicators
   */
  detectStatus(text) {
    const completedIndicators = ['✅', '[x]', '[X]', 'DONE', 'COMPLETE', 'COMPLETED'];
    const inProgressIndicators = ['🚧', 'WIP', 'IN PROGRESS', 'STARTED'];
    
    const upperText = text.toUpperCase();
    
    if (completedIndicators.some(ind => text.includes(ind) || upperText.includes(ind))) {
      return 'completed';
    }
    
    if (inProgressIndicators.some(ind => text.includes(ind) || upperText.includes(ind))) {
      return 'in-progress';
    }
    
    return 'new';
  }
}
