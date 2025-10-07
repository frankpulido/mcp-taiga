#!/usr/bin/env node

/**
 * Universal Taiga Project Agent Launcher
 * 
 * Simple launcher script that starts the interactive agent
 */

import { TaigaProjectAgent } from './agents/TaigaProjectAgent.js';

console.log('🚀 Starting Universal Taiga Project Agent...\n');

const agent = new TaigaProjectAgent();
agent.run().catch(error => {
  console.error('\n❌ Agent failed:', error.message);
  process.exit(1);
});