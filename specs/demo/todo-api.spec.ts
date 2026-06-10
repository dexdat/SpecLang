// @spec: speclang-demo/todo-api v1.0.0
// @source: specs/demo/todo-api.spec.ts.md:49-188
import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ───────────────────────────────────────────────────────

interface Todo {
  id: string;
  title: string;
  status: 'pending' | 'done';
  created_at: string;
  updated_at: string;
}

// ── Store ───────────────────────────────────────────────────────

const DB_PATH = path.join(__dirname, '..', '..', '.speclang', 'demo', 'todos.json');

function loadTodos(): Todo[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveTodos(todos: Todo[]): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(todos, null, 2));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Server ──────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// CORS for local dev
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// GET /api/todos
app.get('/api/todos', (req: Request, res: Response) => {
  const todos = loadTodos();
  const { status } = req.query;
  if (status && (status === 'pending' || status === 'done')) {
    return res.json(todos.filter((t) => t.status === status));
  }
  res.json(todos);
});

// POST /api/todos
app.post('/api/todos', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title (string) is required' });
  }
  const todo: Todo = {
    id: generateId(),
    title: title.trim(),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const todos = loadTodos();
  todos.push(todo);
  saveTodos(todos);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id
app.patch('/api/todos/:id', (req: Request, res: Response) => {
  const todos = loadTodos();
  const idx = todos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Todo not found' });

  const { title, status } = req.body;
  if (title !== undefined) todos[idx].title = title.trim();
  if (status !== undefined) {
    if (status !== 'pending' && status !== 'done') {
      return res.status(400).json({ error: 'status must be pending or done' });
    }
    todos[idx].status = status;
  }
  todos[idx].updated_at = new Date().toISOString();
  saveTodos(todos);
  res.json(todos[idx]);
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', (req: Request, res: Response) => {
  const todos = loadTodos();
  const idx = todos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Todo not found' });
  const removed = todos.splice(idx, 1)[0];
  saveTodos(todos);
  res.json(removed);
});

// GET /api/health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    spec: 'speclang-demo/todo-api',
    version: '1.0.0',
    todos: loadTodos().length,
    timestamp: new Date().toISOString(),
  });
});

// ── Start ──────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3999', 10);

export function start(): Promise<void> {
  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`[todo-api] Running on http://localhost:${PORT}`);
      console.log(`[todo-api] Spec: speclang-demo/todo-api (v1.0.0)`);
      resolve();
    });
  });
}

if (require.main === module) {
  start().catch(console.error);
}

export { app, Todo };
