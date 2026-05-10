declare global {
    interface WebGLShader {
        readonly __kind: "webgl_shader"
    }

    interface WebGLProgram {
        readonly __kind: "webgl_program"
    }

    interface WebGLVertexArrayObject {
        readonly __kind: "webgl_vao"
    }

    interface WebGLBuffer {
        readonly __kind: "webgl_buffer"
    }
}

export function createShader(
    gl: WebGL2RenderingContext,
    kind: GLenum,
    source: string,
) {
    const shader = gl.createShader(kind)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? ""
        gl.deleteShader(shader)
        throw new Error(log)
    }

    return shader
}

export function createProgram(
    gl: WebGL2RenderingContext,
    vert: WebGLShader,
    frag: WebGLShader,
) {
    const program = gl.createProgram()
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? ""
        gl.deleteProgram(program)
        throw new Error(log)
    }

    return program
}

export function createBuffer(gl: WebGL2RenderingContext, data: Float32Array) {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    return buffer
}

export function createVao(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    data: Record<string, { buffer: WebGLBuffer; size: number }>,
): WebGLVertexArrayObject {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    for (const key in data) {
        const { buffer, size } = data[key]!
        const location = gl.getAttribLocation(program, key)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.enableVertexAttribArray(location)
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
    }

    return vao
}

export function program(
    gl: WebGL2RenderingContext,
    props: {
        vert: string
        frag: string
        attrs: Record<string, number[][]>
        primitive:
            | typeof WebGL2RenderingContext.POINTS
            | typeof WebGL2RenderingContext.LINES
            | typeof WebGL2RenderingContext.LINE_LOOP
            | typeof WebGL2RenderingContext.LINE_STRIP
            | typeof WebGL2RenderingContext.TRIANGLES
            | typeof WebGL2RenderingContext.TRIANGLE_STRIP
            | typeof WebGL2RenderingContext.TRIANGLE_FAN
        count: number
    },
) {
    const program = createProgram(
        gl,
        createShader(
            gl,
            gl.VERTEX_SHADER,
            "#version 300 es\nprecision highp float;\n" + props.vert,
        ),
        createShader(
            gl,
            gl.FRAGMENT_SHADER,
            "#version 300 es\nprecision highp float;\n" + props.frag,
        ),
    )

    const vao = createVao(
        gl,
        program,
        Object.fromEntries(
            Object.entries(props.attrs).map(([k, v]) => {
                const buffer = createBuffer(gl, new Float32Array(v.flat()))
                return [
                    k,
                    {
                        buffer,
                        size: v[0]?.length ?? 1,
                    },
                ]
            }),
        ),
    )

    return {
        prog: program,
        vertexArray: vao,
        shape: props.primitive,
        count: props.count,
    }
}
