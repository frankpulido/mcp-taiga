import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  // Create a transport that connects to our MCP server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/index.js'],
  });

  // Create a client
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
    // Connect to the server
    await client.connect(transport);
    console.log('Connected to Taiga MCP server');

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);

    // Test authentication with actual credentials
    console.log('\nTesting authentication...');
    const authResult = await client.callTool({
      name: 'authenticate',
      arguments: {
        username: 'your_username', // Replace with actual username
        password: 'your_password'  // Replace with actual password
      },
    });
    console.log('Authentication result:', authResult);

    // Test listing projects
    console.log('\nTesting listProjects...');
    const projectsResult = await client.callTool({
      name: 'listProjects',
      arguments: {},
    });
    console.log('Projects result:', projectsResult);

    // No need to disconnect, the process will end naturally
    console.log('\nTest completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
