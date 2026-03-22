/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/safety.spec.dir/src/notification.spec.md
 * Generated: 2026-03-21
 * 
 * Edit the spec, not this file.
 */

export interface Notification {
  type: 'quarantine' | 'review_request' | 'downgrade' | 'warning' | 'approval';
  specId: string;
  message: string;
  ticketId?: string;
  assignees?: string[];
  previousLevel?: string;
  newLevel?: string;
}

export class NotificationService {
  async send(notification: Notification): Promise<void> {
    // Format message based on type
    const formatted = this.formatNotification(notification);
    
    // Log notification (in production, integrate with actual notification systems)
    console.log(`[NOTIFICATION] ${notification.type}: ${formatted}`);
    
    // Store notification
    await this.store(notification);
  }

  private formatNotification(notification: Notification): string {
    switch (notification.type) {
      case 'quarantine':
        return `Spec ${notification.specId} quarantined. ${notification.message}. Ticket: ${notification.ticketId}`;
        
      case 'review_request':
        return `Review requested for ${notification.specId}. Assignees: ${notification.assignees?.join(', ')}`;
        
      case 'downgrade':
        return `Spec ${notification.specId} downgraded from ${notification.previousLevel} to ${notification.newLevel}`;
        
      case 'warning':
        return `Warning for ${notification.specId}: ${notification.message}`;
        
      case 'approval':
        return `Spec ${notification.specId} approved`;
        
      default:
        return notification.message;
    }
  }

  private async store(notification: Notification): Promise<void> {
    // Store in database for audit trail
  }
}