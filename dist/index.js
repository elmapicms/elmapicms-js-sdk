/**
 * ElmapiCMS JavaScript SDK
 *
 * SDK for interacting with the ElmapiCMS Content API.
 * This SDK provides type-safe access to all API endpoints for managing content, assets, and collections.
 */
import superagent from 'superagent';
/**
 * Base error class for all SDK errors
 */
export class ElmapiError extends Error {
    constructor(message, statusCode, code, details, requestInfo) {
        super(message);
        this.name = this.constructor.name;
        if (statusCode !== undefined)
            this.statusCode = statusCode;
        if (code !== undefined)
            this.code = code;
        if (details !== undefined)
            this.details = details;
        if (requestInfo !== undefined)
            this.requestInfo = requestInfo;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Authentication error (401)
 */
export class AuthenticationError extends ElmapiError {
    constructor(message = 'Authentication failed. Please check your API token.', requestInfo) {
        super(message, 401, 'AUTHENTICATION_ERROR', undefined, requestInfo);
    }
}
/**
 * Authorization error (403)
 */
export class AuthorizationError extends ElmapiError {
    constructor(message = 'You do not have permission to perform this action.', requestInfo) {
        super(message, 403, 'AUTHORIZATION_ERROR', undefined, requestInfo);
    }
}
/**
 * Not found error (404)
 */
export class NotFoundError extends ElmapiError {
    constructor(resource, requestInfo) {
        super(`${resource} not found.`, 404, 'NOT_FOUND', undefined, requestInfo);
    }
}
/**
 * Validation error (422)
 */
export class ValidationError extends ElmapiError {
    constructor(message, details, requestInfo) {
        super(message, 422, 'VALIDATION_ERROR', details, requestInfo);
    }
}
/**
 * Rate limit error (429)
 */
export class RateLimitError extends ElmapiError {
    constructor(message = 'Rate limit exceeded. Please try again later.', requestInfo) {
        super(message, 429, 'RATE_LIMIT_ERROR', undefined, requestInfo);
    }
}
/**
 * Server error (5xx)
 */
export class ServerError extends ElmapiError {
    constructor(message = 'Server error occurred. Please try again later.', requestInfo) {
        super(message, 500, 'SERVER_ERROR', undefined, requestInfo);
    }
}
/**
 * Network error (timeout, connection issues)
 */
export class NetworkError extends ElmapiError {
    constructor(message = 'Network error occurred. Please check your connection.', requestInfo) {
        super(message, undefined, 'NETWORK_ERROR', undefined, requestInfo);
    }
}
/**
 * Timeout error
 */
export class TimeoutError extends ElmapiError {
    constructor(timeout, requestInfo) {
        super(`Request timed out after ${timeout}ms.`, undefined, 'TIMEOUT_ERROR', undefined, requestInfo);
    }
}
/**
 * Parse API error response and create appropriate error instance
 */
function createApiError(error, requestInfo) {
    const statusCode = error.response?.status;
    const responseBody = error.response?.body || error.response?.text;
    // Try to parse error response
    let errorData = {};
    if (responseBody) {
        try {
            errorData = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        }
        catch {
            // If parsing fails, use the raw text
            errorData = { message: responseBody };
        }
    }
    const message = errorData.message || errorData.error || error.message || 'An unknown error occurred';
    const details = errorData.details;
    const code = errorData.code;
    // Create specific error based on status code
    switch (statusCode) {
        case 401:
            return new AuthenticationError(message, requestInfo);
        case 403:
            return new AuthorizationError(message, requestInfo);
        case 404:
            return new NotFoundError('Resource', requestInfo);
        case 422:
            return new ValidationError(message, details, requestInfo);
        case 429:
            return new RateLimitError(message, requestInfo);
        case 500:
        case 502:
        case 503:
        case 504:
            return new ServerError(message, requestInfo);
        default:
            return new ElmapiError(message, statusCode, code, details, requestInfo);
    }
}
/**
 * Create network/timeout error
 */
function createNetworkError(error, requestInfo) {
    if (error.code === 'ECONNABORTED' || error.timeout) {
        return new TimeoutError(requestInfo.timeout || 30000, requestInfo);
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return new NetworkError('Unable to connect to the server. Please check your internet connection and the API URL.', requestInfo);
    }
    return new NetworkError(error.message || 'Network error occurred', requestInfo);
}
/**
 * Base API client class with all API methods
 */
export class ApiClient {
    constructor(config) {
        this.basePath = config.basePath.replace(/\/+$/, '');
        this.accessToken = config.accessToken || '';
        this.projectId = config.projectId;
        this.timeout = config.timeout || 30000;
    }
    /**
     * Make an HTTP request
     */
    async request(method, path, params = {}, data) {
        const url = `${this.basePath}${path}`;
        let request = superagent(method, url);
        // Add authentication
        if (this.accessToken) {
            request = request.set('Authorization', `Bearer ${this.accessToken}`);
        }
        // Add project-id header (required for all endpoints)
        request = request.set('project-id', this.projectId);
        // Add Accept header for JSON responses
        request = request.set('Accept', 'application/json');
        // Add query parameters
        if (params) {
            request = request.query(params);
        }
        // Add request body
        if (data) {
            request = request.send(data);
        }
        // Set timeout
        request = request.timeout(this.timeout);
        const requestInfo = {
            method,
            url,
            params,
            data,
            timeout: this.timeout
        };
        try {
            const response = await request;
            return response.body;
        }
        catch (error) {
            // Handle API errors (with response)
            if (error.response) {
                throw createApiError(error, requestInfo);
            }
            // Handle network/timeout errors
            throw createNetworkError(error, requestInfo);
        }
    }
    // Projects API methods
    /**
     * Get project
     */
    async getProject(params) {
        return this.request('GET', '/', params);
    }
    // Collections API methods
    /**
     * Get all collections for the current project
     */
    async getCollections() {
        return this.request('GET', '/collections');
    }
    /**
     * Get a specific collection by slug
     */
    async getCollection(collectionSlug) {
        try {
            return await this.request('GET', `/collections/${collectionSlug}`);
        }
        catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundError(`Collection '${collectionSlug}'`, error.requestInfo);
            }
            throw error;
        }
    }
    // Content API methods
    /**
     * Get entries for a collection
     */
    async getEntries(collectionSlug, params) {
        return this.request('GET', `/${collectionSlug}`, params);
    }
    /**
     * Get a specific entry by UUID
     */
    async getEntry(collectionSlug, uuid) {
        try {
            return await this.request('GET', `/${collectionSlug}/${uuid}`);
        }
        catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundError(`Entry '${uuid}' in collection '${collectionSlug}'`, error.requestInfo);
            }
            throw error;
        }
    }
    /**
     * Create a new entry
     */
    async createEntry(collectionSlug, data) {
        return this.request('POST', `/${collectionSlug}`, {}, data);
    }
    /**
     * Update an entry
     */
    async updateEntry(collectionSlug, uuid, data) {
        return this.request('PUT', `/${collectionSlug}/${uuid}`, {}, data);
    }
    /**
     * Patch an entry
     */
    async patchEntry(collectionSlug, uuid, data) {
        return this.request('PATCH', `/${collectionSlug}/${uuid}`, {}, data);
    }
    /**
     * Delete an entry
     * @param force - If true or 1, permanently deletes the entry. If not set, trashes the entry.
     */
    async deleteEntry(collectionSlug, uuid, force) {
        const params = force ? { force } : {};
        return this.request('DELETE', `/${collectionSlug}/${uuid}`, params);
    }
    // Assets API methods
    /**
     * Get all assets for the current project
     */
    async getAssets(params) {
        return this.request('GET', '/files', params);
    }
    /**
     * Get a specific asset by ID or UUID
     */
    async getAsset(identifier) {
        try {
            return await this.request('GET', `/files/${identifier}`);
        }
        catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundError(`Asset '${identifier}'`, error.requestInfo);
            }
            throw error;
        }
    }
    /**
     * Get a specific asset by filename
     */
    async getAssetByFilename(filename) {
        try {
            return await this.request('GET', `/files/name/${filename}`);
        }
        catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundError(`Asset with filename '${filename}'`, error.requestInfo);
            }
            throw error;
        }
    }
    /**
     * Upload a new asset
     */
    async uploadAsset(file, metadata) {
        const url = `${this.basePath}/files`;
        let request = superagent.post(url);
        if (this.accessToken) {
            request = request.set('Authorization', `Bearer ${this.accessToken}`);
        }
        // Add project-id header
        request = request.set('project-id', this.projectId);
        request = request.attach('file', file);
        if (metadata) {
            request = request.field('metadata', JSON.stringify(metadata));
        }
        const requestInfo = {
            method: 'POST',
            url,
            params: {},
            data: { file: file.name || 'file', metadata },
            timeout: this.timeout
        };
        try {
            const response = await request;
            return response.body;
        }
        catch (error) {
            // Handle API errors (with response)
            if (error.response) {
                throw createApiError(error, requestInfo);
            }
            // Handle network/timeout errors
            throw createNetworkError(error, requestInfo);
        }
    }
    /**
     * Delete an asset
     */
    async deleteAsset(identifier, force) {
        const params = force ? { force } : {};
        return this.request('DELETE', `/files/${identifier}`, params);
    }
    /**
     * Check if the client is properly configured
     */
    validateConfiguration() {
        const errors = [];
        if (!this.basePath) {
            errors.push('Base path is required');
        }
        if (!this.projectId) {
            errors.push('Project ID is required');
        }
        if (errors.length > 0) {
            throw new ValidationError(`Invalid client configuration: ${errors.join(', ')}`, { errors });
        }
    }
    /**
     * Get debug information about the client configuration
     */
    getDebugInfo() {
        return {
            basePath: this.basePath,
            hasAccessToken: !!this.accessToken,
            projectId: this.projectId,
            timeout: this.timeout
        };
    }
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
export function createClient(baseUrl, apiToken, projectId, config = {}) {
    const client = new ApiClient({
        basePath: baseUrl,
        accessToken: apiToken,
        projectId,
        timeout: config.timeout || 30000,
    });
    // Validate configuration
    try {
        client.validateConfiguration();
    }
    catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new ValidationError('Failed to validate client configuration');
    }
    return client;
}
/**
 * Default export for convenience
 */
export default createClient;
//# sourceMappingURL=index.js.map