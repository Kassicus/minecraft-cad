/**
 * MinecraftCAD - Base Renderer
 * Abstract base class for all view renderers
 */

// Removed coordinate system import - starting fresh

export class BaseRenderer {
  constructor(canvas) {
    if (new.target === BaseRenderer) {
      throw new Error('BaseRenderer is abstract and cannot be instantiated directly');
    }
    
    this.canvas = canvas;
    this.context = null;
    
    // Viewport bounds
    this.viewportBounds = {
      x: 0,
      y: 0,
      width: canvas ? canvas.width : 800,
      height: canvas ? canvas.height : 600
    };
    
    // Camera/view state
    this.camera = {
      offsetX: 0,
      offsetY: 0,
      zoom: 1.0
    };
    
    // Rendering settings
    this.settings = {
      showGrid: true,
      showMajorGrid: true,
      showGhostBlocks: true,
      blockSize: 20,
      majorGridInterval: 10
    };
    
    // Performance tracking
    this.performance = {
      lastFrameTime: 0,
      frameCount: 0,
      fps: 0,
      renderTime: 0
    };
    
    // Setup canvas if provided
    if (canvas) {
      this.setupCanvas();
    }
  }

  /**
   * Setup canvas properties
   */
  setupCanvas() {
    if (!this.canvas) return;
    
    // Set up high DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Update viewport bounds
    this.viewportBounds.width = this.canvas.width;
    this.viewportBounds.height = this.canvas.height;
    
    // Scale context for high DPI
    if (this.context) {
      this.context.scale(dpr, dpr);
    }
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  render(blockData, camera, viewport) {
    throw new Error('render() method must be implemented by subclass');
  }

  handleResize(width, height) {
    throw new Error('handleResize() method must be implemented by subclass');
  }

  worldToScreen(x, y, z) {
    throw new Error('worldToScreen() method must be implemented by subclass');
  }

  screenToWorld(screenX, screenY) {
    throw new Error('screenToWorld() method must be implemented by subclass');
  }

  /**
   * Common resize handling
   */
  onResize(width, height) {
    if (!this.canvas) return;
    
    this.viewportBounds.width = width;
    this.viewportBounds.height = height;
    
    // Update canvas size
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    // Scale context for high DPI
    if (this.context) {
      this.context.scale(dpr, dpr);
    }
    
    // Call subclass implementation
    this.handleResize(width, height);
  }

  /**
   * Update camera state
   */
  updateCamera(cameraState) {
    if (!cameraState) return;
    
    this.camera = { ...this.camera, ...cameraState };
  }

  /**
   * Update rendering settings
   */
  updateSettings(settings) {
    if (!settings) return;
    
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Handle view change events
   */
  onViewChange(viewType, level, cameraState) {
    this.updateCamera(cameraState);
    // Subclasses can override this for view-specific behavior
  }

  /**
   * Calculate viewport culling bounds
   */
  calculateCullingBounds() {
    const margin = 50; // Pixel margin for culling
    
    // Culling bounds calculation removed - will be rebuilt with new system
    return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  }

  /**
   * Start performance measurement
   */
  startPerformanceMeasurement() {
    this.performance.startTime = performance.now();
  }

  /**
   * End performance measurement
   */
  endPerformanceMeasurement() {
    const endTime = performance.now();
    this.performance.renderTime = endTime - this.performance.startTime;
    
    // Update FPS calculation
    this.performance.frameCount++;
    const now = Date.now();
    if (now - this.performance.lastFrameTime >= 1000) {
      this.performance.fps = this.performance.frameCount;
      this.performance.frameCount = 0;
      this.performance.lastFrameTime = now;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      fps: this.performance.fps,
      renderTime: this.performance.renderTime.toFixed(2) + 'ms',
      viewportSize: `${this.viewportBounds.width}x${this.viewportBounds.height}`
    };
  }

  /**
   * Clear the canvas
   */
  clear() {
    if (!this.context) return;
    
    this.context.clearRect(0, 0, this.viewportBounds.width, this.viewportBounds.height);
  }

  /**
   * Set canvas cursor
   */
  setCursor(cursor) {
    if (this.canvas) {
      this.canvas.style.cursor = cursor;
    }
  }

  /**
   * Check if a point is visible in the viewport
   */
  isPointVisible(x, y) {
    const screen = this.worldToScreen(x, y, 0);
    return screen.x >= -50 && screen.x <= this.viewportBounds.width + 50 &&
           screen.y >= -50 && screen.y <= this.viewportBounds.height + 50;
  }

  /**
   * Check if a rectangle intersects the viewport
   */
  isRectVisible(x, y, width, height) {
    const topLeft = this.worldToScreen(x, y, 0);
    const bottomRight = this.worldToScreen(x + width, y + height, 0);
    
    return !(bottomRight.x < 0 || topLeft.x > this.viewportBounds.width ||
             bottomRight.y < 0 || topLeft.y > this.viewportBounds.height);
  }

  /**
   * Convert hex color to rgba
   */
  hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Draw text with background
   */
  drawTextWithBackground(text, x, y, options = {}) {
    if (!this.context) return;
    
    const {
      font = '12px monospace',
      textColor = '#e8f4f8',
      backgroundColor = '#1e3a5f',
      borderColor = '#64b5f6',
      padding = 4,
      align = 'left'
    } = options;
    
    this.context.font = font;
    this.context.textAlign = align;
    this.context.textBaseline = 'middle';
    
    const metrics = this.context.measureText(text);
    const width = metrics.width + padding * 2;
    const height = 16 + padding * 2;
    
    let bgX = x - padding;
    if (align === 'center') {
      bgX = x - width / 2;
    } else if (align === 'right') {
      bgX = x - width + padding;
    }
    
    // Draw background
    this.context.fillStyle = backgroundColor;
    this.context.fillRect(bgX, y - height / 2, width, height);
    
    // Draw border
    this.context.strokeStyle = borderColor;
    this.context.lineWidth = 1;
    this.context.strokeRect(bgX, y - height / 2, width, height);
    
    // Draw text
    this.context.fillStyle = textColor;
    this.context.fillText(text, x, y);
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.canvas = null;
    this.context = null;
  }
}
