import React, { useEffect, useRef } from 'react';
import { hslTripleToRgb, hexToRgb01 } from '@/lib/background';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
// Domain-warped fbm: ink / fluid slowly mixing over black. u_sharp tightens the
// ink edges and adds thin bright veins; u_detail raises the base frequency.
const FRAG = `
precision mediump float;
uniform vec2 u_res; uniform float u_t; uniform vec3 u_a; uniform vec3 u_b; uniform float u_sharp; uniform float u_detail;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / u_res; uv.x *= u_res.x / u_res.y;
  float t = u_t * 0.05; float k = mix(1.4, 2.6, u_detail);
  vec2 q = vec2(fbm(uv*k + t), fbm(uv*k - t*0.7 + 3.1));
  vec2 r = vec2(fbm(uv*k + 2.2*q + vec2(1.7, 9.2) + t*0.5), fbm(uv*k + 2.2*q + vec2(8.3, 2.8) - t*0.3));
  float f = fbm(uv*k + 2.0*r);
  float w = mix(0.34, 0.05, u_sharp);
  float ink = smoothstep(0.56 - w, 0.56 + w, f);
  float vein = (1.0 - smoothstep(0.0, 0.03, abs(f - 0.62))) * u_sharp * 0.6;
  vec3 tint = mix(u_b, u_a, smoothstep(0.3, 0.7, r.x));
  vec3 col = mix(vec3(0.0), tint, ink) * (0.8 + 0.2*q.y) + tint * vein;
  gl_FragColor = vec4(col, 1.0);
}`;

const themeColors = (): [number[], number[]] => {
  const cs = getComputedStyle(document.documentElement);
  return [hslTripleToRgb(cs.getPropertyValue('--brand') || '348 62% 60%'), hslTripleToRgb(cs.getPropertyValue('--brand-2') || '20 72% 58%')];
};

interface Props { className?: string; sharp?: number; detail?: number; colors?: [string, string] | null }

/** Real-time liquid backdrop (WebGL). Colours follow the theme unless overridden. */
const LiquidBackground: React.FC<Props> = ({ className = '', sharp = 0.65, detail = 0.5, colors = null }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfg = useRef({ sharp, detail, colors }); cfg.current = { sharp, detail, colors };
  const apply = useRef<() => void>(() => undefined);

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
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('u_res'), uT = u('u_t'), uA = u('u_a'), uB = u('u_b'), uS = u('u_sharp'), uD = u('u_detail');

    const applyAll = () => {
      const { sharp, detail, colors } = cfg.current;
      const [a, b] = colors ? [hexToRgb01(colors[0]), hexToRgb01(colors[1])] : themeColors();
      gl.uniform3f(uA, a[0], a[1], a[2]); gl.uniform3f(uB, b[0], b[1], b[2]);
      gl.uniform1f(uS, sharp); gl.uniform1f(uD, detail);
      // sharper look = render closer to device resolution (capped for battery)
      const s = Math.min(devicePixelRatio || 1, 1.5) * (0.6 + 0.4 * sharp);
      canvas.width = Math.max(1, Math.floor(innerWidth * s)); canvas.height = Math.max(1, Math.floor(innerHeight * s));
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    apply.current = applyAll; applyAll();
    const mo = new MutationObserver(applyAll);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    addEventListener('resize', applyAll);

    let raf = 0; const start = performance.now(); let running = true;
    const frame = (now: number) => { if (!running) return; gl.uniform1f(uT, (now - start) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(frame); };
    const vis = () => { running = !document.hidden; if (running) raf = requestAnimationFrame(frame); else cancelAnimationFrame(raf); };
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); removeEventListener('resize', applyAll); document.removeEventListener('visibilitychange', vis); mo.disconnect(); gl.deleteProgram(prog); };
  }, []);

  // live re-apply when sharpness / colours change
  useEffect(() => { apply.current(); }, [sharp, detail, colors?.[0], colors?.[1]]);

  return <canvas ref={ref} className={`fixed inset-0 h-full w-full ${className}`} aria-hidden="true" />;
};

export default LiquidBackground;
