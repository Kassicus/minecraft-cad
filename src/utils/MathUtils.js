/**
 * MinecraftCAD - Math Utilities
 * Common mathematical functions and coordinate transformations
 */

export class MathUtils {
  /**
   * Clamp a value between min and max
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation between two values
   */
  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Snap a value to the nearest grid point
   */
  static snapToGrid(value, gridSize = 20) {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  static screenToWorld(screenX, screenY, camera, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    
    // Apply camera transformation
    const worldX = (x - camera.offsetX) / camera.zoom;
    const worldY = (y - camera.offsetY) / camera.zoom;
    
    return { x: worldX, y: worldY };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  static worldToScreen(worldX, worldY, camera) {
    const screenX = worldX * camera.zoom + camera.offsetX;
    const screenY = worldY * camera.zoom + camera.offsetY;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  static worldToGrid(worldX, worldY, gridSize = 20) {
    return {
      x: Math.floor(worldX / gridSize),
      y: Math.floor(worldY / gridSize)
    };
  }

  /**
   * Convert grid coordinates to world coordinates
   */
  static gridToWorld(gridX, gridY, gridSize = 20) {
    return {
      x: gridX * gridSize,
      y: gridY * gridSize
    };
  }

  /**
   * Calculate distance between two points
   */
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a point is within a rectangle
   */
  static pointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
    return pointX >= rectX && pointX <= rectX + rectWidth &&
           pointY >= rectY && pointY <= rectY + rectHeight;
  }

  /**
   * Check if two rectangles intersect
   */
  static rectsIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.width || 
             r2.x + r2.width < r1.x || 
             r2.y > r1.y + r1.height ||
             r2.y + r2.height < r1.y);
  }

  /**
   * Generate a unique coordinate key for sparse storage
   */
  static coordKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  /**
   * Parse a coordinate key back to x,y,z values
   */
  static parseCoordKey(key) {
    const parts = key.split(',').map(Number);
    return { x: parts[0], y: parts[1], z: parts[2] };
  }

  /**
   * Calculate viewport bounds for culling
   */
  static calculateViewportBounds(camera, canvasWidth, canvasHeight, margin = 50) {
    const worldTopLeft = this.screenToWorld(-margin, -margin, camera, { 
      getBoundingClientRect: () => ({ left: 0, top: 0 })
    });
    const worldBottomRight = this.screenToWorld(
      canvasWidth + margin, 
      canvasHeight + margin, 
      camera, 
      { getBoundingClientRect: () => ({ left: 0, top: 0 }) }
    );

    return {
      minX: Math.floor(worldTopLeft.x / 20),
      minY: Math.floor(worldTopLeft.y / 20),
      maxX: Math.ceil(worldBottomRight.x / 20),
      maxY: Math.ceil(worldBottomRight.y / 20)
    };
  }

  /**
   * Generate hash for caching
   */
  static hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Deep clone an object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === "object") {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }
}
