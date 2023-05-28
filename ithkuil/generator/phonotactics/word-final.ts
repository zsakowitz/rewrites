import { isLegalConsonantForm } from "./general"

export const LEGAL_WORD_FINAL_1_CONSONANT_FORMS = /^[^wy'h]$/

export const LEGAL_WORD_FINAL_2_CONSONANT_FORMS =
  /^(?:[tkp][fţsšhļ]|[bdg][vḑzžx]|[kp]t|[bg]d|[sšç][ptk]|[zž][bdg]|[cč][tk]|[żj][dg]|f[tksšç]|v[dgzž]|ţ[tk]|ḑ[dg]|[ļx][ptk]|[mn][pbtdkgfvţḑszšžxļ]|ň[tdfvţḑszšž]|r[^wyh']|l[wyrň'])$/

export const LEGAL_WORD_FINAL_3_CONSONANT_FORMS =
  /^(?:[rřl]p[tkfţxsšhļç]|[mň]p[hļç]|[sšç]p[fţsšļç]|[lrř]t[kfxhļç]|nt[kfxh]|[mňsšç]t[hļç]|[lrř]k[tfţsšhç]|[nfţļ]k[hç]|mk[fţhç]|[sšç]k[fţsšhç]|[rř]b[dgvḑzž]|lb[vḑzž]|[rř]d[bgv]|[rř]g[bdvḑzž]|lg[vḑzž]|[lrřmň]f[tkfsš]|[ptk]f[kf]|ff[tksš]|[pkrlřmnň]ţ[tkţ]|ţţ[tk]|[rlř]x[tx]|[ptfsšnm]xx|xxt|[ptrřmnň]ļ[tkļ]|[ļl]ļ[tk]|[rlřmnňpkf]s[ptkfţxs]|ţs[ptks]|ss[ptkfţx]|[rlřmnňpkf]š[ptkfţxs]|ţš[ptkš]|š š[ptkfţx]|[rřl]v[vzž]|[bgmň]vv|vv[zž]|[pgrřlnmň]ḑḑ|[rřlnmň]z[bdgz]|[bgv]zz|zz[bdg]|[rřlnmň]ž[bdgž]|[bgv]žž|žž[bdg]|[rřl]c[tkch]|[rřl]č[tkčh]|[rřl]ż[dgż]|[rřl]j[dgj]|[rlř]m[ptkbdfţxsšvḑzžmļç]|mm[ptkbdfţxsšvḑzžļç]|[rř]n[tkdgfţxsšvḑzžnļç]|ln[tkdgţsšzžļç]|nn[tkdgfţxsšvḍzžļç]|[rř]ň[tdfţsšvḑzžňç]|lňň|ňň[tdfţsšvḑzžç]|ll[ptkbdgfţxsšvḍzžcčżjmnňç]|rr[ptkbdgfţxsšvḍzžcčżjmnňlļç]|řř[ptkbdgfţxsšvḍzžcčżjmnňlļç]|[ptkmnňrlř]ç[tkç]|çç[tk])$/

export const LEGAL_WORD_FINAL_4_CONSONANT_FORMS =
  /^(?:[lrř][kp][sšţç][tk]|[lrř]tç[tk]|[lrř]pf[tk]|[lrř][fsfš][tk]|r[nňm][sšţç][tk]|r[ňm]f[tk])$/

let didShowWarning = false

export function isLegalWordFinalConsonantForm(text: string) {
  if (!isLegalConsonantForm(text)) {
    return false
  }

  if (text.length == 1) {
    return text != "w" && text != "y" && text != "'" && text != "h"
  }

  if (text.length == 2) {
    return (
      (text[0] == text[1] && !"ptkbdg".includes(text[0]!)) ||
      LEGAL_WORD_FINAL_2_CONSONANT_FORMS.test(text)
    )
  }

  if (text.length == 3) {
    return LEGAL_WORD_FINAL_3_CONSONANT_FORMS.test(text)
  }

  if (text.length == 4) {
    return LEGAL_WORD_FINAL_4_CONSONANT_FORMS.test(text)
  }

  if (text.length == 5 && !didShowWarning) {
    didShowWarning = true

    console.warn(
      "'isLegalWordFinalConsonantForm' does not accurately test 5-consonant structures and may return a false negative (i.e. disallowing a consonant cluster that is valid in speech).",
    )
  }

  return false
}
