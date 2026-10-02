// Spots messages where the visitor wants something only the Nuren team can
// give (a price, quote, proposal, budget plan or meeting), so the per-turn
// note can remind Nura to name the "Talk to our team" button. In production
// evals Nura answered these well but often forgot to point to the button,
// which is where the lead is captured.

const PATTERNS = [
  /\b(?:prices?|pricing|costs?|how much|rate ?cards?|quotes?|quotation|proposals?|propose|media plan|budget|meeting|meet up)\b/i,
  /\bRM\s?\d/i,
  /\b(?:harga|kos|berapa|sebut ?harga|bajet|pakej|cadangan|mesyuarat)\b/i,
  /报价|价格|价钱|多少钱|预算|方案|提案|收费|费用/,
];

/** True when the visitor is asking for pricing, a proposal, a budget plan or a meeting. */
export function asksForTeam(message) {
  if (typeof message !== 'string') return false;
  return PATTERNS.some((re) => re.test(message));
}
