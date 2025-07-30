# ElmapiCMS JavaScript SDK

A JavaScript SDK for interacting with the [ElmapiCMS](https://elmapicms.com) Content API. This SDK provides type-safe access to all API endpoints for managing content, assets, and collections in your ElmapiCMS instance.

## Installation

```bash
npm install @elmapicms/js-sdk
```

## Quick Start

```javascript
import { createClient } from '@elmapicms/js-sdk';

// Create a client instance
const client = createClient(
  'https://your-instance.elmapi.com/api',
  'your-api-token',
  '550e8400-e29b-41d4-a716-446655440000' // Your project UUID
);

// Get project 
const project = await client.getProject();
console.log('Project Info:', projectInfo);

// Get collections for the project
const collections = await client.getCollections();
console.log('Collections:', collections);

// Get entries for a collection
const entries = await client.getEntries('blog-posts');
console.log('Entries:', entries);
```

## Features

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Promise-based**: Modern async/await support
- **Comprehensive**: Covers all API endpoints in a single client
- **Well-documented**: JSDoc comments for all methods
- **Simplified API**: All methods available directly on the client instance

## API Reference

### Projects

```javascript
// Get project
const project = await client.getProject();
```

### Collections

```javascript
// Get all collections for the current project
const collections = await client.getCollections();

// Get a specific collection by slug
const collection = await client.getCollection('blog-posts');
```

### Content

```javascript
// Get entries for a collection
const entries = await client.getEntries('blog-posts', {
  state: 'with_draft',
  limit: 10,
  sort: 'created_at:desc'
});

// Get a specific entry
const entry = await client.getEntry('blog-posts', 'uuid-here');

// Create a new entry
const newEntry = await client.createEntry('blog-posts', {
  locale: 'en',
  state: 'draft',
  data: {
    title: 'My Post',
    content: 'Post body'
  }
});

// Update an entry (PUT) - replace the entire entry
const updatedEntry = await client.updateEntry('blog-posts', 'uuid-here', {
  data: { title: 'Updated Post' }
});

// Patch an entry (PATCH) - update only the fields that are provided
const patchedEntry = await client.patchEntry('blog-posts', 'uuid-here', {
  data: { title: 'Patched Post' }
});

// Delete an entry (move to trash)
await client.deleteEntry('blog-posts', 'uuid-here');

// Permanently delete an entry
await client.deleteEntry('blog-posts', 'uuid-here', true);
```

### Assets

```javascript
// Get all assets for the current project
const assets = await client.getAssets({
  search: 'image',
  type: 'image',
  paginate: 20
});

// Get a specific asset by ID or UUID
const asset = await client.getAsset('uuid-here');

// Get a specific asset by filename
const asset = await client.getAssetByFilename('my-image.jpg');

// Upload a new asset
const newAsset = await client.uploadAsset(file, {
  alt: 'Image description',
  category: 'blog'
});

// Delete an asset (soft delete)
await client.deleteAsset('uuid-here');

// Permanently delete an asset
await client.deleteAsset('uuid-here', true);
```

## Error Handling

The SDK provides comprehensive error handling with specific error types, detailed error messages, and debugging information. All errors extend from the base `ElmapiError` class.

### Error Types

The SDK throws specific error types based on the HTTP status code or error condition:

- **`AuthenticationError`** (401): Invalid or missing API token
- **`AuthorizationError`** (403): Insufficient permissions
- **`NotFoundError`** (404): Resource not found
- **`ValidationError`** (422): Invalid request data
- **`RateLimitError`** (429): Rate limit exceeded
- **`ServerError`** (5xx): Server-side errors
- **`NetworkError`**: Network connectivity issues
- **`TimeoutError`**: Request timeout

### Basic Error Handling

```javascript
import { 
  createClient, 
  AuthenticationError,
  NotFoundError,
  ValidationError 
} from '@elmapicms/js-sdk';

const client = createClient(
  'https://your-instance.elmapi.com/api',
  'your-api-token',
  'your-project-id'
);

try {
  const project = await client.getProject();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
    console.log('Please check your API token');
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Advanced Error Handling

Each error includes detailed information for debugging:

```javascript
try {
  const collection = await client.getCollection('non-existent');
} catch (error) {
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    details: error.details
  });
  
  // Request information for debugging
  if (error.requestInfo) {
    console.error('Request details:', {
      method: error.requestInfo.method,
      url: error.requestInfo.url,
      params: error.requestInfo.params
    });
  }
}
```

### Retry Logic with Error Handling

```javascript
async function retryWithBackoff(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Don't retry on certain errors
      if (error instanceof AuthenticationError || 
          error instanceof NotFoundError || 
          error instanceof ValidationError) {
        throw error;
      }
      
      // Retry on rate limit, server errors, and network errors
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
try {
  const result = await retryWithBackoff(() => client.getCollections());
  console.log('Success:', result);
} catch (error) {
  console.error('All retry attempts failed:', error.message);
}
```

### Client Configuration Validation

```javascript
// Validate client configuration
try {
  client.validateConfiguration();
  console.log('✓ Configuration is valid');
} catch (error) {
  console.error('Configuration Error:', error.message);
}

// Get debug information
const debugInfo = client.getDebugInfo();
console.log('Client Configuration:', debugInfo);
```

See the [error handling examples](./examples/error-handling-examples.js) for more detailed patterns.

## API Reference

### Client Methods

#### `getProject(params?)`
Get project including name, description, default locale, and available locales. Optional params:
- `with`: Comma-separated list for collections and fields (e.g. `with=collections,fields`)

```javascript
const project = await client.getProject();
// Returns: { uuid, name, description, default_locale, locales }
```

#### `getCollections()`
Get all collections for the current project.

```javascript
const collections = await client.getCollections();
// Returns: Array of collection objects
```

#### `getCollection(collectionSlug)`
Get detailed information about a specific collection including its fields.

```javascript
const collection = await client.getCollection('blog-posts');
// Returns: Collection object with fields array
```

#### `getEntries(collectionSlug, params?)`
Get entries for a collection with optional filtering and pagination.

```javascript
const posts = await client.getEntries('blog-posts', {
  state: 'with_draft',        // 'only_draft' | 'with_draft'
  locale: 'en',              // Filter by locale
  exclude: 'content,excerpt', // Comma-separated fields to exclude
  where: { state: 'published' }, // Advanced filtering
  sort: 'created_at:desc',  // Sorting
  limit: 20,                 // Number of items
  offset: 0,                 // Pagination offset
  timestamps: true           // Include created_at/updated_at
});
```

#### `getEntry(collectionSlug, uuid)`
Get a specific entry by UUID.

```javascript
const post = await client.getEntry('blog-posts', '550e8400-e29b-41d4-a716-446655440000');
```

#### `createEntry(collectionSlug, data)`
Create a new entry.

```javascript
const newPost = await client.createEntry('blog-posts', {
  locale: 'en',
  state: 'draft',
  published_at: '2024-01-01T00:00:00Z',
  data: {
    title: 'My New Post',
    content: 'Post content here...'
  }
});
```

#### `updateEntry(collectionSlug, uuid, data)`
Update an existing entry (PUT).

```javascript
const updatedPost = await client.updateEntry('blog-posts', 'uuid', {
  state: 'published',
  data: { title: 'Updated Title' }
});
```

#### `patchEntry(collectionSlug, uuid, data)`
Partially update an entry (PATCH).

```javascript
const patchedPost = await client.patchEntry('blog-posts', 'uuid', {
  data: { title: 'Patched Title' }
});
```

#### `deleteEntry(collectionSlug, uuid, force?)`
Delete an entry. If `force` is set to `true` or `1`, the entry is permanently deleted. If not set, the entry is moved to trash.

```javascript
await client.deleteEntry('blog-posts', 'uuid');           // Move to trash
await client.deleteEntry('blog-posts', 'uuid', true);     // Permanently delete
```

#### `getAssets(params?)`
Get all assets for the current project with optional filtering.

```javascript
const assets = await client.getAssets({
  search: 'image',           // Search by filename, original filename, or mime type
  type: 'image',             // 'image' | 'video' | 'audio' | 'document'
  paginate: 20               // Number of items per page
});
```

#### `getAsset(identifier)`
Get a specific asset by ID or UUID.

```javascript
const asset = await client.getAsset('550e8400-e29b-41d4-a716-446655440000');
```

#### `getAssetByFilename(filename)`
Get a specific asset by original filename.

```javascript
const asset = await client.getAssetByFilename('my-image.jpg');
```

#### `uploadAsset(file, metadata?)`
Upload a new file asset.

```javascript
const uploadedAsset = await client.uploadAsset(file, {
  alt: 'Image description',
  category: 'blog'
});
```

#### `deleteAsset(identifier, force?)`
Delete an asset (soft delete by default, or permanent with force parameter).

```javascript
await client.deleteAsset('uuid');           // Soft delete
await client.deleteAsset('uuid', true);     // Permanent delete
```

## License

See LICENSE file for details.

## Support

For support, please contact support@elmapicms.com or visit our documentation at https://docs.elmapicms.com. 