export function generateList(/** @type {RegExp | string} */ regex) {
    let source = regex instanceof RegExp ? regex.source : regex

    if (source.startsWith("/")) {
        source = source.slice(1)
    }

    if (source.endsWith("/")) {
        source = source.slice(0, -1)
    }

    if (source.startsWith("^(")) {
        source = source.slice(2)
    }

    if (source.startsWith("?:")) {
        source = source.slice(2)
    }

    if (source.endsWith(")$")) {
        source = source.slice(0, -2)
    }

    source = source
        .replace(/ż/g, "ẓ")
        .replace(/\./g, "[bcçčdḑfghjklļmnňprřsštţvwxyzẓž]")
        .replace(
            /\[\^([^^[\]]+)\]/g,
            (x) =>
                "["
                + "bcçčdḑfghjklļmnňprřsštţvwxyzẓž"
                    .split("")
                    .filter((char) => !x.includes(char))
                    .join("")
                + "]",
        )

    return source.split("|").flatMap((segment) => {
        const matches = (segment.match(/\[[^[\]]+\]|[^[\]]/g) || []).map(
            (match) => (match.startsWith("[") ? match.slice(1, -1) : match),
        )

        let output = [""]

        for (const match of matches) {
            const chars = match.split("")
            output = output.flatMap((x) => chars.map((char) => x + char))
        }

        return output
    })
}

const PROHIBITED_CONJUNCTS =
    /.'|[td][szšžcżčjţḑ]|[kg][xň]|kg|gk|td|dt|pb|bp|fv|vf|ţḑ|ḑţ|cż|żc|čj|jč|čc|jc|čż|jż|[šž][cż]|sż|s[zšž]|z[sšž]|š[szž]|ž[szš]|[cżčj][szšž]|[szšž]ç|ç[szšž]|[cżčj]ç|ç[żj]|ļç|çļ|hç|çh|xç|n[cżčj]|m[pb][fvtdţḑ]|n(?:k[sš]|g[zž])|n[pb]|n[fv].|ň[kgxy]|x[szšžçgļňyhř]|[bdghç]ļ|ļ[szšžhç]|[ļxç]h$|[rh]ř|řr|[wy]./

const WORD_INITIAL_CONJUNCTS =
    /^(?:[^ļ]|[pbtdkg][rlřwy]|[pk][sš]|[bg][zž]|p[fţxhļ]|b[vḑ]|t[fxhļ]|d[v]|k[fţh]|g[vḑ]|[kg][mn]|[sš][ptkfţxcčç]|[zž][bdgvḑżjmnňrlwyř]|[sšzž][mnňlrwyřv]|[cżčj][lrmnňwv]|[cč][fţxh]|[żj][vḑ]|[cč][ptk]|[żj][bdg]|x[ptcčmnlrw]|ç[ptcčkmnňlrřw]|[fvţḑ][lrwyřmnň]|[fţ][ptkcč]|[vḑ][bdgżj]|ļ[ptkcčmnňwy]|h[lrmnw]|[mn][lrwyř]|ň[lrw]|l[wy]|[pk][sš][ptkfţxcčçmnňlrwyřv]|[bg][zž][bdgḑżjmnňlrwyřv]|[ptk][fţļ][wy]|[ptk]hw|[bdg][vḑ][wy]|[pbtdkg][lr][wy]|[ptk]ç[mnň]|[pk][fţ][wy]|[pt]ļ[wy]|[sšç][ptk][wyřlr]|[zž][bdg][wyřlr]|[szšžç][mn][wy]|[szšžç]ňw|h(?:[lrmn]w|[mn]y|ll|rr|mm|nn)|[cč][ptk][lrwyř]|[żj][bdg][lrwyř]|[cżčj][mn][wy]|[cżčj]ňw|[fţ]l[wy]|x[pt][lrwy]|x[mn][wy]|x[cč]w|[pk][sš][ptkfţxcčçmnňlrwyřv][lrwyř]|[bg][zž][bdgḑżjmnňlrwyřv][lrwyř]|[sšçcč][ptk]ly|[zžżj][bdg]ly)$/

const WORD_FINAL_CONJUNCTS =
    /^(?:[^hwy']|[ptk][fţsšçxhļ]|[bdg][fḑzž]|[pk]t|[bg]d|[sšç][ptk]|[zž][bdg]|[cč][tk]|[żj][dg]|f[tksš]|v[dgzž]|ţ[tk]|ḑ[dg]|[ļx][ptk]|[mn][pbtdkgfvţḑszšžçxhļ]|ň[tdfvţḑszšžçh]|r[^hwy']|l[^wyrň']|[rřl]p[tkfţxsšhļç]|[mň]p[hļç]|[sšç]p[fţsšļç]|[lrř]t[kfxhļç]|[n]t[kfxh]|[mňsšç]t[hļç]|[lrř]k[tfţsšhç]|[nfţļ]k[hç]|[m]k[fţhç]|[sšç]k[fţsšhç]|[rř]b[dgvḑzž]|[l]b[vḑzž]|[rř]d[bgv]|[rř]g[bdvḑzž]|[l]g[vḑzž]|[lrřmň]f[tkfsš]|[ptk]f[kf]|[f]f[tksš]|[pkrlřmnň]ţ[tkţ]|[ţ]ţ[tk]|[rlř]x[tx]|[ptfsšnm]x[x]|[x]x[t]|[ptrřmnň]ļ[tkļ]|[ļl]ļ[tk]|[rlřmnňpkf]s[ptkfţxs]|[ţ]s[ptks]|[s]s[ptkfţx]|[rlřmnňpkf]š[ptkfţxš]|[ţ]š[ptkš]|[š]š[ptkfţx]|[rřl]v[vzž]|[bgmň]v[v]|[v]v[zž]|[bgrřlnmň]ḑ[ḑ]|[rřlnmň]z[bdgz]|[bgv]z[z]|[z]z[bdg]|[rřlnmň]ž[bdgž]|[bgv]ž[ž]|[ž]ž[bdg]|[rřl]c[tkch]|[rřl]č[tkčh]|[rřl]ż[dgż]|[rřl]j[dgj]|[rlř]m[ptkbdfţxsšvḑzžmļç]|[m]m[ptkbdfţxsšvḑzžļç]|[rř]n[tkdgfţxsšvḑzžnļç]|[l]n[tkdgţsšzžļç]|[n]n[tkdgfţxsšvḑzžļç]|[rř]ň[tdfţsšvḑzžňç]|[l]ň[ň]|[ň]ň[tdfţsšvḑzžç]|[l]l[pbtdkgfţxsšvḑzžcčżjmnňç]|[r]r[pbtdkgfţxsšvḑzžcčżjmnňlļç]|[ř]ř[pbtdkgfţxsšvḑzžcčżjmnňlļç]|[ptkmnňrlř]ç[tkç]|[ç]ç[tk]|[lrř][kp][sšţç][tk]|[lrř]tç[tk]|[lrř]pf[tk]|[lrř]f[sš][tk]|r[nňm][sšţç][tk]|r[ňm]f[tk])$/

export function allConjuncts() {
    const ALL_LETTERS = "bcçčdḑfghjklļmnňprřsštţvwxyzẓž".split("")

    /** @type {string[]} */
    const conjuncts = []

    function add(
        /** @type {string} */
        text,
    ) {
        if (/(.)\1\1/.test(text)) {
            return
        }

        const matches = text.match(/(.)\1/g)

        if (!matches) {
            if (text.length > 5) {
                return
            }

            if (!PROHIBITED_CONJUNCTS.test(text)) {
                conjuncts.push(text)
            }

            return
        }

        if (matches.length >= 2) {
            return
        }

        const newText = text.replace(/(.)\1/, (_, a) => a)

        if (!PROHIBITED_CONJUNCTS.test(newText)) {
            conjuncts.push(text)
        }
    }

    for (const a of ALL_LETTERS) {
        add(a)
    }

    for (const a of ALL_LETTERS) {
        for (const b of ALL_LETTERS) {
            add(a + b)
        }
    }

    for (const a of ALL_LETTERS) {
        for (const b of ALL_LETTERS) {
            for (const c of ALL_LETTERS) {
                add(a + b + c)
            }
        }
    }

    for (const a of ALL_LETTERS) {
        for (const b of ALL_LETTERS) {
            for (const c of ALL_LETTERS) {
                for (const d of ALL_LETTERS) {
                    add(a + b + c + d)
                }
            }
        }
    }

    for (const a of ALL_LETTERS) {
        for (const b of ALL_LETTERS) {
            for (const c of ALL_LETTERS) {
                for (const d of ALL_LETTERS) {
                    for (const e of ALL_LETTERS) {
                        add(a + b + c + d + e)
                    }
                }
            }
        }
    }

    for (const a of ALL_LETTERS) {
        for (const b of ALL_LETTERS) {
            for (const c of ALL_LETTERS) {
                for (const d of ALL_LETTERS) {
                    for (const e of ALL_LETTERS) {
                        for (const f of ALL_LETTERS) {
                            add(a + b + c + d + e + f)
                        }
                    }
                }
            }
        }
    }

    return conjuncts
}

const initials = generateList(WORD_INITIAL_CONJUNCTS)

const finals = generateList(WORD_FINAL_CONJUNCTS)

// VERY SLOW. May take up to a minute on some machines.
const conjuncts = allConjuncts()
