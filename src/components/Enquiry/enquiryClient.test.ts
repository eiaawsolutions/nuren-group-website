import { describe, it, expect } from 'vitest';
import { validateBrief, fillEmpty, prefillFor, EMPTY_ENQUIRY, isCampaignType, ENQUIRY_TYPES } from './enquiryClient';

describe('validateBrief', () => {
  it('accepts the document and image types a brief usually comes in', () => {
    for (const name of ['brief.pdf', 'Brief.DOCX', 'deck.pptx', 'budget.xlsx', 'mood.png', 'mood.jpg']) {
      expect(validateBrief({ name, size: 1000 }), name).toBeNull();
    }
  });

  it('refuses other file types, empty files and files over 4 MB', () => {
    expect(validateBrief({ name: 'run.exe', size: 1000 })).toMatch(/Attach a PDF/);
    expect(validateBrief({ name: 'noextension', size: 1000 })).toMatch(/Attach a PDF/);
    expect(validateBrief({ name: 'a.pdf', size: 0 })).toMatch(/empty/);
    expect(validateBrief({ name: 'a.pdf', size: 4 * 1024 * 1024 + 1 })).toMatch(/4 MB/);
    expect(validateBrief({ name: 'a.pdf', size: 4 * 1024 * 1024 })).toBeNull();
  });
});

describe('fillEmpty', () => {
  it('fills empty fields from the chat draft and leaves typed ones alone', () => {
    const current = { ...EMPTY_ENQUIRY, name: 'Mei Lin', message: 'My own words' };
    const next = fillEmpty(current, { name: 'Someone Else', message: 'Drafted', company: 'Drypers', budget: '' });
    expect(next).toMatchObject({ name: 'Mei Lin', message: 'My own words', company: 'Drypers', budget: '' });
  });

  it('ignores values that are not strings', () => {
    const next = fillEmpty(EMPTY_ENQUIRY, { company: undefined, type: 5 as unknown as string });
    expect(next).toEqual(EMPTY_ENQUIRY);
  });
});

describe('prefillFor', () => {
  it('sets what the enquiry is about, and fills the rest only where empty', () => {
    const current = { ...EMPTY_ENQUIRY, type: 'advertising', name: 'Mei Lin', message: 'Already typed' };
    const next = prefillFor(current, { type: 'career', message: 'Marketing Intern Application' });
    expect(next).toMatchObject({ type: 'career', name: 'Mei Lin', message: 'Already typed' });
    expect(prefillFor(EMPTY_ENQUIRY, { type: 'career', message: 'Marketing Intern Application' }).message).toBe('Marketing Intern Application');
  });

  it('ignores a type the form does not offer', () => {
    expect(prefillFor(EMPTY_ENQUIRY, { type: 'nope' }).type).toBe('');
  });
});

describe('isCampaignType', () => {
  it('asks for campaign details for brand enquiries only', () => {
    expect(isCampaignType('advertising')).toBe(true);
    expect(isCampaignType('press')).toBe(false);
    expect(isCampaignType('')).toBe(false);
    for (const key of Object.keys(ENQUIRY_TYPES)) expect(typeof isCampaignType(key)).toBe('boolean');
  });
});
