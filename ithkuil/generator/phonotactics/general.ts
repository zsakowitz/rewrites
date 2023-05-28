export const ILLEGAL_CONSONANT_FORMS =
  /[dt][szšžcżčjḑţ]|[kg][xň]|[cżčj][szšžç]|ç[szšžżjļh]|[szšžcżčjxļh]ç|m[pb][fvtd]|(?:m[pb]|n[tdkg]|ň[kg])[szšžcżčjç]|ň[kgxy]|x[szšžçgļňyhř]|[bdghç]l|l[hļszšžç]|[ļxç]h$|[rh]ř|s[šzž]|z[šžs]|š[zžs]|ž[šzs]|bp|pb|kg|gk|dp|pd|fv|ţḑ|sz|šž|vf|ḑţ|zs|žš|cż|żc|čj|jč|čc|jc|čż|jż|šc|šż|žc|žż|sż|nc|nč|nż|nj|ngḑ|np|nb|řr|nf(?!$)|nv(?!$)|[wy](?!$)/iu

export function isLegalConsonantForm(text: string) {
  return !ILLEGAL_CONSONANT_FORMS.test(text)
}
