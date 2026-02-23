export interface DatabaseConfig {
  path: string;
}

export class Database {
  constructor(config: DatabaseConfig) {}
  
  public query(sql: string): any[] {
    return [];
  }
}
