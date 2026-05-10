const cv = document.createElement("canvas")
cv.style = "width:100dvw;height:100dvh;position:absolute;top:0;left:0"
new ResizeObserver(() => {
    cv.width = devicePixelRatio * cv.clientWidth
    cv.height = devicePixelRatio * cv.clientHeight
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    draw()
}).observe(cv)

document.body.style = "background: #8839ef"
document.body.appendChild(cv)

const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

function createShader(kind: GLenum) {
    return (source: TemplateStringsArray): WebGLShader => {
        const shader = gl.createShader(kind)!
        gl.shaderSource(shader, source[0]!.trim())
        gl.compileShader(shader)

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(shader))
            gl.deleteShader(shader)
            throw new Error()
        }

        return shader
    }
}

function createProgram(vert: WebGLShader, frag: WebGLShader) {
    const program = gl.createProgram()
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        throw new Error()
    }

    return program
}

function program(vertSource: TemplateStringsArray) {
    return (fragSource: TemplateStringsArray) => {
        const vert = createShader(gl.VERTEX_SHADER)(vertSource)
        const frag = createShader(gl.FRAGMENT_SHADER)(fragSource)
        return createProgram(vert, frag)
    }
}

const prog = program`
    #version 300 es

    in vec4 position;
    out vec4 pos;
    uniform mat4 u_proj;

    void main() {
        gl_Position = u_proj * position;
        pos = position;
    }
``
    #version 300 es
    precision highp float;

    out vec4 color;
    in vec4 pos;
    uniform mat4 u_proj;

    void main() {
        color = pos / 2.0 + 0.5;
    }
`

const prog2 = program`
    #version 300 es

    in vec4 position;
    out vec4 pos;
    uniform mat4 u_proj;

    void main() {
        gl_Position = u_proj * position;
        pos = position;
    }
``
    #version 300 es
    precision highp float;

    out vec4 color;
    in vec4 pos;
    uniform mat4 u_proj;

    void main() {
        color = pos;
    }
`

function cube() {
    // 0——————1
    // |\    /|
    // | 4——5 |
    // | |  | |
    // | 6——7 |
    // |/    \|
    // 2——————3

    // prettier-ignore
    return [
        5, 1, 4, 4, 1, 0,
        0, 2, 4, 4, 2, 6,
        7, 5, 6, 6, 5, 4,
        1, 5, 7, 7, 3, 1,
        3, 7, 2, 6, 2, 7,
        0, 1, 2, 3, 2, 1,
    ].flatMap((i) => [
        i & 0b001 ? 1 : -1,
        i & 0b010 ? 1 : -1,
        i & 0b100 ? 1 : -1,
    ])
}

let rafId = -1

const u_rot = new DOMMatrix()
u_rot.rotateSelf(70, 30, 10)

function draw() {
    if (rafId != -1) {
        cancelAnimationFrame(rafId)
        rafId = -1
    }

    const u_proj = new DOMMatrix()
    u_proj.scaleSelf(gl.canvas.height / gl.canvas.width, 1, 1)
    u_proj.multiplySelf(u_rot)
    u_proj.scale3dSelf(0.3)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    {
        gl.useProgram(prog)

        const ux = gl.getUniformLocation(prog, "u_proj")
        gl.uniformMatrix4fv(ux, false, u_proj.toFloat32Array())

        const pos = new Float32Array(cube())
        const posAttrLoc = gl.getAttribLocation(prog, "position")
        const posBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW)

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        gl.enableVertexAttribArray(posAttrLoc)
        gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0)

        gl.useProgram(prog)
        gl.bindVertexArray(vao)
        gl.drawArrays(gl.TRIANGLES, 0, pos.length / 3)
    }

    {
        gl.useProgram(prog2)
        gl.disable(gl.CULL_FACE)

        const ux = gl.getUniformLocation(prog2, "u_proj")
        gl.uniformMatrix4fv(ux, false, u_proj.toFloat32Array())

        const pos = new Float32Array(
            Array.from({ length: 5 }, (_, z) =>
                Array.from({ length: 5 }, (_, i) => [
                    i - 2,
                    -2,
                    z - 2,

                    i - 2,
                    +2,
                    z - 2,

                    -2,
                    i - 2,
                    z - 2,

                    +2,
                    i - 2,
                    z - 2,
                ]).flat(),
            ).flat(),
        )
        const posAttrLoc = gl.getAttribLocation(prog2, "position")
        const posBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW)

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        gl.enableVertexAttribArray(posAttrLoc)
        gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0)

        gl.useProgram(prog2)
        gl.bindVertexArray(vao)
        gl.drawArrays(gl.LINES, 0, pos.length / 3)
    }

    rafId = requestAnimationFrame(draw)
}

onwheel = (ev) => {
    const rot = new DOMMatrix()
    rot.rotateSelf(ev.deltaY, ev.deltaX, 0)
    u_rot.preMultiplySelf(rot)
}
