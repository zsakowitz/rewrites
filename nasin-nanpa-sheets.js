;(function () {
    const fonts = ", nasin-nanpa"
    const fontsAsuki = "nasin-nanpa"
    const asukiOverride = "'docs-Amatic SC'"

    function getFontProperty() {
        if ("__sitelen_pona_font" in window) {
            return window.__sitelen_pona_font
        } else {
            const font = Object.getOwnPropertyDescriptor(
                CanvasRenderingContext2D.prototype,
                "font",
            )
            window.__sitelen_pona_font = font
            return font
        }
    }

    const font = getFontProperty()

    Object.defineProperty(CanvasRenderingContext2D.prototype, "font", {
        enumerable: true,
        configurable: true,
        get() {
            const value = "" + font.get.call(this)

            if (value.endsWith(fonts)) {
                return value.slice(0, -fonts.length)
            } else if (value.endsWith(fontsAsuki)) {
                return value.slice(0, -fontsAsuki.length)
            } else {
                return value
            }
        },
        set(v) {
            globalThis.cccccccccc = this
            if (v.endsWith(asukiOverride)) {
                const value = v.slice(0, -asukiOverride.length) + fontsAsuki
                console.log("tried to set", value)
                font.set.call(this, value)
                console.log("got", font.get.call(this))
            } else {
                font.set.call(this, v + fonts)
            }
        },
    })
})()
