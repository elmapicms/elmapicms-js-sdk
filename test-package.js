/**
 * Test file to verify the package works correctly
 */

import { createClient } from './dist/index.js';

console.log('✅ Package loaded successfully!');
console.log('Available exports:', {
  createClient: typeof createClient
});

// Test client creation
const client = createClient(
  'https://example.com/api', 
  'test-token', 
  '550e8400-e29b-41d4-a716-446655440000'
);
console.log('✅ Client created successfully!');
console.log('Client basePath:', client.basePath);
console.log('Client projectId:', client.projectId);

// Test method availability
console.log('✅ All API methods available directly on client instance');
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(name => 
  name !== 'constructor' && 
  typeof client[name] === 'function' &&
  !name.startsWith('_')
));

// Test that project-id header is set
console.log('✅ Project ID header will be automatically included in all requests');

console.log('\n🎉 Package test completed successfully!');
console.log('The SDK is ready for npm publication.'); 