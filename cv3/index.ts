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
        return (
            shape: number,
            count: number,
            attrs: Record<
                string,
                [WebGLBuffer, size: 1 | 2 | 3 | 4, offset?: number]
            >,
        ) => {
            const vert = createShader(gl.VERTEX_SHADER)(vertSource)
            const frag = createShader(gl.FRAGMENT_SHADER)(fragSource)
            const prog = createProgram(vert, frag)
            const vertexArray = vao(prog, attrs)
            return { prog, shape, count, vertexArray }
        }
    }
}

function buf(data: number[]) {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    return buffer
}

function vao(
    program: WebGLProgram,
    data: Record<string, [WebGLBuffer, size: 1 | 2 | 3 | 4, offset?: number]>,
): WebGLVertexArrayObject {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    for (const key in data) {
        const [buffer, size, offset = 0] = data[key]!
        const location = gl.getAttribLocation(program, key)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.enableVertexAttribArray(location)
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, offset)
    }

    return vao
}

const axes = program`
    #version 300 es

    in vec4 position;
    in vec4 a_color;
    out vec4 v_color;
    uniform mat4 u_proj;

    void main() {
        gl_Position = u_proj * position;
        v_color = a_color;
    }
``
    #version 300 es
    precision highp float;

    out vec4 color;
    in vec4 v_color;

    void main() {
        color = v_color;
    }
`(gl.LINES, 6, {
    position: [buf([0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 5]), 3],
    a_color: [
        buf([1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1]),
        3,
    ],
})

let rafId = -1

const rot = new DOMMatrix()
rot.rotateSelf(160, 0, 0)
rot.rotateSelf(110, 90, 20)
rot.rotateSelf(0, 0, 300)

const unitSquare = program`
    #version 300 es

    uniform mat4 u_proj;
    in vec4 a_position;
    out vec4 v_position;

    void main() {
        gl_Position = u_proj * a_position;
        v_position = a_position;
    }
``
    #version 300 es
    precision highp float;

    uniform mat4 u_proj;
    in vec4 v_position;
    out vec4 color;

    void main() {
        color = vec4(v_position.xy, 0, 1);
    }
`(gl.TRIANGLE_STRIP, 4, {
    a_position: [buf([0, 0, 0, 1, 1, 0, 1, 1]), 2],
})

const triangle = program`
    #version 300 es

    uniform mat4 u_proj;
    in vec4 a_position;

    void main() {
        gl_Position = a_position;
    }
``
    #version 300 es
    precision highp float;

    uniform mat4 u_proj;
    uniform vec2 u_resolution;
    out vec4 color;

    void main() {
        vec2 pos = gl_FragCoord.xy / u_resolution;
        vec4 proj = inverse(u_proj) * vec4(pos, 0, 1);
        proj /= proj.z * sign(proj.z);
        color = vec4(proj.xy, 0, 0.5);
    }
`(gl.TRIANGLES, 3, {
    a_position: [buf([-1, -1, 3, -1, -1, 3]), 2],
})

function draw() {
    if (rafId != -1) {
        cancelAnimationFrame(rafId)
        rafId = -1
    }

    const proj = new DOMMatrix()
    proj.scaleSelf(gl.canvas.height / gl.canvas.width, 1, 1)
    proj.multiplySelf(rot)
    proj.scale3dSelf(0.3)
    console.log(proj.toString())

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    for (const el of [unitSquare, axes, triangle]) {
        gl.useProgram(el.prog)

        const u1 = gl.getUniformLocation(el.prog, "u_proj")
        if (u1 != null) {
            gl.uniformMatrix4fv(u1, false, proj.toFloat32Array())
        }

        const u2 = gl.getUniformLocation(el.prog, "u_resolution")
        if (u2 != null) {
            gl.uniform2f(u2, gl.drawingBufferWidth, gl.drawingBufferHeight)
        }

        gl.useProgram(el.prog)
        gl.bindVertexArray(el.vertexArray)
        gl.drawArrays(el.shape, 0, el.count)
    }

    rafId = requestAnimationFrame(draw)
}

onwheel = (ev) => {
    rot.preMultiplySelf(
        new DOMMatrix().rotateSelf(ev.deltaY / 2, ev.deltaX / 2, 0),
    )
}
