#!/usr/bin/env node

/**
 * Populate Observers-Hexagonal NOTIFIER Taiga project
 * Based on git history and README_dev.md architecture
 */

import { TaigaService } from './src/taigaService.js';
import { GitHistoryGenerator } from './agents/TaskGenerators/GitHistoryGenerator.js';
import { RoadmapGenerator } from './agents/TaskGenerators/RoadmapGenerator.js';
import path from 'path';

class ObserversHexPopulator {
  constructor() {
    this.taigaService = new TaigaService();
    this.projectData = null;
    this.statuses = null;
  }

  async initialize() {
    console.log('🚀 Initializing Observers-Hexagonal Taiga Population...\n');
    
    const projects = await this.taigaService.listProjects();
    this.projectData = projects.find(p => 
      p.slug.includes('notifier') || 
      p.name.toLowerCase().includes('observer')
    );
    
    if (!this.projectData) {
      throw new Error('Observers-Hexagonal project not found');
    }
    
    console.log(`📋 Selected project: ${this.projectData.name}`);
    console.log(`   Slug: ${this.projectData.slug}`);
    console.log(`   ID: ${this.projectData.id}\n`);
    
    this.statuses = await this.taigaService.getUserStoryStatuses(this.projectData.id);
    console.log('📊 Available statuses:', this.statuses.map(s => s.name).join(', '));
    console.log();
  }

  async generateFromGitHistory() {
    console.log('📚 Analyzing git history from observers-hexagonal...\n');
    
    const projectPath = '/Users/frankpulidoalvarez/Documents/developer/observers-hexagonal';
    const config = {
      taigaProject: this.projectData,
      statuses: this.statuses
    };
    
    const gitGenerator = new GitHistoryGenerator(projectPath, config);
    const gitTasks = await gitGenerator.generateTasks();
    
    console.log('📊 Generated from Git History:');
    console.log(`   Epics: ${gitTasks.epics.length}`);
    console.log(`   User Stories: ${gitTasks.userStories.length}`);
    console.log(`   Tasks: ${gitTasks.tasks.length}\n`);
    
    return gitTasks;
  }

  async generateFromRoadmap() {
    console.log('📄 Analyzing README_dev.md architecture document...\n');
    
    const roadmapPath = '/Users/frankpulidoalvarez/Documents/developer/observers-hexagonal/README_dev.md';
    const config = {
      taigaProject: this.projectData,
      statuses: this.statuses
    };
    
    const roadmapGenerator = new RoadmapGenerator(roadmapPath, config);
    const roadmapTasks = await roadmapGenerator.generateTasks();
    
    console.log('📊 Generated from README_dev.md:');
    console.log(`   Epics: ${roadmapTasks.epics.length}`);
    console.log(`   User Stories: ${roadmapTasks.userStories.length}`);
    console.log(`   Tasks: ${roadmapTasks.tasks.length}\n`);
    
    return roadmapTasks;
  }

  async createCustomArchitectureTasks() {
    console.log('🏗️  Creating custom architecture tasks...\n');
    
    const newStatusId = this.statuses.find(s => s.name.toLowerCase().includes('new'))?.id;
    const customTasks = [];
    
    const architectureTasks = [
      {
        subject: 'Phase 1: Hexagonal Architecture Foundation',
        description: `## Phase 1: Establish Hexagonal Architecture

### Goals:
- Create \`src/ObserversHex/\` directory structure
- Set up Domain, Application, and Infrastructure layers
- Update composer.json autoload for \`ObserversHex\\\\\` namespace

### Directory Structure:
\`\`\`
src/ObserversHex/
├── Domain/          (pure business logic)
├── Application/     (use cases)
└── Infrastructure/  (adapters)
\`\`\`

### Key Principles:
- Zero Laravel dependencies in Domain layer
- Framework-agnostic use cases in Application layer
- Existing Laravel models become Infrastructure adapters`,
        tags: ['architecture', 'phase-1', 'hexagonal', 'foundation']
      },
      {
        subject: 'Phase 2: Domain Model Implementation',
        description: `## Phase 2: Core Domain Entities

### Aggregates to Create:
- **User** (authentication + service channels)
- **Publisher** (business entity + publisher lists)
- **Subscriber** (profile + subscriptions)
- **Notification** (content + delivery tracking)

### Value Objects:
- **ServiceChannel** (service, username, preferences, isActive)
- **NotificationContent** (title, message, type, formatting)
- **SubscriptionPreferences** (frequency, channels, content filters)

### Domain Services:
- **NotificationDispatcher**: Channel routing logic
- **SubscriptionManager**: Public/private list access
- **ChannelVerifier**: Username validation across services`,
        tags: ['domain', 'phase-2', 'ddd', 'entities']
      },
      {
        subject: 'Phase 3: Alexa Channel Implementation',
        description: `## Phase 3: Alexa as First Delivery Channel

### Why Alexa First:
- Forces true hexagonal thinking
- Voice commands map perfectly to use cases
- Clear success criteria

### Use Cases to Implement:
\`\`\`php
"Alexa, get my notifications" → GetUserNotificationsUseCase
"Alexa, what's new from TechCorp?" → GetPublisherListNotificationsUseCase
"Alexa, subscribe to Tech News" → SubscribeToPublisherListUseCase
\`\`\`

### Username-Based Integration:
- Users provide their Alexa email (Amazon account)
- No OAuth complexity
- Direct integration through username`,
        tags: ['alexa', 'phase-3', 'voice', 'integration']
      },
      {
        subject: 'Phase 4: Multi-Channel Architecture',
        description: `## Phase 4: Add Multiple Notification Channels

### Channels to Implement:
- **Slack**: \`@john.doe\` or email
- **Discord**: \`JohnDoe#1234\`
- **WhatsApp**: \`+1234567890\`
- **SMS**: Phone number
- **Email**: Direct email

### Channel Adapter Interface:
\`\`\`php
interface NotificationChannelPort {
    public function send(string $username, NotificationDTO $notification): bool;
}
\`\`\`

### Implementation:
Each channel is completely isolated, uses username-based integration`,
        tags: ['channels', 'phase-4', 'multi-channel', 'adapters']
      },
      {
        subject: 'Publisher List Topical Content System',
        description: `## Publisher List Feature: Content Categories

### Core Insight:
Publishers don't just blast everyone - they create **topical content categories**

### Key Features:
- \`PublisherList\` with \`is_private\` flag
- Users subscribe to specific topics, not publishers directly
- Public vs Private list access control
- \`Subscription\` links to \`PublisherList\`, not \`Publisher\`

### Business Logic:
- Publishers can create multiple lists (e.g., "Tech News", "Product Updates")
- Subscribers choose which topics they want
- Private lists require approval/invitation`,
        tags: ['publisher-list', 'subscription', 'business-logic', 'core-feature']
      },
      {
        subject: 'Setup Testing Strategy (Domain, Application, Infrastructure)',
        description: `## Testing Strategy for Hexagonal Architecture

### Domain Layer Tests (Fast, Pure):
\`\`\`php
// No Laravel, database, or external dependencies
class PublisherTest extends PHPUnit\\Framework\\TestCase {
    public function test_publisher_can_create_private_list() {
        $publisher = new Publisher($publisherId, 'TechCorp');
        $list = $publisher->createList('VIP News', true);
        $this->assertTrue($list->isPrivate());
    }
}
\`\`\`

### Application Layer Tests (Use Cases):
Test business logic without infrastructure concerns using mocked repositories

### Infrastructure Layer Tests (Integration):
Test Laravel integration, database, external APIs`,
        tags: ['testing', 'tdd', 'quality', 'architecture']
      },
      {
        subject: 'Migrate Existing Laravel Models to Infrastructure Adapters',
        description: `## Existing Models as Infrastructure Layer

### Current Laravel Structure:
\`\`\`
app/Models/
├── User.php (roles: admin, publisher, subscriber)
├── Publisher.php (CIF, max_private_subscribers_plan)
├── PublisherList.php (is_private flag)
├── Subscriber.php (demographics, occupation)
├── Subscription.php (subscriber ↔ publisher_list)
└── Notification.php (multi-type notifications)
\`\`\`

### Migration Strategy:
1. Keep existing models in \`app/Models/\`
2. Create pure domain entities in \`src/ObserversHex/Domain/\`
3. Models become adapters that translate between Laravel and Domain
4. Implement Repository pattern to bridge the gap`,
        tags: ['migration', 'laravel', 'adapters', 'refactoring']
      }
    ];

    for (const task of architectureTasks) {
      try {
        const userStory = await this.taigaService.createUserStory({
          project: this.projectData.id,
          subject: task.subject,
          description: task.description,
          status: newStatusId,
          tags: task.tags
        });
        
        customTasks.push(userStory);
        console.log(`✅ Created: ${task.subject}`);
        await this.delay(400);
        
      } catch (error) {
        console.error(`❌ Failed to create: ${task.subject}`);
        console.error(`   Error: ${error.message}`);
      }
    }
    
    console.log();
    return customTasks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      await this.initialize();
      
      console.log('═'.repeat(60));
      console.log('🎯 Starting Taiga Population for Observers-Hexagonal');
      console.log('═'.repeat(60));
      console.log();
      
      // Generate from git history
      const gitTasks = await this.generateFromGitHistory();
      
      // Generate from roadmap
      let roadmapTasks = { epics: [], userStories: [], tasks: [] };
      try {
        roadmapTasks = await this.generateFromRoadmap();
      } catch (error) {
        console.log('⚠️  Roadmap parsing had issues, continuing with git history only\n');
      }
      
      // Create custom architecture tasks
      const customTasks = await this.createCustomArchitectureTasks();
      
      console.log('═'.repeat(60));
      console.log('📊 Population Summary:');
      console.log('═'.repeat(60));
      console.log(`Git History Epics:     ${gitTasks.epics.length}`);
      console.log(`Git History Stories:   ${gitTasks.userStories.length}`);
      console.log(`Git History Tasks:     ${gitTasks.tasks.length}`);
      console.log(`Roadmap Epics:         ${roadmapTasks.epics?.length || 0}`);
      console.log(`Roadmap Stories:       ${roadmapTasks.userStories?.length || 0}`);
      console.log(`Architecture Tasks:    ${customTasks.length}`);
      console.log('═'.repeat(60));
      console.log();
      
      // Execute population
      console.log('🚀 Populating Taiga with generated tasks...\n');
      
      if (gitTasks.epics.length > 0) {
        await new GitHistoryGenerator('/Users/frankpulidoalvarez/Documents/developer/observers-hexagonal', {
          taigaProject: this.projectData,
          statuses: this.statuses
        }).execute(this.taigaService, this.projectData);
      }
      
      console.log('\n✅ Population Complete!\n');
      console.log(`🔗 View your project: https://tree.taiga.io/project/${this.projectData.slug}/\n`);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run the populator
const populator = new ObserversHexPopulator();
populator.run();
