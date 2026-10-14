import React, { useEffect, useRef } from 'react';
import { hslTripleToRgb } from '@/lib/background';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
// Domain-warped fbm: reads as ink / fluid slowly mixing over black.
const FRAG = `
precision mediump float;
uniform vec2 u_res; uniform float u_t; uniform vec3 u_a; uniform vec3 u_b;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / u_res; uv.x *= u_res.x / u_res.y;
  float t = u_t * 0.05;
  vec2 q = vec2(fbm(uv*1.5 + t), fbm(uv*1.5 - t*0.7 + 3.1));
  vec2 r = vec2(fbm(uv*1.5 + 2.2*q + vec2(1.7, 9.2) + t*0.5), fbm(uv*1.5 + 2.2*q + vec2(8.3, 2.8) - t*0.3));
  float f = fbm(uv*1.5 + 2.0*r);
  float ink = smoothstep(0.28, 0.9, f);
  vec3 tint = mix(u_b, u_a, smoothstep(0.3, 0.7, r.x));
  vec3 col = mix(vec3(0.0), tint, ink) * (0.8 + 0.2*q.y);
  gl_FragColor = vec4(col, 1.0);
}`;

const readThemeColors = (): [number[], number[]] => {
  const cs = getComputedStyle(document.documentElement);
  return [hslTripleToRgb(cs.getPropertyValue('--brand') || '348 62% 60%'), hslTripleToRgb(cs.getPropertyValue('--brand-2') || '20 72% 58%')];
};

/** Real-time liquid backdrop (WebGL). Colors follow the active theme. */
const LiquidBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    const mk = (type: number, src: string) => { const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res'), uT = gl.getUniformLocation(prog, 'u_t'), uA = gl.getUniformLocation(prog, 'u_a'), uB = gl.getUniformLocation(prog, 'u_b');

    let [a, b] = readThemeColors();
    const applyColors = () => { [a, b] = readThemeColors(); gl.uniform3f(uA, a[0], a[1], a[2]); gl.uniform3f(uB, b[0], b[1], b[2]); };
    applyColors();
    const mo = new MutationObserver(applyColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

    // render at half resolution: cheaper, and the softness suits the liquid look
    const resize = () => { const s = 0.5; canvas.width = Math.max(1, Math.floor(innerWidth * s)); canvas.height = Math.max(1, Math.floor(innerHeight * s)); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height); };
    resize(); addEventListener('resize', resize);

    let raf = 0, start = performance.now(), running = true;
    const frame = (now: number) => { if (!running) return; gl.uniform1f(uT, (now - start) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(frame); };
    const vis = () => { running = !document.hidden; if (running) { start = performance.now() - (performance.now() - start); raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); };
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(frame);

    return () => { running = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); mo.disconnect(); gl.deleteProgram(prog); };
  }, []);

  return <canvas ref={ref} className={`fixed inset-0 h-full w-full ${className}`} aria-hidden="true" />;
};

export default LiquidBackground;
