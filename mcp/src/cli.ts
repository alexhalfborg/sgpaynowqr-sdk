#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const MCP_ENDPOINT = "https://developers.sgpaynowqr.com/api/mcp";
const ENV_VAR = "SGPAYNOWQR_API_KEY";

const apiKey = process.env[ENV_VAR];
if (!apiKey) {
  console.error(
    `Missing required environment variable ${ENV_VAR}.\n\n` +
      `Get an API key from https://developers.sgpaynowqr.com/dashboard, then set it in your\n` +
      `MCP client config, e.g.:\n\n` +
      `  "env": { "${ENV_VAR}": "sgpn_your_api_key_here" }\n`,
  );
  process.exit(1);
}

// mcp-remote does the actual stdio<->Streamable HTTP bridging; this CLI just
// pins the URL and turns the API key into the header the server expects.
const require = createRequire(import.meta.url);
const mcpRemoteBin = require.resolve("mcp-remote/dist/proxy.js");

// http-only: the server is stateless Streamable HTTP and only implements POST (no SSE/GET
// support), so mcp-remote's default fallback to an SSE transport strategy would hit a dead-end
// 405 and abort — pin the strategy so it never attempts that fallback.
const child = spawn(
  process.execPath,
  [
    mcpRemoteBin,
    MCP_ENDPOINT,
    "--header",
    `X-API-Key:${apiKey}`,
    "--transport",
    "http-only",
  ],
  { stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});

child.on("error", (err) => {
  console.error(`Failed to start mcp-remote: ${err.message}`);
  process.exit(1);
});
