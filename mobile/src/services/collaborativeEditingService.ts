import { webSocketService } from './webSocketService';
import { EventEmitter } from 'events';

export interface EditOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: string;
}

export interface CursorPosition {
  userId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  timestamp: string;
}

export interface CollaborativeSession {
  entityType: string;
  entityId: string;
  participants: string[];
  operations: EditOperation[];
  cursors: Map<string, CursorPosition>;
}

class CollaborativeEditingService extends EventEmitter {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private currentUserId: string | null = null;
  private operationQueue: EditOperation[] = [];
  private isProcessingQueue = false;

  constructor() {
    super();
    this.setupWebSocketListeners();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    webSocketService.on('collaborative-edit', (data) => {
      this.handleRemoteOperation(data);
    });

    webSocketService.on('cursor-update', (data) => {
      this.handleCursorUpdate(data);
    });

    webSocketService.on('user-joined', (data) => {
      this.handleUserJoined(data);
    });

    webSocketService.on('user-left', (data) => {
      this.handleUserLeft(data);
    });

    webSocketService.on('typing', (data) => {
      this.handleTypingIndicator(data);
    });
  }

  /**
   * Start collaborative editing session
   */
  startSession(entityType: string, entityId: string, userId: string): void {
    const sessionKey = `${entityType}:${entityId}`;
    this.currentUserId = userId;

    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        entityType,
        entityId,
        participants: [userId],
        operations: [],
        cursors: new Map(),
      });
    } else {
      const session = this.sessions.get(sessionKey)!;
      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
      }
    }

    // Subscribe to real-time updates
    webSocketService.subscribeToEntity(entityType, entityId);
    
    // Notify server about joining
    webSocketService.sendMessage('join-collaborative-session', {
      entityType,
      entityId,
      userId,
    });

    this.emit('session-started', { entityType, entityId, userId });
  }

  /**
   * End collaborative editing session
   */
  endSession(entityType: string, entityId: string, userId: string): void {
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (session) {
      session.participants = session.participants.filter(id => id !== userId);
      
      if (session.participants.length === 0) {
        this.sessions.delete(sessionKey);
      }
    }

    // Unsubscribe from real-time updates
    webSocketService.unsubscribeFromEntity(entityType, entityId);
    
    // Notify server about leaving
    webSocketService.sendMessage('leave-collaborative-session', {
      entityType,
      entityId,
      userId,
    });

    this.emit('session-ended', { entityType, entityId, userId });
  }

  /**
   * Apply local edit operation
   */
  applyLocalOperation(
    entityType: string,
    entityId: string,
    operation: Omit<EditOperation, 'id' | 'userId' | 'timestamp'>
  ): EditOperation {
    const fullOperation: EditOperation = {
      ...operation,
      id: this.generateOperationId(),
      userId: this.currentUserId!,
      timestamp: new Date().toISOString(),
    };

    // Add to operation queue
    this.operationQueue.push(fullOperation);

    // Send to server
    webSocketService.sendCollaborativeEdit(entityType, entityId, fullOperation);

    // Process queue
    this.processOperationQueue();

    this.emit('local-operation', fullOperation);
    return fullOperation;
  }

  /**
   * Handle remote edit operation
   */
  private handleRemoteOperation(data: any): void {
    const { entityType, entityId, operation } = data;
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (!session) {
      return;
    }

    // Transform operation against local operations
    const transformedOperation = this.transformOperation(operation, session.operations);
    
    // Add to session operations
    session.operations.push(transformedOperation);

    this.emit('remote-operation', transformedOperation);
  }

  /**
   * Update cursor position
   */
  updateCursor(
    entityType: string,
    entityId: string,
    position: number,
    selection?: { start: number; end: number }
  ): void {
    if (!this.currentUserId) return;

    const cursorUpdate: CursorPosition = {
      userId: this.currentUserId,
      position,
      selection,
      timestamp: new Date().toISOString(),
    };

    // Send to server
    webSocketService.sendMessage('cursor-update', {
      entityType,
      entityId,
      cursor: cursorUpdate,
    });

    this.emit('cursor-updated', cursorUpdate);
  }

  /**
   * Handle cursor update from other users
   */
  private handleCursorUpdate(data: any): void {
    const { entityType, entityId, cursor } = data;
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (session && cursor.userId !== this.currentUserId) {
      session.cursors.set(cursor.userId, cursor);
      this.emit('remote-cursor-update', cursor);
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(entityType: string, entityId: string, isTyping: boolean): void {
    webSocketService.sendTypingIndicator(entityType, entityId, isTyping);
  }

  /**
   * Handle typing indicator from other users
   */
  private handleTypingIndicator(data: any): void {
    if (data.userId !== this.currentUserId) {
      this.emit('typing-indicator', data);
    }
  }

  /**
   * Handle user joined session
   */
  private handleUserJoined(data: any): void {
    const { entityType, entityId, userId } = data;
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (session && !session.participants.includes(userId)) {
      session.participants.push(userId);
      this.emit('user-joined', data);
    }
  }

  /**
   * Handle user left session
   */
  private handleUserLeft(data: any): void {
    const { entityType, entityId, userId } = data;
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (session) {
      session.participants = session.participants.filter(id => id !== userId);
      session.cursors.delete(userId);
      this.emit('user-left', data);
    }
  }

  /**
   * Transform operation against existing operations (Operational Transformation)
   */
  private transformOperation(operation: EditOperation, existingOperations: EditOperation[]): EditOperation {
    let transformedOperation = { ...operation };

    // Simple transformation logic - in a real implementation, you'd use a proper OT library
    for (const existingOp of existingOperations) {
      if (existingOp.timestamp < operation.timestamp) {
        transformedOperation = this.transformAgainstOperation(transformedOperation, existingOp);
      }
    }

    return transformedOperation;
  }

  /**
   * Transform one operation against another
   */
  private transformAgainstOperation(op1: EditOperation, op2: EditOperation): EditOperation {
    const transformed = { ...op1 };

    // Simple transformation rules
    if (op2.type === 'insert' && op2.position <= op1.position) {
      transformed.position += op2.content?.length || 0;
    } else if (op2.type === 'delete' && op2.position < op1.position) {
      transformed.position -= op2.length || 0;
    }

    return transformed;
  }

  /**
   * Process operation queue
   */
  private async processOperationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()!;
      
      // Apply operation locally
      this.emit('apply-operation', operation);
      
      // Small delay to prevent overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get session participants
   */
  getSessionParticipants(entityType: string, entityId: string): string[] {
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);
    return session ? [...session.participants] : [];
  }

  /**
   * Get cursor positions for session
   */
  getCursorPositions(entityType: string, entityId: string): Map<string, CursorPosition> {
    const sessionKey = `${entityType}:${entityId}`;
    const session = this.sessions.get(sessionKey);
    return session ? new Map(session.cursors) : new Map();
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): Array<{ entityType: string; entityId: string; participants: string[] }> {
    return Array.from(this.sessions.entries()).map(([key, session]) => {
      const [entityType, entityId] = key.split(':');
      return {
        entityType,
        entityId,
        participants: [...session.participants],
      };
    });
  }

  /**
   * Cleanup all sessions
   */
  cleanup(): void {
    this.sessions.clear();
    this.operationQueue = [];
    this.currentUserId = null;
    this.isProcessingQueue = false;
  }
}

export const collaborativeEditingService = new CollaborativeEditingService();
