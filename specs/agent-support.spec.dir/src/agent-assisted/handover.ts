/**
 * SPECLANG-GENERATED: Human-agent handover management for agent-assisted mode
 * Source: @specs/agent-support-levels/levels#agent-assisted
 */

import { HandoverEvent, HandoverRequest } from './types';

/**
 * Handover manager for agent-assisted mode
 */
export class HandoverManager {
  private handovers: Map<string, HandoverEvent[]>;
  private pendingHandoffs: Map<string, HandoverRequest>;

  constructor() {
    this.handovers = new Map();
    this.pendingHandoffs = new Map();
  }

  /**
   * Request a handover between human and agent
   */
  async requestHandover(
    actionId: string,
    from: 'human' | 'agent',
    to: 'human' | 'agent',
    reason: string,
    context: Record<string, unknown>
  ): Promise<HandoverRequest> {
    const request: HandoverRequest = {
      id: `handover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionId,
      from,
      to,
      reason,
      context,
      status: 'pending',
      requestedAt: new Date()
    };

    this.pendingHandoffs.set(request.id, request);

    // Notify appropriate party
    if (to === 'human') {
      await this.notifyHuman(request);
    } else {
      await this.notifyAgent(request);
    }

    return request;
  }

  /**
   * Complete a handover request
   */
  async completeHandover(
    requestId: string,
    completedBy: string
  ): Promise<void> {
    const request = this.pendingHandoffs.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid handover request');
    }

    const handover: HandoverEvent = {
      id: requestId,
      from: request.from,
      to: request.to,
      reason: request.reason,
      context: request.context,
      timestamp: new Date()
    };

    const actionHandovers = this.handovers.get(request.actionId) || [];
    actionHandovers.push(handover);
    this.handovers.set(request.actionId, actionHandovers);

    request.status = 'completed';
    request.completedBy = completedBy;
    request.completedAt = new Date();
  }

  /**
   * Reject a handover request
   */
  async rejectHandover(
    requestId: string,
    rejectedBy: string,
    reason?: string
  ): Promise<void> {
    const request = this.pendingHandoffs.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid handover request');
    }

    request.status = 'rejected';
    request.completedBy = rejectedBy;
    request.completedAt = new Date();
    
    if (reason) {
      request.context['rejectionReason'] = reason;
    }
  }

  /**
   * Get handover history for an action
   */
  async getHandoverHistory(actionId: string): Promise<HandoverEvent[]> {
    return this.handovers.get(actionId) || [];
  }

  /**
   * Get pending handover requests
   */
  getPendingRequests(): HandoverRequest[] {
    return Array.from(this.pendingHandoffs.values())
      .filter(r => r.status === 'pending');
  }

  /**
   * Get handover request by ID
   */
  getRequest(requestId: string): HandoverRequest | undefined {
    return this.pendingHandoffs.get(requestId);
  }

  /**
   * Cancel a pending handover
   */
  async cancelHandover(requestId: string): Promise<void> {
    const request = this.pendingHandoffs.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Cannot cancel: handover not pending');
    }

    this.pendingHandoffs.delete(requestId);
  }

  /**
   * Get all handovers for a specific party
   */
  getHandoversByParty(party: 'human' | 'agent'): HandoverEvent[] {
    const allHandovers = Array.from(this.handovers.values()).flat();
    return allHandovers.filter(h => h.from === party || h.to === party);
  }

  /**
   * Clear all handover data
   */
  clear(): void {
    this.handovers.clear();
    this.pendingHandoffs.clear();
  }

  private async notifyHuman(request: HandoverRequest): Promise<void> {
    // In real implementation, this would send a notification
    console.log(`[HANDOVER] Human attention needed: ${request.reason}`);
  }

  private async notifyAgent(request: HandoverRequest): Promise<void> {
    // In real implementation, this would notify the agent
    console.log(`[HANDOVER] Agent control requested: ${request.reason}`);
  }
}
