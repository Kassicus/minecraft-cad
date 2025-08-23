/**
 * MinecraftCAD - Rectangle Tool
 * Draws rectangular outlines or filled rectangles
 */

import { BaseTool } from './BaseTool.js';

export class RectangleTool extends BaseTool {
  constructor() {
    super('rectangle', 'Rectangle Tool');
    
    // Rectangle drawing state
    this.startPoint = null;
    this.endPoint = null;
    this.isDrawing = false;
    this.previewBlocks = [];
    this.fillMode = false; // Toggle between outline and filled
  }

  /**
   * Handle mouse down - start rectangle drawing
   */
  onMouseDown(event, worldPos) {
    if (!worldPos) return;

    if (!this.isDrawing) {
      // Start new rectangle
      this.startPoint = { ...worldPos };
      this.isDrawing = true;
      this.setCursor('crosshair');
    } else {
      // Complete rectangle
      this.endPoint = { ...worldPos };
      this.drawRectangle();
      this.finishDrawing();
    }
  }

  /**
   * Handle mouse move - update rectangle preview
   */
  onMouseMove(event, worldPos) {
    if (!this.isDrawing || !worldPos || !this.startPoint) return;

    this.endPoint = { ...worldPos };
    this.updatePreview();
  }

  /**
   * Handle right click - cancel current rectangle
   */
  onRightClick(event, worldPos) {
    if (this.isDrawing) {
      this.cancelDrawing();
    }
  }

  /**
   * Handle key press - F to toggle fill mode, ESC to cancel
   */
  onKeyDown(event) {
    if (event.key === 'Escape' && this.isDrawing) {
      this.cancelDrawing();
    } else if (event.key === 'f' || event.key === 'F') {
      this.fillMode = !this.fillMode;
      this.updatePreview(); // Refresh preview with new mode
      this.notifyStatusChange();
    }
  }

  /**
   * Draw the actual rectangle
   */
  drawRectangle() {
    if (!this.startPoint || !this.endPoint) return;

    const blocks = this.fillMode ? 
      this.calculateFilledRectangleBlocks(this.startPoint, this.endPoint) :
      this.calculateRectangleOutlineBlocks(this.startPoint, this.endPoint);
    
    // Block placement removed - tool disabled until new system is implemented
    console.log('Rectangle tool disabled - block placement system removed');

    // Clear preview
    this.clearPreview();
    
    // Trigger re-render
    this.notifyChange();
  }

  /**
   * Calculate blocks for rectangle outline
   */
  calculateRectangleOutlineBlocks(start, end) {
    const blocks = [];
    
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const minZ = Math.min(start.z, end.z);
    const maxZ = Math.max(start.z, end.z);

    // For 3D rectangles, we need to handle different planes
    if (minZ === maxZ) {
      // 2D rectangle on a single Z level
      // Top and bottom edges
      for (let x = minX; x <= maxX; x++) {
        blocks.push({ x, y: minY, z: minZ });
        if (minY !== maxY) {
          blocks.push({ x, y: maxY, z: minZ });
        }
      }
      
      // Left and right edges (excluding corners already added)
      for (let y = minY + 1; y < maxY; y++) {
        blocks.push({ x: minX, y, z: minZ });
        if (minX !== maxX) {
          blocks.push({ x: maxX, y, z: minZ });
        }
      }
    } else {
      // 3D rectangular frame - outline all faces
      this.addRectangleFrame(blocks, minX, maxX, minY, maxY, minZ, maxZ);
    }

    return blocks;
  }

  /**
   * Calculate blocks for filled rectangle
   */
  calculateFilledRectangleBlocks(start, end) {
    const blocks = [];
    
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const minZ = Math.min(start.z, end.z);
    const maxZ = Math.max(start.z, end.z);

    // Fill the entire rectangular volume
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          blocks.push({ x, y, z });
        }
      }
    }

    return blocks;
  }

  /**
   * Add rectangular frame blocks for 3D rectangles
   */
  addRectangleFrame(blocks, minX, maxX, minY, maxY, minZ, maxZ) {
    // Bottom face edges
    this.addRectangleEdges(blocks, minX, maxX, minY, maxY, minZ);
    
    // Top face edges (if different from bottom)
    if (minZ !== maxZ) {
      this.addRectangleEdges(blocks, minX, maxX, minY, maxY, maxZ);
    }
    
    // Vertical edges
    for (let z = minZ + 1; z < maxZ; z++) {
      blocks.push({ x: minX, y: minY, z });
      blocks.push({ x: maxX, y: minY, z });
      blocks.push({ x: minX, y: maxY, z });
      blocks.push({ x: maxX, y: maxY, z });
    }
  }

  /**
   * Add rectangle edges for a single Z level
   */
  addRectangleEdges(blocks, minX, maxX, minY, maxY, z) {
    // Top and bottom edges
    for (let x = minX; x <= maxX; x++) {
      blocks.push({ x, y: minY, z });
      if (minY !== maxY) {
        blocks.push({ x, y: maxY, z });
      }
    }
    
    // Left and right edges (excluding corners)
    for (let y = minY + 1; y < maxY; y++) {
      blocks.push({ x: minX, y, z });
      if (minX !== maxX) {
        blocks.push({ x: maxX, y, z });
      }
    }
  }

  /**
   * Update the rectangle preview
   */
  updatePreview() {
    this.clearPreview();
    
    if (!this.startPoint || !this.endPoint) return;

    this.previewBlocks = this.fillMode ? 
      this.calculateFilledRectangleBlocks(this.startPoint, this.endPoint) :
      this.calculateRectangleOutlineBlocks(this.startPoint, this.endPoint);
    
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
    const modeText = this.fillMode ? 'filled' : 'outline';
    
    if (this.isDrawing) {
      return `Drawing ${modeText} rectangle - click to set corner, press F to toggle fill, right-click to cancel`;
    }
    return `Rectangle Tool (${modeText}) - click to start, press F to toggle fill mode`;
  }
}
