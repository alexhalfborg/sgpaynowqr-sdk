import { describe, it, expect } from "vitest";
import { createClient } from "../src/client.js";
import { SGPayNowQRError } from "../src/errors.js";
import {
  mockFetch,
  capturingFetch,
  GENERATE_SUCCESS_BODY,
  HEALTH_SUCCESS_BODY,
} from "./helpers.js";

// ---------------------------------------------------------------------------
// Client construction
// ---------------------------------------------------------------------------

describe("createClient", () => {
  it("throws if apiKey is empty", () => {
    expect(() => createClient("")).toThrow("API key is required");
  });

  it("throws if apiKey is not a string", () => {
    // @ts-expect-error — testing runtime guard
    expect(() => createClient(undefined)).toThrow("API key is required");
  });

  it("uses custom baseUrl", async () => {
    const { fetch, captured } = capturingFetch({ body: GENERATE_SUCCESS_BODY });
    const client = createClient("sgpn_test", {
      baseUrl: "https://custom.example.com/api/v1",
      fetch,
    });
    await client.generate({ payment_type: "uen", uen: "201234567A", merchant_name: "Test", amount: 10 });
    expect(captured().url).toBe("https://custom.example.com/api/v1/generate");
  });

  it("strips trailing slash from baseUrl", async () => {
    const { fetch, captured } = capturingFetch({ body: GENERATE_SUCCESS_BODY });
    const client = createClient("sgpn_test", {
      baseUrl: "https://custom.example.com/api/v1/",
      fetch,
    });
    await client.generate({ payment_type: "uen", uen: "201234567A", merchant_name: "Test", amount: 10 });
    expect(captured().url).toBe("https://custom.example.com/api/v1/generate");
  });

  it("uses custom fetch function", async () => {
    let called = false;
    const customFetch: typeof fetch = async () => {
      called = true;
      return new Response(JSON.stringify(GENERATE_SUCCESS_BODY), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createClient("sgpn_test", { fetch: customFetch });
    await client.generate({ payment_type: "uen", uen: "201234567A", merchant_name: "Test", amount: 10 });
    expect(called).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generate()
// ---------------------------------------------------------------------------

describe("generate()", () => {
  it("sends correct request for UEN payment", async () => {
    const { fetch, captured } = capturingFetch({ body: GENERATE_SUCCESS_BODY });
    const client = createClient("sgpn_testkey", { fetch });
    await client.generate({
      payment_type: "uen",
      uen: "201234567A",
      merchant_name: "My Company",
      amount: 25,
      reference: "INV001",
    });

    const { url, init } = captured();
    expect(url).toBe("https://developers.sgpaynowqr.com/api/v1/generate");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("sgpn_testkey");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Accept"]).toBe("application/json");
    const body = JSON.parse(init.body as string);
    expect(body.payment_type).toBe("uen");
    expect(body.uen).toBe("201234567A");
    expect(body.merchant_name).toBe("My Company");
    expect(body.amount).toBe(25);
    expect(body.reference).toBe("INV001");
  });

  it("sends correct request for mobile payment", async () => {
    const { fetch, captured } = capturingFetch({ body: GENERATE_SUCCESS_BODY });
    const client = createClient("sgpn_test", { fetch });
    await client.generate({
      payment_type: "mobile",
      mobile_number: "+6591234567",
      amount: 10.5,
    });

    const body = JSON.parse(captured().init.body as string);
    expect(body.payment_type).toBe("mobile");
    expect(body.mobile_number).toBe("+6591234567");
    expect(body.amount).toBe(10.5);
  });

  it("sends correct request for VPA payment", async () => {
    const { fetch, captured } = capturingFetch({ body: GENERATE_SUCCESS_BODY });
    const client = createClient("sgpn_test", { fetch });
    await client.generate({
      payment_type: "vpa",
      vpa: "+6591234567#OCBC",
      amount: 5,
      reference: "DONATION",
    });

    const body = JSON.parse(captured().init.body as string);
    expect(body.payment_type).toBe("vpa");
    expect(body.vpa).toBe("+6591234567#OCBC");
    expect(body.reference).toBe("DONATION");
  });

  it("sends all optional fields", async () => {
    const { fetch, captured } = capturingFetch({ body: GENERATE_SUCCESS_BODY });
    const client = createClient("sgpn_test", { fetch });
    await client.generate({
      payment_type: "uen",
      uen: "201234567A",
      merchant_name: "Test",
      amount: 100,
      reference: "REF123",
      expiry: "6h",
      qr_color: "ff0000",
      qr_size: 400,
      include_image: false,
    });

    const body = JSON.parse(captured().init.body as string);
    expect(body.expiry).toBe("6h");
    expect(body.qr_color).toBe("ff0000");
    expect(body.qr_size).toBe(400);
    expect(body.include_image).toBe(false);
  });

  it("returns unwrapped data, meta, and rateLimit", async () => {
    const client = createClient("sgpn_test", {
      fetch: mockFetch({ body: GENERATE_SUCCESS_BODY }),
    });
    const result = await client.generate({
      payment_type: "uen",
      uen: "201234567A",
      merchant_name: "Test",
      amount: 25,
    });

    expect(result.data.qr_string).toBe("000201010212...");
    expect(result.data.payment_type).toBe("uen");
    expect(result.data.amount).toBe("25.00");
    expect(result.data.currency).toBe("SGD");
    expect(result.data.reference).toBe("INV001");
    expect(result.data.expiry).toBe("24h");
    expect(result.meta.api_version).toBe("v1");
    expect(result.meta.request_id).toBe("req_abc123def456");
    expect(result.meta.usage).toEqual({ used: 42, limit: 200, period: "2026-03" });
  });

  it("parses rate limit headers", async () => {
    const client = createClient("sgpn_test", {
      fetch: mockFetch({ body: GENERATE_SUCCESS_BODY }),
    });
    const result = await client.generate({
      payment_type: "uen",
      uen: "201234567A",
      merchant_name: "Test",
      amount: 25,
    });

    expect(result.rateLimit.limit).toBe(200);
    expect(result.rateLimit.remaining).toBe(158);
    expect(result.rateLimit.reset).toBe("2026-04-01T00:00:00+08:00");
  });

  it("handles response without image fields", async () => {
    const bodyWithoutImage = {
      ...GENERATE_SUCCESS_BODY,
      data: {
        qr_string: "000201010212...",
        payment_type: "uen",
        amount: "25.00",
        currency: "SGD",
        reference: null,
        expiry: "24h",
      },
    };
    const client = createClient("sgpn_test", {
      fetch: mockFetch({ body: bodyWithoutImage }),
    });
    const result = await client.generate({
      payment_type: "uen",
      uen: "201234567A",
      merchant_name: "Test",
      amount: 25,
      include_image: false,
    });

    expect(result.data.qr_image_base64).toBeUndefined();
    expect(result.data.image_mime_type).toBeUndefined();
    expect(result.data.reference).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// generate() – errors
// ---------------------------------------------------------------------------

describe("generate() errors", () => {
  it("throws SGPayNowQRError on 400 VALIDATION_ERROR", async () => {
    const client = createClient("sgpn_test", {
      fetch: mockFetch({
        status: 400,
        body: {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Missing required fields" },
          meta: { api_version: "v1", request_id: "req_err1" },
        },
      }),
    });

    await expect(
      client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 0 }),
    ).rejects.toThrow(SGPayNowQRError);

    try {
      await client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 0 });
    } catch (err) {
      const e = err as SGPayNowQRError;
      expect(e.code).toBe("VALIDATION_ERROR");
      expect(e.status).toBe(400);
      expect(e.message).toBe("Missing required fields");
      expect(e.requestId).toBe("req_err1");
    }
  });

  it("throws on 401 UNAUTHORIZED", async () => {
    const client = createClient("sgpn_bad", {
      fetch: mockFetch({
        status: 401,
        body: {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid API key" },
          meta: { api_version: "v1", request_id: "req_err2" },
        },
      }),
    });

    try {
      await client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 1 });
    } catch (err) {
      const e = err as SGPayNowQRError;
      expect(e.code).toBe("UNAUTHORIZED");
      expect(e.status).toBe(401);
    }
  });

  it("throws on 429 with rateLimit populated", async () => {
    const client = createClient("sgpn_test", {
      fetch: mockFetch({
        status: 429,
        body: {
          success: false,
          error: { code: "RATE_LIMIT_EXCEEDED", message: "Monthly usage limit exceeded" },
          meta: { api_version: "v1", request_id: "req_err3" },
        },
        headers: {
          "X-RateLimit-Limit": "200",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "2026-04-01T00:00:00+08:00",
        },
      }),
    });

    try {
      await client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 1 });
    } catch (err) {
      const e = err as SGPayNowQRError;
      expect(e.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(e.status).toBe(429);
      expect(e.rateLimit?.remaining).toBe(0);
    }
  });

  it("throws on 500 INTERNAL_ERROR", async () => {
    const client = createClient("sgpn_test", {
      fetch: mockFetch({
        status: 500,
        body: {
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Server error" },
          meta: { api_version: "v1", request_id: "req_err4" },
        },
      }),
    });

    try {
      await client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 1 });
    } catch (err) {
      const e = err as SGPayNowQRError;
      expect(e.code).toBe("INTERNAL_ERROR");
      expect(e.status).toBe(500);
    }
  });

  it("wraps network errors as NETWORK_ERROR", async () => {
    const client = createClient("sgpn_test", {
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    try {
      await client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 1 });
    } catch (err) {
      const e = err as SGPayNowQRError;
      expect(e.code).toBe("NETWORK_ERROR");
      expect(e.status).toBe(0);
      expect(e.message).toBe("fetch failed");
      expect(e.requestId).toBeUndefined();
      expect(e.rateLimit).toBeUndefined();
    }
  });

  it("wraps non-JSON responses as PARSE_ERROR", async () => {
    const client = createClient("sgpn_test", {
      fetch: async () =>
        new Response("not json", {
          status: 502,
          headers: { "X-Request-Id": "req_parse" },
        }),
    });

    try {
      await client.generate({ payment_type: "uen", uen: "X", merchant_name: "T", amount: 1 });
    } catch (err) {
      const e = err as SGPayNowQRError;
      expect(e.code).toBe("PARSE_ERROR");
      expect(e.status).toBe(502);
      expect(e.requestId).toBe("req_parse");
    }
  });
});

// ---------------------------------------------------------------------------
// health()
// ---------------------------------------------------------------------------

describe("health()", () => {
  it("returns health data without auth header", async () => {
    const { fetch, captured } = capturingFetch({ body: HEALTH_SUCCESS_BODY });
    const client = createClient("sgpn_test", { fetch });
    const result = await client.health();

    expect(result.data.status).toBe("ok");
    expect(result.data.version).toBe("v1");
    expect(result.meta.api_version).toBe("v1");

    const headers = captured().init.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBeUndefined();
    expect(captured().url).toContain("/health");
  });

  it("returns degraded status", async () => {
    const degradedBody = {
      ...HEALTH_SUCCESS_BODY,
      data: { ...HEALTH_SUCCESS_BODY.data, status: "degraded" },
    };
    const client = createClient("sgpn_test", {
      fetch: mockFetch({ body: degradedBody }),
    });
    const result = await client.health();
    expect(result.data.status).toBe("degraded");
  });
});

