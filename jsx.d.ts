// JSX types that all JSX libraries in this project use.

declare global {
  namespace JSX {
    type Element =
      | string
      | number
      | bigint
      | boolean
      | ChildNode
      | readonly Element[]
      | (() => Element)
      | null
      | undefined

    type Parent = {
      appendChild(node: ChildNode): void
    }

    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<
        Helpers.HTMLProps<HTMLElementTagNameMap[K]>
      >
    }

    interface ElementChildrenAttribute {
      children: {}
    }

    namespace Helpers {
      type Parent = { appendChild(node: ChildNode): unknown }

      type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
        T
      >() => T extends Y ? 1 : 2
        ? A
        : B

      type OmitFunctionsAndConstantsAndEventsAndReadonly<T> = {
        [K in keyof T as T[K] extends (...args: readonly any[]) => any
          ? never
          : K extends Uppercase<K & string>
          ? never
          : K extends `on${string}`
          ? never
          : IfEquals<
              { [L in K]: T[L] },
              { -readonly [L in K]: T[L] },
              K,
              never
            >]: T[K] | (() => T[K])
      }

      type EventMapToProps<T> = {
        [K in keyof T & string as `on:${K}`]: (event: T[K]) => void
      }

      type MaybeEventMap<Source, Requirement, EventMap> =
        Source extends Requirement
          ? EventMapToProps<Omit<EventMap, keyof HTMLElementEventMap>>
          : {}

      type HTMLProps<T> = OmitFunctionsAndConstantsAndEventsAndReadonly<T> & {
        children: Element
        use: (el: T) => void
        style:
          | string
          | Partial<CSSStyleDeclaration>
          | (() => string | Partial<CSSStyleDeclaration>)
        [x: `class:${string}`]: boolean | (() => boolean)
        [x: `on:${string}`]: (event: Event) => void
        [x: `style:${string}`]: string | number | (() => string | number)
      } & EventMapToProps<HTMLElementEventMap> &
        MaybeEventMap<T, HTMLBodyElement, HTMLBodyElementEventMap> &
        MaybeEventMap<T, HTMLMediaElement, HTMLMediaElementEventMap> &
        MaybeEventMap<T, HTMLVideoElement, HTMLVideoElementEventMap> &
        MaybeEventMap<T, HTMLFrameSetElement, HTMLFrameSetElementEventMap>

      type NullableIfPropsCanBeEmpty<T> = Partial<
        Record<keyof T, undefined>
      > extends T
        ? null | undefined
        : never
    }
  }
}

export {}
