/**
 * A10city Labs - WebGL Polkadot Background Effect
 * Sparse animated dots that pop and fade in theme colors
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        maxDots: 2000,           // Maximum dots on screen at once
        spawnInterval: 600,    // ms between spawn attempts
        minLifetime: 2500,     // Minimum dot lifetime in ms
        maxLifetime: 5000,     // Maximum dot lifetime in ms
        minSize: 20,            // Minimum dot radius
        maxSize:500,           // Maximum dot radius
        colors: [
            [0.75, 1.0, 0.0, 0.6],    // Lime green (BFFF00) - main accent
            [0.75, 1.0, 0.0, 0.4],    // Lime green - softer
            [1.0, 1.0, 1.0, 0.25],    // White - subtle
            [0.0, 0.46, 0.85, 0.4],   // Blue (0074D9)
            [0.63, 0.88, 0.0, 0.5],   // Slightly darker lime (A0E000)
        ]
    };

    // Vertex shader - handles position and size
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute float a_size;
        attribute vec4 a_color;
        attribute float a_alpha;
        
        varying vec4 v_color;
        
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            gl_PointSize = a_size;
            v_color = vec4(a_color.rgb, a_color.a * a_alpha);
        }
    `;

    // Fragment shader - renders smooth circles
    const fragmentShaderSource = `
        precision mediump float;
        
        varying vec4 v_color;
        
        void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            
            // Smooth circle with soft edge
            float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
            
            // Add subtle glow effect
            float glow = exp(-dist * 3.0) * 0.3;
            
            gl_FragColor = vec4(v_color.rgb, v_color.a * (alpha + glow));
        }
    `;

    class PolkadotBackground {
        constructor() {
            this.canvas = null;
            this.gl = null;
            this.program = null;
            this.dots = [];
            this.lastSpawnTime = 0;
            this.animationId = null;
            
            this.init();
        }

        init() {
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'polkadot-bg';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            `;
            document.body.insertBefore(this.canvas, document.body.firstChild);

            // Get WebGL context
            this.gl = this.canvas.getContext('webgl', {
                alpha: true,
                premultipliedAlpha: false,
                antialias: true
            });

            if (!this.gl) {
                console.warn('WebGL not supported, polkadot effect disabled');
                return;
            }

            this.setupWebGL();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.animate();
        }

        setupWebGL() {
            const gl = this.gl;

            // Create shaders
            const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
            const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

            // Create program
            this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(this.program));
                return;
            }

            gl.useProgram(this.program);

            // Get attribute locations
            this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
            this.sizeLocation = gl.getAttribLocation(this.program, 'a_size');
            this.colorLocation = gl.getAttribLocation(this.program, 'a_color');
            this.alphaLocation = gl.getAttribLocation(this.program, 'a_alpha');

            // Create buffers
            this.positionBuffer = gl.createBuffer();
            this.sizeBuffer = gl.createBuffer();
            this.colorBuffer = gl.createBuffer();
            this.alphaBuffer = gl.createBuffer();

            // Enable blending for transparency
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        createShader(type, source) {
            const gl = this.gl;
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

        resize() {
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            
            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        spawnDot() {
            if (this.dots.length >= CONFIG.maxDots) return;

            const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
            const lifetime = CONFIG.minLifetime + Math.random() * (CONFIG.maxLifetime - CONFIG.minLifetime);
            
            this.dots.push({
                x: (Math.random() * 2 - 1),  // -1 to 1 in clip space
                y: (Math.random() * 2 - 1),
                size: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
                color: color,
                birthTime: performance.now(),
                lifetime: lifetime
            });
        }

        updateDots(currentTime) {
            // Remove expired dots
            this.dots = this.dots.filter(dot => {
                const age = currentTime - dot.birthTime;
                return age < dot.lifetime;
            });

            // Spawn new dots periodically
            if (currentTime - this.lastSpawnTime > CONFIG.spawnInterval) {
                if (Math.random() < 0.7) { // 70% chance to spawn
                    this.spawnDot();
                }
                this.lastSpawnTime = currentTime;
            }
        }

        calculateAlpha(dot, currentTime) {
            const age = currentTime - dot.birthTime;
            const progress = age / dot.lifetime;
            
            // Smooth fade in and out using sine curve
            return Math.sin(progress * Math.PI);
        }

        render(currentTime) {
            const gl = this.gl;
            if (!gl || this.dots.length === 0) return;

            // Clear with transparent background
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Prepare data arrays
            const positions = [];
            const sizes = [];
            const colors = [];
            const alphas = [];

            const dpr = window.devicePixelRatio || 1;

            for (const dot of this.dots) {
                positions.push(dot.x, dot.y);
                sizes.push(dot.size * dpr);
                colors.push(...dot.color);
                alphas.push(this.calculateAlpha(dot, currentTime));
            }

            // Upload position data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.positionLocation);
            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

            // Upload size data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.sizeLocation);
            gl.vertexAttribPointer(this.sizeLocation, 1, gl.FLOAT, false, 0, 0);

            // Upload color data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.colorLocation);
            gl.vertexAttribPointer(this.colorLocation, 4, gl.FLOAT, false, 0, 0);

            // Upload alpha data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.alphaLocation);
            gl.vertexAttribPointer(this.alphaLocation, 1, gl.FLOAT, false, 0, 0);

            // Draw points
            gl.drawArrays(gl.POINTS, 0, this.dots.length);
        }

        animate() {
            const loop = (currentTime) => {
                this.updateDots(currentTime);
                this.render(currentTime);
                this.animationId = requestAnimationFrame(loop);
            };
            
            this.animationId = requestAnimationFrame(loop);
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new PolkadotBackground());
    } else {
        new PolkadotBackground();
    }

})();