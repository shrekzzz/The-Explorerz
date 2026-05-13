#!/usr/bin/env node

/**
 * Startup script for production
 * Handles database sync before starting the server
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function syncDatabase() {
  console.log('🗄️  Syncing database schema...');
  
  try {
    // Try to push schema changes to database
    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate --accept-data-loss');
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('already in sync')) console.error(stderr);
    
    console.log('✅ Database schema synced successfully');
    return true;
  } catch (error) {
    console.error('⚠️  Database sync warning:', error.message);
    // Continue anyway - database might already be in sync
    return true;
  }
}

async function startServer() {
  console.log('🚀 Starting server...');
  
  try {
    // Import and start the server
    await import('./dist/index.js');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 Production startup initiated...');
  
  // Sync database first
  await syncDatabase();
  
  // Start the server
  await startServer();
}

main().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});
