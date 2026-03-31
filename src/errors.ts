import type { RateLimitInfo } from "./types.js";

export class SGPayNowQRError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | undefined;
  readonly rateLimit: RateLimitInfo | undefined;

  constructor(params: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    rateLimit?: RateLimitInfo;
  }) {
    super(params.message);
    this.name = "SGPayNowQRError";
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
    this.rateLimit = params.rateLimit;
  }
}
