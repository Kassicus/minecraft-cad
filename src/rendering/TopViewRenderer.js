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
    
    // Connected systems
    this.appStateManager = null;
    
    this.setupCanvas();
  }

  /**
   * Connect to other systems
   */
  connect(appStateManager) {
    this.appStateManager = appStateManager;
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
   * Calculate visible area for culling
   */
  calculateCullingBounds() {
    // Calculate visible bounds based on camera position and zoom
    // This provides better performance for large builds
    const margin = 50; // Extra margin for smooth scrolling
    
    // Convert screen corners to world coordinates
    const topLeft = this.screenToWorld(-margin, -margin, 0);
    const bottomRight = this.screenToWorld(
      this.viewportBounds.width + margin, 
      this.viewportBounds.height + margin, 
      0
    );
    
    // Convert to grid coordinates
    const topLeftGrid = coordinateSystem.worldToGrid(topLeft.x, topLeft.y);
    const bottomRightGrid = coordinateSystem.worldToGrid(bottomRight.x, bottomRight.y);
    
    return {
      minX: Math.floor(topLeftGrid.x) - 5,
      maxX: Math.ceil(bottomRightGrid.x) + 5,
      minY: Math.floor(topLeftGrid.y) - 5,
      maxY: Math.ceil(bottomRightGrid.y) + 5
    };
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
      
      // Debug block rendering positions
      if (block.x === -17 && block.y === -7) {
        console.log(`Block at grid (${block.x}, ${block.y}): world=(${(block.x + 0.5) * 20}, ${(block.y + 0.5) * 20}), screen=(${screenPos.x.toFixed(2)}, ${screenPos.y.toFixed(2)})`);
      }
      
      // Draw block centered on grid cell center
      this.drawBlock(ctx, screenPos.x - blockSize/2, screenPos.y - blockSize/2, blockSize, block.type, 1.0);
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
        
        // Draw ghost block centered on grid cell center
        this.drawBlock(ctx, screenPos.x - blockSize/2, screenPos.y - blockSize/2, blockSize, block.type, this.settings.ghostBlockAlpha);
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

    // Draw cursor crosshair
    this.drawCursor();
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
   * Draw cursor crosshair at center of grid cell (where blocks will be placed)
   */
  drawCursor() {
    if (!this.context || !this.appStateManager) return;
    
    const mousePos = this.appStateManager.getMousePosition();
    if (!mousePos || (mousePos.x === 0 && mousePos.y === 0)) return;
    
    // Convert mouse screen position to world coordinates
    const worldPos = this.screenToWorld(mousePos.x, mousePos.y);
    
    // SIMPLE APPROACH: Calculate grid cell center directly
    const gridX = Math.floor(worldPos.x / 20); // 20 is blockSize
    const gridY = Math.floor(worldPos.y / 20);
    
    // Calculate center of this grid cell in world coordinates
    const centerWorldX = (gridX + 0.5) * 20;
    const centerWorldY = (gridY + 0.5) * 20;
    
    // Convert to screen coordinates
    const centerScreenX = centerWorldX * this.camera.zoom + this.camera.offsetX;
    const centerScreenY = centerWorldY * this.camera.zoom + this.camera.offsetY;
    
    console.log(`Simple calc: world(${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}) -> grid(${gridX}, ${gridY}) -> center world(${centerWorldX}, ${centerWorldY}) -> screen(${centerScreenX.toFixed(2)}, ${centerScreenY.toFixed(2)})`);
    
    const ctx = this.context;
    ctx.save();
    
    // Draw crosshair cursor at center of grid cell
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    
    const size = 8;
    ctx.beginPath();
    
    // Horizontal line
    ctx.moveTo(centerScreenX - size, centerScreenY);
    ctx.lineTo(centerScreenX + size, centerScreenY);
    
    // Vertical line
    ctx.moveTo(centerScreenX, centerScreenY - size);
    ctx.lineTo(centerScreenX, centerScreenY + size);
    
    ctx.stroke();
    
    // DEBUG: Draw a bright red dot at the exact position where we think the cursor should be
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(centerScreenX, centerScreenY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // DEBUG: Also draw the mouse position in green to see the difference
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
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
      
      const newScreenPoint = this.worldToScreen(worldPoint.x, worldPoint.y);
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
      // No blocks or single block - center view with closer zoom
      this.camera.offsetX = this.viewportBounds.width / 2;
      this.camera.offsetY = this.viewportBounds.height / 2;
      this.camera.zoom = 3.0; // Start with closer zoom for better detail
      return;
    }
    
    // Calculate zoom to fit all blocks
    const buildWidth = (bounds.maxX - bounds.minX + 1) * this.settings.blockSize;
    const buildHeight = (bounds.maxY - bounds.minY + 1) * this.settings.blockSize;
    
    const scaleX = (this.viewportBounds.width * 0.8) / buildWidth;
    const scaleY = (this.viewportBounds.height * 0.8) / buildHeight;
    
    // Start with closer zoom for better detail view
    this.camera.zoom = Math.min(scaleX, scaleY, 3.0);
    
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
    this.context.fillRect(screenPos.x - blockSize/2, screenPos.y - blockSize/2, blockSize, blockSize);
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
