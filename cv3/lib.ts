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

const prelude = `#version 300 es
    precision highp float;

    uniform vec2 u_resolution;
    uniform mat4 u_perspective;

    struct Plane {
        vec3 normal;
        float offset;
    };

    struct Line {
        vec3 p0;
        vec3 p1;
    };

    Plane plane_from_three_points(vec3 p1, vec3 p2, vec3 p3) {
        vec3 normal = normalize(cross(p3 - p2, p1 - p2));
        float offset = -dot(p2, normal);
        return Plane(normal, offset);
    }

    vec4 intersection(Plane plane, Line line) {
        vec3 n = plane.normal;
        vec3 p0 = n * plane.offset;

        vec3 l0 = line.p0;
        vec3 l = normalize(line.p1 - line.p0);

        float d = dot(p0 - l0, n) / dot(l, n);

        return vec4(l0 + l * d, d);
    }

    Plane xyplane = Plane(vec3(0, 0, 1), 0.0);

    vec3 deperspective(vec4 p) {
        return p.xyz / p.w;
    }

    vec3 as_xy(vec2 gc) {
        vec2 p_screen_initial = gc / u_resolution * 2.0 - 1.0;

        vec4 zm = vec4(p_screen_initial, -1, 1);
        vec4 zp = vec4(p_screen_initial, +1, 1);

        vec4 p_world = intersection(
            xyplane,
            Line(
                deperspective(inverse(u_perspective) * zm),
                deperspective(inverse(u_perspective) * zp)
            )
        );

        vec4 p_screen = u_perspective * vec4(p_world.xyz, 1.0);

        return vec3(p_world.xy, (p_screen.z / p_screen.w + 1.0) * 0.5);
    }
`

export function createShader(
    gl: WebGL2RenderingContext,
    kind: GLenum,
    source: string,
) {
    const shader = gl.createShader(kind)!
    gl.shaderSource(shader, prelude + source)
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
        writeDepth?: boolean
    },
) {
    const program = createProgram(
        gl,
        createShader(gl, gl.VERTEX_SHADER, props.vert),
        createShader(gl, gl.FRAGMENT_SHADER, props.frag),
    )

    const vao = createVao(
        gl,
        program,
        Object.fromEntries(
            Object.entries(props.attrs).map(([k, v]) => {
                const buffer = createBuffer(gl, new Float32Array(v.flat()))
                return [k, { buffer, size: v[0]?.length ?? 1 }]
            }),
        ),
    )

    return {
        prog: program,
        vertexArray: vao,
        shape: props.primitive,
        count: props.count,
        writeDepth: props.writeDepth,
    }
}
