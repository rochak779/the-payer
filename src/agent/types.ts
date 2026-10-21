import type { Decision, Money, PurchaseRequest, RunEvent } from '@/domain/types';

/** One shop's price for a product, read from a product search (Channel3). */
export type Offer = { shop: string; price: Money; condition: 'new' | 'used' | 'refurbished' | 'unknown'; inStock: boolean };
export type SearchResult = { title: string; url: string; snippet: string; offer?: Offer };

export interface WebSearch {
  readonly name: string;
  search(query: string): Promise<SearchResult[]>;
}

export type ShopperEvent = Omit<RunEvent, 'at'>;

/** Everything the agent may do. It never sees how the person pays. */
export type ShopperTools = {
  searchWeb(query: string): Promise<SearchResult[]>;
  requestPurchase(req: PurchaseRequest): Promise<Decision>;
};

export interface Shopper {
  readonly name: string;
  run(task: string, tools: ShopperTools, emit: (event: ShopperEvent) => void): Promise<void>;
}
