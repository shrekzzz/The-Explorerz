#!/usr/bin/env tsx
/**
 * Status Check Script
 * Verifies system configuration and readiness
 */

import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, passMsg: string, failMsg: string, isWarning = false) {
  if (condition) {
    results.push({ name, status: 'pass', message: passMsg });
  } else {
    results.push({ name, status: isWarning ? 'warn' : 'fail', message: failMsg });
  }
}

console.log(chalk.bold.blue('\n🔍 The-Explorerz System Status Check\n'));

// ─── Environment Variables ────────────────────────────────────

console.log(chalk.bold('📋 Environment Variables:'));

check(
  'DATABASE_URL',
  !!process.env.DATABASE_URL,
  'Database URL configured',
  'DATABASE_URL not set in .env'
);

check(
  'JWT_SECRET',
  !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
  'JWT secret configured (secure)',
  'JWT_SECRET missing or too short (min 32 chars)',
  true // Warning if using Clerk
);

check(
  'CLERK_SECRET_KEY',
  !!process.env.CLERK_SECRET_KEY,
  'Clerk configured',
  'Clerk not configured',
  true // Warning if using JWT
);

check(
  'REDIS_URL',
  !!process.env.REDIS_URL,
  'Redis configured',
  'Redis not configured (optional but recommended)',
  true
);

check(
  'SMTP_HOST',
  !!process.env.SMTP_HOST,
  'Email service configured',
  'Email service not configured',
  true
);

check(
  'RAZORPAY_KEY_ID',
  !!process.env.RAZORPAY_KEY_ID,
  'Razorpay configured',
  'Razorpay not configured (required for payments)'
);

check(
  'CLOUDINARY_CLOUD_NAME',
  !!process.env.CLOUDINARY_CLOUD_NAME,
  'Cloudinary configured',
  'Cloudinary not configured (required for uploads)'
);

check(
  'CORS_ORIGINS',
  !!process.env.CORS_ORIGINS,
  'CORS origins configured',
  'CORS_ORIGINS not set'
);

// ─── File Structure ───────────────────────────────────────────

console.log(chalk.bold('\n📁 File Structure:'));

const requiredFiles = [
  'src/app.ts',
  'src/index.ts',
  'src/middleware/auth.ts',
  'src/middleware/security.ts',
  'src/middleware/csrf.ts',
  'src/middleware/idempotency.ts',
  'src/middleware/rls.ts',
  'src/middleware/rateLimiter.ts',
  'prisma/schema.prisma',
];

requiredFiles.forEach((file) => {
  const path = join(process.cwd(), file);
  check(
    file,
    existsSync(path),
    `${file} exists`,
    `${file} missing`
  );
});

// ─── Prisma Schema Checks ─────────────────────────────────────

console.log(chalk.bold('\n🗄️  Database Schema:'));

try {
  const schemaPath = join(process.cwd(), 'prisma/schema.prisma');
  const schema = readFileSync(schemaPath, 'utf-8');

  check(
    'User model',
    schema.includes('model User'),
    'User model defined',
    'User model missing'
  );

  check(
    'Booking model',
    schema.includes('model Booking'),
    'Booking model defined',
    'Booking model missing'
  );

  check(
    'Package model',
    schema.includes('model Package'),
    'Package model defined',
    'Package model missing'
  );

  check(
    'AuditLog model',
    schema.includes('model AuditLog'),
    'AuditLog model defined',
    'AuditLog model missing'
  );

  // Check for dual auth (both Clerk and JWT)
  const hasClerkId = schema.includes('clerkId');
  const hasPasswordHash = schema.includes('passwordHash');
  
  if (hasClerkId && hasPasswordHash) {
    results.push({
      name: 'Auth System',
      status: 'warn',
      message: '⚠️  BOTH Clerk and JWT auth detected - choose ONE',
    });
  } else if (hasClerkId) {
    results.push({
      name: 'Auth System',
      status: 'pass',
      message: 'Using Clerk authentication',
    });
  } else if (hasPasswordHash) {
    results.push({
      name: 'Auth System',
      status: 'pass',
      message: 'Using JWT authentication',
    });
  } else {
    results.push({
      name: 'Auth System',
      status: 'fail',
      message: 'No authentication system configured',
    });
  }
} catch (err) {
  results.push({
    name: 'Schema Check',
    status: 'fail',
    message: 'Could not read schema.prisma',
  });
}

// ─── Package.json Checks ──────────────────────────────────────

console.log(chalk.bold('\n📦 Dependencies:'));

try {
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  const requiredDeps = [
    'express',
    '@prisma/client',
    'helmet',
    'cors',
    'jsonwebtoken',
    'argon2',
    'zod',
    'ioredis',
    'bullmq',
    'razorpay',
    'cloudinary',
  ];

  requiredDeps.forEach((dep) => {
    check(
      dep,
      !!pkg.dependencies?.[dep],
      `${dep} installed`,
      `${dep} not installed`,
      dep === 'ioredis' || dep === 'bullmq' // Redis is optional
    );
  });
} catch (err) {
  results.push({
    name: 'Package Check',
    status: 'fail',
    message: 'Could not read package.json',
  });
}

// ─── Security Checks ──────────────────────────────────────────

console.log(chalk.bold('\n🔒 Security:'));

try {
  const securityPath = join(process.cwd(), 'src/middleware/security.ts');
  const security = readFileSync(securityPath, 'utf-8');

  check(
    'CSP Nonce',
    security.includes('res.locals.nonce'),
    'CSP nonce implemented',
    'CSP nonce not implemented'
  );

  check(
    'Helmet',
    security.includes('helmet('),
    'Helmet security headers configured',
    'Helmet not configured'
  );

  check(
    'CORS',
    security.includes('cors('),
    'CORS configured',
    'CORS not configured'
  );
} catch (err) {
  results.push({
    name: 'Security Check',
    status: 'fail',
    message: 'Could not read security.ts',
  });
}

// ─── API Versioning Check ─────────────────────────────────────

console.log(chalk.bold('\n🔢 API Versioning:'));

try {
  const appPath = join(process.cwd(), 'src/app.ts');
  const app = readFileSync(appPath, 'utf-8');

  check(
    'API Versioning',
    app.includes('/api/v1'),
    'API versioning implemented',
    'API versioning not implemented'
  );
} catch (err) {
  results.push({
    name: 'Versioning Check',
    status: 'fail',
    message: 'Could not read app.ts',
  });
}

// ─── Print Results ────────────────────────────────────────────

console.log(chalk.bold('\n📊 Results:\n'));

let passCount = 0;
let warnCount = 0;
let failCount = 0;

results.forEach((result) => {
  let icon = '';
  let color = chalk.white;

  if (result.status === 'pass') {
    icon = '✅';
    color = chalk.green;
    passCount++;
  } else if (result.status === 'warn') {
    icon = '⚠️ ';
    color = chalk.yellow;
    warnCount++;
  } else {
    icon = '❌';
    color = chalk.red;
    failCount++;
  }

  console.log(`${icon} ${color(result.message)}`);
});

// ─── Summary ──────────────────────────────────────────────────

console.log(chalk.bold('\n📈 Summary:\n'));
console.log(chalk.green(`✅ Passed: ${passCount}`));
console.log(chalk.yellow(`⚠️  Warnings: ${warnCount}`));
console.log(chalk.red(`❌ Failed: ${failCount}`));

const total = passCount + warnCount + failCount;
const score = Math.round((passCount / total) * 100);

console.log(chalk.bold(`\n🎯 Overall Score: ${score}%\n`));

if (failCount > 0) {
  console.log(chalk.red.bold('❌ CRITICAL ISSUES DETECTED'));
  console.log(chalk.red('Fix failed checks before deploying to production.\n'));
  console.log(chalk.white('See IMMEDIATE_ACTION_REQUIRED.md for details.\n'));
  process.exit(1);
} else if (warnCount > 0) {
  console.log(chalk.yellow.bold('⚠️  WARNINGS DETECTED'));
  console.log(chalk.yellow('Review warnings before deploying to production.\n'));
  console.log(chalk.white('See IMMEDIATE_ACTION_REQUIRED.md for details.\n'));
  process.exit(0);
} else {
  console.log(chalk.green.bold('✅ ALL CHECKS PASSED'));
  console.log(chalk.green('System is ready for deployment!\n'));
  process.exit(0);
}
