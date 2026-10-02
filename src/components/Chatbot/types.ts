export type Role = 'user' | 'model';
export type Lang = 'en' | 'ms' | 'zh';

export interface ChatMessage {
  role: Role;
  text: string;
  /** The fixed greeting: shown, but never stored or sent to the model. */
  intro?: boolean;
  /** Error notices: shown, but never sent back to the model as history. */
  local?: boolean;
  /** Tappable next steps offered with this reply. */
  options?: string[];
}

export const isLang = (value: unknown): value is Lang => value === 'en' || value === 'ms' || value === 'zh';

const MAX_OPTIONS = 3;
const MAX_OPTION_CHARS = 60;

/** Next-step options from the server or storage: up to three short, distinct strings. */
export function toOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const options: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const option = item.trim();
    if (option && option.length <= MAX_OPTION_CHARS && !options.includes(option)) options.push(option);
  }
  return options.slice(0, MAX_OPTIONS);
}
