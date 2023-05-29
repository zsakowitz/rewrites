export const CONSONANT = /[^aeiouäëöü]/g

export function extractAllVowels(text: string): string {
  return text.replace(CONSONANT, "")
}

export const VOWEL = /[aeiouäëöü]/g

export function extractAllConsonants(text: string): string {
  return text.replace(VOWEL, "")
}

export const INITIAL_CONSONANT_CLUSTER = /^[^aeiouäëöü]+/

export function extractInitialConsonantCluster(
  text: string,
): string | undefined {
  return text.match(INITIAL_CONSONANT_CLUSTER)?.[0]
}

export const FINAL_CONSONANT_CLUSTER = /[^aeiouäëöü]+$/

export function extractFinalConsonantCluster(text: string): string | undefined {
  return text.match(FINAL_CONSONANT_CLUSTER)?.[0]
}

export const INITIAL_VOWEL_CLUSTER = /^[aeiouäëöü]+/

export function extractInitialVowelCluster(text: string): string | undefined {
  return text.match(INITIAL_VOWEL_CLUSTER)?.[0]
}

export const FINAL_VOWEL_CLUSTER = /[aeiouäëöü]+$/

export function extractFinalVowelCluster(text: string): string | undefined {
  return text.match(FINAL_VOWEL_CLUSTER)?.[0]
}
