type Word = [
    sitelenTelo: string,
    tokiPona: string,
    definition: string,
    derivation: string,
]

const words: Word[] = [
    ["a", "a", "emphasis", "intensity, movement"],
    [
        "akesi",
        "akesi",
        "reptile, amphibian",
        "land animal [soweli] with a long bent tail (lizard)",
    ],
    ["ala", "ala", "no", "drawing of a cross (no, not)"],
    [
        "alasa",
        "alasa",
        "hunt",
        "a bow / eye [oko] + targeting an object, ‘sharp sight’",
    ],
    ["ali", "ali", "all", "one [wan] more than many [mute]"],
    ["anpa", "anpa", "under", "like a flipped [lon], on/at"],
    ["ante", "ante", "different", "no [ala] + same [sama]"],
    ["anu", "anu", "or", "diverging path [nasin]"],
    ["awen", "awen", "stay", "feet [noka] in two directions (stationary)"],
    ["e", "e", "direct object", "stylized rightward arrow"],
    ["en", "en", "and", "two equal [sama] things connected"],
    ["esun", "esun", "shop", "place [tomo] for equal [sama] transactions"],
    ["ijo", "ijo", "thing", "round thing"],
    ["ike", "ike", "bad", "no [ala] + heart [pilin]"],
    ["ilo", "ilo", "tool", "stick [palisa] held by a hand [luka]"],
    ["insa", "insa", "inside", "item inside container [poki]"],
    [
        "jaki",
        "jaki",
        "disgusting",
        "no [ala] + heart [pilin], reminiscent of a scribble",
    ],
    ["jan", "jan", "person", "stylized drawing of a person"],
    ["jelo", "jelo", "yellow", "ground (soil) [ma] + eye [oko]"],
    ["jo", "jo", "have", "object [ijo] inside hand [luka]"],
    [
        "kala",
        "kala",
        "fish",
        "water [telo] + object [ijo], image of diving fish",
    ],
    ["kalama", "kalama", "sound", "ear [kute] motion"],
    ["kama", "kama", "come", "feet [noka] pointing backward"],
    ["kasi", "kasi", "plant", "plant with leaf on ground [ma]"],
    ["ken", "ken", "can", "path [nasin] + foot [noka], walkable path"],
    [
        "kepeken",
        "kepeken",
        "use",
        "hand [luka] holding a stick [palisa] with motion",
    ],
    [
        "kili",
        "kili",
        "fruit",
        "stylized drawing of an apple / plant-heart = [kasi] + [pilin]",
    ],
    ["kin", "kin", "indeed", "like [aa] but less intense"],
    ["kiwen", "kiwen", "rock", "strong-object = [wawa] + [ijo]"],
    ["ko", "ko", "paste", "compound glyph: strong [wawa] + water [telo]"],
    ["kon", "kon", "air", "two smoke clouds / tornado"],
    ["kule", "kule", "color", "form of eye = [sijelo] + [oko]"],
    ["kulupu", "kulupu", "group", "many objects = [mute] + [ijo]"],
    ["kute", "kute", "ear", "stylized drawing of an ear"],
    ["la", "la", "context", "leftward arrow"],
    ["lape", "lape", "sleep", "[jan] on cloth (bed)"],
    ["laso", "laso", "green/blue", "water [telo] + eye [oko]"],
    ["lawa", "lawa", "lead, head", "person [jan] with emphasis on head"],
    ["len", "len", "cloth", "cloth/flag waving in the wind"],
    ["lete", "lete", "cold", "air [kon] + water [telo]"],
    [
        "li",
        "li",
        "subject/verb separator",
        "stylized [ala] (grammatical separator)",
    ],
    ["lili", "lili", "small", "form [sijelo], emphasis downward"],
    ["linja", "linja", "line", "wavy line"],
    ["lipu", "lipu", "paper/card", "drawing of a square-ish thing"],
    ["loje", "loje", "red", "heat [seli] + eye [oko]"],
    ["lon", "lon", "on/at", "stick [palisa] over ground [ma]"],
    ["luka", "luka", "hand", "stylized hand (palm + thumb)"],
    ["lukin", "lukin", "look", "eye [oko] action"],
    ["lupa", "lupa", "hole", "container [poki] under the ground [ma]"],
    ["ma", "ma", "earth", "drawing of flat ground"],
    ["mama", "mama", "parent", "person [jan] sheltering a heart [pilin]"],
    ["mani", "mani", "wealth", "number [nanpa] + thing [ijo]"],
    ["meli", "meli", "woman", "water [telo] + person [jan]"],
    ["mi", "mi", "me", "person [jan] + this [ni]"],
    ["mije", "mije", "man", "fire [seli] + person [jan]"],
    ["moku", "moku", "eat", "hand [luka] + mouth [uta]"],
    ["moli", "moli", "dead", "no [ala] + person [jan] under ground"],
    ["monsi", "monsi", "back", "object [ijo] behind a wall"],
    ["mu", "mu", "animal sound", "land animal [soweli] + mouth [uta]"],
    [
        "mun",
        "mun",
        "moon/star",
        "crescent moon above ground [ma] / ‘heart of the sky’",
    ],
    ["musi", "musi", "playful", "dancing person [jan] / evocative glyph"],
    ["mute", "mute", "many", "three horizontal lines, cursive"],
    ["nanpa", "nanpa", "number", "Notches on a stick [palisa]"],
    [
        "nasa",
        "nasa",
        "crazy",
        "thing [ijo] + air [kon] = air-things (nonsense)",
    ],
    ["nasin", "nasin", "path", "path"],
    ["nena", "nena", "mountain", "drawing of mountain"],
    ["ni", "ni", "this/that", "direct object [ee] + ‘this’"],
    ["nimi", "nimi", "name", "‘head’ of an object’s form [sijelo]"],
    ["noka", "noka", "foot", "stylized foot"],
    ["o", "o", "imperative", "direction + emphasis"],
    ["oko", "oko", "eye", "stylized drawing of an eye"],
    ["olin", "olin", "love", "beating heart [pilin]"],
    ["ona", "ona", "they", "person [jan] separated by a ‘wall’"],
    ["open", "open", "open", "[poki] with lid open"],
    ["pakala", "pakala", "broken", "image of a crack"],
    ["pali", "pali", "work/do", "hand [luka] + foot [noka], limbs to work"],
    ["palisa", "palisa", "stick", "stylized drawing of a stick"],
    ["pan", "pan", "bread/grain", "plant [kasi] + mouth [uta]"],
    ["pana", "pana", "give", "hand [luka] + motion"],
    ["pi", "pi", "grammatical grouper", "thing inside something bigger"],
    ["pilin", "pilin", "heart", "stylized drawing of a heart"],
    ["pimeja", "pimeja", "black", "no [ala] + eye [oko]"],
    ["pini", "pini", "end", "event, closed bracket"],
    ["pipi", "pipi", "bug", "scary six-legged land animal [soweli]"],
    ["poka", "poka", "beside", "stick [palisa] beside container [poki]"],
    ["poki", "poki", "container", "open container [poki] with lid"],
    ["pona", "pona", "good", "heart [pilin] action / smiley face"],
    ["pu", "pu", "toki pona book", "head (knowledge) + book [lipu]"],
    ["sama", "sama", "same", "two lines of equal length, cursive"],
    ["seli", "seli", "fire", "heat + air [kon]"],
    ["selo", "selo", "skin/cover", "that which covers an object [ijo]"],
    ["seme", "seme", "question", "unclear"],
    ["sewi", "sewi", "high", "two sticks on the ground, one high"],
    ["sijelo", "sijelo", "form/body", "abstracted standing legs [noka]"],
    ["sike", "sike", "circle", "round object [ijo]"],
    ["sin", "sin", "start", "open bracket + event"],
    [
        "sina",
        "sina",
        "you",
        "arms of a person [jan] outstretched (in friendship, or hug)",
    ],
    ["sinpin", "sinpin", "front", "object [ijo] in front of a wall"],
    ["sitelen", "sitelen", "image", "paper/card [lipu], emphasis content"],
    ["sona", "sona", "to know", "head + mouth [uta] (speak) + thing [ijo]"],
    ["soweli", "soweli", "land animal", "drawing of a four-legged animal"],
    ["suli", "suli", "big", "person [jan], arms wide open"],
    ["suno", "suno", "sun", "heat [seli] + object [ijo]"],
    ["supa", "supa", "table/flat", "flat object on legs"],
    ["suwi", "suwi", "sweet", "mouth [uta] + water [telo], drool"],
    ["tan", "tan", "from", "path [nasin] that turns back"],
    ["taso", "taso", "but", "blocked path [nasin]"],
    ["tawa", "tawa", "to", "feet [noka] pointing forward"],
    ["telo", "telo", "water", "water droplets"],
    ["tenpo", "tenpo", "time", "open bracket + closed bracket"],
    ["toki", "toki", "talk", "mouth [uta] + motion"],
    ["tomo", "tomo", "room", "shelter + heart [pilin]"],
    ["tu", "tu", "two", "two horizontal lines, cursive"],
    ["unpa", "unpa", "sex", "two persons [jan] intertwined"],
    ["uta", "uta", "mouth", "image of a mouth"],
    [
        "utala",
        "utala",
        "conflict",
        "hand [luka] + no [ala], prevent from doing",
    ],
    ["walo", "walo", "white", "air [kon] + eye [oko]"],
    ["wan", "wan", "one", "one line"],
    ["waso", "waso", "bird", "drawing of a bird, see Chinese niao"],
    ["wawa", "wawa", "strong", "flexing person [jan]"],
    ["weka", "weka", "missing", "no [ala] + thing [ijo]"],
    [
        "wile",
        "wile",
        "want",
        "head + heart [pilin] + foot [noka], walking forward = desire",
    ],
    ["apeja", "apeja", "shame", "two persons [jan], divided"],
    ["kipisi", "kipisi", "divide", "object [ijo] split"],
    ["leko", "leko", "blocks", "form [sijelo] + stack"],
    ["majuna", "majuna", "old", "person [jan] with cane"],
    [
        "monsuta",
        "monsuta",
        "fear, monster",
        "crack + heart [pilin], or sharp teeth",
    ],
    ["namako", "namako", "new/spice", "mouth [uta], excitement inside"],
    ["pake", "pake", "barrier", "direct-object [ee] + not [ala]"],
    ["pata", "pata", "sibling", "two persons [jan] side by side, connected"],
    ["powe", "powe", "deceit", "no [ala] + heart [pilin], tears"],
    [
        "tonsi",
        "tonsi",
        "nonbinary",
        "person [jan] + heart [pilin] (comrade), or two [tu] + not [ala] (nonbinary)",
    ],
    ["aaa", "aaa", "laughter", "[aa][aa][aa]"],
    [
        "tokipona",
        "toki pona",
        "toki pona",
        "blend of: talk [toki] + good [pona]",
    ],
    ["tuwan", "tu wan", "three", "[tu] + [wan]"],
    ["tutu", "tu tu", "four", "[tu] + [tu]"],
    [
        "eni",
        "e ni",
        "e ni",
        "blend of: direct object [ee] + &apos;here&apos; [ni|ni]",
    ],
    ["tawami", "tawa mi", "tawa mi", "blend of: to [tawa] + me [mi]"],
    [
        "kijetesantakalu",
        "kijetesantakalu",
        "animal of raccoon family",
        "drawing of a face of a raccoon (eyes/nose) on [soweli]",
    ],
    [
        "sutopatikuna",
        "sutopatikuna",
        "platypus",
        "like [kijetesantakalu|kijetesantakalu] but the face drawn to have a duckbill",
    ],
    [
        "epiku",
        "epiku, sikomo, kulijo",
        "any word which means ‘awesome’",
        "‘mind blown’",
    ],
    ["itomi", "itomi", "shade, insult", "drawing of a farting person [jan]"],
    [
        "pa",
        "pa, okepuma",
        "sarcastic disbelief (i.e, any situation which the response “bruh..” is appropriate)",
        "person [jan] drawn with a really big head, with two dots as ellipsis",
    ],
]

const radicals = [
    ["jan", 19],
    ["ijo", 14],
    ["ala", 11],
    ["pilin", 11],
    ["oko", 8],
    ["noka", 7],
    ["luka", 7],
    ["uta", 7],
    ["telo", 6],
    ["palisa", 5],
    ["poki", 5],
    ["ma", 5],
    ["soweli", 4],
    ["nasin", 4],
    ["a", 4],
    ["sijelo", 4],
    ["kon", 4],
    ["tu", 4],
    ["sama", 3],
    ["seli", 3],
    ["e", 3],
    ["wan", 2],
    ["mute", 2],
    ["kasi", 2],
    ["wawa", 2],
    ["ni", 2],
    ["lipu", 2],
    ["lon", 1],
    ["tomo", 1],
    ["kute", 1],
    ["nanpa", 1],
    ["toki", 1],
    ["pona", 1],
    ["tawa", 1],
    ["mi", 1],
    ["kijetesantakalu", 1],
] as const

const radicalsByPosition: readonly string[] = radicals.map((x) => x[0])

function escape(x: string) {
    return x
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

for (const word of words) {
    word[0] = word[0].trim()
    word[1] = word[1].trim()
    word[2] = word[2].trim()
    word[3] = word[3].trim().replace(/\[[^\]]+\]/g, (x) => {
        x = x.slice(1, -1)
        if (x == "aa") {
            return "[a<span class='sitelen-telo'>a</span>]"
        }
        if (x == "ee") {
            return "[e<span class='sitelen-telo'>e</span>]"
        }
        if (x.includes("|")) {
            return `[${x.split("|")[0]}<span class='sitelen-telo'>${
                x.split("|")[1]
            }</span>]`
        }
        return `[${x.slice(0, -1)}<span class='sitelen-telo'>${x.slice(-1)}</span>]`
    })
}

words.sort((a, b) => {
    const ai = radicalsByPosition.indexOf(a[0])
    const bi = radicalsByPosition.indexOf(b[0])
    if (ai == -1 && bi == -1) return 0
    if (ai == -1) return 1
    if (bi == -1) return -1
    return ai - bi
})

export { type Word, words, radicals, radicalsByPosition }
