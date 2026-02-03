// Utilities for creating private fields on plain objects. As is noted in the
// proposal (tc39/proposal-class-fields), private fields are really syntax sugar
// for WeakMaps, so this is allowed.

const ReturnInput = function <T>(object: T): T {
    return object
} as unknown as new <T>(object: T) => T

function createPrivateField<Target extends object, Field>() {
    // @ts-ignore
    class PrivateField extends ReturnInput<Target> {
        #field!: Field

        constructor(object: Target, field: Field) {
            super(object)
            this.#field = field
        }

        static get(object: Target): Field {
            return (object as any).#field
        }

        static set(object: Target, value: Field): Target {
            if (!(#field in object)) {
                new PrivateField(object, value)
            }

            ;(object as any).#field = value
            return object
        }

        static has(object: object): object is Target {
            return #field in object
        }
    }

    return {
        get(object: Target): Field {
            return PrivateField.get(object)
        },
        set(object: Target, value: Field): Target {
            return PrivateField.set(object, value)
        },
        has(object: Target) {
            return PrivateField.has(object)
        },
    }
}

const name = createPrivateField<{}, string>()

const sakawi = {}

name.set(sakawi, "sakawi")

name.get(sakawi)

export {}
