import Anthropic from '@anthropic-ai/sdk';

export const CHECKER_MODEL = process.env.CHECKER_MODEL ?? 'claude-sonnet-5-5';
export const AGENT_MODEL = process.env.AGENT_MODEL ?? 'claude-sonnet-5-5';
export type Effort = 'low' | 'medium' | 'high';
export const CHECKER_EFFORT = (process.env.CHECKER_EFFORT ?? 'medium') as Effort;

let client: Anthropic | undefined;

/** Uses ANTHROPIC_API_KEY, or an `ant auth login` profile if no key is set. */
export function claude(): Anthropic {
  client ??= new Anthropic();
  return client;
}
