/**
 * MCP start command - start MCP server
 */
export async function mcpStartCommand(options: McpStartOptions): Promise<void> {
  try {
    const server = new MCPServer();
    
    if (!options.json) {
      console.log('Starting SpecLang MCP server...');
    }
    
    if (options.remote || options.port) {
      const port = options.port || 3000;
      if (!options.json) {
        console.log(`Starting in HTTP mode on port ${port}...`);
      }
      await server.startHTTP(port);
    } else {
      if (!options.json) {
        console.log('Starting in stdio mode...');
      }
      await server.startStdio();
    }
  } catch (error) {
    if (!options.json) {
      console.error('Failed to start MCP server:', error);
    } else {
      console.log(JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
    process.exit(1);
  }
}

/**
 * MCP serve command - daemon mode
 */
export async function mcpServeCommand(options: McpServeOptions): Promise<void> {
  const pid = readPid();
  
  if (pid) {
    try {
      process.kill(pid, 0);
      if (!options.json) {
        console.log('MCP server is already running');
      } else {
        console.log(JSON.stringify({ success: false, message: 'Server already running' }));
      }
      return;
    } catch {
      removePid();
    }
  }
  
  const baseDir = getDbPath().replace('.speclang.db', '');
  const daemonScript = path.join(baseDir, '.speclang', 'mcp-daemon.sh');
  const logFile = path.join(baseDir, '.speclang', 'mcp.log');
  
  const daemonContent = `#!/bin/bash
exec npx speclang-mcp start --http --port 3000 >> "${logFile}" 2>&1
`;
  
  const dir = path.dirname(daemonScript);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(daemonScript, daemonContent);
  fs.chmodSync(daemonScript, 0o755);
  
  const child = spawn(daemonScript, [], {
    detached: true,
    stdio: 'ignore',
    cwd: baseDir
  });
  
  child.unref();
  
  const serverPid = child.pid;
  writePid(serverPid);
  
  writeStatus({
    mode: 'daemon',
    started: new Date().toISOString(),
    pid: serverPid
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!options.json) {
    console.log(`MCP server started in daemon mode (PID: ${serverPid})`);
    console.log(`Log file: ${logFile}`);
  } else {
    console.log(JSON.stringify({ success: true, pid: serverPid }));
  }
}

/**
 * MCP generate-openapi command - generate MCP server from OpenAPI spec
 */
export async function mcpGenerateOpenapiCommand(options: McpGenerateOpenapiOptions): Promise<void> {
  const input = options.input;
  const output = options.output;
  
  if (!input) {
    if (!options.json) {
      console.error('Error: --input is required');
      console.error('Usage: speclang mcp generate-openapi --input <spec> --output <dir> [options]');
    } else {
      console.log(JSON.stringify({ success: false, message: '--input is required' }));
    }
    process.exit(1);
  }
  
  if (!output) {
    if (!options.json) {
      console.error('Error: --output is required');
      console.error('Usage: speclang mcp generate-openapi --input <spec> --output <dir> [options]');
    } else {
      console.log(JSON.stringify({ success: false, message: '--output is required' }));
    }
    process.exit(1);
  }
  
  if (!options.json) {
    console.log(`Generating MCP server from OpenAPI spec: ${input}`);
    console.log(`Output directory: ${output}`);
  }
  
  const transport = options.transport || 'stdio';
  const port = options.port || 3000;
  const serverName = options.serverName || 'generated-mcp-server';
  const baseUrl = options.baseUrl || '';
  const force = options.force ? '--force' : '';
  const register = options.register ? '--register' : '';
  
  let specPath = input;
  if (input.startsWith('http://') || input.startsWith('https://')) {
    specPath = input;
  } else if (!fs.existsSync(input)) {
    if (!options.json) {
      console.error(`Error: OpenAPI spec not found: ${input}`);
    } else {
      console.log(JSON.stringify({ success: false, message: `File not found: ${input}` }));
    }
    process.exit(1);
  }
  
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  const args = [
    '-y',
    'openapi-mcp-generator',
    '--input', specPath,
    '--output', output,
    '--transport', transport,
    '--port', port.toString(),
    '--server-name', serverName,
    force,
    register
  ].filter(Boolean);
  
  if (baseUrl) {
    args.push('--base-url', baseUrl);
  }
  
  try {
    if (!options.json) {
      console.log(`Running: ${npxCmd} ${args.join(' ')}`);
    }
    
    execSync(npxCmd + ' ' + args.join(' '), { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    if (!options.json) {
      console.log(`\nMCP server generated successfully!`);
      console.log(`To start the server:`);
      console.log(`  cd ${output} && npm install && npm start`);
    } else {
      console.log(JSON.stringify({ 
        success: true, 
        output,
        transport,
        port,
        serverName
      }));
    }
  } catch (error) {
    if (!options.json) {
      console.error('Failed to generate MCP server:', error);
    } else {
      console.log(JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Generation failed'
      }));
    }
    process.exit(1);
  }
}