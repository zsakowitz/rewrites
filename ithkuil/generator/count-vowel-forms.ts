export function countVowelForms(text: string) {
  return text.match(/[aeiouäëöü]+/g)?.length || 0
}
