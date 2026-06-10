---
id: "speclang-demo/todo-api-test"
version: 1.0.0
layer: 3
target_lang: ts
owned-by: demo
tags: [demo, test, api]
short: "Integration tests for the Todo API demo — proves spec-driven test workflow"
depends_on:
  - "@ref:speclang-demo/todo-api"
status: demo
---

# Todo API Demo — Integration Tests

## Overview

Integration tests for the Todo API. Demonstrates SpecLang's spec-driven testing workflow:
spec → implementation → test → pipeline → running service.

## Implementation

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';

const BASE_URL = 'http://localhost:3999';

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Todo API', () => {
  const testIds: string[] = [];

  describe('Health Check', () => {
    it('should return status ok', async () => {
      const { status, data } = await request('GET', '/api/health');
      expect(status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.spec).toBe('speclang-demo/todo-api');
    });
  });

  describe('Create Todo', () => {
    it('should create a todo', async () => {
      const { status, data } = await request('POST', '/api/todos', {
        title: 'Test todo',
      });
      expect(status).toBe(201);
      expect(data.title).toBe('Test todo');
      expect(data.status).toBe('pending');
      expect(data.id).toBeTruthy();
      testIds.push(data.id);
    });

    it('should reject empty title', async () => {
      const { status, data } = await request('POST', '/api/todos', {});
      expect(status).toBe(400);
      expect(data.error).toBeTruthy();
    });
  });

  describe('List Todos', () => {
    it('should list created todos', async () => {
      const { status, data } = await request('GET', '/api/todos');
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter by status', async () => {
      const { status, data } = await request('GET', '/api/todos?status=pending');
      expect(status).toBe(200);
      expect(data.every((t: any) => t.status === 'pending')).toBe(true);
    });
  });

  describe('Update Todo', () => {
    it('should mark todo as done', async () => {
      // Create a fresh todo first
      const { data: todo } = await request('POST', '/api/todos', { title: 'Update me' });
      testIds.push(todo.id);

      const { status, data } = await request('PATCH', `/api/todos/${todo.id}`, {
        status: 'done',
      });
      expect(status).toBe(200);
      expect(data.status).toBe('done');
    });

    it('should return 404 for unknown id', async () => {
      const { status } = await request('PATCH', '/api/todos/nonexistent', {
        status: 'done',
      });
      expect(status).toBe(404);
    });
  });

  describe('Delete Todo', () => {
    it('should delete a todo', async () => {
      const { data: todo } = await request('POST', '/api/todos', { title: 'Delete me' });

      const { status, data } = await request('DELETE', `/api/todos/${todo.id}`);
      expect(status).toBe(200);
      expect(data.id).toBe(todo.id);
    });

    it('should return 404 for unknown id', async () => {
      const { status } = await request('DELETE', '/api/todos/nonexistent');
      expect(status).toBe(404);
    });
  });
});
```
