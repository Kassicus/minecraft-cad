/**
 * MinecraftCAD - Line Tool
 * Draws straight lines of blocks between two points
 */

import { BaseTool } from './BaseTool.js';

export class LineTool extends BaseTool {
  constructor() {
    super('line', 'Line Tool');
    
    // Line drawing state
    this.startPoint = null;
    this.endPoint = null;
    this.isDrawing = false;
    this.previewBlocks = [];
  }

  /**
   * Handle mouse down - start line drawing
   */
  onMouseDown(event, worldPos) {

    if (!worldPos) return;

    if (!this.isDrawing) {
      // Start new line
      this.startPoint = { ...worldPos };
      this.isDrawing = true;
      this.setCursor('crosshair');
    } else {
      // Complete line
      this.endPoint = { ...worldPos };
      this.drawLine();
      this.finishDrawing();
    }
  }

  /**
   * Handle mouse move - update line preview
   */
  onMouseMove(event, worldPos) {
    if (!this.isDrawing || !worldPos || !this.startPoint) return;

    this.endPoint = { ...worldPos };
    this.updatePreview();
  }

  /**
   * Handle right click - cancel current line
   */
  onRightClick(event, worldPos) {
    if (this.isDrawing) {
      this.cancelDrawing();
    }
  }

  /**
   * Handle key press - ESC to cancel
   */
  onKeyDown(event) {
    if (event.key === 'Escape' && this.isDrawing) {
      this.cancelDrawing();
    }
  }

  /**
   * Draw the actual line - REMOVED BLOCK PLACEMENT
   */
  drawLine() {
    // Block placement removed - tool disabled until new system is implemented
    console.log('Line tool disabled - block placement system removed');
    this.clearPreview();
  }

  /**
   * Calculate all block positions for a line using Bresenham's algorithm
   */
  calculateLineBlocks(start, end) {
    const blocks = [];
    
    // 3D Bresenham's line algorithm
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const dz = Math.abs(end.z - start.z);
    
    const sx = start.x < end.x ? 1 : -1;
    const sy = start.y < end.y ? 1 : -1;
    const sz = start.z < end.z ? 1 : -1;
    
    let x = start.x;
    let y = start.y;
    let z = start.z;
    
    // Determine the driving axis
    if (dx >= dy && dx >= dz) {
      // X is the driving axis
      let p1 = 2 * dy - dx;
      let p2 = 2 * dz - dx;
      
      while (x !== end.x) {
        blocks.push({ x, y, z });
        
        if (p1 >= 0) {
          y += sy;
          p1 -= 2 * dx;
        }
        
        if (p2 >= 0) {
          z += sz;
          p2 -= 2 * dx;
        }
        
        p1 += 2 * dy;
        p2 += 2 * dz;
        x += sx;
      }
    } else if (dy >= dx && dy >= dz) {
      // Y is the driving axis
      let p1 = 2 * dx - dy;
      let p2 = 2 * dz - dy;
      
      while (y !== end.y) {
        blocks.push({ x, y, z });
        
        if (p1 >= 0) {
          x += sx;
          p1 -= 2 * dy;
        }
        
        if (p2 >= 0) {
          z += sz;
          p2 -= 2 * dy;
        }
        
        p1 += 2 * dx;
        p2 += 2 * dz;
        y += sy;
      }
    } else {
      // Z is the driving axis
      let p1 = 2 * dy - dz;
      let p2 = 2 * dx - dz;
      
      while (z !== end.z) {
        blocks.push({ x, y, z });
        
        if (p1 >= 0) {
          y += sy;
          p1 -= 2 * dz;
        }
        
        if (p2 >= 0) {
          x += sx;
          p2 -= 2 * dz;
        }
        
        p1 += 2 * dy;
        p2 += 2 * dx;
        z += sz;
      }
    }
    
    // Add the end point
    blocks.push({ x: end.x, y: end.y, z: end.z });
    
    return blocks;
  }

  /**
   * Update the line preview
   */
  updatePreview() {
    this.clearPreview();
    
    if (!this.startPoint || !this.endPoint) return;

    this.previewBlocks = this.calculateLineBlocks(this.startPoint, this.endPoint);
    
    // Add preview blocks to renderer (if supported)
    if (this.renderer && this.renderer.addPreviewBlocks) {
      this.renderer.addPreviewBlocks(this.previewBlocks, this.currentBlockType);
    }
  }

  /**
   * Clear preview blocks
   */
  clearPreview() {
    if (this.renderer && this.renderer.clearPreviewBlocks) {
      this.renderer.clearPreviewBlocks();
    }
    this.previewBlocks = [];
  }

  /**
   * Finish drawing and reset state
   */
  finishDrawing() {
    this.startPoint = null;
    this.endPoint = null;
    this.isDrawing = false;
    this.clearPreview();
    this.setCursor('default');
  }

  /**
   * Cancel current drawing operation
   */
  cancelDrawing() {
    this.finishDrawing();
  }

  /**
   * Activate the tool
   */
  activate() {
    super.activate();
    this.setCursor('crosshair');
  }

  /**
   * Deactivate the tool
   */
  deactivate() {
    this.cancelDrawing();
    super.deactivate();
  }

  /**
   * Get tool status text
   */
  getStatusText() {
    if (this.isDrawing) {
      return 'Click to set end point, or right-click to cancel';
    }
    return 'Click to start drawing a line';
  }
}
