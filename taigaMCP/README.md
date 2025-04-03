# Taiga MCP Server

An MCP (Model Context Protocol) server that allows you to interact with Taiga using natural language. This server enables you to list your projects and create user stories within your chosen project.

## Features

- List all your Taiga projects
- Get detailed information about a specific project
- Create user stories within a project
- List user stories in a project

## Prerequisites

- Node.js (v14 or higher)
- npm
- A Taiga account

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd taigaMCP
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure your Taiga credentials:
   
   Edit the `.env` file and add your Taiga credentials:
   ```
   TAIGA_API_URL=https://api.taiga.io/api/v1
   TAIGA_USERNAME=your_username
   TAIGA_PASSWORD=your_password
   ```

## Usage

Start the MCP server:

```
npm start
```

The server will start and listen for MCP requests via standard input/output.

### Connecting to the MCP Server

You can connect to the MCP server using any MCP client, such as the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) or by using the MCP client SDK.

### Available Tools

The server provides the following tools:

1. `authenticate` - Authenticate with Taiga
2. `listProjects` - List all your Taiga projects
3. `getProject` - Get detailed information about a specific project
4. `createUserStory` - Create a new user story in a project
5. `listUserStories` - List all user stories in a project

### Example Prompts

Here are some example natural language prompts you can use with an LLM that supports MCP:

- "List all my Taiga projects"
- "Show me details about project X"
- "Create a new user story in project Y with title 'Implement login feature'"
- "Show me all user stories in project Z"

## License

ISC
