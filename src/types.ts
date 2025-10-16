export interface ProductData {
  site: string;
  url: string;
  timestamp: number;
  title: string;
  price: number;
  priceRaw: string;
  image: string | null;
  seller: string | null;
  productId: string | null;
  reviews: string | null;
  rating: string | null;
}

export interface DealResult {
  title: string;
  price: number;
  source: string;
  url: string;
  image?: string;
  shipping?: string;
  trustScore?: number;
}

export interface DealData {
  results: DealResult[];
  timestamp: number;
}

export interface PricePoint {
  date: number;
  price: number;
}

export interface PriceHistoryData {
  prices: PricePoint[];
}

export interface TrustBreakdown {
  sellerReputation: number;
  ratingQuality: number;
  reviewCount: number;
  pricePositioning: number;
  platformReliability: number;
}

export interface AnalysisData {
  product: ProductData;
  deals: DealData;
  trustScore: number;
  trustBreakdown?: TrustBreakdown;
  summary?: string | null; // Summarizer API generated summary (streaming)
  summaryComplete?: boolean; // True when streaming is complete
  priceHistory: PriceHistoryData | null;
  timestamp: number;
}
