/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/examples.spec.dir/hello-world/hello-world.spec.md
 * Generated: 2026-03-31T13:49:00.000Z
 * 
 * Edit the spec, not this file.
 */

/**
 * A simple function that returns a greeting message.
 */
export function hello(name: string): string {
  return `Hello, ${name}!`;
}

/**
 * The main entry point that demonstrates usage.
 */
export function main(): void {
  const message = hello("World");
  console.log(message);
}

// Run main if executed directly
if (require.main === module) {
  main();
}
