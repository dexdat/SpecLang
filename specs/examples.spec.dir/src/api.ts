// Generated from specs/examples/api.spec.md
// DO NOT EDIT MANUALLY
// Source: @examples/api

/**
 * API design example module
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * List users with pagination.
 * GET /api/users
 */
export function listUsers(page: number = 1, limit: number = 20, sort?: string): UsersListResponse {
  // Placeholder implementation
  throw new Error('Not implemented');
}

/**
 * Create a new user.
 * POST /api/users
 */
export function createUser(request: CreateUserRequest): CreateUserResponse {
  // Placeholder implementation
  throw new Error('Not implemented');
}