/**
 * Simple verification script for OUI Lookup
 * Run with: node --loader ts-node/esm src/utils/verify-oui.ts
 */

import { ouiLookup } from './OUILookup';

console.log('OUI Lookup Verification\n');
console.log('Database size:', ouiLookup.getDatabaseSize(), 'manufacturers\n');

// Test cases
const testCases = [
  { bssid: 'F0:EE:7A:12:34:56', expected: 'Apple, Inc.' },
  { bssid: '64:1B:2F:11:22:33', expected: 'Samsung Electronics Co.,Ltd' },
  { bssid: 'E0:06:30:AA:BB:CC', expected: 'HUAWEI TECHNOLOGIES CO.,LTD' },
  { bssid: 'E8:0A:B9:12:34:56', expected: 'Cisco Systems, Inc' },
  { bssid: '10:06:1C:12:34:56', expected: 'Espressif Inc.' },
  { bssid: 'D8:3A:DD:12:34:56', expected: 'Raspberry Pi Trading Ltd' },
  { bssid: 'FF:FF:FF:12:34:56', expected: 'Unknown' },
  { bssid: 'f0-ee-7a-12-34-56', expected: 'Apple, Inc.' }, // lowercase with hyphens
  { bssid: 'F0EE7A123456', expected: 'Apple, Inc.' }, // no separators
];

console.log('Test Results:');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach(({ bssid, expected }) => {
  const result = ouiLookup.getManufacturer(bssid);
  const status = result === expected ? '✓ PASS' : '✗ FAIL';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} | ${bssid.padEnd(20)} | Expected: ${expected.padEnd(40)} | Got: ${result}`);
});

console.log('='.repeat(80));
console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('\n✓ All tests passed!');
} else {
  console.log('\n✗ Some tests failed!');
  process.exit(1);
}
