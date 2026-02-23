/**
 * Enterprise HTTP Server with SSE for speclangd
 * 
 * Generated from: @speclang/mcp-daemon/architecture
 */

import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';
import http from 'http';

export interface QueueItem {
  id: string;
  file: string;
  state: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'high' | 'normal' | 'low';
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface DaemonStatusResponse {
  mode: string;
  queue_depth: number;
  files_watching: number;
  uptime: number;
}

export interface QueueResponse {
  pending: string[];
  in_progress: string[];
  completed: string[];
}

export interface CommandRequest {
  command: 'pause' | 'resume' | 'priority' | 'worktree';
  params?: Record<string, unknown>;
}

export interface WorktreeInfo {
  name: string;
  path: string;
  base_commit?: string;
  ready: boolean;
  created_at: number;
}

export interface TestResult {
  test_id: string;
  status: 'running' | 'passed' | 'failed';
  passed?: number;
  failed?: number;
  duration?: number;
}

export type SSEEventType = 
  | 'file.changed'
  | 'queue.updated'
  | 'agent.started'
  | 'agent.finished'
  | 'convergence.detected'
  | 'pipeline.started'
  | 'pipeline.finished';

export interface SSEEvent {
  event: SSEEventType;
  data: Record<string, unknown>;
}

export class HTTPServer {
  private app: express.Application;
  private server: http.Server | null = null;
  private port: number;
  private host: string;
  private eventEmitter: EventEmitter;
  private queue: Map<string, QueueItem>;
  private worktrees: Map<string, WorktreeInfo>;
  private startTime: number;
  private filesWatching: number;
  private paused: boolean;

  constructor(port: number = 8765, host: string = 'localhost') {
    this.port = port;
    this.host = host;
    this.eventEmitter = new EventEmitter();
    this.queue = new Map();
    this.worktrees = new Map();
    this.startTime = Date.now();
    this.filesWatching = 0;
    this.paused = false;
    
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // GET /status
    this.app.get('/status', (_req: Request, res: Response) => {
      const status: DaemonStatusResponse = {
        mode: 'enterprise',
        queue_depth: this.queue.size,
        files_watching: this.filesWatching,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
      };
      res.json(status);
    });

    // GET /events - SSE stream
    this.app.get('/events', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const onEvent = (event: SSEEvent) => {
        res.write(`event: ${event.event}\n`);
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
      };

      this.eventEmitter.on('event', onEvent);

      req.on('close', () => {
        this.eventEmitter.off('event', onEvent);
      });
    });

    // GET /queue
    this.app.get('/queue', (_req: Request, res: Response) => {
      const pending: string[] = [];
      const in_progress: string[] = [];
      const completed: string[] = [];

      for (const item of this.queue.values()) {
        if (item.state === 'pending') pending.push(item.file);
        else if (item.state === 'in_progress') in_progress.push(item.file);
        else if (item.state === 'completed') completed.push(item.file);
      }

      const response: QueueResponse = { pending, in_progress, completed };
      res.json(response);
    });

    // POST /command
    this.app.post('/command', (req: Request, res: Response) => {
      const { command, params } = req.body as CommandRequest;

      switch (command) {
        case 'pause':
          this.paused = true;
          res.json({ ok: true, queue_paused: true });
          break;
        case 'resume':
          this.paused = false;
          res.json({ ok: true, queue_paused: false });
          break;
        case 'priority':
          if (params?.file) {
            const item = this.queue.get(params.file as string);
            if (item) {
              item.priority = 'high';
              this.broadcastQueueUpdate();
            }
          }
          res.json({ ok: true });
          break;
        case 'worktree':
          res.json({ ok: true, worktree_command: 'processed' });
          break;
        default:
          res.status(400).json({ error: 'Unknown command' });
      }
    });

    // GET /worktrees
    this.app.get('/worktrees', (_req: Request, res: Response) => {
      res.json(Array.from(this.worktrees.values()));
    });

    // POST /worktree/create
    this.app.post('/worktree/create', (req: Request, res: Response) => {
      const { name, base_commit } = req.body;
      
      const worktree: WorktreeInfo = {
        name,
        path: `.speclang/worktrees/${name}`,
        base_commit,
        ready: true,
        created_at: Date.now(),
      };
      
      this.worktrees.set(name, worktree);
      res.json({ path: worktree.path, ready: worktree.ready });
    });

    // POST /worktree/:name/test
    this.app.post('/worktree/:name/test', (req: Request, res: Response) => {
      const { name } = req.params;
      const { filter } = req.body;
      
      const testResult: TestResult = {
        test_id: `test-${Date.now()}`,
        status: 'running',
      };
      
      res.json(testResult);
    });

    // POST /worktree/:name/deploy
    this.app.post('/worktree/:name/deploy', (req: Request, res: Response) => {
      const { name } = req.params;
      const { target } = req.body;
      
      const deployment = {
        deployment_id: `deploy-${Date.now()}`,
        status: 'deployed',
        target: target || 'production',
        timestamp: Date.now(),
      };
      
      res.json(deployment);
    });
  }

  private broadcastQueueUpdate(): void {
    const pending: string[] = [];
    const in_progress: string[] = [];
    
    for (const item of this.queue.values()) {
      if (item.state === 'pending') pending.push(item.file);
      else if (item.state === 'in_progress') in_progress.push(item.file);
    }
    
    this.emit('queue.updated', {
      depth: this.queue.size,
      added: pending,
      removed: in_progress,
    });
  }

  public emit(event: SSEEventType, data: Record<string, unknown>): void {
    this.eventEmitter.emit('event', { event, data });
  }

  public addToQueue(file: string, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    const item: QueueItem = {
      id: `item-${Date.now()}`,
      file,
      state: 'pending',
      priority,
      addedAt: Date.now(),
    };
    this.queue.set(file, item);
    this.broadcastQueueUpdate();
  }

  public setFilesWatching(count: number): void {
    this.filesWatching = count;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, this.host, () => {
        console.log(`[HTTPServer] Enterprise daemon listening on http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[HTTPServer] Stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
