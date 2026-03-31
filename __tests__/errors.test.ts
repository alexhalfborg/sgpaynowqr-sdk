import { describe, it, expect } from "vitest";
import { SGPayNowQRError } from "../src/errors.js";

describe("SGPayNowQRError", () => {
  it("is an instance of Error", () => {
    const err = new SGPayNowQRError({
      code: "VALIDATION_ERROR",
      message: "Invalid amount",
      status: 400,
    });
    expect(err).toBeInstanceOf(Error);
  });

  it("has name SGPayNowQRError", () => {
    const err = new SGPayNowQRError({
      code: "UNAUTHORIZED",
      message: "Invalid API key",
      status: 401,
    });
    expect(err.name).toBe("SGPayNowQRError");
  });

  it("assigns all properties", () => {
    const rateLimit = { limit: 200, remaining: 0, reset: "2026-04-01T00:00:00+08:00" };
    const err = new SGPayNowQRError({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Monthly usage limit exceeded",
      status: 429,
      requestId: "req_123",
      rateLimit,
    });
    expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(err.message).toBe("Monthly usage limit exceeded");
    expect(err.status).toBe(429);
    expect(err.requestId).toBe("req_123");
    expect(err.rateLimit).toEqual(rateLimit);
  });

  it("leaves optional properties undefined when not provided", () => {
    const err = new SGPayNowQRError({
      code: "NETWORK_ERROR",
      message: "Network request failed",
      status: 0,
    });
    expect(err.requestId).toBeUndefined();
    expect(err.rateLimit).toBeUndefined();
  });
});
