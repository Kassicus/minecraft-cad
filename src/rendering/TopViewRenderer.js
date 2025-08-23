/**
 * MinecraftCAD - Top View Renderer
 * 2D Canvas-based renderer for top-down plan views
 */

import { BaseRenderer } from './BaseRenderer.js';
import { HatchPatternManager } from './HatchPatternManager.js';
import { MathUtils } from '../utils/MathUtils.js';
import { coordinateSystem } from '../utils/CoordinateSystem.js';

export class TopViewRenderer extends BaseRenderer {
  constructor(canvas) {
    super(canvas);
    
    this.context = canvas.getContext('2d');
    this.hatchPatterns = new HatchPatternManager();
    
    // Top view specific settings
    this.settings = {
      ...this.settings,
      blockSize: 20, // Size of each block in pixels at 1.0 zoom
      showBlockBorders: true,
      showGhostBlocks: true,
      ghostBlockAlpha: 0.3,
      showCoordinates: false,
      showLevelIndicator: true
    };
    
    // Current level being displayed
    this.currentLevel = 0;
    
    // Grid rendering cache
    this.gridCache = null;
    this.gridCacheValid = false;
    
    // Block rendering optimization
    this.lastRenderBounds = null;
    this.visibleBlocks = [];
    
    this.setupCanvas();
  }

  /**
   * Main render method
   */
  render(blockData, camera, level = 0) {
    if (!this.context || !blockData) return;
    
    this.startPerformanceMeasurement();
    
    // Update camera and level
    this.updateCamera(camera);
    this.currentLevel = level;
    
    // Clear canvas
    this.clear();
    
    // Calculate visible area for culling
    const cullingBounds = this.calculateCullingBounds();
    
    // Draw grid
    if (this.settings.showGrid) {
      this.drawGrid();
    }
    
    // Draw blocks at current level
    this.drawBlocksAtLevel(blockData, level, cullingBounds);
    
    // Draw ghost blocks from other levels
    if (this.settings.showGhostBlocks) {
      this.drawGhostBlocks(blockData, level, cullingBounds);
    }
    
    // Draw overlays
    this.drawOverlays();
    
    this.endPerformanceMeasurement();
  }

  /**
   * Draw the grid system
   */
  drawGrid() {
    if (!this.context) return;
    
    // Use the unified coordinate system for grid rendering
    // Draw grid using coordinate system
    coordinateSystem.drawGrid(
      this.context,
      this.camera,
      this.viewportBounds.width,
      this.viewportBounds.height,
      {
        showGrid: this.settings.showGrid,
        showMajorGrid: this.settings.showMajorGrid,
        gridColor: 'rgba(100, 181, 246, 0.1)',
        majorGridColor: 'rgba(100, 181, 246, 0.3)',
        majorGridInterval: 10,
        minGridSize: 2
      }
    );
  }

  /**
   * Draw blocks at the current level
   */
  drawBlocksAtLevel(blockData, level, cullingBounds) {
    if (!this.context) return;
    
    const blocks = blockData ? blockData.getBlocksAtLevel(level) : [];
    const blockSize = this.settings.blockSize * this.camera.zoom;
    
    // Skip if blocks would be too small to see
    if (blockSize < 1) return;
    
    const ctx = this.context;
    ctx.save();
    
    for (const block of blocks) {
      // Cull blocks outside viewport
      if (block.x < cullingBounds.minX || block.x > cullingBounds.maxX ||
          block.y < cullingBounds.minY || block.y > cullingBounds.maxY) {
        continue;
      }
      
      const screenPos = this.gridToScreen(block.x, block.y);
      
      // Draw block with pattern
      this.drawBlock(ctx, screenPos.x, screenPos.y, blockSize, block.type, 1.0);
    }
    
    ctx.restore();
  }

  /**
   * Draw ghost blocks from other levels
   */
  drawGhostBlocks(blockData, currentLevel, cullingBounds) {
    if (!this.context || !this.settings.showGhostBlocks) return;
    
    const ctx = this.context;
    const blockSize = this.settings.blockSize * this.camera.zoom;
    
    // Skip if blocks would be too small to see
    if (blockSize < 2) return;
    
    ctx.save();
    
    // Get blocks from adjacent levels
    const levelsToShow = [];
    if (currentLevel > 0) levelsToShow.push(currentLevel - 1);
    if (currentLevel < 49) levelsToShow.push(currentLevel + 1);
    
    for (const level of levelsToShow) {
      // Block rendering removed - starting fresh
      const blocks = [];
      
      for (const block of blocks) {
        // Cull blocks outside viewport
        if (block.x < cullingBounds.minX || block.x > cullingBounds.maxX ||
            block.y < cullingBounds.minY || block.y > cullingBounds.maxY) {
          continue;
        }
        
        const screenPos = this.gridToScreen(block.x, block.y);
        
        // Draw ghost block with reduced alpha
        this.drawBlock(ctx, screenPos.x, screenPos.y, blockSize, block.type, this.settings.ghostBlockAlpha);
      }
    }
    
    ctx.restore();
  }

  /**
   * Draw a single block
   */
  drawBlock(ctx, x, y, size, blockType, alpha = 1.0) {
    // Fill with pattern
    this.hatchPatterns.fillRectWithPattern(
      ctx, x, y, size, size, blockType, 
      this.hatchPatterns.getScaleForZoom(this.camera.zoom), 
      alpha
    );
    
    // Draw border if enabled and blocks are large enough
    if (this.settings.showBlockBorders && size > 4) {
      this.hatchPatterns.strokeRectWithPattern(
        ctx, x, y, size, size, blockType, 1, alpha * 0.8
      );
    }
  }

  /**
   * Draw overlays (coordinates, level indicator, etc.)
   */
  drawOverlays() {
    if (!this.context) return;
    
    // Draw level indicator
    if (this.settings.showLevelIndicator) {
      this.drawLevelIndicator();
    }
    
    // Draw coordinates if enabled
    if (this.settings.showCoordinates) {
      this.drawCoordinateAxes();
    }
  }

  /**
   * Draw level indicator
   */
  drawLevelIndicator() {
    const levelName = this.currentLevel === 0 ? 'Ground' : `+${this.currentLevel}`;
    const text = `Level: ${levelName}`;
    
    this.drawTextWithBackground(
      text,
      this.viewportBounds.width - 20,
      30,
      {
        align: 'right',
        font: '14px monospace',
        backgroundColor: 'rgba(30, 58, 95, 0.9)',
        borderColor: '#64b5f6',
        padding: 8
      }
    );
  }

  /**
   * Draw coordinate axes
   */
  drawCoordinateAxes() {
    if (!this.context) return;
    
    const ctx = this.context;
    const origin = this.worldToScreen(0, 0, 0);
    
    ctx.save();
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + 100, origin.y);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x, origin.y + 100);
    ctx.stroke();
    
    ctx.restore();
    
    // Axis labels
    this.drawTextWithBackground('X', origin.x + 110, origin.y, { align: 'left' });
    this.drawTextWithBackground('Y', origin.x, origin.y + 110, { align: 'center' });
  }

  /**
   * Handle resize events
   */
  handleResize(width, height) {
    this.viewportBounds.width = width;
    this.viewportBounds.height = height;
    
    // Invalidate grid cache
    this.gridCacheValid = false;
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY, worldZ) {
    return coordinateSystem.worldToScreen(worldX, worldY, this.camera);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return coordinateSystem.screenToWorld(screenX, screenY, this.camera);
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  screenToGrid(screenX, screenY) {
    return coordinateSystem.screenToGrid(screenX, screenY, this.camera);
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  gridToScreen(gridX, gridY) {
    return coordinateSystem.gridToScreen(gridX, gridY, this.camera);
  }

  /**
   * Pan the view
   */
  pan(deltaX, deltaY) {
    this.camera.offsetX += deltaX;
    this.camera.offsetY += deltaY;
  }

  /**
   * Zoom the view
   */
  zoom(factor, centerX, centerY) {
    const oldZoom = this.camera.zoom;
    const newZoom = Math.max(0.1, Math.min(10.0, oldZoom * factor));
    
    if (newZoom !== oldZoom) {
      // Zoom towards the specified point
      const worldPoint = this.screenToWorld(centerX, centerY);
      
      this.camera.zoom = newZoom;
      
      const newScreenPoint = this.worldToScreen(worldPoint.x, worldPoint.y, 0);
      this.camera.offsetX += centerX - newScreenPoint.x;
      this.camera.offsetY += centerY - newScreenPoint.y;
    }
  }

  /**
   * Reset view to show entire build
   */
  resetView(blockData) {
    if (!blockData) return;
    
    const bounds = blockData.getBounds();
    
    if (bounds.minX === bounds.maxX && bounds.minY === bounds.maxY) {
      // No blocks or single block - center view
      this.camera.offsetX = this.viewportBounds.width / 2;
      this.camera.offsetY = this.viewportBounds.height / 2;
      this.camera.zoom = 1.0;
      return;
    }
    
    // Calculate zoom to fit all blocks
    const buildWidth = (bounds.maxX - bounds.minX + 1) * this.settings.blockSize;
    const buildHeight = (bounds.maxY - bounds.minY + 1) * this.settings.blockSize;
    
    const scaleX = (this.viewportBounds.width * 0.8) / buildWidth;
    const scaleY = (this.viewportBounds.height * 0.8) / buildHeight;
    
    this.camera.zoom = Math.min(scaleX, scaleY, 2.0);
    
    // Center the build
    const centerX = (bounds.minX + bounds.maxX) * this.settings.blockSize / 2;
    const centerY = (bounds.minY + bounds.maxY) * this.settings.blockSize / 2;
    
    this.camera.offsetX = this.viewportBounds.width / 2 - centerX * this.camera.zoom;
    this.camera.offsetY = this.viewportBounds.height / 2 - centerY * this.camera.zoom;
  }


  /**
   * Get the block at screen coordinates
   */
  getBlockAtScreen(screenX, screenY) {
    const grid = this.screenToGrid(screenX, screenY);
    return { x: grid.x, y: grid.y, z: this.currentLevel };
  }

  /**
   * Highlight a grid cell
   */
  highlightGridCell(gridX, gridY, color = 'rgba(100, 181, 246, 0.5)') {
    if (!this.context) return;
    
    const screenPos = this.gridToScreen(gridX, gridY);
    const blockSize = this.settings.blockSize * this.camera.zoom;
    
    this.context.save();
    this.context.fillStyle = color;
    this.context.fillRect(screenPos.x, screenPos.y, blockSize, blockSize);
    this.context.restore();
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    super.updateSettings(newSettings);
    
    // Invalidate caches when relevant settings change
    if (newSettings.showGrid !== undefined || 
        newSettings.showMajorGrid !== undefined ||
        newSettings.blockSize !== undefined) {
      this.gridCacheValid = false;
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    super.dispose();
    
    if (this.hatchPatterns) {
      this.hatchPatterns.dispose();
    }
    
    this.gridCache = null;
  }
}
