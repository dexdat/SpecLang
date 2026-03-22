# speclang-header lines:12
id: "@specs/safety/peer-review"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, peer-review, workflow]
short: Peer review workflows for safety nets
target: src/safety/peer-review.ts
---

# Peer Review Workflow Spec

This module manages peer review requests for specs requiring human review.

## @block:types @kind:interface

### ReviewRequest

```typescript
export interface ReviewRequest {
  id: string;
  specId: string;
  type: 'confidence' | 'manual' | 'critical_change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'changes_requested';
  assignees: string[];
  createdAt: string;
  dueAt: string | null;
  completedAt: string | null;
  comments: ReviewComment[];
}
```

### ReviewComment

```typescript
export interface ReviewComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  resolved: boolean;
}
```

## @block:class @kind:class

### PeerReviewWorkflow

```typescript
export class PeerReviewWorkflow {
  private requests: Map<string, ReviewRequest> = new Map();
  
  async createRequest(data: {
    specId: string;
    type: ReviewRequest['type'];
    priority: ReviewRequest['priority'];
    assignees: string[];
  }): Promise<ReviewRequest> {
    const request: ReviewRequest = {
      id: this.generateId(),
      specId: data.specId,
      type: data.type,
      priority: data.priority,
      status: 'pending',
      assignees: data.assignees,
      createdAt: new Date().toISOString(),
      dueAt: this.calculateDueDate(data.priority),
      completedAt: null,
      comments: [],
    };
    
    this.requests.set(request.id, request);
    
    // Notify assignees
    await this.notifyAssignees(request);
    
    return request;
  }

  async addComment(
    requestId: string,
    author: string,
    content: string
  ): Promise<ReviewComment> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);
    
    const comment: ReviewComment = {
      id: this.generateId(),
      author,
      content,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    
    request.comments.push(comment);
    
    return comment;
  }

  async approve(requestId: string, reviewer: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);
    
    // Verify reviewer is assigned
    if (!request.assignees.includes(reviewer)) {
      throw new Error(`Reviewer ${reviewer} not assigned to this request`);
    }
    
    request.status = 'approved';
    request.completedAt = new Date().toISOString();
    
    // Update spec tags
    await this.updateSpecAfterApproval(request.specId);
  }

  async reject(requestId: string, reviewer: string, reason: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);
    
    request.status = 'rejected';
    request.completedAt = new Date().toISOString();
    
    await this.addComment(requestId, reviewer, `Rejected: ${reason}`);
  }

  async requestChanges(requestId: string, reviewer: string, feedback: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) throw new Error(`Request ${requestId} not found`);
    
    request.status = 'changes_requested';
    
    await this.addComment(requestId, reviewer, `Changes requested: ${feedback}`);
  }

  async getPendingForReviewer(reviewer: string): Promise<ReviewRequest[]> {
    return Array.from(this.requests.values()).filter(
      r => r.assignees.includes(reviewer) && r.status === 'pending'
    );
  }

  private calculateDueDate(priority: ReviewRequest['priority']): string | null {
    const hours: Record<ReviewRequest['priority'], number> = {
      critical: 4,
      high: 24,
      medium: 72,
      low: 168, // 1 week
    };
    
    return new Date(Date.now() + hours[priority] * 60 * 60 * 1000).toISOString();
  }

  private async notifyAssignees(request: ReviewRequest): Promise<void> {
    // Send notifications to assignees
    // This would integrate with the notification service
  }

  private async updateSpecAfterApproval(specId: string): Promise<void> {
    // Update spec metadata to reflect approval
    // Remove low confidence tags, add human_reviewed tag
  }

  private generateId(): string {
    return `RR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```