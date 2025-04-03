import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { TaigaService } from './taigaService.js';
import { authenticate } from './taigaAuth.js';

// Load environment variables
dotenv.config();

// Create a new MCP server
const server = new McpServer({
  name: 'Taiga MCP',
  version: '1.0.0',
});

// Create Taiga service instance
const taigaService = new TaigaService();

// Add resources for documentation and context
server.resource(
  'taiga-api-docs',
  'docs://taiga/api',
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: `Taiga API Documentation

This MCP server allows you to interact with Taiga using natural language.
You can perform the following actions:

1. List your projects
2. Create user stories within a project
3. List user stories in a project
4. Create tasks within a user story
5. List tasks in a user story
6. Authenticate with Taiga

The server connects to the Taiga API at ${process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1'}.

The server authenticates with Taiga using these credentials at ${process.env.TAIGA_USERNAME} and ${process.env.TAIGA_PASSWORD}, use this credentials when user authenticate with taiga-mcp.

        `,
      },
    ],
  })
);

// Add resource for projects
server.resource(
  'projects',
  'taiga://projects',
  async (uri) => {
    try {
      const projects = await taigaService.listProjects();
      return {
        contents: [
          {
            uri: uri.href,
            text: `Your Taiga Projects:

${projects.map(p => `- ${p.name} (ID: ${p.id}, Slug: ${p.slug})`).join('\n')}
            `,
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error fetching projects: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Add tool for authenticating with Taiga
server.tool(
  'authenticate',
  {
    username: z.string().optional(),
    password: z.string().optional(),
  },
  async ({ username, password }) => {
    try {
      // Use provided credentials or fall back to environment variables
      const user = username || process.env.TAIGA_USERNAME;
      const pass = password || process.env.TAIGA_PASSWORD;

      if (!user || !pass) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Username and password are required. Please provide them or set them in the environment variables.',
            },
          ],
        };
      }

      await authenticate(user, pass);
      const currentUser = await taigaService.getCurrentUser();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully authenticated as ${currentUser.full_name} (${currentUser.username}).`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Authentication failed: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Add tool for listing projects
server.tool(
  'listProjects',
  {},
  async () => {
    try {
      const projects = await taigaService.listProjects();

      return {
        content: [
          {
            type: 'text',
            text: `Your Taiga Projects:\n\n${projects.map(p => `- ${p.name} (ID: ${p.id}, Slug: ${p.slug})`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list projects: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Add tool for getting project details
server.tool(
  'getProject',
  {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  async ({ projectIdentifier }) => {
    try {
      let project;

      // Try to get project by ID first
      if (!isNaN(projectIdentifier)) {
        try {
          project = await taigaService.getProject(projectIdentifier);
        } catch (error) {
          // If that fails, try by slug
          project = await taigaService.getProjectBySlug(projectIdentifier);
        }
      } else {
        // If it's not a number, try by slug
        project = await taigaService.getProjectBySlug(projectIdentifier);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Project Details:

Name: ${project.name}
ID: ${project.id}
Slug: ${project.slug}
Description: ${project.description || 'No description'}
Created: ${new Date(project.created_date).toLocaleString()}
Total Members: ${project.total_memberships}
            `,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get project details: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Add tool for creating a user story
server.tool(
  'createUserStory',
  {
    projectIdentifier: z.string().describe('Project ID or slug'),
    subject: z.string().describe('User story title/subject'),
    description: z.string().optional().describe('User story description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
  },
  async ({ projectIdentifier, subject, description, status, tags }) => {
    try {
      // Get project ID if a slug was provided
      let projectId = projectIdentifier;
      if (isNaN(projectIdentifier)) {
        const project = await taigaService.getProjectBySlug(projectIdentifier);
        projectId = project.id;
      }

      // Get status ID if a status name was provided
      let statusId = undefined;
      if (status) {
        const statuses = await taigaService.getUserStoryStatuses(projectId);
        const matchingStatus = statuses.find(s =>
          s.name.toLowerCase() === status.toLowerCase()
        );

        if (matchingStatus) {
          statusId = matchingStatus.id;
        }
      }

      // Create the user story
      const userStoryData = {
        project: projectId,
        subject,
        description,
        status: statusId,
        tags,
      };

      const createdStory = await taigaService.createUserStory(userStoryData);

      return {
        content: [
          {
            type: 'text',
            text: `User story created successfully!

Subject: ${createdStory.subject}
Reference: #${createdStory.ref}
Status: ${createdStory.status_extra_info?.name || 'Default status'}
Project: ${createdStory.project_extra_info?.name}
            `,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create user story: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Add tool for listing user stories in a project
server.tool(
  'listUserStories',
  {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  async ({ projectIdentifier }) => {
    try {
      // Get project ID if a slug was provided
      let projectId = projectIdentifier;
      if (isNaN(projectIdentifier)) {
        const project = await taigaService.getProjectBySlug(projectIdentifier);
        projectId = project.id;
      }

      const userStories = await taigaService.listUserStories(projectId);

      if (userStories.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No user stories found in this project.',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `User Stories in Project:

${userStories.map(us => `- #${us.ref}: ${us.subject} (Status: ${us.status_extra_info?.name || 'Unknown'})`).join('\n')}
            `,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list user stories: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Add tool for creating a task
server.tool(
  'createTask',
  {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStoryIdentifier: z.string().describe('User story ID or reference number'),
    subject: z.string().describe('Task title/subject'),
    description: z.string().optional().describe('Task description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
  },
  async ({ projectIdentifier, userStoryIdentifier, subject, description, status, tags }) => {
    try {
      // Get project ID if a slug was provided
      let projectId = projectIdentifier;
      if (isNaN(projectIdentifier)) {
        const project = await taigaService.getProjectBySlug(projectIdentifier);
        projectId = project.id;
      }

      // Get user story ID if a reference number was provided
      let userStoryId = userStoryIdentifier;
      if (userStoryIdentifier.startsWith('#')) {
        // Remove the # prefix
        const refNumber = userStoryIdentifier.substring(1);
        // Get all user stories for the project
        const userStories = await taigaService.listUserStories(projectId);
        // Find the user story with the matching reference number
        const userStory = userStories.find(us => us.ref.toString() === refNumber);
        if (userStory) {
          userStoryId = userStory.id;
        } else {
          throw new Error(`User story with reference ${userStoryIdentifier} not found`);
        }
      }

      // Get status ID if a status name was provided
      let statusId = undefined;
      if (status) {
        const statuses = await taigaService.getTaskStatuses(projectId);
        const matchingStatus = statuses.find(s =>
          s.name.toLowerCase() === status.toLowerCase()
        );

        if (matchingStatus) {
          statusId = matchingStatus.id;
        }
      }

      // Create the task
      const taskData = {
        project: projectId,
        user_story: userStoryId,
        subject,
        description,
        status: statusId,
        tags,
      };

      const createdTask = await taigaService.createTask(taskData);

      return {
        content: [
          {
            type: 'text',
            text: `Task created successfully!

Subject: ${createdTask.subject}
Reference: #${createdTask.ref}
Status: ${createdTask.status_extra_info?.name || 'Default status'}
Project: ${createdTask.project_extra_info?.name}
User Story: #${createdTask.user_story_extra_info?.ref} - ${createdTask.user_story_extra_info?.subject}
            `,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create task: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.log('Taiga MCP server started');
