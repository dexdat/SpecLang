/**
speclang-header lines:5
id: @specs/examples
version: 1.0.0
layer: 5
 */

// Generated from specs/examples/hello-world.spec.md
// DO NOT EDIT MANUALLY
// Source: @examples/hello-world

/**
 * Hello World function
 * Generated from @examples/hello-world
 */
export function helloWorld(name: string): string {
  return `Hello, ${name}!`;
}

// Example usage
if (require.main === module) {
  console.log(helloWorld("SpecLang"));
}
