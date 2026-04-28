type Html = string & { __type: "html" }
type Text = string & { __type?: undefined }

function escape(x: Text): Html {
    return x
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&lt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;") as Html
}

function ident(x: Text) {
    return `<mi>${escape(x)}</mi>` as Html
}

function op(x: Text) {
    return `<mo>${escape(x)}</mo>` as Html
}

function num(x: Text) {
    return `<mn>${escape(x)}</mn>` as Html
}

function text(x: Text) {
    return `<mtext>${escape(x)}</mtext>` as Html
}

function str(x: Text) {
    return `<ms>${escape(x)}</ms>` as Html
}

function error(x: Html) {
    return `<merror>${x}</merror>` as Html
}

function frac(x: Html, y: Html): Html {
    return `<mfrac><mrow>${x}</mrow><mrow>${y}</mrow></mfrac>` as Html
}

function sqrt(x: Html): Html {
    return `<msqrt>${x}</msqrt>` as Html
}

function sub(base: Html, sub: Html): Html {
    return `<msub><mrow>${base}</mrow><mrow>${sub}</mrow></msub>` as Html
}

function sup(base: Html, sup: Html): Html {
    return `<msup><mrow>${base}</mrow><mrow>${sup}</mrow></msup>` as Html
}

function subsup(base: Html, sub: Html, sup: Html): Html {
    return `<msubsup><mrow>${base}</mrow><mrow>${sub}</mrow><mrow>${sup}</mrow></msubsup>` as Html
}
