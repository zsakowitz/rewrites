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
        vec2 z = pos.xy;
        vec2 c = pos.xy;

        for (int i = 0; i < 120; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (length(z) > 4.0) break;
        }

        if (length(z) < 4.0) {
            color = vec4(1);
        } else {
            vec2 p = pos.xy * 0.25 + 0.5;
            color = vec4(p, 1.0 - p.x - p.y, 1);
        }
    }
`

let rafId = -1

const rot = new DOMMatrix()
rot.rotateSelf(70, 30, 10)

function draw() {
    if (rafId != -1) {
        cancelAnimationFrame(rafId)
        rafId = -1
    }

    const proj = new DOMMatrix()
    proj.scaleSelf(gl.canvas.height / gl.canvas.width, 1, 1)
    proj.multiplySelf(rot)
    proj.scale3dSelf(0.3)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)

    {
        gl.useProgram(prog)

        const ux = gl.getUniformLocation(prog, "u_proj")
        gl.uniformMatrix4fv(ux, false, proj.toFloat32Array())

        const pos = new Float32Array([-2, -2, -2, 2, 2, -2, -2, 2, 2, -2, 2, 2])
        const posAttrLoc = gl.getAttribLocation(prog, "position")
        const posBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW)

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        gl.enableVertexAttribArray(posAttrLoc)
        gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0)

        gl.useProgram(prog)
        gl.bindVertexArray(vao)
        gl.drawArrays(gl.TRIANGLES, 0, pos.length / 2)
    }

    rafId = requestAnimationFrame(draw)
}

onwheel = (ev) => {
    rot.preMultiplySelf(
        new DOMMatrix().rotateSelf(ev.deltaY / 2, ev.deltaX / 2, 0),
    )
}
