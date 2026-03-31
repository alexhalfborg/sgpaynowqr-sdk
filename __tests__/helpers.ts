export function mockFetch(config: {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
}): typeof fetch {
  return async (_input: string | URL | Request, _init?: RequestInit) => {
    return new Response(JSON.stringify(config.body), {
      status: config.status ?? 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "200",
        "X-RateLimit-Remaining": "158",
        "X-RateLimit-Reset": "2026-04-01T00:00:00+08:00",
        "X-Request-Id": "req_test123",
        ...config.headers,
      },
    });
  };
}

export function capturingFetch(config: {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
}): { fetch: typeof fetch; captured: () => { url: string; init: RequestInit } } {
  let capturedUrl = "";
  let capturedInit: RequestInit = {};

  const fetchFn: typeof fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    capturedUrl = String(input);
    capturedInit = init ?? {};
    return new Response(JSON.stringify(config.body), {
      status: config.status ?? 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "200",
        "X-RateLimit-Remaining": "158",
        "X-RateLimit-Reset": "2026-04-01T00:00:00+08:00",
        "X-Request-Id": "req_test123",
        ...config.headers,
      },
    });
  };

  return {
    fetch: fetchFn,
    captured: () => ({ url: capturedUrl, init: capturedInit }),
  };
}

export const GENERATE_SUCCESS_BODY = {
  success: true,
  data: {
    qr_string: "000201010212...",
    qr_image_base64: "iVBORw0KGgo...",
    image_mime_type: "image/png",
    payment_type: "uen",
    amount: "25.00",
    currency: "SGD",
    reference: "INV001",
    expiry: "24h",
  },
  meta: {
    api_version: "v1",
    request_id: "req_abc123def456",
    usage: { used: 42, limit: 200, period: "2026-03" },
  },
};

export const HEALTH_SUCCESS_BODY = {
  success: true,
  data: {
    status: "ok",
    version: "v1",
    timestamp: "2026-03-22T14:30:00.000Z",
  },
  meta: {
    api_version: "v1",
    request_id: "req_health123",
  },
};

export const BATCH_SUCCESS_BODY = {
  success: true,
  data: {
    results: [
      {
        index: 0,
        success: true,
        data: {
          qr_string: "000201010212...",
          qr_image_base64: "iVBORw0KGgo...",
          image_mime_type: "image/png",
          payment_type: "uen",
          amount: "10.50",
          currency: "SGD",
          reference: null,
          expiry: "24h",
        },
      },
      {
        index: 1,
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid mobile number",
        },
      },
    ],
    summary: { total: 2, succeeded: 1, failed: 1 },
  },
  meta: {
    api_version: "v1",
    request_id: "req_batch123",
    usage: { used: 43, limit: 2000, period: "2026-03" },
  },
};
