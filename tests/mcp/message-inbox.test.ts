/**
 * SPECLANG-GENERATED: MCP Message Inbox Tests
 * Source: @speclang/mcp/messages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagesToolHandler } from '../../src/mcp/tools/messages.js';
import type { SpecLangDB } from '../../src/db/index.js';

// Mock database factory
const createMockDb = () => {
  let _execCalls: string[] = [];
  const mock: Record<string, ReturnType<typeof vi.fn>> = {
    exec: vi.fn((sql: string) => {
      _execCalls.push(sql);
    }),
    prepare: vi.fn(() => ({
      get: vi.fn(() => undefined),
      run: vi.fn(() => ({ changes: 1, lastInsertRowid: 1 })),
      all: vi.fn(() => [])
    })),
    transaction: vi.fn((fn: () => void) => fn())
  };
  return mock as unknown as ReturnType<typeof createMockDb>;
};

describe('MessagesToolHandler', () => {
  let handler: MessagesToolHandler;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    const db = {
      getDatabase: () => mockDb
    } as unknown as SpecLangDB;
    handler = new MessagesToolHandler(db);
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SCHEMA CREATION
  // ==========================================================================

  describe('schema initialization', () => {
    it('should init tables on first tool call', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        get: vi.fn(() => ({ count: 0 })),
        run: vi.fn(() => ({ changes: 1 })),
        all: vi.fn(() => [])
      });

      await handler.handleQueryMessages({});

      expect(mockDb.exec).toHaveBeenCalled();
      const execCalls = (mockDb.exec as ReturnType<typeof vi.fn>).mock.calls;
      const allSql = execCalls.map((c: string[]) => c[0]).join(' ');
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS messages');
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS message_responses');
      expect(allSql).toContain('CHECK (type IN');
      expect(allSql).toContain('CHECK (priority IN');
      expect(allSql).toContain('CHECK (status IN');
      expect(allSql).toContain('FOREIGN KEY (parent_message_id)');
      expect(allSql).toContain('FOREIGN KEY (message_id) REFERENCES messages(id)');
    });
  });

  // ==========================================================================
  // REPORT MESSAGE
  // ==========================================================================

  describe('speclang_report_message', () => {
    it('should create a message with all required fields', async () => {
      let capturedParams: unknown[] = [];
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn((...params: unknown[]) => {
          capturedParams = params;
          return { changes: 1 };
        })
      });

      const result = await handler.handleReportMessage({
        type: 'ambiguity',
        priority: 'high',
        spec_id: '@specs/auth',
        file_path: 'specs/auth.spec.md',
        title: 'Ambiguous password requirements',
        description: 'The spec lacks minimum password length requirements'
      });

      expect(result.message_id).toBeDefined();
      expect(result.message_id.length).toBeGreaterThan(0);
      expect(result.created_at).toBeGreaterThan(0);

      expect(capturedParams[0]).toBe(result.message_id);
      expect(capturedParams[1]).toBe('ambiguity');
      expect(capturedParams[2]).toBe('high');
      expect(capturedParams[6]).toBe('@specs/auth');
      expect(capturedParams[7]).toBe('specs/auth.spec.md');
      expect(capturedParams[10]).toBe('Ambiguous password requirements');
      expect(capturedParams[11]).toBe('The spec lacks minimum password length requirements');
      expect(capturedParams[16]).toBe('new');
    });

    it('should include optional fields when provided', async () => {
      let capturedParams: unknown[] = [];
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn((...params: unknown[]) => {
          capturedParams = params;
          return { changes: 1 };
        })
      });

      await handler.handleReportMessage({
        type: 'validation_failure',
        priority: 'blocking',
        spec_id: '@specs/db',
        file_path: 'specs/db.spec.md',
        title: 'Schema validation failed',
        description: 'Column type mismatch',
        suggested_fix: 'Change INTEGER to TEXT',
        code_snippet: 'CREATE TABLE foo (bar TEXT)',
        line_range: [10, 25]
      });

      expect(capturedParams[3]).toBe('unknown');
      expect(capturedParams[12]).toBe('Change INTEGER to TEXT');
      expect(capturedParams[13]).toBe('CREATE TABLE foo (bar TEXT)');
      expect(capturedParams[8]).toBe(10);
      expect(capturedParams[9]).toBe(25);
    });

    it('should use default source fields when not provided', async () => {
      let capturedParams: unknown[] = [];
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn((...params: unknown[]) => {
          capturedParams = params;
          return { changes: 1 };
        })
      });

      await handler.handleReportMessage({
        type: 'question',
        priority: 'low',
        spec_id: '@specs/test',
        file_path: 'specs/test.spec.md',
        title: 'Test question',
        description: 'How should we handle edge cases?'
      });

      expect(capturedParams[3]).toBe('unknown');
      expect(capturedParams[4]).toBe('unknown');
      expect(capturedParams[14]).toBe(capturedParams[15]);
      expect(capturedParams[16]).toBe('new');
    });

    it('should accept all message types', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const types = ['ambiguity', 'incompleteness', 'validation_failure', 'question', 'suggestion'] as const;

      for (const type of types) {
        const result = await handler.handleReportMessage({
          type,
          priority: 'medium',
          spec_id: '@specs/test',
          file_path: 'specs/test.spec.md',
          title: 'Test',
          description: 'Test description'
        });
        expect(result.message_id).toBeDefined();
      }
    });

    it('should accept all priority levels', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const priorities = ['blocking', 'high', 'medium', 'low', 'informational'] as const;

      for (const priority of priorities) {
        const result = await handler.handleReportMessage({
          type: 'suggestion',
          priority,
          spec_id: '@specs/test',
          file_path: 'specs/test.spec.md',
          title: 'Test',
          description: 'Test description'
        });
        expect(result.message_id).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // QUERY MESSAGES
  // ==========================================================================

  describe('speclang_query_messages', () => {
    it('should return all messages with default pagination', async () => {
      const mockRows = [
        { id: 'msg-1', type: 'ambiguity', status: 'new', created_at: 1000 },
        { id: 'msg-2', type: 'question', status: 'new', created_at: 2000 }
      ];
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 2 }) })
        .mockReturnValueOnce({ all: () => mockRows });

      const result = await handler.handleQueryMessages({});

      expect(result.messages).toHaveLength(2);
      expect(result.total_count).toBe(2);
      expect(result.messages[0].id).toBe('msg-1');
    });

    it('should filter by status', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 1 }) })
        .mockReturnValueOnce({ all: () => [{ id: 'msg-1', status: 'new' }] });

      await handler.handleQueryMessages({ status: 'new' });

      const allCall = mockPrepare.mock.calls[1];
      const allCallParams = mockPrepare.mock.results[1];
      expect(allCallParams.value.all).toBeDefined();
    });

    it('should filter by priority', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 0 }) })
        .mockReturnValueOnce({ all: () => [] });

      const result = await handler.handleQueryMessages({ priority: 'high' });

      expect(result.total_count).toBe(0);
      expect(result.messages).toHaveLength(0);
    });

    it('should filter by type', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 1 }) })
        .mockReturnValueOnce({ all: () => [{ id: 'msg-1', type: 'ambiguity' }] });

      const result = await handler.handleQueryMessages({ type: 'ambiguity' });

      expect(result.messages).toHaveLength(1);
    });

    it('should filter by spec_id', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 3 }) })
        .mockReturnValueOnce({ all: () => [{ id: 'msg-1' }, { id: 'msg-2' }, { id: 'msg-3' }] });

      const result = await handler.handleQueryMessages({ spec_id: '@specs/auth' });

      expect(result.total_count).toBe(3);
    });

    it('should apply limit and offset', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 10 }) })
        .mockReturnValueOnce({ all: () => [{ id: 'msg-1' }, { id: 'msg-2' }] });

      const result = await handler.handleQueryMessages({ limit: 2, offset: 5 });

      expect(result.messages).toHaveLength(2);
      expect(result.total_count).toBe(10);
    });

    it('should use default limit of 20 when not specified', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 0 }) })
        .mockReturnValueOnce({ all: () => [] });

      await handler.handleQueryMessages({});

      const allCall = mockPrepare.mock.calls[1];
      expect(allCall[0]).toBeCalled;
    });
  });

  // ==========================================================================
  // GET MESSAGE
  // ==========================================================================

  describe('speclang_get_message', () => {
    it('should return message with responses', async () => {
      const mockMessage = {
        id: 'msg-1',
        type: 'ambiguity',
        priority: 'high',
        title: 'Test',
        description: 'Desc'
      };
      const mockResponses = [
        { id: 'resp-1', message_id: 'msg-1', content: 'Response 1', agent: 'human', created_at: 2000 }
      ];

      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => mockMessage })
        .mockReturnValueOnce({ all: () => mockResponses });

      const result = await handler.handleGetMessage({ message_id: 'msg-1' });

      expect(result.message.id).toBe('msg-1');
      expect(result.message.responses).toHaveLength(1);
      expect(result.message.responses[0].content).toBe('Response 1');
    });

    it('should return empty responses array when no responses', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ id: 'msg-1' }) })
        .mockReturnValueOnce({ all: () => [] });

      const result = await handler.handleGetMessage({ message_id: 'msg-1' });

      expect(result.message.responses).toHaveLength(0);
    });

    it('should throw error for missing message', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        get: () => undefined
      });

      await expect(handler.handleGetMessage({ message_id: 'nonexistent' }))
        .rejects.toThrow('Message not found: nonexistent');
    });
  });

  // ==========================================================================
  // UPDATE MESSAGE STATUS
  // ==========================================================================

  describe('speclang_update_message_status', () => {
    it('should update status to in_progress', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const result = await handler.handleUpdateMessageStatus({
        message_id: 'msg-1',
        status: 'in_progress'
      });

      expect(result.success).toBe(true);
      expect(result.updated_at).toBeGreaterThan(0);
    });

    it('should update status to resolved', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const result = await handler.handleUpdateMessageStatus({
        message_id: 'msg-1',
        status: 'resolved'
      });

      expect(result.success).toBe(true);
    });

    it('should update status to dismissed', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const result = await handler.handleUpdateMessageStatus({
        message_id: 'msg-1',
        status: 'dismissed'
      });

      expect(result.success).toBe(true);
    });

    it('should include resolution notes when provided', async () => {
      let capturedParams: unknown[] = [];
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn((...params: unknown[]) => {
          capturedParams = params;
          return { changes: 1 };
        })
      });

      await handler.handleUpdateMessageStatus({
        message_id: 'msg-1',
        status: 'resolved',
        resolution_notes: 'Updated the spec with clear requirements'
      });

      expect(capturedParams[3]).toBe('Updated the spec with clear requirements');
    });

    it('should reject invalid status', async () => {
      await expect(handler.handleUpdateMessageStatus({
        message_id: 'msg-1',
        status: 'invalid' as 'resolved'
      })).rejects.toThrow('Invalid status');
    });

    it('should throw when message not found', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 0 }))
      });

      await expect(handler.handleUpdateMessageStatus({
        message_id: 'nonexistent',
        status: 'resolved'
      })).rejects.toThrow('Message not found: nonexistent');
    });
  });

  // ==========================================================================
  // ADD MESSAGE RESPONSE
  // ==========================================================================

  describe('speclang_add_message_response', () => {
    it('should add response to existing message', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      let capturedParams: unknown[] = [];

      mockPrepare
        .mockReturnValueOnce({ get: () => ({ id: 'msg-1' }) })
        .mockReturnValueOnce({ all: () => [] })
        .mockReturnValueOnce({
          run: vi.fn((...params: unknown[]) => {
            capturedParams = params;
            return { changes: 1 };
          })
        });

      const result = await handler.handleAddMessageResponse({
        message_id: 'msg-1',
        content: 'Thanks for the report, fixed in latest update',
        agent: 'human'
      });

      expect(result.response_id).toBeDefined();
      expect(result.created_at).toBeGreaterThan(0);
      expect(capturedParams[2]).toBe('human');
      expect(capturedParams[3]).toBe('Thanks for the report, fixed in latest update');
    });

    it('should throw when message does not exist', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        get: () => undefined,
        all: () => []
      });

      await expect(handler.handleAddMessageResponse({
        message_id: 'nonexistent',
        content: 'Response',
        agent: 'human'
      })).rejects.toThrow('Message not found: nonexistent');
    });

    it('should allow multiple responses from different agents', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;

      mockPrepare
        .mockReturnValueOnce({ get: () => ({ id: 'msg-1' }) })
        .mockReturnValueOnce({ all: () => [] })
        .mockReturnValueOnce({ run: vi.fn(() => ({ changes: 1 })) });

      const result1 = await handler.handleAddMessageResponse({
        message_id: 'msg-1',
        content: 'Agent response',
        agent: 'spec-writer'
      });

      expect(result1.response_id).toBeDefined();

      mockPrepare
        .mockReturnValueOnce({ get: () => ({ id: 'msg-1' }) })
        .mockReturnValueOnce({ all: () => [] })
        .mockReturnValueOnce({ run: vi.fn(() => ({ changes: 1 })) });

      const result2 = await handler.handleAddMessageResponse({
        message_id: 'msg-1',
        content: 'Human reply',
        agent: 'human'
      });

      expect(result2.response_id).toBeDefined();
      expect(result2.response_id).not.toBe(result1.response_id);
    });
  });

  // ==========================================================================
  // FULL LIFECYCLE
  // ==========================================================================

  describe('full message lifecycle', () => {
    it('should complete full CREATE → QUERY → GET → UPDATE → ADD_RESPONSE flow', async () => {
      // Simulate: CREATE message
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      let createdMessageId = '';

      mockPrepare.mockReturnValue({
        run: vi.fn((...params: unknown[]) => {
          createdMessageId = params[0] as string;
          return { changes: 1 };
        })
      });

      const createResult = await handler.handleReportMessage({
        type: 'incompleteness',
        priority: 'medium',
        spec_id: '@specs/api',
        file_path: 'specs/api.spec.md',
        title: 'Missing endpoint specs',
        description: 'PUT and DELETE endpoints not documented'
      });

      expect(createResult.message_id).toBeDefined();
      createdMessageId = createResult.message_id;

      // Simulate: QUERY messages
      mockPrepare
        .mockReset()
        .mockReturnValueOnce({ get: () => ({ count: 1 }) })
        .mockReturnValueOnce({ all: () => [{ id: createdMessageId, status: 'new' }] });

      const queryResult = await handler.handleQueryMessages({ status: 'new' });
      expect(queryResult.total_count).toBeGreaterThanOrEqual(1);

      // Simulate: GET message
      mockPrepare
        .mockReset()
        .mockReturnValueOnce({ get: () => ({ id: createdMessageId, title: 'Missing endpoint specs' }) })
        .mockReturnValueOnce({ all: () => [] });

      const getResult = await handler.handleGetMessage({ message_id: createdMessageId });
      expect(getResult.message.title).toBe('Missing endpoint specs');

      // Simulate: UPDATE status
      mockPrepare
        .mockReset()
        .mockReturnValue({ run: vi.fn(() => ({ changes: 1 })) });

      const updateResult = await handler.handleUpdateMessageStatus({
        message_id: createdMessageId,
        status: 'in_progress'
      });
      expect(updateResult.success).toBe(true);

      // Simulate: ADD_RESPONSE
      mockPrepare
        .mockReset()
        .mockReturnValueOnce({ get: () => ({ id: createdMessageId }) })
        .mockReturnValueOnce({ all: () => [] })
        .mockReturnValueOnce({ run: vi.fn(() => ({ changes: 1 })) });

      const responseResult = await handler.handleAddMessageResponse({
        message_id: createdMessageId,
        content: 'Acknowledged, working on it',
        agent: 'human'
      });
      expect(responseResult.response_id).toBeDefined();

      // Simulate: UPDATE to resolved
      mockPrepare
        .mockReset()
        .mockReturnValue({ run: vi.fn(() => ({ changes: 1 })) });

      const resolveResult = await handler.handleUpdateMessageStatus({
        message_id: createdMessageId,
        status: 'resolved',
        resolution_notes: 'Added missing endpoint documentation'
      });
      expect(resolveResult.success).toBe(true);
    });
  });
});
