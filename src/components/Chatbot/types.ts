export type Role = 'user' | 'model';
export type Lang = 'en' | 'ms' | 'zh';

export interface ChatMessage {
  role: Role;
  text: string;
  /** The fixed greeting: shown, but never stored or sent to the model. */
  intro?: boolean;
  /** Error notices: shown, but never sent back to the model as history. */
  local?: boolean;
  /** A reply still arriving from the server. */
  streaming?: boolean;
}

export const isLang = (value: unknown): value is Lang => value === 'en' || value === 'ms' || value === 'zh';
