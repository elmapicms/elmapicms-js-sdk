/**
 * ElmapiCMS JavaScript SDK
 *
 * SDK for interacting with the ElmapiCMS Content API.
 * This SDK provides type-safe access to all API endpoints for managing content, assets, and collections.
 */
/**
 * Configuration interface for the API client
 */
export interface ApiConfig {
    basePath: string;
    accessToken?: string;
    projectId: string;
    timeout?: number;
}
/**
 * Error response structure from the API
 */
export interface ApiErrorResponse {
    error?: string;
    message?: string;
    details?: any;
    code?: string;
}
/**
 * Base error class for all SDK errors
 */
export declare class ElmapiError extends Error {
    readonly name: string;
    readonly statusCode?: number;
    readonly code?: string;
    readonly details?: any;
    readonly requestInfo?: {
        method: string;
        url: string;
        params?: any;
        data?: any;
    };
    constructor(message: string, statusCode?: number, code?: string, details?: any, requestInfo?: any);
}
/**
 * Authentication error (401)
 */
export declare class AuthenticationError extends ElmapiError {
    constructor(message?: string, requestInfo?: any);
}
/**
 * Authorization error (403)
 */
export declare class AuthorizationError extends ElmapiError {
    constructor(message?: string, requestInfo?: any);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends ElmapiError {
    constructor(resource: string, requestInfo?: any);
}
/**
 * Validation error (422)
 */
export declare class ValidationError extends ElmapiError {
    constructor(message: string, details?: any, requestInfo?: any);
}
/**
 * Rate limit error (429)
 */
export declare class RateLimitError extends ElmapiError {
    constructor(message?: string, requestInfo?: any);
}
/**
 * Server error (5xx)
 */
export declare class ServerError extends ElmapiError {
    constructor(message?: string, requestInfo?: any);
}
/**
 * Network error (timeout, connection issues)
 */
export declare class NetworkError extends ElmapiError {
    constructor(message?: string, requestInfo?: any);
}
/**
 * Timeout error
 */
export declare class TimeoutError extends ElmapiError {
    constructor(timeout: number, requestInfo?: any);
}
/**
 * Base API client class with all API methods
 */
export declare class ApiClient {
    basePath: string;
    accessToken?: string;
    projectId: string;
    timeout: number;
    constructor(config: ApiConfig);
    /**
     * Make an HTTP request
     */
    request<T>(method: string, path: string, params?: any, data?: any): Promise<T>;
    /**
     * Get project
     */
    getProject(params?: {
        with?: string;
    }): Promise<unknown>;
    /**
     * Get all collections for the current project
     */
    getCollections(): Promise<unknown>;
    /**
     * Get a specific collection by slug
     */
    getCollection(collectionSlug: string): Promise<unknown>;
    /**
     * Get entries for a collection
     */
    getEntries(collectionSlug: string, params?: {
        state?: 'only_draft' | 'with_draft' | 'published';
        locale?: string;
        exclude?: string;
        where?: object;
        sort?: string;
        limit?: number;
        offset?: number;
        timestamps?: boolean;
    }): Promise<unknown>;
    /**
     * Get a specific entry by UUID
     */
    getEntry(collectionSlug: string, uuid: string): Promise<unknown>;
    /**
     * Create a new entry
     */
    createEntry(collectionSlug: string, data: {
        locale?: string;
        state?: 'draft' | 'published';
        published_at?: string;
        data: object;
    }): Promise<unknown>;
    /**
     * Update an entry
     */
    updateEntry(collectionSlug: string, uuid: string, data: {
        locale?: string;
        state?: 'draft' | 'published';
        published_at?: string;
        data: object;
    }): Promise<unknown>;
    /**
     * Patch an entry
     */
    patchEntry(collectionSlug: string, uuid: string, data: {
        locale?: string;
        state?: 'draft' | 'published';
        published_at?: string;
        data: object;
    }): Promise<unknown>;
    /**
     * Delete an entry
     * @param force - If true or 1, permanently deletes the entry. If not set, trashes the entry.
     */
    deleteEntry(collectionSlug: string, uuid: string, force?: boolean): Promise<unknown>;
    /**
     * Get all assets for the current project
     */
    getAssets(params?: {
        search?: string;
        type?: 'image' | 'video' | 'audio' | 'document';
        paginate?: number;
    }): Promise<unknown>;
    /**
     * Get a specific asset by ID or UUID
     */
    getAsset(identifier: string): Promise<unknown>;
    /**
     * Get a specific asset by filename
     */
    getAssetByFilename(filename: string): Promise<unknown>;
    /**
     * Upload a new asset
     */
    uploadAsset(file: File | Buffer, metadata?: any): Promise<any>;
    /**
     * Delete an asset
     */
    deleteAsset(identifier: string, force?: boolean): Promise<unknown>;
    /**
     * Check if the client is properly configured
     */
    validateConfiguration(): void;
    /**
     * Get debug information about the client configuration
     */
    getDebugInfo(): {
        basePath: string;
        hasAccessToken: boolean;
        projectId: string;
        timeout: number;
    };
}
/**
 * Create a new ElmapiCMS client instance
 *
 * @param baseUrl - The base URL of your ElmapiCMS instance
 * @param apiToken - Your API token for authentication
 * @param projectId - Your project UUID (required for all API calls)
 * @param config - Additional configuration options
 * @returns A configured ApiClient instance with all API methods
 *
 * @example
 * ```javascript
 * import { createClient } from '@elmapicms/js-sdk';
 *
 * const client = createClient(
 *   'https://your-instance.elmapi.com/api',
 *   'your-api-token',
 *   '550e8400-e29b-41d4-a716-446655440000'
 * );
 *
 * // Use the client directly
 * const project = await client.getProject();
 * const collections = await client.getCollections();
 * const entries = await client.getEntries('blog');
 * ```
 */
export declare function createClient(baseUrl: string, apiToken: string, projectId: string, config?: Partial<ApiConfig>): ApiClient;
/**
 * Default export for convenience
 */
export default createClient;
//# sourceMappingURL=index.d.ts.map