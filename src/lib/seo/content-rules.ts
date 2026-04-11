import type { SeoMetaInput } from './contracts';

const CITY_NAMES = ['Santiago', 'Valparaíso', 'Concepción'];

export function validateSeoCopyRules(input: SeoMetaInput): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title || !description) {
    reasons.push('title y description son obligatorios.');
  }

  if (input.supportIntent && input.supportIntent === input.intent) {
    reasons.push('supportIntent debe ser distinto de intent principal.');
  }

  if (countRepeatedTokens(title) > 2 || countRepeatedTokens(description) > 3) {
    reasons.push('Se detectó repetición artificial de keywords (keyword stuffing).');
  }

  if (hasTooManyCityMentions(title) || hasTooManyCityMentions(description)) {
    reasons.push('Cada campo (title o description) puede mencionar como máximo una ciudad de Chile.');
  }

  return { ok: reasons.length === 0, reasons };
}

function countRepeatedTokens(text: string): number {
  const clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');

  const words = clean
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const occurrences = new Map<string, number>();

  for (const word of words) {
    occurrences.set(word, (occurrences.get(word) ?? 0) + 1);
  }

  let highestRepeat = 1;

  for (const value of occurrences.values()) {
    if (value > highestRepeat) {
      highestRepeat = value;
    }
  }

  return highestRepeat;
}

function hasTooManyCityMentions(text: string): boolean {
  let mentions = 0;

  for (const city of CITY_NAMES) {
    const regex = new RegExp(`\\b${city}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      mentions += matches.length;
    }
  }

  return mentions > 1;
}
