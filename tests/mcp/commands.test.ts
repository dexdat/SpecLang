/**
 * SPECLANG-GENERATED: MCP Command Queue Tools Tests
 * Source: @speclang/mcp
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandsToolHandler } from '../../src/mcp/tools/commands.js';
import type { SpecLangDB } from '../../src/db/index.js';

// Mock database
const createMockDb = () => ({
  prepare: vi.fn(() => ({
    get: vi.fn(() => ({})),
    run: vi.fn(() => ({ changes: 1 })),
    all: vi.fn(() => [])
  })),
  transaction: vi.fn((fn: () => void) => fn())
});

describe('CommandsToolHandler', () => {
  let handler: CommandsToolHandler;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    const db = {
      getDatabase: () => mockDb
    } as unknown as SpecLangDB;
    handler = new CommandsToolHandler(db);
    vi.clearAllMocks();
  });

  describe('handleGetStatus', () => {
    it('should return correct status counts', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 2 }) })
        .mockReturnValueOnce({ get: () => ({ count: 5 }) })
        .mockReturnValueOnce({ get: () => ({ max_depth: 3 }) })
        .mockReturnValueOnce({ get: () => ({ max_created: 1704067200 }) })
        .mockReturnValueOnce({ get: () => ({ count: 0 }) });

      const result = await handler.handleGetStatus();

      expect(result.active_sessions).toBe(2);
      expect(result.queue_depth).toBe(5);
      expect(result.cascade_depth).toBe(3);
      expect(result.last_build).toBe(1704067200);
    });

    it('should detect convergence when no activity', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare
        .mockReturnValueOnce({ get: () => ({ count: 0 }) })
        .mockReturnValueOnce({ get: () => ({ count: 0 }) })
        .mockReturnValueOnce({ get: () => ({ max_depth: null }) })
        .mockReturnValueOnce({ get: () => ({ max_created: null }) })
        .mockReturnValueOnce({ get: () => ({ count: 0 }) });

      const result = await handler.handleGetStatus();

      expect(result.converged).toBe(true);
      expect(result.active_sessions).toBe(0);
      expect(result.queue_depth).toBe(0);
    });
  });

  describe('handleQueryCommands', () => {
    it('should query pending commands with default params', async () => {
      const mockCommands = [
        {
          command_id: 'cmd-1',
          cascade_id: 'cascade-1',
          action: 'generate',
          target_file: 'src/auth.ts',
          session_id: 'session-1',
          payload: '{"key": "value"}',
          priority: 10,
          status: 'pending',
          created_at: 1704067200,
          updated_at: 1704067200
        }
      ];

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        all: () => mockCommands
      });

      const result = await handler.handleQueryCommands({});

      expect(result).toHaveLength(1);
      expect(result[0].command_id).toBe('cmd-1');
      expect(result[0].payload).toEqual({ key: 'value' });
    });
  });

  describe('handleInsertCommand', () => {
    it('should insert command and return id', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const result = await handler.handleInsertCommand({
        cascade_id: 'cascade-1',
        action: 'generate',
        target_file: 'src/auth.ts',
        priority: 10
      });

      expect(result.command_id).toBeDefined();
      expect(result.command_id.length).toBeGreaterThan(0);
    });
  });

  describe('handleUpdateCommand', () => {
    it('should update command status', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const result = await handler.handleUpdateCommand({
        command_id: 'cmd-1',
        status: 'completed'
      });

      expect(result.updated).toBe(true);
    });
  });

  describe('handleDeleteCommand', () => {
    it('should delete command', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 1 }))
      });

      const result = await handler.handleDeleteCommand({
        command_id: 'cmd-1'
      });

      expect(result.deleted).toBe(true);
    });
  });

  describe('handleGetNextCommand', () => {
    it('should return highest priority pending command', async () => {
      const mockCommand = {
        command_id: 'cmd-1',
        cascade_id: 'cascade-1',
        action: 'generate',
        target_file: 'src/auth.ts',
        session_id: 'session-1',
        payload: null,
        priority: 10,
        status: 'pending',
        created_at: 1704067200,
        updated_at: 1704067200
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        get: () => mockCommand
      });

      const result = await handler.handleGetNextCommand();

      expect(result).not.toBeNull();
      expect(result?.command_id).toBe('cmd-1');
    });

    it('should return null when no pending commands', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        get: () => undefined
      });

      const result = await handler.handleGetNextCommand();

      expect(result).toBeNull();
    });
  });

  describe('handleClearCompleted', () => {
    it('should clear old completed commands', async () => {
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({
        run: vi.fn(() => ({ changes: 5 }))
      });

      const result = await handler.handleClearCompleted({});

      expect(result.cleared).toBe(5);
    });
  });
});
