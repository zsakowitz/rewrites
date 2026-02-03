module.exports = {
    presets: ["@babel/preset-typescript"],
    plugins: [
        [
            "babel-plugin-jsx-dom-expressions",
            {
                moduleName: "./dom",
                moduleName: __dirname + "/jsx/lib/dom",
                contextToCustomElements: true,
                wrapConditionals: true,
                generate: "dom",
                delegateEvents: false,
            },
        ],
    ],
}
