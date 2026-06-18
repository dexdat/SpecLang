/**
 * SPECLANG-GENERATED: MCP Message Inbox Tools
 * Source: @speclang/mcp/messages
 */

import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import {
  initMessageDB,
  createMessage,
  queryMessages,
  getMessage,
  updateMessageStatus,
  addMessageResponse
} from '../message-db.js';
import type {
  ReportMessageInput,
  QueryMessagesInput,
  GetMessageInput,
  UpdateMessageStatusInput,
  AddMessageResponseInput
} from '../types.js';

/**
 * Message inbox tool handler
 */
export class MessagesToolHandler {
  private db: SpecLangDB;

  constructor(db: SpecLangDB) {
    this.db = db;
  }

  /**
   * Handle speclang_report_message - Agent reports a spec issue or question
   */
  async handleReportMessage(args: ReportMessageInput): Promise<{ message_id: string; created_at: number }> {
    const db = this.db.getDatabase();
    initMessageDB(db);
    return createMessage(db, args);
  }

  /**
   * Handle speclang_query_messages - Human agent queries message inbox
   */
  async handleQueryMessages(args: QueryMessagesInput): Promise<{ messages: Record<string, unknown>[]; total_count: number }> {
    const db = this.db.getDatabase();
    initMessageDB(db);
    return queryMessages(db, args);
  }

  /**
   * Handle speclang_get_message - Get specific message by ID
   */
  async handleGetMessage(args: GetMessageInput): Promise<{ message: Record<string, unknown> }> {
    const db = this.db.getDatabase();
    initMessageDB(db);
    const message = getMessage(db, args.message_id);
    if (!message) {
      throw new Error(`Message not found: ${args.message_id}`);
    }
    return { message };
  }

  /**
   * Handle speclang_update_message_status - Update message status
   */
  async handleUpdateMessageStatus(args: UpdateMessageStatusInput): Promise<{ success: boolean; updated_at: number }> {
    const db = this.db.getDatabase();
    initMessageDB(db);

    const validStatuses = ['in_progress', 'resolved', 'dismissed'];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Invalid status: ${args.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = updateMessageStatus(db, args);
    if (!result.success) {
      throw new Error(`Message not found: ${args.message_id}`);
    }
    return result;
  }

  /**
   * Handle speclang_add_message_response - Add response to message
   */
  async handleAddMessageResponse(args: AddMessageResponseInput): Promise<{ response_id: string; created_at: number }> {
    const db = this.db.getDatabase();
    initMessageDB(db);

    const message = getMessage(db, args.message_id);
    if (!message) {
      throw new Error(`Message not found: ${args.message_id}`);
    }

    return addMessageResponse(db, args);
  }
}
