#!/usr/bin/env tsx
/**
 * Redis Connection Test Script
 * Tests connection to Redis (local or Upstash)
 */

import redis from '../src/config/redis.js';
import { logger } from '../src/utils/logger.js';
import chalk from 'chalk';

async function testRedis() {
  console.log(chalk.bold.blue('\n🧪 Testing Redis Connection\n'));

  try {
    // Test 1: Connect
    console.log(chalk.bold('1. Connecting to Redis...'));
    await redis.connect();
    console.log(chalk.green('✅ Connected successfully\n'));

    // Test 2: Ping
    console.log(chalk.bold('2. Testing PING command...'));
    const pong = await redis.ping();
    console.log(chalk.green(`✅ PING response: ${pong}\n`));

    // Test 3: Set and Get
    console.log(chalk.bold('3. Testing SET/GET commands...'));
    await redis.set('test:key', 'Hello from Upstash!');
    const value = await redis.get('test:key');
    console.log(chalk.green(`✅ SET/GET working: ${value}\n`));

    // Test 4: Expiration
    console.log(chalk.bold('4. Testing expiration (TTL)...'));
    await redis.setex('test:expiring', 10, 'This expires in 10 seconds');
    const ttl = await redis.ttl('test:expiring');
    console.log(chalk.green(`✅ TTL working: ${ttl} seconds remaining\n`));

    // Test 5: Increment
    console.log(chalk.bold('5. Testing INCR command...'));
    await redis.set('test:counter', '0');
    await redis.incr('test:counter');
    await redis.incr('test:counter');
    const counter = await redis.get('test:counter');
    console.log(chalk.green(`✅ INCR working: counter = ${counter}\n`));

    // Test 6: Hash operations
    console.log(chalk.bold('6. Testing HASH commands...'));
    await redis.hset('test:hash', 'field1', 'value1');
    await redis.hset('test:hash', 'field2', 'value2');
    const hashValue = await redis.hget('test:hash', 'field1');
    console.log(chalk.green(`✅ HASH working: ${hashValue}\n`));

    // Test 7: List operations
    console.log(chalk.bold('7. Testing LIST commands...'));
    await redis.lpush('test:list', 'item1', 'item2', 'item3');
    const listLength = await redis.llen('test:list');
    console.log(chalk.green(`✅ LIST working: ${listLength} items\n`));

    // Test 8: Pipeline
    console.log(chalk.bold('8. Testing PIPELINE...'));
    const pipeline = redis.pipeline();
    pipeline.set('test:pipe1', 'value1');
    pipeline.set('test:pipe2', 'value2');
    pipeline.set('test:pipe3', 'value3');
    const results = await pipeline.exec();
    console.log(chalk.green(`✅ PIPELINE working: ${results?.length} commands executed\n`));

    // Test 9: Check info
    console.log(chalk.bold('9. Getting Redis info...'));
    const info = await redis.info('server');
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
    const mode = info.match(/redis_mode:([^\r\n]+)/)?.[1];
    console.log(chalk.green(`✅ Redis version: ${version}`));
    console.log(chalk.green(`✅ Redis mode: ${mode}\n`));

    // Test 10: Cleanup
    console.log(chalk.bold('10. Cleaning up test keys...'));
    await redis.del(
      'test:key',
      'test:expiring',
      'test:counter',
      'test:hash',
      'test:list',
      'test:pipe1',
      'test:pipe2',
      'test:pipe3'
    );
    console.log(chalk.green('✅ Cleanup complete\n'));

    // Summary
    console.log(chalk.bold.green('🎉 All tests passed!\n'));
    console.log(chalk.bold('Redis Configuration:'));
    console.log(chalk.white(`  Provider: ${process.env.REDIS_URL?.includes('upstash.io') ? 'Upstash' : 'Local Redis'}`));
    console.log(chalk.white(`  TLS: ${process.env.REDIS_URL?.startsWith('rediss://') ? 'Enabled' : 'Disabled'}`));
    console.log(chalk.white(`  Version: ${version}`));
    console.log(chalk.white(`  Mode: ${mode}\n`));

    // Performance test
    console.log(chalk.bold('⚡ Performance Test:'));
    const iterations = 100;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await redis.set(`perf:test:${i}`, `value${i}`);
    }
    
    const duration = Date.now() - start;
    const avgLatency = duration / iterations;
    
    console.log(chalk.white(`  ${iterations} SET operations: ${duration}ms`));
    console.log(chalk.white(`  Average latency: ${avgLatency.toFixed(2)}ms per operation\n`));

    // Cleanup performance test keys
    const perfKeys = Array.from({ length: iterations }, (_, i) => `perf:test:${i}`);
    await redis.del(...perfKeys);

    // Recommendations
    console.log(chalk.bold('💡 Recommendations:\n'));
    
    if (avgLatency < 10) {
      console.log(chalk.green('✅ Excellent latency! Your Redis is very fast.'));
    } else if (avgLatency < 50) {
      console.log(chalk.yellow('⚠️  Good latency, but could be improved.'));
      console.log(chalk.white('   Consider using a closer region or Global database.'));
    } else {
      console.log(chalk.red('❌ High latency detected!'));
      console.log(chalk.white('   Recommendations:'));
      console.log(chalk.white('   1. Use Upstash Global database'));
      console.log(chalk.white('   2. Choose region closer to your users'));
      console.log(chalk.white('   3. Check network connectivity'));
    }

    console.log('');

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Redis test failed!\n'));
    
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}\n`));
      
      // Provide helpful troubleshooting
      console.log(chalk.bold('🔧 Troubleshooting:\n'));
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log(chalk.yellow('Connection refused:'));
        console.log(chalk.white('  1. Check if Redis is running'));
        console.log(chalk.white('  2. Verify REDIS_URL in .env'));
        console.log(chalk.white('  3. Check firewall settings\n'));
      } else if (error.message.includes('ETIMEDOUT')) {
        console.log(chalk.yellow('Connection timeout:'));
        console.log(chalk.white('  1. Check internet connection'));
        console.log(chalk.white('  2. Verify Upstash URL is correct'));
        console.log(chalk.white('  3. Check if firewall blocks outbound connections\n'));
      } else if (error.message.includes('NOAUTH')) {
        console.log(chalk.yellow('Authentication failed:'));
        console.log(chalk.white('  1. Check password in REDIS_URL'));
        console.log(chalk.white('  2. Verify URL format: rediss://default:PASSWORD@...'));
        console.log(chalk.white('  3. Reset password in Upstash dashboard\n'));
      } else if (error.message.includes('certificate')) {
        console.log(chalk.yellow('TLS certificate error:'));
        console.log(chalk.white('  1. Use rediss:// (with double s) for TLS'));
        console.log(chalk.white('  2. Update Node.js to latest version'));
        console.log(chalk.white('  3. Check TLS configuration\n'));
      } else {
        console.log(chalk.yellow('Unknown error:'));
        console.log(chalk.white('  1. Check server logs for details'));
        console.log(chalk.white('  2. Verify all environment variables'));
        console.log(chalk.white('  3. Try restarting the application\n'));
      }
    }
    
    process.exit(1);
  } finally {
    // Disconnect
    await redis.quit();
    console.log(chalk.gray('Disconnected from Redis\n'));
  }
}

// Run tests
testRedis().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
