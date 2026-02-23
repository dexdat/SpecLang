/**
 * Session API Server
 * 
 * HTTP endpoints for session management
 * Generated from: @speclang/agent-protocol/sessions
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import { SessionManager } from './session';
import { AgentRole } from './types';
import { Server } from 'http';

export interface SessionApiConfig {
  port: number;
  sessionManager: SessionManager;
}

interface CreateSessionRequest {
  agent: AgentRole;
  owns?: string[];
}

interface SessionEventRequest {
  kind: string;
  path?: string;
  details?: Record<string, unknown>;
}

interface CreateSessionResponse {
  session_id: string;
  agent_id: string;
}

interface SessionStatusResponse {
  status: string;
  agent: {
    id: string;
    role: AgentRole;
    status: string;
    last_activity: string;
  };
  working_on: string | null;
  pending_tasks: number;
  completed_tasks: number;
  created: string;
}

interface SessionEventResponse {
  accepted: boolean;
}

interface DeleteSessionResponse {
  ok: boolean;
}

export class SessionApiServer {
  private app: Application;
  private port: number;
  private sessionManager: SessionManager;
  private server: Server | null = null;

  constructor(config: SessionApiConfig) {
    this.app = express();
    this.port = config.port;
    this.sessionManager = config.sessionManager;
    
    this.app.use(express.json());
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupRoutes(): void {
    // POST /session/create - Create new session
    this.app.post('/session/create', (req: Request, res: Response) => {
      try {
        const body = req.body as CreateSessionRequest;
        const { agent, owns } = body;

        if (!agent) {
          res.status(400).json({ error: 'agent is required' });
          return;
        }

        const session = this.sessionManager.create(agent);
        
        const response: CreateSessionResponse = {
          session_id: session.id,
          agent_id: session.agent.id,
        };

        res.status(201).json(response);
      } catch (error) {
        console.error('[SessionAPI] Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
      }
    });

    // GET /session/:id/status - Get session status
    this.app.get('/session/:id/status', (req: Request, res: Response) => {
      try {
        const id = req.params.id as string;
        const session = this.sessionManager.get(id);

        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        const response: SessionStatusResponse = {
          status: session.agent.status,
          agent: {
            id: session.agent.id,
            role: session.agent.role,
            status: session.agent.status,
            last_activity: session.agent.last_activity.toISOString(),
          },
          working_on: session.state.workingOn,
          pending_tasks: session.state.pendingTasks.length,
          completed_tasks: session.state.completedTasks.length,
          created: session.created.toISOString(),
        };

        res.json(response);
      } catch (error) {
        console.error('[SessionAPI] Error getting session status:', error);
        res.status(500).json({ error: 'Failed to get session status' });
      }
    });

    // POST /session/:id/event - Send event to session
    this.app.post('/session/:id/event', (req: Request, res: Response) => {
      try {
        const id = req.params.id as string;
        const body = req.body as SessionEventRequest;
        const { kind, path, details } = body;

        const session = this.sessionManager.get(id);
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        // Handle different event kinds
        if (kind === 'file-changed') {
          this.sessionManager.setAgentStatus(session.agent.id, 'working');
          if (path) {
            this.sessionManager.setWorkingOn(session.agent.id, Array.isArray(path) ? path[0] : path);
          }
        } else if (kind === 'work-done') {
          this.sessionManager.setAgentStatus(session.agent.id, 'idle');
          this.sessionManager.setWorkingOn(session.agent.id, null);
        }

        const response: SessionEventResponse = {
          accepted: true,
        };

        res.json(response);
      } catch (error) {
        console.error('[SessionAPI] Error handling session event:', error);
        res.status(500).json({ error: 'Failed to handle event' });
      }
    });

    // DELETE /session/:id - Delete session
    this.app.delete('/session/:id', (req: Request, res: Response) => {
      try {
        const id = req.params.id as string;
        const session = this.sessionManager.get(id);

        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        this.sessionManager.end(id);

        const response: DeleteSessionResponse = {
          ok: true,
        };

        res.json(response);
      } catch (error) {
        console.error('[SessionAPI] Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
      }
    });

    // GET /sessions - List all sessions
    this.app.get('/sessions', (_req: Request, res: Response) => {
      try {
        const sessions = this.sessionManager.list();
        const response = sessions.map(s => ({
          id: s.id,
          agent_id: s.agent.id,
          role: s.agent.role,
          status: s.agent.status,
          created: s.created.toISOString(),
        }));
        res.json(response);
      } catch (error) {
        console.error('[SessionAPI] Error listing sessions:', error);
        res.status(500).json({ error: 'Failed to list sessions' });
      }
    });

    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        active_sessions: this.sessionManager.getActiveCount(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('[SessionAPI] Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`[SessionAPI] Server running on port ${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('[SessionAPI] Server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export function createSessionApiServer(
  sessionManager: SessionManager,
  port: number = 3100
): SessionApiServer {
  return new SessionApiServer({ port, sessionManager });
}
