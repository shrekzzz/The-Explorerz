/**
 * ════════════════════════════════════════════════════════════════════════════
 * RLS VERIFICATION SCRIPT
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * This script verifies that Row-Level Security is properly configured
 * in the database.
 * 
 * Usage: npx tsx scripts/verify-rls.ts
 * ════════════════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

interface RLSStatus {
  tablename: string;
  rowsecurity: boolean;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

async function checkRLSEnabled(): Promise<boolean> {
  console.log(chalk.blue('\n📋 Checking if RLS is enabled on tables...\n'));

  try {
    const tables = await prisma.$queryRaw<RLSStatus[]>`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    let allEnabled = true;

    for (const table of tables) {
      const status = table.rowsecurity ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled');
      console.log(`  ${table.tablename.padEnd(20)} ${status}`);
      
      if (!table.rowsecurity) {
        allEnabled = false;
      }
    }

    return allEnabled;
  } catch (error) {
    console.error(chalk.red('Error checking RLS status:'), error);
    return false;
  }
}

async function checkHelperFunctions(): Promise<boolean> {
  console.log(chalk.blue('\n🔧 Checking helper functions...\n'));

  const functions = [
    'current_user_id',
    'is_admin',
    'is_staff_or_above'
  ];

  let allExist = true;

  for (const funcName of functions) {
    try {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' 
          AND p.proname = ${funcName}
        ) as exists;
      `;

      const exists = result[0]?.exists;
      const status = exists ? chalk.green('✓ Exists') : chalk.red('✗ Missing');
      console.log(`  ${funcName.padEnd(20)} ${status}`);

      if (!exists) {
        allExist = false;
      }
    } catch (error) {
      console.error(chalk.red(`Error checking function ${funcName}:`), error);
      allExist = false;
    }
  }

  return allExist;
}

async function checkPolicies(): Promise<boolean> {
  console.log(chalk.blue('\n🛡️  Checking RLS policies...\n'));

  try {
    const policies = await prisma.$queryRaw<PolicyInfo[]>`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual::text,
        with_check::text
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    if (policies.length === 0) {
      console.log(chalk.red('  ✗ No policies found!'));
      return false;
    }

    // Group policies by table
    const policiesByTable = policies.reduce((acc, policy) => {
      if (!acc[policy.tablename]) {
        acc[policy.tablename] = [];
      }
      acc[policy.tablename].push(policy);
      return acc;
    }, {} as Record<string, PolicyInfo[]>);

    for (const [tableName, tablePolicies] of Object.entries(policiesByTable)) {
      console.log(chalk.cyan(`  ${tableName}:`));
      console.log(chalk.gray(`    ${tablePolicies.length} policies`));
      
      // Check for basic CRUD policies
      const commands = tablePolicies.map(p => p.cmd);
      const hasSelect = commands.includes('SELECT');
      const hasInsert = commands.includes('INSERT');
      const hasUpdate = commands.includes('UPDATE');
      const hasDelete = commands.includes('DELETE');

      console.log(`    SELECT: ${hasSelect ? chalk.green('✓') : chalk.yellow('○')}`);
      console.log(`    INSERT: ${hasInsert ? chalk.green('✓') : chalk.yellow('○')}`);
      console.log(`    UPDATE: ${hasUpdate ? chalk.green('✓') : chalk.yellow('○')}`);
      console.log(`    DELETE: ${hasDelete ? chalk.green('✓') : chalk.yellow('○')}`);
      console.log();
    }

    console.log(chalk.green(`  ✓ Total policies: ${policies.length}`));
    return true;
  } catch (error) {
    console.error(chalk.red('Error checking policies:'), error);
    return false;
  }
}

async function testRLSContext(): Promise<boolean> {
  console.log(chalk.blue('\n🧪 Testing RLS context functions...\n'));

  try {
    // Test setting context
    await prisma.$executeRawUnsafe(
      "SET LOCAL app.current_user_id = '00000000-0000-0000-0000-000000000001'"
    );
    await prisma.$executeRawUnsafe(
      "SET LOCAL app.user_role = 'USER'"
    );

    // Test retrieving context
    const result = await prisma.$queryRawUnsafe<Array<{
      user_id: string | null;
      user_role: string | null;
    }>>(
      `SELECT 
        current_setting('app.current_user_id', TRUE) as user_id,
        current_setting('app.user_role', TRUE) as user_role`
    );

    const userId = result[0]?.user_id;
    const userRole = result[0]?.user_role;

    if (userId && userRole) {
      console.log(chalk.green('  ✓ Context setting works'));
      console.log(`    User ID: ${userId}`);
      console.log(`    User Role: ${userRole}`);
    } else {
      console.log(chalk.red('  ✗ Context setting failed'));
      return false;
    }

    // Test helper functions
    const helperResult = await prisma.$queryRaw<Array<{
      current_user_id: string | null;
      is_admin: boolean;
      is_staff_or_above: boolean;
    }>>`
      SELECT 
        current_user_id() as current_user_id,
        is_admin() as is_admin,
        is_staff_or_above() as is_staff_or_above
    `;

    const helpers = helperResult[0];
    console.log(chalk.green('\n  ✓ Helper functions work'));
    console.log(`    current_user_id(): ${helpers.current_user_id}`);
    console.log(`    is_admin(): ${helpers.is_admin}`);
    console.log(`    is_staff_or_above(): ${helpers.is_staff_or_above}`);

    // Clear context
    await prisma.$executeRawUnsafe('RESET app.current_user_id');
    await prisma.$executeRawUnsafe('RESET app.user_role');

    return true;
  } catch (error) {
    console.error(chalk.red('Error testing RLS context:'), error);
    return false;
  }
}

async function generateReport(): Promise<void> {
  console.log(chalk.bold.blue('\n════════════════════════════════════════════════════════════════'));
  console.log(chalk.bold.blue('  ROW-LEVEL SECURITY VERIFICATION REPORT'));
  console.log(chalk.bold.blue('════════════════════════════════════════════════════════════════'));

  const checks = {
    rlsEnabled: await checkRLSEnabled(),
    helperFunctions: await checkHelperFunctions(),
    policies: await checkPolicies(),
    contextTest: await testRLSContext()
  };

  console.log(chalk.blue('\n════════════════════════════════════════════════════════════════'));
  console.log(chalk.bold.blue('  SUMMARY'));
  console.log(chalk.blue('════════════════════════════════════════════════════════════════\n'));

  const allPassed = Object.values(checks).every(v => v);

  console.log(`  RLS Enabled:        ${checks.rlsEnabled ? chalk.green('✓ PASS') : chalk.red('✗ FAIL')}`);
  console.log(`  Helper Functions:   ${checks.helperFunctions ? chalk.green('✓ PASS') : chalk.red('✗ FAIL')}`);
  console.log(`  Policies:           ${checks.policies ? chalk.green('✓ PASS') : chalk.red('✗ FAIL')}`);
  console.log(`  Context Test:       ${checks.contextTest ? chalk.green('✓ PASS') : chalk.red('✗ FAIL')}`);

  console.log(chalk.blue('\n════════════════════════════════════════════════════════════════\n'));

  if (allPassed) {
    console.log(chalk.bold.green('✓ All checks passed! RLS is properly configured.\n'));
  } else {
    console.log(chalk.bold.red('✗ Some checks failed. Please review the errors above.\n'));
    console.log(chalk.yellow('To fix issues, run the RLS migration:'));
    console.log(chalk.cyan('  npx prisma migrate deploy\n'));
  }
}

async function main() {
  try {
    await generateReport();
  } catch (error) {
    console.error(chalk.red('\nFatal error:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
