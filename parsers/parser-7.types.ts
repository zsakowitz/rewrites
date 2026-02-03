// Extra types for parser-7.

type ToArray<Length extends number, Accumulator extends any[] = []> =
    Accumulator["length"] extends Length ? Accumulator
    :   ToArray<Length, [...Accumulator, any]>

type ToNumber<T extends any[]> = number & T["length"]

type StringSlice<This extends string, Start extends any[]> =
    Start extends [any, ...infer StartTail extends any[]] ?
        string extends This ? string
        : This extends `${string}${infer StringTail}` ?
            StringSlice<StringTail, StartTail>
        :   ""
    :   This

type StringLength<This extends string, Total extends any[]> =
    string extends This ? number
    : This extends `${string}${infer Rest}` ?
        StringLength<Rest, [...Total, any]>
    :   ToNumber<Total>

declare global {
    interface String {
        startsWith<
            This extends string,
            Text extends string,
            Position extends number = 0,
        >(
            this: This,
            text: Text,
            position?: Position,
        ): StringSlice<This, ToArray<Position>> extends `${Text}${string}` ?
            true
        :   false
    }

    namespace String {
        type startsWith<
            This extends string,
            Text extends string,
            Position extends number = 0,
        > =
            string extends This ? boolean
            : StringSlice<This, ToArray<Position>> extends `${Text}${string}` ?
                true
            :   false

        type length<This extends string> = StringLength<This, []>

        type charAt<This extends string, Position extends number> =
            string extends This ? string
            : StringSlice<This, ToArray<Position>> extends (
                `${infer Character}${string}`
            ) ?
                Character
            :   ""
    }

    namespace Number {
        type add<A extends number, B extends number> =
            number extends A ? number
            : number extends B ? number
            : ToNumber<[...ToArray<A>, ...ToArray<B>]>

        type plusOne<N extends number> =
            number extends N ? number : ToNumber<[...ToArray<N>, any]>
    }
}

export {}
