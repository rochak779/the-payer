import type { Decision, PurchaseRequest, RunEvent } from '@/domain/types';

export type SearchResult = { title: string; url: string; snippet: string };

export interface WebSearch {
  readonly name: string;
  search(query: string): Promise<SearchResult[]>;
}

export type ShopperEvent = Omit<RunEvent, 'at'>;

/** Everything the agent may do. It never sees a card. */
export type ShopperTools = {
  searchWeb(query: string): Promise<SearchResult[]>;
  requestPurchase(req: PurchaseRequest): Promise<Decision>;
};

export interface Shopper {
  readonly name: string;
  run(task: string, tools: ShopperTools, emit: (event: ShopperEvent) => void): Promise<void>;
}
