import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/index.js'],
  });

  const client = new Client(
    {
      name: 'Taiga MCP Test Client',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  try {
    await client.connect(transport);
    console.log('Connected to Taiga MCP server');

    // Autenticar primero
    console.log('\nAuthenticating...');
    const authResult = await client.callTool({
      name: 'authenticate',
      arguments: {
        username: process.env.TAIGA_USERNAME || 'adriapedralbes',
        password: process.env.TAIGA_PASSWORD || 'boruto321'
      },
    });
    console.log('Authentication result:');
    if (authResult && authResult.content) {
      authResult.content.forEach(item => {
        if (item.type === 'text') {
          console.log(item.text);
        }
      });
    }

    // Listar proyectos
    console.log('\nListing projects...');
    const projectsResult = await client.callTool({
      name: 'listProjects',
      arguments: {},
    });
    console.log('Projects result:');
    if (projectsResult && projectsResult.content) {
      projectsResult.content.forEach(item => {
        if (item.type === 'text') {
          console.log(item.text);
        }
      });
    }

    console.log('\nTest completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
