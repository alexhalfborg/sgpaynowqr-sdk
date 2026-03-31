# sgpaynowqr

TypeScript SDK for the [SGPayNowQR API](https://developers.sgpaynowqr.com/docs) — generate EMVCo-compliant Singapore PayNow QR codes.

- Zero dependencies (uses native `fetch`)
- Full TypeScript types with discriminated unions
- Dual CJS/ESM output
- Node.js 18+

## Install

```bash
npm install sgpaynowqr
```

## Quick Start

Get your API key at [developers.sgpaynowqr.com](https://developers.sgpaynowqr.com/register).

### UEN Payment

```typescript
import { createClient } from "sgpaynowqr";

const client = createClient("sgpn_your_api_key");

const { data } = await client.generate({
  payment_type: "uen",
  uen: "201234567A",
  merchant_name: "My Company",
  amount: 25.0,
  reference: "INV001",
});

console.log(data.qr_string); // EMVCo QR string
```

### Mobile Payment

```typescript
const { data } = await client.generate({
  payment_type: "mobile",
  mobile_number: "+6591234567",
  amount: 10.5,
});
```

### VPA Payment

```typescript
const { data } = await client.generate({
  payment_type: "vpa",
  vpa: "+6591234567#OCBC",
  amount: 5.0,
  reference: "DONATION",
});
```

## Response

Every `generate()` call returns `data`, `meta`, and `rateLimit`:

```typescript
const result = await client.generate({
  payment_type: "uen",
  uen: "201234567A",
  merchant_name: "My Company",
  amount: 25.0,
});

// QR code data
result.data.qr_string;        // "000201010212..."
result.data.qr_image_base64;  // base64-encoded PNG (when include_image=true)
result.data.payment_type;     // "uen"
result.data.amount;           // "25.00" (string)
result.data.currency;         // "SGD"
result.data.reference;        // string | null
result.data.expiry;           // "24h"

// API metadata
result.meta.request_id;       // "req_abc123def456"
result.meta.usage?.used;      // 42
result.meta.usage?.limit;     // 200

// Rate limit info (from response headers)
result.rateLimit.limit;       // 200
result.rateLimit.remaining;   // 158
result.rateLimit.reset;       // "2026-04-01T00:00:00+08:00"
```

## Save QR Image to File

```typescript
import { writeFileSync } from "node:fs";

const { data } = await client.generate({
  payment_type: "uen",
  uen: "201234567A",
  merchant_name: "My Company",
  amount: 25.0,
});

if (data.qr_image_base64) {
  writeFileSync("qr.png", Buffer.from(data.qr_image_base64, "base64"));
}
```

## Optional Parameters

```typescript
const { data } = await client.generate({
  payment_type: "uen",
  uen: "201234567A",
  merchant_name: "My Company",
  amount: 25.0,
  reference: "INV001",        // alphanumeric, max 25 chars
  expiry: "6h",               // "1h" | "2h" | "6h" | "12h" | "24h" | "none"
  qr_color: "ff0000",         // hex color without #
  qr_size: 400,               // 200 | 300 | 400 pixels
  include_image: false,        // set false to skip base64 PNG
});
```

## Error Handling

All API and network errors throw `SGPayNowQRError`:

```typescript
import { createClient, SGPayNowQRError } from "sgpaynowqr";

const client = createClient("sgpn_your_api_key");

try {
  await client.generate({
    payment_type: "uen",
    uen: "201234567A",
    merchant_name: "My Company",
    amount: 25.0,
  });
} catch (err) {
  if (err instanceof SGPayNowQRError) {
    console.error(err.code);       // "VALIDATION_ERROR" | "UNAUTHORIZED" | "RATE_LIMIT_EXCEEDED" | ...
    console.error(err.message);    // "Missing required fields"
    console.error(err.status);     // 400 (HTTP status, 0 for network errors)
    console.error(err.requestId);  // "req_abc123def456"
    console.error(err.rateLimit);  // { limit, remaining, reset }

    if (err.code === "RATE_LIMIT_EXCEEDED") {
      console.log(`Resets at: ${err.rateLimit?.reset}`);
    }
  }
}
```

### Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid parameters or missing required fields |
| 400 | `INVALID_JSON` | Request body is not valid JSON |
| 400 | `INVALID_CONTENT_TYPE` | Content-Type must be application/json |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 429 | `RATE_LIMIT_EXCEEDED` | Monthly usage limit exceeded |
| 500 | `INTERNAL_ERROR` | Server error |
| 0 | `NETWORK_ERROR` | Network failure (DNS, timeout, etc.) |

## TypeScript

`GenerateParams` is a discriminated union — TypeScript enforces the correct fields for each payment type:

```typescript
// TypeScript will error: Property 'uen' is missing
client.generate({
  payment_type: "uen",
  amount: 10,
  // uen and merchant_name are required when payment_type is "uen"
});

// TypeScript will error: 'uen' does not exist on mobile type
client.generate({
  payment_type: "mobile",
  uen: "201234567A", // wrong field for mobile
  amount: 10,
});
```

Import types directly:

```typescript
import type { GenerateParams, GenerateResponse, RateLimitInfo } from "sgpaynowqr";
```

## Health Check

```typescript
const { data } = await client.health();
console.log(data.status); // "ok" | "degraded"
```

## Configuration

```typescript
const client = createClient("sgpn_your_api_key", {
  baseUrl: "https://staging.sgpaynowqr.com/api/v1", // custom base URL
  fetch: customFetchFn,                              // custom fetch implementation
});
```

## Rate Limits

Limits are per API key, per calendar month (Singapore timezone). Only successful requests count.

| Tier | Monthly Limit |
|------|---------------|
| Free | 50 |
| Starter | 200 |
| Pro | 2,000 |
| Enterprise | 10,000 |

Rate limit info is available on every response via `result.rateLimit`.

## Requirements

- Node.js 18+ (uses native `fetch`)
- API key from [developers.sgpaynowqr.com](https://developers.sgpaynowqr.com/register)

## License

MIT
