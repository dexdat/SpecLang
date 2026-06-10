---
id: @specs/examples/crud-app
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [example, crud, rest, api]
short: CRUD example with REST API
depends_on:
  - "@ref:specs/core"
  - "@ref:specs/examples/hello-world"
  - "@ref:specs/examples/auth"
---

# CRUD Application Example

A full CRUD example demonstrating REST API with entity management.

### @block:todo-entity @kind:interface
Todo item entity with complete data model.

```typescript
interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### @block:todo-repository @kind:class
Repository pattern for todo persistence.

```typescript
class TodoRepository {
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
```

### @block:create-todo-input @kind:type
Input type for creating todos.

```typescript
type CreateTodoInput = Pick<Todo, 'title' | 'description'>;
```

### @block:update-todo-input @kind:type
Input type for updating todos.

```typescript
type UpdateTodoInput = Partial<Pick<Todo, 'title' | 'description' | 'completed'>>;
```

### @block:todo-controller @kind:class
REST controller for todo endpoints.

```typescript
class TodoController {
  private repo: TodoRepository;
  
  constructor(repo: TodoRepository) {
    this.repo = repo;
  }
  
  async getAll(req: Request, res: Response): Promise<void> {
    const todos = await this.repo.findAll();
    res.json(todos);
  }
  
  async getOne(req: Request, res: Response): Promise<void> {
    const todo = await this.repo.findById(req.params.id);
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(todo);
  }
  
  async create(req: Request, res: Response): Promise<void> {
    const todo = await this.repo.create(req.body);
    res.status(201).json(todo);
  }
  
  async update(req: Request, res: Response): Promise<void> {
    const todo = await this.repo.update(req.params.id, req.body);
    if (!todo) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json(todo);
  }
  
  async delete(req: Request, res: Response): Promise<void> {
    const deleted = await this.repo.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.status(204).send();
  }
}
```
