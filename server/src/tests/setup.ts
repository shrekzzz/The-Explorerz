import { beforeAll, afterAll } from 'vitest';
import prisma from '../config/database.js';

beforeAll(async () => {
  // Ensure test database is clean
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  // Cleanup and disconnect
  console.log('🧹 Cleaning up test environment...');
  await prisma.$disconnect();
});
