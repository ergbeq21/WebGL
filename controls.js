
// Function to initialize controls on a given canvas
function initControls(canvas) {
  // Object storing the current state of the controls
  const controls = {
    rotationX: 0,  // rotation around X-axis (up/down)
    rotationY: 0,  // rotation around Y-axis (left/right)
    distance: 5    // camera distance (zoom)
  };

  // Internal variables to track dragging state
  let isDragging = false;
  let previousMouseX = 0;
  let previousMouseY = 0;

  //  Mouse Events

  // Mouse down: start dragging
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true; // flag that drag started
    previousMouseX = e.clientX;// store initial mouse position
    previousMouseY = e.clientY;
  });

  // Mouse move: update rotation if dragging
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return; // only rotate when dragging

    const deltaX = e.clientX - previousMouseX;  // difference in X
    const deltaY = e.clientY - previousMouseY;  // difference in Y

    // Update cube rotation based on mouse movement
    controls.rotationY += deltaX * 0.5;  // horizontal movement -> Y rotation
    controls.rotationX += deltaY * 0.5;  // vertical movement -> X rotation

    // Update previous mouse positions for next movement
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  });

  // Mouse up: stop dragging
  canvas.addEventListener('mouseup', () => isDragging = false);

  // Mouse leaves canvas: stop dragging
  canvas.addEventListener('mouseleave', () => isDragging = false);

  // Mouse Wheel for Zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // prevent page scrolling

    // Adjust distance based on wheel delta
    controls.distance += e.deltaY * 0.005;

    // Clamp distance between 2 and 20
    controls.distance = Math.max(2, Math.min(20, controls.distance));
  });

  // Return the live controls object
  // This object is updated in real-time by mouse interactions
  return controls;
}
