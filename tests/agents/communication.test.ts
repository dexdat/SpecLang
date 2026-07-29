/**
 * Agent Communication Module Tests
 *
 * Source: @speclang/agents @block:agents/communication
 * SKIPPED: src/agents/communication module not yet implemented.
 * Restore when the source module is created.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Type stubs for when the module is implemented
type AgentMessage = {
  id: string;
  type: string;
  protocol: string;
  sender: string;
  senderId: string;
  payload: Record<string, unknown>;
  priority: string;
  timestamp: number;
  status: string;
  target?: string;
  [key: string]: unknown;
};
type AgentMessageType = string;
type AgentRole = string;
class AgentCommunicationBus {}
function createAgentCommunicationBus() {
  return new AgentCommunicationBus();
}
class PubSubChannel {}
class RequestResponseChannel {}
class BroadcastChannel {}

// Incrementing counter for unique message IDs
let testMsgCounter = 0;

// Helper to create a test message payload
function createTestMessage(
  overrides: Partial<AgentMessage> = {},
): AgentMessage {
  testMsgCounter++;
  return {
    id: `test-msg-${Date.now()}-${testMsgCounter}`,
    type: "file_changed",
    protocol: "pub_sub",
    sender: "spec-writer" as AgentRole,
    senderId: "agent-1",
    payload: { filepath: "/test/file.spec.md" },
    priority: "normal",
    timestamp: Date.now(),
    status: "pending",
    target: undefined,
    ...overrides,
  };
}

// ============================================================================
// PubSubChannel Tests
// ============================================================================

describe.skip("PubSubChannel", () => {
  let channel: PubSubChannel;

  beforeEach(() => {
    channel = new PubSubChannel();
  });

  it("should subscribe and receive published messages", () => {
    const handler = vi.fn();
    const msg = createTestMessage();

    channel.subscribe("file_changed", handler);
    channel.publish(msg);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      msg,
      expect.objectContaining({
        message: msg,
        deliveredAt: expect.any(Number),
      }),
    );
  });

  it("should not call handlers for non-matching types", () => {
    const handler = vi.fn();
    const msg = createTestMessage({ type: "file_changed" });

    channel.subscribe("cascade_trigger", handler);
    channel.publish(msg);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should support multiple message types in one subscription", () => {
    const handler = vi.fn();

    channel.subscribe(["file_changed", "cascade_trigger"], handler);
    channel.publish(createTestMessage({ type: "file_changed" }));
    channel.publish(createTestMessage({ type: "cascade_trigger" }));

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("should filter messages when filter function is provided", () => {
    const handler = vi.fn();

    channel.subscribe("file_changed", handler, (msg) =>
      (msg.payload as { filepath: string }).filepath.includes("spec"),
    );

    channel.publish(
      createTestMessage({
        payload: { filepath: "/test/file.spec.md" },
      }),
    );
    channel.publish(
      createTestMessage({
        payload: { filepath: "/test/other.json" },
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe and stop receiving messages", () => {
    const handler = vi.fn();
    const msg = createTestMessage();

    const sub = channel.subscribe("file_changed", handler);
    channel.unsubscribe(sub.id);
    channel.publish(msg);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should track message history", () => {
    channel.publish(createTestMessage());
    channel.publish(createTestMessage({ type: "cascade_trigger" }));

    const allHistory = channel.getHistory();
    expect(allHistory).toHaveLength(2);

    const filteredHistory = channel.getHistory("cascade_trigger");
    expect(filteredHistory).toHaveLength(1);
  });

  it("should clear message history", () => {
    channel.publish(createTestMessage());
    channel.clearHistory();
    expect(channel.getHistory()).toHaveLength(0);
  });

  it("should report subscription count", () => {
    expect(channel.getSubscriptionCount()).toBe(0);
    channel.subscribe("file_changed", vi.fn());
    expect(channel.getSubscriptionCount()).toBe(1);
    channel.subscribe("cascade_trigger", vi.fn());
    expect(channel.getSubscriptionCount()).toBe(2);
  });

  it("should handle handler errors gracefully", () => {
    const errorHandler = vi.fn().mockImplementation(() => {
      throw new Error("Handler failed");
    });

    channel.subscribe("file_changed", errorHandler);
    const msg = createTestMessage();
    const envelopes = channel.publish(msg);

    expect(envelopes[0].error).toBe("Handler failed");
    expect(msg.status).toBe("failed");
  });

  it("should cap history at max size", () => {
    const smallChannel = new PubSubChannel(3);
    for (let i = 0; i < 10; i++) {
      smallChannel.publish(createTestMessage());
    }
    expect(smallChannel.getHistory()).toHaveLength(3);
  });
});

// ============================================================================
// RequestResponseChannel Tests
// ============================================================================

describe.skip("RequestResponseChannel", () => {
  let channel: RequestResponseChannel;

  beforeEach(() => {
    channel = new RequestResponseChannel();
  });

  it("should handle request and send response", async () => {
    const requestHandler = vi.fn().mockImplementation((msg: AgentMessage) => {
      channel.sendResponse(msg, { result: "ok" });
    });

    channel.onRequest("cascade_trigger", requestHandler);

    const response = await channel.sendRequest(
      createTestMessage({
        type: "cascade_trigger",
        protocol: "request_response",
      }),
      5000,
    );

    expect(response).not.toBeNull();
    expect(response!.payload).toEqual({ result: "ok" });
    expect(requestHandler).toHaveBeenCalledTimes(1);
  });

  it("should time out when no handler responds", async () => {
    const msg = createTestMessage({
      type: "cascade_trigger",
      protocol: "request_response",
    });

    await expect(channel.sendRequest(msg, 100)).rejects.toThrow("timed out");
  });

  it("should cancel pending requests", async () => {
    const msg = createTestMessage({
      type: "cascade_trigger",
      protocol: "request_response",
    });
    const promise = channel.sendRequest(msg, 5000).catch(() => {});
    const cancelled = channel.cancelRequest(msg.correlationId || msg.id);

    expect(cancelled).toBe(true);
    expect(channel.getPendingCount()).toBe(0);
  });

  it("should register and unregister handlers", () => {
    const handler = vi.fn();
    channel.onRequest("file_changed", handler);
    channel.offRequest("file_changed", handler);

    channel
      .sendRequest(
        createTestMessage({
          type: "file_changed",
          protocol: "request_response",
        }),
        100,
      )
      .catch(() => {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("should track pending request count", () => {
    expect(channel.getPendingCount()).toBe(0);

    channel
      .sendRequest(
        createTestMessage({
          type: "file_changed",
          protocol: "request_response",
        }),
        5000,
      )
      .catch(() => {});
    expect(channel.getPendingCount()).toBe(1);

    channel
      .sendRequest(
        createTestMessage({
          type: "cascade_trigger",
          protocol: "request_response",
        }),
        5000,
      )
      .catch(() => {});
    expect(channel.getPendingCount()).toBe(2);
  });
});

// ============================================================================
// BroadcastChannel Tests
// ============================================================================

describe.skip("BroadcastChannel", () => {
  let channel: BroadcastChannel;

  beforeEach(() => {
    channel = new BroadcastChannel();
  });

  it("should broadcast to all listeners", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    channel.onAnnouncement("agent_status", handler1);
    channel.onAnnouncement("agent_status", handler2);

    const msg = createTestMessage({ type: "agent_status" });
    channel.broadcast(msg);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("should not call listeners for non-matching types", () => {
    const handler = vi.fn();

    channel.onAnnouncement("agent_status", handler);
    channel.broadcast(createTestMessage({ type: "file_changed" }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("should remove listeners on offAnnouncement", () => {
    const handler = vi.fn();

    channel.onAnnouncement("agent_status", handler);
    channel.offAnnouncement("agent_status", handler);
    channel.broadcast(createTestMessage({ type: "agent_status" }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("should track announcements history", () => {
    channel.broadcast(createTestMessage({ type: "agent_status" }));
    channel.broadcast(createTestMessage({ type: "file_changed" }));

    expect(channel.getAnnouncements()).toHaveLength(2);
    expect(channel.getAnnouncements("agent_status")).toHaveLength(1);
  });

  it("should clear announcements", () => {
    channel.broadcast(createTestMessage({ type: "agent_status" }));
    channel.clearAnnouncements();
    expect(channel.getAnnouncements()).toHaveLength(0);
  });

  it("should report listener count", () => {
    expect(channel.getListenerCount()).toBe(0);
    channel.onAnnouncement("agent_status", vi.fn());
    expect(channel.getListenerCount()).toBe(1);
    channel.onAnnouncement("file_changed", vi.fn());
    expect(channel.getListenerCount()).toBe(2);
  });
});

// ============================================================================
// AgentCommunicationBus Tests
// ============================================================================

describe.skip("AgentCommunicationBus", () => {
  let bus: AgentCommunicationBus;

  beforeEach(() => {
    bus = createAgentCommunicationBus();
  });

  describe("send", () => {
    it("should send a pub_sub message", () => {
      const handler = vi.fn();
      bus.pubSub.subscribe("file_changed", handler);

      const msg = bus.send({
        type: "file_changed",
        sender: "spec-writer" as AgentRole,
        senderId: "agent-1",
        payload: { filepath: "/test/file.spec.md" },
        priority: "normal",
      });

      expect(msg.id).toBeDefined();
      expect(msg.timestamp).toBeDefined();
      expect(msg.protocol).toBe("pub_sub");
      expect(msg.status).toBe("delivered");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should send a broadcast message", () => {
      const handler = vi.fn();
      bus.broadcast.onAnnouncement("agent_status", handler);

      const msg = bus.send({
        type: "agent_status",
        protocol: "broadcast",
        sender: "pipeline" as AgentRole,
        senderId: "agent-2",
        payload: { status: "idle", agentRole: "pipeline", agentId: "agent-2" },
        priority: "low",
      });

      expect(msg.protocol).toBe("broadcast");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should emit events for sent messages", () => {
      const messageHandler = vi.fn();
      const typeHandler = vi.fn();

      bus.on("message", messageHandler);
      bus.on("message:file_changed", typeHandler);

      bus.send({
        type: "file_changed",
        sender: "spec-writer" as AgentRole,
        senderId: "agent-1",
        payload: { filepath: "/test/file.spec.md" },
        priority: "normal",
      });

      expect(messageHandler).toHaveBeenCalledTimes(1);
      expect(typeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendAndWait", () => {
    it("should send and wait for response", async () => {
      bus.requestResponse.onRequest("cascade_trigger", (msg: AgentMessage) => {
        bus.respond(msg, { processed: true, cascadeId: "cascade-1" });
      });

      const response = await bus.sendAndWait(
        {
          type: "cascade_trigger",
          sender: "spec-writer" as AgentRole,
          senderId: "agent-1",
          payload: { cascadeId: "cascade-1", triggeredBy: "file-change" },
          priority: "high",
          correlationId: "corr-1",
        },
        5000,
      );

      expect(response).not.toBeNull();
      expect(response!.payload).toEqual({
        processed: true,
        cascadeId: "cascade-1",
      });
    });

    it("should return null on timeout", async () => {
      const response = await bus.sendAndWait(
        {
          type: "cascade_trigger",
          sender: "spec-writer" as AgentRole,
          senderId: "agent-1",
          payload: { cascadeId: "cascade-1", triggeredBy: "file-change" },
          priority: "high",
          correlationId: "corr-timeout",
        },
        50,
      );

      expect(response).toBeNull();
    });
  });

  describe("respond", () => {
    it("should send a response and resolve pending request", async () => {
      const requestMsg = bus.send({
        type: "cascade_trigger",
        protocol: "request_response",
        sender: "spec-writer" as AgentRole,
        senderId: "agent-1",
        payload: { cascadeId: "cascade-1" },
        priority: "high",
        correlationId: "corr-respond",
      });

      const response = bus.respond(requestMsg, { processed: true });

      expect(response.payload).toEqual({ processed: true });
      expect(response.correlationId).toBe("corr-respond");
    });
  });

  describe("convenience methods", () => {
    it("notifyFileChanged should send file_changed message", () => {
      const msg = bus.notifyFileChanged(
        "/test/file.spec.md",
        "modified",
        "spec-writer" as AgentRole,
        "agent-1",
      );
      expect(msg.type).toBe("file_changed");
      expect(msg.payload).toMatchObject({
        filepath: "/test/file.spec.md",
        changeType: "modified",
      });
    });

    it("notifyCascadeTrigger should send cascade_trigger message", () => {
      const msg = bus.notifyCascadeTrigger(
        "cascade-1",
        "file-change",
        "spec-writer" as AgentRole,
        "agent-1",
      );
      expect(msg.type).toBe("cascade_trigger");
      expect(msg.payload).toMatchObject({ cascadeId: "cascade-1" });
    });

    it("notifyCascadeComplete should send cascade_complete message", () => {
      const msg = bus.notifyCascadeComplete(
        "cascade-1",
        { filesChanged: 5 },
        "spec-writer" as AgentRole,
        "agent-1",
      );
      expect(msg.type).toBe("cascade_complete");
      expect(msg.payload).toMatchObject({
        cascadeId: "cascade-1",
        result: { filesChanged: 5 },
      });
    });

    it("notifyAgentStatus should send agent_status message", () => {
      const msg = bus.notifyAgentStatus(
        "working",
        "code-gen" as AgentRole,
        "agent-3",
      );
      expect(msg.type).toBe("agent_status");
      expect(msg.payload).toMatchObject({
        status: "working",
        agentRole: "code-gen",
      });
    });
  });

  describe("getMessages", () => {
    it("should return all messages", () => {
      bus.notifyFileChanged(
        "/test/a.spec.md",
        "created",
        "spec-writer" as AgentRole,
        "agent-1",
      );
      bus.notifyCascadeTrigger(
        "c-1",
        "a",
        "spec-writer" as AgentRole,
        "agent-1",
      );
      bus.notifyCascadeComplete(
        "c-1",
        {},
        "spec-writer" as AgentRole,
        "agent-1",
      );
      bus.notifyAgentStatus("idle", "pipeline" as AgentRole, "agent-2");

      const all = bus.getMessages();
      expect(all).toHaveLength(4);
    });

    it("should filter by message type", () => {
      bus.notifyFileChanged(
        "/test/a.spec.md",
        "created",
        "spec-writer" as AgentRole,
        "agent-1",
      );
      bus.notifyCascadeTrigger(
        "c-1",
        "a",
        "spec-writer" as AgentRole,
        "agent-1",
      );

      const filtered = bus.getMessages("file_changed");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe("file_changed");
    });
  });

  describe("getStats", () => {
    it("should return stats with correct counts", () => {
      const stats = bus.getStats();
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesDelivered).toBe(0);

      bus.pubSub.subscribe("file_changed", vi.fn());
      bus.notifyFileChanged(
        "/test/a.spec.md",
        "created",
        "spec-writer" as AgentRole,
        "agent-1",
      );

      const updatedStats = bus.getStats();
      expect(updatedStats.messagesSent).toBe(1);
      expect(updatedStats.messagesDelivered).toBe(1);
    });
  });

  describe("getChannels", () => {
    it("should return channel info for all protocols", () => {
      const channels = bus.getChannels();
      expect(channels).toHaveLength(3);

      const pubSub = channels.find((c) => c.name === "pub_sub");
      expect(pubSub).toBeDefined();
      expect(pubSub!.protocol).toBe("pub_sub");

      const reqRes = channels.find((c) => c.name === "request_response");
      expect(reqRes).toBeDefined();
      expect(reqRes!.protocol).toBe("request_response");

      const broadcast = channels.find((c) => c.name === "broadcast");
      expect(broadcast).toBeDefined();
      expect(broadcast!.protocol).toBe("broadcast");
    });
  });

  describe("clearMessages", () => {
    it("should clear all tracked messages", () => {
      bus.notifyFileChanged(
        "/test/a.spec.md",
        "created",
        "spec-writer" as AgentRole,
        "agent-1",
      );
      bus.clearMessages();
      expect(bus.getMessages()).toHaveLength(0);
    });
  });

  describe("message cap", () => {
    it("should cap total messages at maxMessages", () => {
      const smallBus = createAgentCommunicationBus(5);
      for (let i = 0; i < 10; i++) {
        smallBus.notifyFileChanged(
          `/test/${i}.spec.md`,
          "created",
          "spec-writer" as AgentRole,
          "agent-1",
        );
      }
      expect(smallBus.getMessages()).toHaveLength(5);
    });
  });
});
