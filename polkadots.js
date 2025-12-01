/**
 * A10city Labs - WebGL Triangle Background Effect
 * Animated triangles with glowing shadows matching website theme
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        maxDots: 10,              // Maximum triangles on screen at once
        spawnInterval: 1000,      // ms between spawn attempts
        minLifetime: 4000,       // Minimum triangle lifetime in ms
        maxLifetime: 6000,       // Maximum triangle lifetime in ms
        minSize: 70,             // Minimum triangle size
        maxSize: 80,            // Maximum triangle size
        colors: [
            // Website theme colors - blues and lime green accent
            [0.0, 0.34, 0.7, 0.75],   // Blue (#0056b3)
            [0.0, 0.46, 0.85, 0.75],  // Blue (#0074d9)
            [0.0, 0.5, 0.9, 0.7],     // Bright blue
            [0.0, 0.4, 0.75, 0.75],   // Medium blue
        ]
    };

    // Vertex shader - handles position and size
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute float a_size;
        attribute vec4 a_color;
        attribute float a_alpha;
        attribute float a_rotation;
        
        varying vec4 v_color;
        varying float v_rotation;
        
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            gl_PointSize = a_size;
            v_color = vec4(a_color.rgb, a_color.a * a_alpha);
            v_rotation = a_rotation;
        }
    `;

    // Fragment shader - renders glowing triangles
    const fragmentShaderSource = `
        precision mediump float;
        
        varying vec4 v_color;
        varying float v_rotation;
        
        // Function to check if point is inside triangle
        float triangleSDF(vec2 p) {
            // Equilateral triangle vertices centered at origin
            float k = sqrt(3.0);
            p.x = abs(p.x) - 0.5;
            p.y = p.y + 0.5 / k;
            if(p.x + k * p.y > 0.0) {
                p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
            }
            p.x -= clamp(p.x, -1.0, 0.0);
            return -length(p) * sign(p.y);
        }
        
        void main() {
            // Transform point coordinates to centered space
            vec2 coord = gl_PointCoord - vec2(0.5);
            
            // Apply rotation
            float c = cos(v_rotation);
            float s = sin(v_rotation);
            vec2 rotatedCoord = vec2(
                coord.x * c - coord.y * s,
                coord.x * s + coord.y * c
            );
            
            // Scale for triangle
            vec2 p = rotatedCoord * 2.8;
            
            // Get signed distance to triangle
            float d = triangleSDF(p);
            
            // Core triangle with soft edge
            float core = 1.0 - smoothstep(-0.1, 0.05, d);
            
            // Outer glow layers
            float glow1 = exp(d * 6.0) * 0.5;
            float glow2 = exp(d * 3.5) * 0.35;
            float glow3 = exp(d * 2.0) * 0.2;
            
            // Combine glows for halo effect
            float totalGlow = (glow1 + glow2 + glow3) * step(d, 0.5);
            
            // Bright inner highlight for sparkle
            float highlight = exp(d * 10.0) * 0.4 * step(d, 0.0);
            
            // Final alpha combines core and glows
            float alpha = core + totalGlow;
            
            // Brighten the color towards white in the center for sparkle
            vec3 brightColor = mix(v_color.rgb, vec3(1.0), highlight);
            
            // Add slight color boost for vibrancy
            brightColor = brightColor * 1.15;
            
            gl_FragColor = vec4(brightColor, v_color.a * alpha);
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
                console.warn('WebGL not supported, triangle effect disabled');
                return;
            }

            this.setupWebGL();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            // Pre-populate with triangles
            this.prePopulateDots();
            
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
            this.rotationLocation = gl.getAttribLocation(this.program, 'a_rotation');

            // Create buffers
            this.positionBuffer = gl.createBuffer();
            this.sizeBuffer = gl.createBuffer();
            this.colorBuffer = gl.createBuffer();
            this.alphaBuffer = gl.createBuffer();
            this.rotationBuffer = gl.createBuffer();

            // Enable additive blending for bright glowing effect
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
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

        // Helper to get random X position avoiding center third
        getRandomX() {
            // Center third is from -0.333 to 0.333 - avoid this region
            const isLeft = Math.random() < 0.5;
            if (isLeft) {
                return -1 + Math.random() * 0.667; // -1 to -0.333
            } else {
                return 0.333 + Math.random() * 0.667; // 0.333 to 1
            }
        }

        prePopulateDots() {
            // Spawn initial batch of triangles with staggered birth times
            const currentTime = performance.now();
            const targetDots = Math.floor(CONFIG.maxDots * 0.7); // Start with 70% of max
            
            for (let i = 0; i < targetDots; i++) {
                const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
                const lifetime = CONFIG.minLifetime + Math.random() * (CONFIG.maxLifetime - CONFIG.minLifetime);
                // Stagger birth times so they don't all fade at once
                const birthOffset = Math.random() * lifetime * 0.8;
                
                this.dots.push({
                    x: this.getRandomX(),
                    y: (Math.random() * 2 - 1),
                    size: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
                    color: color,
                    birthTime: currentTime - birthOffset,
                    lifetime: lifetime,
                    rotation: Math.random() * Math.PI * 2, // Random initial rotation
                    rotationSpeed: (Math.random() - 0.5) * 0.002 // Slow rotation speed
                });
            }
        }

        spawnDot() {
            if (this.dots.length >= CONFIG.maxDots) return;

            const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
            const lifetime = CONFIG.minLifetime + Math.random() * (CONFIG.maxLifetime - CONFIG.minLifetime);
            
            this.dots.push({
                x: this.getRandomX(),  // Use helper to avoid center third
                y: (Math.random() * 2 - 1),
                size: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
                color: color,
                birthTime: performance.now(),
                lifetime: lifetime,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.002
            });
        }

        updateDots(currentTime) {
            // Remove expired dots and update rotations
            this.dots = this.dots.filter(dot => {
                const age = currentTime - dot.birthTime;
                if (age < dot.lifetime) {
                    // Update rotation
                    dot.rotation += dot.rotationSpeed * 16; // Approximate frame time
                    return true;
                }
                return false;
            });

            // Spawn new triangles
            if (currentTime - this.lastSpawnTime > CONFIG.spawnInterval) {
                // Spawn multiple triangles at once to maintain density
                const dotsToSpawn = Math.min(3, CONFIG.maxDots - this.dots.length);
                for (let i = 0; i < dotsToSpawn; i++) {
                    if (Math.random() < 0.85) { // 85% chance to spawn
                        this.spawnDot();
                    }
                }
                this.lastSpawnTime = currentTime;
            }
        }

        calculateAlpha(dot, currentTime) {
            const age = currentTime - dot.birthTime;
            const progress = age / dot.lifetime;
            
            // Smooth fade in and out using sine curve with slight sparkle variation
            const baseAlpha = Math.sin(progress * Math.PI);
            
            // Add subtle twinkle effect
            const twinkle = 1 + Math.sin(age * 0.01) * 0.1;
            
            return baseAlpha * twinkle;
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
            const rotations = [];

            const dpr = window.devicePixelRatio || 1;

            for (const dot of this.dots) {
                positions.push(dot.x, dot.y);
                sizes.push(dot.size * dpr);
                colors.push(...dot.color);
                alphas.push(this.calculateAlpha(dot, currentTime));
                rotations.push(dot.rotation);
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

            // Upload rotation data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rotations), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.rotationLocation);
            gl.vertexAttribPointer(this.rotationLocation, 1, gl.FLOAT, false, 0, 0);

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