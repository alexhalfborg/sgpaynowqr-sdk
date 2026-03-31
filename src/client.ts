import { SGPayNowQRError } from "./errors.js";
import type {
  BatchParams,
  BatchResponse,
  ClientOptions,
  GenerateParams,
  GenerateResponse,
  HealthResponse,
  RateLimitInfo,
  SGPayNowQRClient,
} from "./types.js";

const DEFAULT_BASE_URL = "https://developers.sgpaynowqr.com/api/v1";

export function createClient(
  apiKey: string,
  options?: ClientOptions,
): SGPayNowQRClient {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("API key is required");
  }

  const baseUrl = (options?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const fetchFn = options?.fetch ?? globalThis.fetch;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    authenticated = true,
  ): Promise<{ data: T; meta: any; rateLimit: RateLimitInfo }> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (authenticated) {
      headers["X-API-Key"] = apiKey;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new SGPayNowQRError({
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network request failed",
        status: 0,
      });
    }

    const rateLimit = parseRateLimitHeaders(response.headers);
    const requestId = response.headers.get("X-Request-Id") ?? undefined;

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new SGPayNowQRError({
        code: "PARSE_ERROR",
        message: `Unexpected response (HTTP ${response.status})`,
        status: response.status,
        requestId,
        rateLimit,
      });
    }

    if (!json.success) {
      throw new SGPayNowQRError({
        code: json.error?.code ?? "UNKNOWN_ERROR",
        message: json.error?.message ?? "Unknown error",
        status: response.status,
        requestId: json.meta?.request_id ?? requestId,
        rateLimit,
      });
    }

    return { data: json.data, meta: json.meta, rateLimit };
  }

  return {
    async generate(params: GenerateParams): Promise<GenerateResponse> {
      const { data, meta, rateLimit } = await request<GenerateResponse["data"]>(
        "POST",
        "/generate",
        params,
      );
      return { data, meta, rateLimit };
    },

    async generateBatch(params: BatchParams): Promise<BatchResponse> {
      const { data, meta, rateLimit } = await request<BatchResponse["data"]>(
        "POST",
        "/generate/batch",
        params,
      );
      return { data, meta, rateLimit };
    },

    async health(): Promise<HealthResponse> {
      const { data, meta } = await request<HealthResponse["data"]>(
        "GET",
        "/health",
        undefined,
        false,
      );
      return { data, meta };
    },
  };
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limit: parseInt(headers.get("X-RateLimit-Limit") ?? "0", 10),
    remaining: parseInt(headers.get("X-RateLimit-Remaining") ?? "0", 10),
    reset: headers.get("X-RateLimit-Reset") ?? "",
  };
}
