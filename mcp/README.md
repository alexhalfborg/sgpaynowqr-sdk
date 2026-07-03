# @alexhalfborg/sgpaynowqr-mcp

Run the [SGPayNowQR](https://developers.sgpaynowqr.com) MCP server from any stdio-only MCP
client (Cursor, Claude Desktop, Windsurf, etc). This package doesn't run its own MCP server — it
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

If your client supports remote MCP servers natively (Streamable HTTP), you can skip this package
and point it directly at the endpoint instead — see the
[MCP server setup guide](https://developers.sgpaynowqr.com/docs/guides/mcp-server-setup) for that
config and more detail on the server itself.

## License

MIT
