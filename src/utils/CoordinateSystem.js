/**
 * MinecraftCAD - Coordinate System
 * Simple coordinate transformations for grid-based building
 */

export class CoordinateSystem {
  constructor(blockSize = 20) {
    this.blockSize = blockSize;
  }

  /**
   * Get block size
   */
  getBlockSize() {
    return this.blockSize;
  }

  /**
   * Set block size
   */
  setBlockSize(size) {
    this.blockSize = size;
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY, camera) {
    if (!camera) return { x: 0, y: 0 };
    
    const worldX = (screenX - camera.offsetX) / camera.zoom;
    const worldY = (screenY - camera.offsetY) / camera.zoom;
    
    return { x: worldX, y: worldY };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY, camera) {
    if (!camera) return { x: 0, y: 0 };
    
    const screenX = worldX * camera.zoom + camera.offsetX;
    const screenY = worldY * camera.zoom + camera.offsetY;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.blockSize),
      y: Math.floor(worldY / this.blockSize)
    };
  }

  /**
   * Convert grid coordinates to world coordinates (center of grid cell)
   */
  gridToWorld(gridX, gridY) {
    return {
      x: (gridX + 0.5) * this.blockSize,
      y: (gridY + 0.5) * this.blockSize
    };
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  screenToGrid(screenX, screenY, camera) {
    const world = this.screenToWorld(screenX, screenY, camera);
    return this.worldToGrid(world.x, world.y);
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  gridToScreen(gridX, gridY, camera) {
    const world = this.gridToWorld(gridX, gridY);
    return this.worldToScreen(world.x, world.y, camera);
  }

  /**
   * Snap world coordinates to grid
   */
  snapToGrid(worldX, worldY) {
    const gridX = Math.floor(worldX / this.blockSize);
    const gridY = Math.floor(worldY / this.blockSize);
    return this.gridToWorld(gridX, gridY);
  }

  /**
   * Draw grid lines on canvas
   */
  drawGrid(ctx, camera, viewportWidth, viewportHeight, options = {}) {
    const {
      showGrid = true,
      showMajorGrid = true,
      gridColor = 'rgba(100, 181, 246, 0.2)',
      majorGridColor = 'rgba(100, 181, 246, 0.4)',
      majorGridInterval = 10,
      minGridSize = 2
    } = options;

    if (!showGrid) return;

    const currentBlockSize = this.blockSize * camera.zoom;
    
    // Don't draw grid if too small
    if (currentBlockSize < minGridSize) return;

    ctx.save();
    ctx.lineWidth = 1;

    // Calculate visible grid bounds
    const topLeft = this.screenToWorld(0, 0, camera);
    const bottomRight = this.screenToWorld(viewportWidth, viewportHeight, camera);
    
    const startGridX = Math.floor(topLeft.x / this.blockSize);
    const endGridX = Math.ceil(bottomRight.x / this.blockSize);
    const startGridY = Math.floor(topLeft.y / this.blockSize);
    const endGridY = Math.ceil(bottomRight.y / this.blockSize);

    // Draw main grid lines
    ctx.strokeStyle = gridColor;
    ctx.beginPath();

    // Vertical lines
    for (let x = startGridX; x <= endGridX; x++) {
      const screenX = this.gridToScreen(x, 0, camera).x;
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, viewportHeight);
    }

    // Horizontal lines
    for (let y = startGridY; y <= endGridY; y++) {
      const screenY = this.gridToScreen(0, y, camera).y;
      ctx.moveTo(0, screenY);
      ctx.lineTo(viewportWidth, screenY);
    }
    
    ctx.stroke();

    // Draw major grid lines
    if (showMajorGrid && currentBlockSize >= majorGridInterval) {
      ctx.strokeStyle = majorGridColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Major vertical lines
      const startMajorX = Math.floor(startGridX / majorGridInterval) * majorGridInterval;
      for (let x = startMajorX; x <= endGridX; x += majorGridInterval) {
        const screenX = this.gridToScreen(x, 0, camera).x;
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, viewportHeight);
      }

      // Major horizontal lines
      const startMajorY = Math.floor(startGridY / majorGridInterval) * majorGridInterval;
      for (let y = startMajorY; y <= endGridY; y += majorGridInterval) {
        const screenY = this.gridToScreen(0, y, camera).y;
        ctx.moveTo(0, screenY);
        ctx.lineTo(viewportWidth, screenY);
      }
      
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Get visible grid bounds for culling
   */
  getVisibleGridBounds(camera, viewportWidth, viewportHeight, margin = 50) {
    const topLeft = this.screenToWorld(-margin, -margin, camera);
    const bottomRight = this.screenToWorld(viewportWidth + margin, viewportHeight + margin, camera);
    
    return {
      minX: Math.floor(topLeft.x / this.blockSize),
      minY: Math.floor(topLeft.y / this.blockSize),
      maxX: Math.ceil(bottomRight.x / this.blockSize),
      maxY: Math.ceil(bottomRight.y / this.blockSize)
    };
  }
}

// Create singleton instance
export const coordinateSystem = new CoordinateSystem();
