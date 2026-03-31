# Changelog

## 0.1.0

Initial release.

- `createClient(apiKey)` factory function
- `generate()` — single QR code generation (UEN, mobile, VPA)
- `generateBatch()` — batch generation (Pro/Enterprise)
- `health()` — health check
- Discriminated union types for type-safe request params
- `SGPayNowQRError` with `code`, `status`, `requestId`, `rateLimit`
- Rate limit headers parsed on every response
- Dual CJS/ESM output with TypeScript declarations
