/* ═══════════════════════════════════════════════════════════════════
   ANHAD — Aurora Background System v3
   WebGL2 + CSS fallback • 60fps • Sacred gradients
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const Aurora = {
  canvas: null,
  gl: null,
  program: null,
  isWebGL: false,
  isRunning: false,
  raf: null,
  startTime: Date.now(),

  init() {
    this.canvas = document.getElementById('auroraCanvas');
    
    if (!this.canvas) {
      console.warn('[Aurora] Canvas not found, using CSS fallback');
      this._useCSSFallback();
      return;
    }

    // Try WebGL2 first
    try {
      this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      });

      if (this.gl) {
        this._initWebGL();
      } else {
        throw new Error('WebGL2 not supported');
      }
    } catch (e) {
      console.warn('[Aurora] WebGL failed, using CSS fallback:', e.message);
      this._useCSSFallback();
    }
  },

  _initWebGL() {
    this.isWebGL = true;
    this.canvas.style.display = 'block';
    
    // Resize canvas
    this._resize();
    window.addEventListener('resize', () => this._resize(), { passive: true });

    // Create shader program
    const vertexShader = this._createShader(this.gl.VERTEX_SHADER, `#version 300 es
      in vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `);

    const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      uniform float time;
      uniform vec2 resolution;
      out vec4 fragColor;

      // Sacred golden and purple aurora colors
      const vec3 gold = vec3(0.831, 0.525, 0.039);
      const vec3 purple = vec3(0.659, 0.333, 0.969);
      const vec3 warm = vec3(0.992, 0.965, 0.925);

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for(int i = 0; i < 4; i++) {
          value += amplitude * smoothNoise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;

        // Animated noise
        float t = time * 0.05;
        vec2 q = vec2(fbm(p + t), fbm(p + t + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(p + q + t * 0.5), fbm(p + q + t * 0.5 + vec2(8.3, 2.8)));
        
        float f = fbm(p + r);

        // Create two aurora blobs
        vec2 blob1 = vec2(-0.3 + sin(t) * 0.2, 0.3 + cos(t * 0.7) * 0.2);
        vec2 blob2 = vec2(0.4 + cos(t * 0.8) * 0.2, -0.2 + sin(t * 0.6) * 0.2);
        
        float d1 = length(p - blob1);
        float d2 = length(p - blob2);
        
        // Golden blob
        vec3 color1 = gold * (1.0 - smoothstep(0.0, 1.5, d1)) * 0.15;
        // Purple blob
        vec3 color2 = purple * (1.0 - smoothstep(0.0, 1.5, d2)) * 0.12;
        
        // Combine with noise
        vec3 color = warm + color1 + color2;
        color = mix(color, color * f, 0.3);
        
        fragColor = vec4(color, 1.0);
      }
    `);

    this.program = this._createProgram(vertexShader, fragmentShader);
    this.gl.useProgram(this.program);

    // Create fullscreen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLoc = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);

    // Get uniform locations
    this.uniforms = {
      time: this.gl.getUniformLocation(this.program, 'time'),
      resolution: this.gl.getUniformLocation(this.program, 'resolution')
    };

    // Start rendering
    this.start();
  },

  _createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  },

  _createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  },

  _resize() {
    if (!this.canvas) return;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this._render();
  },

  stop() {
    this.isRunning = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  },

  _render() {
    if (!this.isRunning || !this.gl) return;

    const time = (Date.now() - this.startTime) / 1000;

    // Update uniforms
    this.gl.uniform1f(this.uniforms.time, time);
    this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    // Draw
    this.gl.clearColor(0.992, 0.965, 0.925, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.raf = requestAnimationFrame(() => this._render());
  },

  _useCSSFallback() {
    this.isWebGL = false;
    
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    
    // Ensure CSS aurora is visible
    const cssBg = document.querySelector('.aurora-bg:not(canvas)');
    if (cssBg) {
      cssBg.style.display = '';
    }
    
    // Pause CSS animations when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (cssBg) {
        cssBg.style.animationPlayState = document.hidden ? 'paused' : 'running';
      }
    });
  },

  destroy() {
    this.stop();
    if (this.gl) {
      this.gl.deleteProgram(this.program);
      this.gl = null;
    }
  }
};

window.Aurora = Aurora;
