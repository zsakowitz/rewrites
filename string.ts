// String.split and Array.join, but in the TS typesystem. #typesystem

namespace String {
    export type Embeddable =
        | string
        | number
        | bigint
        | boolean
        | null
        | undefined

    type JoinRest<
        Array extends readonly any[],
        Joiner extends string = "",
        Output extends string = "",
    > =
        Array extends readonly [infer Element, ...infer Rest] ?
            Element extends Embeddable ?
                JoinRest<Rest, Joiner, `${Output}${Joiner}${Element}`>
            :   never
        :   Output

    export type Join<Array extends readonly any[], Joiner extends string = ""> =
        Array extends [] ? ""
        : Array extends [infer Element] ?
            Element extends Embeddable ?
                `${Element}`
            :   never
        : Array extends [infer Element, ...infer Rest] ?
            Element extends Embeddable ?
                `${Element}${JoinRest<Rest, Joiner>}`
            :   never
        :   never

    export type Split<
        Text extends string,
        Splitter extends Embeddable,
        Arr extends string[] = [],
    > =
        Text extends `${infer First}${Splitter}${infer Rest}` ?
            Split<Rest, Splitter, [...Arr, First]>
        : Splitter extends "" ? Arr
        : [...Arr, Text]

    export type Character<T extends string> =
        T extends "" ? [char: undefined, rest: ""]
        : T extends `${infer Char}${infer Rest}` ? [char: Char, rest: Rest]
        : never

    export type Trim<T extends string> =
        T extends ` ${infer U}` ? Trim<U>
        : T extends `\n${infer U}` ? Trim<U>
        : T extends `${infer U} ` ? Trim<U>
        : T extends `${infer U}\n` ? Trim<U>
        : T
}

interface String {
    split<This extends string, Splitter extends string>(
        this: This,
        splitter: Splitter,
        limit?: number,
    ): string extends This ? string[] : String.Split<This, Splitter>

    trim<This extends string>(
        this: This,
    ): string extends This ? string : String.Trim<This>
}

let testString = "test string".split(" ")
