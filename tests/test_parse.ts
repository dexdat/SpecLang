import { SpecParser } from './codegen';

async function main() {
  try {
    const spec = await SpecParser.parseSpec('specs/mcp/openapi-generation-cli.ts.spec');
    console.log('Parsed spec:', JSON.stringify(spec, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();