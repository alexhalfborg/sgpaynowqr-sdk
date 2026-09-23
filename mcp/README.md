# @alexhalfborg/sgpaynowqr-mcp

Run the [SGPayNowQR](https://developers.sgpaynowqr.com) MCP server from any stdio-only MCP
client that can only launch a local process. This package doesn't run its own MCP server — it
bridges your client's stdio connection to the real server at
`https://developers.sgpaynowqr.com/api/mcp` over Streamable HTTP, using
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote).

Once connected, the server exposes one tool, `generate_qr`, which generates EMVCo-compliant
Singapore PayNow QR codes for UEN, mobile number, and VPA payment targets — same output as the
[REST API](https://developers.sgpaynowqr.com/docs) and the
[TypeScript SDK](https://github.com/alexhalfborg/sgpaynowqr-sdk).

## Setup

You need an API key — create one from the
[dashboard](https://developers.sgpaynowqr.com/dashboard) (free tier: 50 requests/month).

Add this to your MCP client's config:

```json
{
  "mcpServers": {
    "sgpaynowqr": {
      "command": "npx",
      "args": ["-y", "@alexhalfborg/sgpaynowqr-mcp"],
      "env": {
        "SGPAYNOWQR_API_KEY": "sgpn_your_api_key_here"
      }
    }
  }
}
```

## You may not need this package

Most clients now connect to remote MCP servers directly, which is simpler and needs no Node.js:

- **Claude Code, Cursor, VS Code, Windsurf, Codex CLI, Gemini CLI**: point them at
  `https://developers.sgpaynowqr.com/api/mcp` with an `X-API-Key` header.
- **Claude (web & desktop) and ChatGPT**: these usually accept only a URL, so add a custom
  connector with your personal URL, `https://developers.sgpaynowqr.com/api/mcp/<your key>`.

The [MCP setup guide](https://developers.sgpaynowqr.com/docs/guides/mcp-server-setup) has
copy-paste config for each client. Logged in? **API Keys → Connect to AI** in the portal shows the
same instructions with your key already filled in.

## License

MIT
