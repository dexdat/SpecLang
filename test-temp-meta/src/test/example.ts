export interface TestInterface {
  id: number;
  name: string;
}

export class TestClass {
  private value: string;
  
  constructor(value: string) {
    this.value = value;
  }
  
  public getValue(): string {
    return this.value;
  }
}

export function testFunction(): void {
  console.log("test");
}

export const TEST_CONSTANT = "test";
