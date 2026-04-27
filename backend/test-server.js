#!/usr/bin/env node

/**
 * Test script to verify BusTrack backend is running correctly
 * Run with: node test-server.js
 */

const http = require('http');

const tests = [
  {
    name: 'Server Health Check',
    url: 'http://localhost:5000/health',
    method: 'GET'
  },
  {
    name: 'Server Root',
    url: 'http://localhost:5000/',
    method: 'GET'
  }
];

let testsPassed = 0;
let testsFailed = 0;

const runTest = (test) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error(`❌ ${test.name} - TIMEOUT (Request took too long)`);
      testsFailed++;
      resolve();
    }, 5000);

    const options = new URL(test.url);
    
    http.get(options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${test.name} - SUCCESS (Status: ${res.statusCode})`);
          console.log(`   Response: ${data.substring(0, 100)}...`);
          testsPassed++;
        } else {
          console.error(`❌ ${test.name} - FAILED (Status: ${res.statusCode})`);
          testsFailed++;
        }
        resolve();
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      console.error(`❌ ${test.name} - ERROR: ${err.message}`);
      testsFailed++;
      resolve();
    });
  });
};

const runAllTests = async () => {
  console.log('\n🧪 BusTrack Backend Diagnostic Tests\n');
  console.log('Testing server at: http://localhost:5000\n');
  
  for (const test of tests) {
    await runTest(test);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50) + '\n');
  
  if (testsFailed > 0) {
    console.log('⚠️  ISSUES DETECTED:\n');
    console.log('1. Make sure the backend server is running:');
    console.log('   Run: npm start (from backend directory)\n');
    console.log('2. Check if port 5000 is available:\n');
    console.log('   Windows: netstat -ano | findstr :5000');
    console.log('   Mac/Linux: lsof -i :5000\n');
    console.log('3. Check .env file has MONGO_URL configured\n');
    console.log('4. Check console logs for database connection errors\n');
  } else {
    console.log('✅ All tests passed! Backend is running correctly.\n');
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
};

runAllTests();
