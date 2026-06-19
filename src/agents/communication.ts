/**
 * Agent Communication Module
 *
 * Generated from: @speclang/agents @block:agents/communication
 *
 * Provides inter-agent messaging with pub/sub, request/response,
 * and broadcast protocols for agent coordination.
 */

import { EventEmitter } from 'events';
import { AgentRole } from './types';

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type AgentMessageType =
  | 'file_changed'
  | 'cascade_trigger'
  | 'cascade_complete'
  | 'agent_status';

export type AgentMessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export type AgentMessageProtocol = 'pub_sub' | 'request_response' | 'broadcast';

export type AgentMessageStatus = 'pending' | 'delivered' | 'failed';

// ============================================================================
// MESSAGE INTERFACES
// ============================================================================

export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  protocol: AgentMessageProtocol;
  sender: AgentRole;
  senderId: string;
  target?: AgentRole | AgentRole[];
  payload: unknown;
  priority: AgentMessagePriority;
  timestamp: number;
  status: AgentMessageStatus;
  correlationId?: string;
  ttl?: number;
}

export interface AgentMessageEnvelope {
  message: AgentMessage;
  deliveredAt?: number;
  error?: string;
}

export interface Subscription {
  id: string;
  messageTypes: AgentMessageType[];
  handler: MessageHandler;
  filter?: (message: AgentMessage) => boolean;
}

export type MessageHandler = (message: AgentMessage, envelope: AgentMessageEnvelope) => void;

export interface PendingRequest {
  id: string;
  message: AgentMessage;
  resolve: (value: AgentMessage | null) => void;
  reject: (reason: Error) => void;
  timeout: number;
  timer?: ReturnType<typeof setTimeout>;
}

export interface CommunicationStats {
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  activeSubscriptions: number;
  pendingRequests: number;
  channels: Record<string, number>;
}

export interface ChannelInfo {
  name: string;
  protocol: AgentMessageProtocol;
  subscriberCount: number;
  messageCount: number;
}

// ============================================================================
// HELPERS
// ============================================================================

let messageCounter = 0;

function generateMessageId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateSubscriptionId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// PUB/SUB CHANNEL
// ============================================================================

export class PubSubChannel {
  private subscriptions: Map<string, Subscription>;
  private history: AgentMessage[];
  private maxHistory: number;

  constructor(maxHistory = 100) {
    this.subscriptions = new Map();
    this.history = [];
    this.maxHistory = maxHistory;
  }

  subscribe(
    messageTypes: AgentMessageType | AgentMessageType[],
    handler: MessageHandler,
    filter?: (message: AgentMessage) => boolean,
  ): Subscription {
    const types = Array.isArray(messageTypes) ? messageTypes : [messageTypes];
    const subscription: Subscription = {
      id: generateSubscriptionId(),
      messageTypes: types,
      handler,
      filter,
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  publish(message: AgentMessage): AgentMessageEnvelope[] {
    const envelopes: AgentMessageEnvelope[] = [];

    this.history.push(message);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    for (const sub of Array.from(this.subscriptions.values())) {
      if (!sub.messageTypes.includes(message.type)) continue;
      if (sub.filter && !sub.filter(message)) continue;

      const envelope: AgentMessageEnvelope = {
        message,
        deliveredAt: Date.now(),
      };

      try {
        sub.handler(message, envelope);
        message.status = 'delivered';
        envelopes.push(envelope);
      } catch (err) {
        envelope.error = err instanceof Error ? err.message : String(err);
        message.status = 'failed';
        envelopes.push(envelope);
      }
    }

    return envelopes;
  }

  getHistory(messageType?: AgentMessageType): AgentMessage[] {
    if (messageType) {
      return this.history.filter(m => m.type === messageType);
    }
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  getMessageCount(): number {
    return this.history.length;
  }
}

// ============================================================================
// REQUEST/RESPONSE CHANNEL
// ============================================================================

export class RequestResponseChannel {
  private pendingRequests: Map<string, PendingRequest>;
  private handlers: Map<AgentMessageType, MessageHandler[]>;
  private defaultTimeout: number;

  constructor(defaultTimeout = 30000) {
    this.pendingRequests = new Map();
    this.handlers = new Map();
    this.defaultTimeout = defaultTimeout;
  }

  onRequest(messageType: AgentMessageType, handler: MessageHandler): void {
    const existing = this.handlers.get(messageType) || [];
    existing.push(handler);
    this.handlers.set(messageType, existing);
  }

  offRequest(messageType: AgentMessageType, handler: MessageHandler): void {
    const existing = this.handlers.get(messageType);
    if (!existing) return;
    const filtered = existing.filter(h => h !== handler);
    if (filtered.length === 0) {
      this.handlers.delete(messageType);
    } else {
      this.handlers.set(messageType, filtered);
    }
  }

  async sendRequest(
    message: AgentMessage,
    timeout?: number,
  ): Promise<AgentMessage | null> {
    const actualTimeout = message.ttl ?? timeout ?? this.defaultTimeout;

    return new Promise<AgentMessage | null>((resolve, reject) => {
      const pending: PendingRequest = {
        id: message.correlationId || message.id,
        message,
        resolve,
        reject,
        timeout: actualTimeout,
      };

      pending.timer = setTimeout(() => {
        this.pendingRequests.delete(pending.id);
        reject(new Error(`Request timed out after ${actualTimeout}ms: ${message.type}`));
      }, actualTimeout);

      this.pendingRequests.set(pending.id, pending);

      const typeHandlers = this.handlers.get(message.type) || [];
      for (const handler of typeHandlers) {
        try {
          handler(message, { message });
        } catch (_err) {
          // Handler error, continue to others
        }
      }
    });
  }

  sendResponse(requestMessage: AgentMessage, responsePayload: unknown): AgentMessage {
    const response: AgentMessage = {
      id: generateMessageId(),
      type: requestMessage.type,
      protocol: 'request_response',
      sender: requestMessage.target as AgentRole || requestMessage.sender,
      senderId: requestMessage.target as string || requestMessage.senderId,
      target: requestMessage.sender,
      payload: responsePayload,
      priority: requestMessage.priority,
      timestamp: Date.now(),
      status: 'delivered',
      correlationId: requestMessage.correlationId || requestMessage.id,
    };

    const pending = this.pendingRequests.get(response.correlationId!);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(pending.id);
      pending.resolve(response);
    }

    return response;
  }

  cancelRequest(correlationId: string): boolean {
    const pending = this.pendingRequests.get(correlationId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(pending.id);
      pending.reject(new Error('Request cancelled'));
      return true;
    }
    return false;
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// ============================================================================
// BROADCAST CHANNEL
// ============================================================================

export class BroadcastChannel {
  private listeners: Map<string, MessageHandler[]>;
  private announcements: AgentMessage[];
  private maxAnnouncements: number;

  constructor(maxAnnouncements = 50) {
    this.listeners = new Map();
    this.announcements = [];
    this.maxAnnouncements = maxAnnouncements;
  }

  onAnnouncement(messageType: AgentMessageType, handler: MessageHandler): void {
    const existing = this.listeners.get(messageType) || [];
    existing.push(handler);
    this.listeners.set(messageType, existing);
  }

  offAnnouncement(messageType: AgentMessageType, handler: MessageHandler): void {
    const existing = this.listeners.get(messageType);
    if (!existing) return;
    const filtered = existing.filter(h => h !== handler);
    if (filtered.length === 0) {
      this.listeners.delete(messageType);
    } else {
      this.listeners.set(messageType, filtered);
    }
  }

  broadcast(message: AgentMessage): AgentMessageEnvelope[] {
    message.protocol = 'broadcast';
    const envelopes: AgentMessageEnvelope[] = [];

    this.announcements.push(message);
    if (this.announcements.length > this.maxAnnouncements) {
      this.announcements = this.announcements.slice(-this.maxAnnouncements);
    }

    const typeListeners = this.listeners.get(message.type) || [];
    for (const handler of typeListeners) {
      const envelope: AgentMessageEnvelope = {
        message,
        deliveredAt: Date.now(),
      };

      try {
        handler(message, envelope);
        message.status = 'delivered';
      } catch (err) {
        envelope.error = err instanceof Error ? err.message : String(err);
        message.status = 'failed';
      }

      envelopes.push(envelope);
    }

    return envelopes;
  }

  getAnnouncements(messageType?: AgentMessageType): AgentMessage[] {
    if (messageType) {
      return this.announcements.filter(a => a.type === messageType);
    }
    return [...this.announcements];
  }

  clearAnnouncements(): void {
    this.announcements = [];
  }

  getListenerCount(): number {
    let count = 0;
    for (const listeners of Array.from(this.listeners.values())) {
      count += listeners.length;
    }
    return count;
  }
}

// ============================================================================
// AGENT COMMUNICATION BUS
// ============================================================================

export class AgentCommunicationBus extends EventEmitter {
  readonly pubSub: PubSubChannel;
  readonly requestResponse: RequestResponseChannel;
  readonly broadcast: BroadcastChannel;

  private messages: AgentMessage[];
  private maxMessages: number;

  constructor(maxMessages = 1000) {
    super();
    this.pubSub = new PubSubChannel();
    this.requestResponse = new RequestResponseChannel();
    this.broadcast = new BroadcastChannel();
    this.messages = [];
    this.maxMessages = maxMessages;
  }

  send(message: Omit<AgentMessage, 'id' | 'timestamp' | 'status' | 'protocol'> & { protocol?: AgentMessageProtocol }): AgentMessage {
    const protocol = message.protocol || 'pub_sub';
    const fullMessage: AgentMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
      status: 'pending',
      protocol,
    };

    this.messages.push(fullMessage);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    switch (protocol) {
      case 'pub_sub':
        this.pubSub.publish(fullMessage);
        break;
      case 'request_response':
        this.requestResponse.sendRequest(fullMessage).catch(() => {});
        break;
      case 'broadcast':
        this.broadcast.broadcast(fullMessage);
        break;
    }

    this.emit('message', fullMessage);
    this.emit(`message:${fullMessage.type}`, fullMessage);

    return fullMessage;
  }

  async sendAndWait(
    message: Omit<AgentMessage, 'id' | 'timestamp' | 'status' | 'protocol'> & { protocol?: 'request_response' },
    timeout?: number,
  ): Promise<AgentMessage | null> {
    const fullMessage: AgentMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
      status: 'pending',
      protocol: 'request_response',
    };

    this.messages.push(fullMessage);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    try {
      const response = await this.requestResponse.sendRequest(fullMessage, timeout);
      this.emit('response', { request: fullMessage, response });
      return response;
    } catch (err) {
      this.emit('request-failed', { request: fullMessage, error: err });
      return null;
    }
  }

  respond(request: AgentMessage, payload: unknown): AgentMessage {
    const response = this.requestResponse.sendResponse(request, payload);
    this.emit('response-sent', { request, response });
    return response;
  }

  notifyFileChanged(filepath: string, changeType: 'created' | 'modified' | 'deleted', senderRole: AgentRole, senderId: string): AgentMessage {
    return this.send({
      type: 'file_changed',
      sender: senderRole,
      senderId,
      payload: { filepath, changeType },
      priority: 'normal',
      target: undefined,
    });
  }

  notifyCascadeTrigger(cascadeId: string, triggeredBy: string, senderRole: AgentRole, senderId: string): AgentMessage {
    return this.send({
      type: 'cascade_trigger',
      sender: senderRole,
      senderId,
      payload: { cascadeId, triggeredBy },
      priority: 'high',
      target: undefined,
    });
  }

  notifyCascadeComplete(cascadeId: string, result: unknown, senderRole: AgentRole, senderId: string): AgentMessage {
    return this.send({
      type: 'cascade_complete',
      sender: senderRole,
      senderId,
      payload: { cascadeId, result },
      priority: 'normal',
      target: undefined,
    });
  }

  notifyAgentStatus(status: string, senderRole: AgentRole, senderId: string): AgentMessage {
    return this.send({
      type: 'agent_status',
      sender: senderRole,
      senderId,
      payload: { status, agentRole: senderRole, agentId: senderId },
      priority: 'low',
      target: undefined,
    });
  }

  getMessages(messageType?: AgentMessageType): AgentMessage[] {
    if (messageType) {
      return this.messages.filter(m => m.type === messageType);
    }
    return [...this.messages];
  }

  getStats(): CommunicationStats {
    const sent = this.messages.length;
    const delivered = this.messages.filter(m => m.status === 'delivered').length;
    const failed = this.messages.filter(m => m.status === 'failed').length;

    return {
      messagesSent: sent,
      messagesDelivered: delivered,
      messagesFailed: failed,
      activeSubscriptions: this.pubSub.getSubscriptionCount(),
      pendingRequests: this.requestResponse.getPendingCount(),
      channels: {
        pub_sub: this.pubSub.getMessageCount(),
        request_response: this.requestResponse.getPendingCount(),
        broadcast: this.broadcast.getListenerCount(),
      },
    };
  }

  getChannels(): ChannelInfo[] {
    return [
      {
        name: 'pub_sub',
        protocol: 'pub_sub',
        subscriberCount: this.pubSub.getSubscriptionCount(),
        messageCount: this.pubSub.getMessageCount(),
      },
      {
        name: 'request_response',
        protocol: 'request_response',
        subscriberCount: this.requestResponse.getPendingCount(),
        messageCount: this.messages.filter(m => m.protocol === 'request_response').length,
      },
      {
        name: 'broadcast',
        protocol: 'broadcast',
        subscriberCount: this.broadcast.getListenerCount(),
        messageCount: this.broadcast.getAnnouncements().length,
      },
    ];
  }

  clearMessages(): void {
    this.messages = [];
  }
}

/**
 * Create a new AgentCommunicationBus
 */
export function createAgentCommunicationBus(maxMessages?: number): AgentCommunicationBus {
  return new AgentCommunicationBus(maxMessages);
}
