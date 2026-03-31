// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface ClientOptions {
  /** Override the base URL (default: https://developers.sgpaynowqr.com/api/v1) */
  baseUrl?: string;
  /** Provide a custom fetch implementation (default: globalThis.fetch) */
  fetch?: typeof fetch;
}

export interface SGPayNowQRClient {
  generate(params: GenerateParams): Promise<GenerateResponse>;
  generateBatch(params: BatchParams): Promise<BatchResponse>;
  health(): Promise<HealthResponse>;
}

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
}

// ---------------------------------------------------------------------------
// Shared meta
// ---------------------------------------------------------------------------

export interface UsageInfo {
  used: number;
  limit: number;
  period: string;
}

export interface ResponseMeta {
  api_version: string;
  request_id: string;
  usage?: UsageInfo;
}

// ---------------------------------------------------------------------------
// Generate – request
// ---------------------------------------------------------------------------

export type PaymentType = "uen" | "mobile" | "vpa";
export type Expiry = "1h" | "2h" | "6h" | "12h" | "24h" | "none";
export type QRSize = 200 | 300 | 400;

interface GenerateBase {
  amount: number;
  reference?: string;
  expiry?: Expiry;
  qr_color?: string;
  qr_size?: QRSize;
  include_image?: boolean;
}

export interface GenerateUEN extends GenerateBase {
  payment_type: "uen";
  uen: string;
  merchant_name: string;
}

export interface GenerateMobile extends GenerateBase {
  payment_type: "mobile";
  mobile_number: string;
}

export interface GenerateVPA extends GenerateBase {
  payment_type: "vpa";
  vpa: string;
}

export type GenerateParams = GenerateUEN | GenerateMobile | GenerateVPA;

// ---------------------------------------------------------------------------
// Generate – response
// ---------------------------------------------------------------------------

export interface GenerateData {
  qr_string: string;
  qr_image_base64?: string;
  image_mime_type?: string;
  payment_type: PaymentType;
  amount: string;
  currency: "SGD";
  reference: string | null;
  expiry: Expiry;
}

export interface GenerateResponse {
  data: GenerateData;
  meta: ResponseMeta;
  rateLimit: RateLimitInfo;
}

// ---------------------------------------------------------------------------
// Batch – request
// ---------------------------------------------------------------------------

interface BatchItemBase {
  amount: number;
  reference?: string;
  expiry?: Expiry;
}

export interface BatchItemUEN extends BatchItemBase {
  payment_type: "uen";
  uen: string;
  merchant_name: string;
}

export interface BatchItemMobile extends BatchItemBase {
  payment_type: "mobile";
  mobile_number: string;
}

export interface BatchItemVPA extends BatchItemBase {
  payment_type: "vpa";
  vpa: string;
}

export type BatchItem = BatchItemUEN | BatchItemMobile | BatchItemVPA;

export interface BatchParams {
  items: BatchItem[];
  qr_color?: string;
  qr_size?: QRSize;
  include_image?: boolean;
}

// ---------------------------------------------------------------------------
// Batch – response
// ---------------------------------------------------------------------------

export interface BatchResultSuccess {
  index: number;
  success: true;
  data: GenerateData;
}

export interface BatchResultFailure {
  index: number;
  success: false;
  error: { code: string; message: string };
}

export type BatchResult = BatchResultSuccess | BatchResultFailure;

export interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
}

export interface BatchResponse {
  data: {
    results: BatchResult[];
    summary: BatchSummary;
  };
  meta: ResponseMeta;
  rateLimit: RateLimitInfo;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthData {
  status: "ok" | "degraded";
  version: string;
  timestamp: string;
}

export interface HealthResponse {
  data: HealthData;
  meta: ResponseMeta;
}
