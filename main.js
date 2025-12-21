
// Get the canvas element from the HTML
const canvas = document.getElementById('glcanvas');

// Get the WebGL rendering context from the canvas
const gl = canvas.getContext('webgl');

// If WebGL is not supported, alert the user
if (!gl) {
  alert('WebGL not supported');
}

// Vertex & Index Data
// Define cube vertices with positions (x,y,z) and colors (r,g,b)
// Each vertex has 6 floats: 3 for position, 3 for color
const vertices = new Float32Array([
  -1,-1, 1,  1,0,0,   1,-1, 1,  1,0,0,   1, 1, 1,  1,0,0,  -1, 1, 1,  1,0,0, // front face, red
  -1,-1,-1,  0,1,0,  -1, 1,-1,  0,1,0,   1, 1,-1,  0,1,0,   1,-1,-1,  0,1,0, // back face, green
  -1, 1,-1,  0,0,1,  -1, 1, 1,  0,0,1,   1, 1, 1,  0,0,1,   1, 1,-1,  0,0,1, // top face, blue
  -1,-1,-1,  1,1,0,   1,-1,-1,  1,1,0,   1,-1, 1,  1,1,0,  -1,-1, 1,  1,1,0, // bottom face, yellow
   1,-1,-1,  0,1,1,   1, 1,-1,  0,1,1,   1, 1, 1,  0,1,1,   1,-1, 1,  0,1,1, // right face, cyan
  -1,-1,-1,  1,0,1,  -1,-1, 1,  1,0,1,  -1, 1, 1,  1,0,1,  -1, 1,-1,  1,0,1, // left face, magenta
]);

// Define the order to draw vertices (triangles)
const indices = new Uint16Array([
  0,1,2, 0,2,3,       // front
  4,5,6, 4,6,7,       // back
  8,9,10, 8,10,11,    // top
  12,13,14, 12,14,15, // bottom
  16,17,18, 16,18,19, // right
  20,21,22, 20,22,23  // left
]);

// Buffers
// Create buffer for vertex data
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Create buffer for indices
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// Shaders
// Function to compile a shader from source
function compileShader(source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check for compilation errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Get shader source code from HTML <script> elements
const vsSource = document.getElementById('vs').text;
const fsSource = document.getElementById('fs').text;

// Create program, attach shaders, and link
const program = gl.createProgram();
gl.attachShader(program, compileShader(vsSource, gl.VERTEX_SHADER));
gl.attachShader(program, compileShader(fsSource, gl.FRAGMENT_SHADER));
gl.linkProgram(program);
gl.useProgram(program);

// Attributes
// Stride: 6 floats per vertex (3 position + 3 color) * 4 bytes per float
const stride = 6 * 4;

// Enable position attribute and set pointer
gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aPosition'));
gl.vertexAttribPointer(gl.getAttribLocation(program, 'aPosition'), 3, gl.FLOAT, false, stride, 0);

// Enable color attribute and set pointer
gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aColor'));
gl.vertexAttribPointer(gl.getAttribLocation(program, 'aColor'), 3, gl.FLOAT, false, stride, 12);

// === Uniforms ===
// Get uniform location for Model-View-Projection matrix
const mvpLoc = gl.getUniformLocation(program, 'uModelViewProjection');

// Matrix Math Functions

// Perspective projection matrix
function perspective(fov, aspect, near, far) {
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
  const rangeInv = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]);
}

// Multiply two 4x4 matrices
function multiply(a, b) {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; ++i)
    for (let j = 0; j < 4; ++j)
      out[i*4 + j] = a[j] * b[i*4] + a[j+4] * b[i*4+1] + a[j+8] * b[i*4+2] + a[j+12] * b[i*4+3];
  return out;
}

// Translation matrix
function translate(x, y, z) {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
}

// Rotation matrices around X and Y axes
function rotateX(deg) {
  const rad = deg * Math.PI / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}

function rotateY(deg) {
  const rad = deg * Math.PI / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}

// Controls
// Initialize mouse/keyboard controls for rotation and zoom
const controls = initControls(canvas);  // returns live object {rotationX, rotationY, distance}

// Rendering Setup
gl.clearColor(0.1, 0.1, 0.1, 1); // dark gray background
gl.enable(gl.DEPTH_TEST); // enable depth testing

// === Render Loop ===
function render() {
  // Clear the color and depth buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Projection matrix
  const proj = perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 100);

  // View matrix (camera)
  const view = translate(0, 0, -controls.distance);

  // Model matrix (cube rotation)
  const model = multiply(rotateX(controls.rotationX), rotateY(controls.rotationY));

  // Combine projection, view, and model matrices
  let mvp = multiply(proj, view);
  mvp = multiply(mvp, model);

  // Send the final MVP matrix to the shader
  gl.uniformMatrix4fv(mvpLoc, false, mvp);

  // Draw cube using indices
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  // Request the next frame
  requestAnimationFrame(render);
}

// Start the render loop
render();
