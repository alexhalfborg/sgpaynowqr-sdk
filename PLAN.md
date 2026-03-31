# Plan: `sgpaynowqr` npm SDK

## Context

Building a TypeScript SDK wrapper for the SGPayNowQR API (`https://developers.sgpaynowqr.com/api/v1`). The API generates EMVCo-compliant Singapore PayNow QR codes for UEN, mobile, and VPA payment types. The SDK repo (`sgpaynowqr-sdk`) is currently empty (just LICENSE + .gitattributes). The API spec, docs, and `llms-full.txt` are in the sibling `sgpaynowqr-developers` repo.

Goal: a zero-dependency, TypeScript-first SDK with minimal surface area, copy-paste ready README, and dual CJS/ESM output.

---

## 1. Package Scope

**Does:**
- Wraps `POST /generate` (single QR generation)
- Wraps `POST /generate/batch` (batch, Pro/Enterprise)
- Wraps `GET /health` (no auth)
- Parses rate limit headers into a typed object on every response
- Provides discriminated union types that enforce conditional field requirements at compile time
- Throws typed `SGPayNowQRError` for all API/network errors

**Does NOT:**
- Client-side validation (server does Zod validation; TS types handle compile-time checks)
- Retry logic, timeout management, caching
- QR image rendering or EMVCo string parsing
- Authentication/account management

---

## 2. Public API Surface

### Factory function
```ts
createClient(apiKey: string, options?: ClientOptions): SGPayNowQRClient
```

### Client object
```ts
interface SGPayNowQRClient {
  generate(params: GenerateParams): Promise<GenerateResponse>
  generateBatch(params: BatchParams): Promise<BatchResponse>
  health(): Promise<HealthResponse>
}
```

### Request types (discriminated union)
```ts
interface GenerateBase {
  amount: number              // 0.01–999999.99
  reference?: string          // alphanumeric, max 25
  expiry?: "1h" | "2h" | "6h" | "12h" | "24h" | "none"
  qr_color?: string           // 6-char hex, default "7d1979"
  qr_size?: 200 | 300 | 400   // default 300
  include_image?: boolean      // default true
}

type GenerateParams =
  | { payment_type: "uen"; uen: string; merchant_name: string } & GenerateBase
  | { payment_type: "mobile"; mobile_number: string } & GenerateBase
  | { payment_type: "vpa"; vpa: string } & GenerateBase
```

### Response types
```ts
interface GenerateData {
  qr_string: string
  qr_image_base64?: string    // omitted when include_image=false
  image_mime_type?: string     // omitted when include_image=false
  payment_type: "uen" | "mobile" | "vpa"
  amount: string              // "10.50" (string with 2dp)
  currency: "SGD"
  reference: string | null
  expiry: "1h" | "2h" | "6h" | "12h" | "24h" | "none"
}

interface GenerateResponse {
  data: GenerateData
  meta: ResponseMeta
  rateLimit: RateLimitInfo
}
```

### Error class
```ts
class SGPayNowQRError extends Error {
  code: string         // "VALIDATION_ERROR" | "UNAUTHORIZED" | "RATE_LIMIT_EXCEEDED" | ...
  status: number       // HTTP status (0 for network errors)
  requestId?: string
  rateLimit?: RateLimitInfo
}
```

### All exports (from single entry point)
- `createClient` (function)
- `SGPayNowQRError` (class)
- All types via `export type`: `ClientOptions`, `SGPayNowQRClient`, `GenerateParams`, `GenerateUEN`, `GenerateMobile`, `GenerateVPA`, `GenerateData`, `GenerateResponse`, `BatchParams`, `BatchItem`, `BatchResult`, `BatchResultSuccess`, `BatchResultFailure`, `BatchSummary`, `BatchResponse`, `HealthData`, `HealthResponse`, `ResponseMeta`, `UsageInfo`, `RateLimitInfo`

---

## 3. File Structure

```
sgpaynowqr-sdk/
├── src/
│   ├── index.ts          # re-exports only (~15 lines)
│   ├── client.ts         # createClient, request helper, parseRateLimitHeaders (~120 lines)
│   ├── types.ts          # all interfaces/types (~100 lines)
│   └── errors.ts         # SGPayNowQRError class (~30 lines)
├── __tests__/
│   ├── client.test.ts    # main tests with mock fetch
│   ├── errors.test.ts    # error class tests
│   └── helpers.ts        # mockFetch utility
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .gitignore
├── README.md
├── CHANGELOG.md
└── PLAN.md
```

---

## 4. Build/Publish Setup

- **Bundler:** tsup — CJS (`.cjs`) + ESM (`.mjs`) + declarations (`.d.mts`, `.d.cts`)
- **Target:** Node 18+ (native fetch)
- **package.json `exports`:** conditional `import`/`require` with separate type entries
- **`files`:** `["dist"]` — only ship built output
- **`type`:** `"module"` (ESM-first)
- **Zero runtime `dependencies`**
- **`devDependencies`:** tsup, typescript, vitest

### npm keywords
`paynow`, `sgqr`, `singapore`, `qr`, `qr-code`, `payments`, `emvco`, `fintech`, `sdk`, `uen`

---

## 5. README Outline

1. **Title + one-liner** — "TypeScript SDK for the SGPayNowQR API"
2. **Install** — `npm install sgpaynowqr`
3. **Quick Start** — UEN, Mobile, VPA examples (copy-paste ready, 3 lines each)
4. **Response** — shape with `data`, `meta`, `rateLimit`
5. **Save QR Image to File** — Buffer.from + fs.writeFileSync example
6. **Error Handling** — try/catch with `SGPayNowQRError` properties
7. **TypeScript** — discriminated union explanation
8. **Batch Generation** — `generateBatch()` example (Pro/Enterprise)
9. **Health Check** — `health()` one-liner
10. **Configuration** — `ClientOptions` (baseUrl, fetch)
11. **Rate Limits** — tier table (Free 50, Starter 200, Pro 2000, Enterprise 10000)
12. **Requirements** — Node 18+, API key link
13. **License** — MIT

---

## 6. Design Decisions

| Decision | Rationale |
|----------|-----------|
| No client-side validation | TS types enforce structure at compile time; server does Zod validation |
| snake_case field names | Match API spec exactly — no translation layer |
| `rateLimit` (camelCase) on response | SDK-constructed, not from API body |
| `reference: string \| null` in response | API returns null when not provided (per OpenAPI `nullable: true`) |
| `options.fetch` injection | Enables testing + custom environments (Bun, Workers) without dependencies |
| No retry/timeout | Application-specific; users use `AbortSignal.timeout()` or custom fetch |
| Include batch + health | Trivial to implement; omitting forces Pro users to raw-fetch |
| `success` field unwrapped | SDK returns `data`/`meta` on success, throws on error — users never see `success` |

---

## 7. Implementation Sequence

1. Write `PLAN.md` to repo
2. Create config files: `.gitignore`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`
3. `npm install`
4. Create `src/types.ts`, `src/errors.ts`, `src/index.ts`
5. Create `src/client.ts`
6. Run `npm run typecheck`
7. Create `__tests__/helpers.ts`, `__tests__/client.test.ts`, `__tests__/errors.test.ts`
8. Run `npm test`
9. Run `npm run build`, verify dist output
10. Write `README.md` and `CHANGELOG.md`

---

## 8. Verification

- `npm run typecheck` — no errors
- `npm test` — all tests pass (mock fetch, no network)
- `npm run build` — produces `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.mts`, `dist/index.d.cts`
- Manual smoke test: import from both CJS and ESM entry points
- README examples are syntactically valid TypeScript
