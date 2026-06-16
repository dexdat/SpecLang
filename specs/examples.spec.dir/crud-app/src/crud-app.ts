/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/examples.spec.dir/crud-app/crud-app.spec.md
 * Generated: 2026-03-31T13:52:00.000Z
 * 
 * Edit the spec, not this file.
 */

import crypto from 'crypto';

/**
 * Todo item entity with complete data model.
 */
export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating todos.
 */
export type CreateTodoInput = Pick<Todo, 'title' | 'description'>;

/**
 * Input type for updating todos.
 */
export type UpdateTodoInput = Partial<Pick<Todo, 'title' | 'description' | 'completed'>>;

/**
 * Repository pattern for todo persistence.
 */
export class TodoRepository {
  private todos: Map<string, Todo> = new Map();
  
  async findAll(): Promise<Todo[]> {
    return Array.from(this.todos.values());
  }
  
  async findById(id: string): Promise<Todo | null> {
    return this.todos.get(id) ?? null;
  }
  
  async create(data: CreateTodoInput): Promise<Todo> {
    const todo: Todo = {
      id: crypto.randomUUID(),
      ...data,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.todos.set(todo.id, todo);
    return todo;
  }
  
  async update(id: string, data: UpdateTodoInput): Promise<Todo | null> {
    const existing = this.todos.get(id);
    if (!existing) return null;
    
    const updated: Todo = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.todos.set(id, updated);
    return updated;
  }
  
  async delete(id: string): Promise<boolean> {
    return this.todos.delete(id);
  }
}

/**
 * REST controller for todo endpoints.
 */
export class TodoController {
  private repo: TodoRepository;
  
  constructor(repo: TodoRepository) {
    this.repo = repo;
  }
  
  async getAll(req: any, res: any): Promise<void> {
    const todos = await this.repo.findAll();
    res.json(todos);
  }
  
  async getOne(req: any, res: any): Promise<void> {
    const todo = await this.repo.findById(req.params.id);
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(todo);
  }
  
  async create(req: any, res: any): Promise<void> {
    const todo = await this.repo.create(req.body);
    res.status(201).json(todo);
  }
  
  async update(req: any, res: any): Promise<void> {
    const todo = await this.repo.update(req.params.id, req.body);
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(todo);
  }
  
  async delete(req: any, res: any): Promise<void> {
    const deleted = await this.repo.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.status(204).send();
  }
}
