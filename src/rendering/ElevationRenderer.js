/**
 * MinecraftCAD - Elevation Renderer
 * 2D Canvas renderer for elevation views (North, South, East, West)
 */

import { BaseRenderer } from './BaseRenderer.js';
import { HatchPatternManager } from './HatchPatternManager.js';
import { MathUtils } from '../utils/MathUtils.js';

export class ElevationRenderer extends BaseRenderer {
  constructor(canvas, direction = 'north') {
    super(canvas);
    
    this.context = canvas.getContext('2d');
    this.hatchPatterns = new HatchPatternManager();
    
    // Elevation direction (north, south, east, west)
    this.direction = direction;
    
    // Elevation view specific settings
    this.settings = {
      ...this.settings,
      blockSize: 20, // Size of each block in pixels at 1.0 zoom
      levelHeight: 20, // Height of each level in pixels
      showBlockBorders: true,
      showDepthShading: true, // Show depth-based shading
      showGhostBlocks: false, // Ghost blocks not typically shown in elevation
      maxDepth: 100, // Maximum depth to render
      depthFadeDistance: 50, // Distance over which blocks fade
      groundLineColor: '#64b5f6',
      groundLineWidth: 2
    };
    
    // View transformation matrices based on direction
    this.transforms = {
      north: { 
        xAxis: { x: 1, y: 0 },  // X maps to screen X
        yAxis: { x: 0, y: -1 }, // Z maps to screen Y (inverted)
        depthAxis: { x: 0, y: 1 }, // Y is depth (into screen)
        label: 'North Elevation'
      },
      south: { 
        xAxis: { x: -1, y: 0 }, // X maps to screen X (flipped)
        yAxis: { x: 0, y: -1 },  // Z maps to screen Y (inverted)
        depthAxis: { x: 0, y: -1 }, // Y is depth (negative)
        label: 'South Elevation'
      },
      east: { 
        xAxis: { x: 0, y: 1 },  // Y maps to screen X
        yAxis: { x: 0, y: -1 }, // Z maps to screen Y (inverted)
        depthAxis: { x: -1, y: 0 }, // X is depth (negative)
        label: 'East Elevation'
      },
      west: { 
        xAxis: { x: 0, y: -1 }, // Y maps to screen X (flipped)
        yAxis: { x: 0, y: -1 },  // Z maps to screen Y (inverted)
        depthAxis: { x: 1, y: 0 }, // X is depth
        label: 'West Elevation'
      }
    };
    
    this.transform = this.transforms[this.direction];
    
    // Depth sorting cache
    this.depthSortedBlocks = [];
    this.lastSortFrame = -1;
    
    this.setupCanvas();
  }

  /**
   * Main render method
   */
  render(blockData, camera, level = 0) {
    if (!this.context || !blockData) {
      console.warn(`ElevationRenderer: Cannot render - context: ${!!this.context}, blockData: ${!!blockData}`);
      return;
    }
    
    console.log(`ElevationRenderer: Starting render with ${blockData.getBlockCount ? blockData.getBlockCount() : 'unknown'} total blocks`);
    
    this.startPerformanceMeasurement();
    
    // Update camera
    this.updateCamera(camera);
    
    // Clear canvas
    this.clear();
    
    // Calculate visible area for culling
    const cullingBounds = this.calculateCullingBounds();
    
    // Draw grid
    if (this.settings.showGrid) {
      this.drawGrid();
    }
    
    // Get and sort blocks by depth
    const visibleBlocks = this.getVisibleBlocks(blockData, cullingBounds);
    const sortedBlocks = this.sortBlocksByDepth(visibleBlocks);
    
    console.log(`ElevationRenderer: Drawing ${sortedBlocks.length} sorted blocks`);
    
    // Draw blocks from back to front
    this.drawBlocks(sortedBlocks);
    
    // Draw ground line
    this.drawGroundLine();
    
    // Draw overlays
    this.drawOverlays();
    
    this.endPerformanceMeasurement();
  }

  /**
   * Draw the grid system for elevation view
   */
  drawGrid() {
    if (!this.context) return;
    
    const ctx = this.context;
    const bounds = this.calculateCullingBounds();
    
    ctx.save();
    
    // Horizontal grid lines (levels)
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let level = 0; level <= 49; level++) {
      const screenY = this.levelToScreenY(level);
      if (screenY >= -50 && screenY <= this.viewportBounds.height + 50) {
        ctx.moveTo(0, screenY);
        ctx.lineTo(this.viewportBounds.width, screenY);
      }
    }
    
    ctx.stroke();
    
    // Vertical grid lines (based on direction)
    ctx.beginPath();
    
    const gridRange = this.getGridRange(bounds);
    for (let i = gridRange.min; i <= gridRange.max; i++) {
      const screenX = this.gridToScreenX(i);
      if (screenX >= -50 && screenX <= this.viewportBounds.width + 50) {
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, this.viewportBounds.height);
      }
    }
    
    ctx.stroke();
    
    // Major grid lines
    if (this.settings.showMajorGrid) {
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Major horizontal lines (every 10 levels)
      for (let level = 0; level <= 49; level += 10) {
        const screenY = this.levelToScreenY(level);
        if (screenY >= -50 && screenY <= this.viewportBounds.height + 50) {
          ctx.moveTo(0, screenY);
          ctx.lineTo(this.viewportBounds.width, screenY);
        }
      }
      
      // Major vertical lines (every 10 units)
      for (let i = Math.floor(gridRange.min / 10) * 10; i <= gridRange.max; i += 10) {
        const screenX = this.gridToScreenX(i);
        if (screenX >= -50 && screenX <= this.viewportBounds.width + 50) {
          ctx.moveTo(screenX, 0);
          ctx.lineTo(screenX, this.viewportBounds.height);
        }
      }
      
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * Get visible blocks for this elevation view
   */
  getVisibleBlocks(blockData, cullingBounds) {
    const blocks = [];
    
    if (!blockData || !blockData.getBlocksAtLevel) {
      console.warn('ElevationRenderer: blockData missing or invalid');
      return blocks;
    }
    
    // Get all blocks and filter for visibility
    for (let level = 0; level < 50; level++) {
      const levelBlocks = blockData.getBlocksAtLevel(level);
      
      if (levelBlocks && levelBlocks.length > 0) {
        for (const block of levelBlocks) {
          if (this.isBlockVisible(block, cullingBounds)) {
            blocks.push(block);
          }
        }
      }
    }
    
    console.log(`ElevationRenderer: Found ${blocks.length} visible blocks out of ${blockData.getBlockCount()} total`);
    return blocks;
  }

  /**
   * Check if a block is visible in this elevation view
   */
  isBlockVisible(block, cullingBounds) {
    // Transform block coordinates to screen space for culling
    const screenPos = this.blockToScreen(block);
    
    // Check if block is in viewport
    if (screenPos.x < -this.settings.blockSize || 
        screenPos.x > this.viewportBounds.width + this.settings.blockSize ||
        screenPos.y < -this.settings.levelHeight || 
        screenPos.y > this.viewportBounds.height + this.settings.levelHeight) {
      return false;
    }
    
    // For elevation views, we only show external faces
    // This is a simplified check - in a full implementation, we'd check if the block
    // has any exposed faces in this direction
    return this.hasExposedFace(block);
  }

  /**
   * Check if block has an exposed face in this direction (simplified)
   */
  hasExposedFace(block) {
    // For now, assume all blocks have exposed faces
    // In a full implementation, this would check adjacent blocks
    return true;
  }

  /**
   * Sort blocks by depth for proper rendering order
   */
  sortBlocksByDepth(blocks) {
    return blocks.sort((a, b) => {
      const depthA = this.getBlockDepth(a);
      const depthB = this.getBlockDepth(b);
      return depthB - depthA; // Back to front
    });
  }

  /**
   * Get the depth of a block for this elevation view
   */
  getBlockDepth(block) {
    switch (this.direction) {
      case 'north': return block.y; // Y is depth
      case 'south': return 100 - block.y; // Flipped Y
      case 'east': return 100 - block.x; // Flipped X
      case 'west': return block.x; // X is depth
      default: return 0;
    }
  }

  /**
   * Draw all blocks
   */
  drawBlocks(blocks) {
    if (!this.context) return;
    
    const ctx = this.context;
    
    for (const block of blocks) {
      this.drawBlock(ctx, block);
    }
  }

  /**
   * Draw a single block
   */
  drawBlock(ctx, block) {
    const screenPos = this.blockToScreen(block);
    const blockSize = this.settings.blockSize * this.camera.zoom;
    const levelHeight = this.settings.levelHeight * this.camera.zoom;
    
    // Skip if too small to see
    if (blockSize < 1 || levelHeight < 1) return;
    
    // Calculate depth-based alpha for depth shading
    let alpha = 1.0;
    if (this.settings.showDepthShading) {
      // Block depth calculation removed
      const depth = 0;
      const maxDepth = this.settings.maxDepth;
      const fadeDistance = this.settings.depthFadeDistance;
      
      if (depth > maxDepth - fadeDistance) {
        alpha = Math.max(0.1, 1.0 - (depth - (maxDepth - fadeDistance)) / fadeDistance);
      }
    }
    
    // Draw block with pattern
    this.hatchPatterns.fillRectWithPattern(
      ctx, 
      screenPos.x, 
      screenPos.y, 
      blockSize, 
      levelHeight, 
      block.type,
      this.hatchPatterns.getScaleForZoom(this.camera.zoom),
      alpha
    );
    
    // Draw border if enabled
    if (this.settings.showBlockBorders && blockSize > 2) {
      this.hatchPatterns.strokeRectWithPattern(
        ctx, 
        screenPos.x, 
        screenPos.y, 
        blockSize, 
        levelHeight, 
        block.type, 
        1, 
        alpha * 0.8
      );
    }
  }

  /**
   * Convert block coordinates to screen coordinates
   */
  blockToScreen(block) {
    // Transform 3D block coordinates to 2D screen coordinates based on direction
    let screenX, screenY;
    
    switch (this.direction) {
      case 'north':
        screenX = block.x * this.settings.blockSize;
        screenY = (49 - block.z) * this.settings.levelHeight; // Flip Z for screen Y
        break;
      case 'south':
        screenX = (99 - block.x) * this.settings.blockSize; // Flip X
        screenY = (49 - block.z) * this.settings.levelHeight;
        break;
      case 'east':
        screenX = block.y * this.settings.blockSize;
        screenY = (49 - block.z) * this.settings.levelHeight;
        break;
      case 'west':
        screenX = (99 - block.y) * this.settings.blockSize; // Flip Y
        screenY = (49 - block.z) * this.settings.levelHeight;
        break;
      default:
        screenX = block.x * this.settings.blockSize;
        screenY = (49 - block.z) * this.settings.levelHeight;
    }
    
    // Apply camera transformation
    return this.worldToScreen(screenX, screenY, 0);
  }

  /**
   * Draw ground line
   */
  drawGroundLine() {
    if (!this.context) return;
    
    const ctx = this.context;
    const groundY = this.levelToScreenY(0);
    
    ctx.save();
    ctx.strokeStyle = this.settings.groundLineColor;
    ctx.lineWidth = this.settings.groundLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.viewportBounds.width, groundY);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw overlays (labels, etc.)
   */
  drawOverlays() {
    if (!this.context) return;
    
    // Draw view label
    this.drawTextWithBackground(
      this.transform.label,
      20,
      30,
      {
        align: 'left',
        font: '14px monospace',
        backgroundColor: 'rgba(30, 58, 95, 0.9)',
        borderColor: '#64b5f6',
        padding: 8
      }
    );
    
    // Draw level indicators
    this.drawLevelIndicators();
  }

  /**
   * Draw level indicators on the left side
   */
  drawLevelIndicators() {
    const ctx = this.context;
    const levels = [0, 10, 20, 30, 40, 49];
    
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64b5f6';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (const level of levels) {
      const screenY = this.levelToScreenY(level);
      if (screenY >= 0 && screenY <= this.viewportBounds.height) {
        const label = level === 0 ? 'Ground' : `+${level}`;
        ctx.fillText(label, 15, screenY);
      }
    }
    
    ctx.restore();
  }

  /**
   * Convert level to screen Y coordinate
   */
  levelToScreenY(level) {
    // Level 0 (ground) should be at the bottom, level 49 at the top
    const worldY = level * this.settings.levelHeight;
    return this.worldToScreen(0, worldY, 0).y;
  }

  /**
   * Convert grid coordinate to screen X
   */
  gridToScreenX(gridCoord) {
    const worldX = gridCoord * this.settings.blockSize;
    return this.worldToScreen(worldX, 0, 0).x;
  }

  /**
   * Get grid range for current view
   */
  getGridRange(bounds) {
    return {
      min: Math.floor(bounds.minX),
      max: Math.ceil(bounds.maxX)
    };
  }

  /**
   * Handle resize events
   */
  handleResize(width, height) {
    this.viewportBounds.width = width;
    this.viewportBounds.height = height;
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY, worldZ) {
    const screenX = worldX * this.camera.zoom + this.camera.offsetX;
    const screenY = worldY * this.camera.zoom + this.camera.offsetY;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    const worldX = (screenX - this.camera.offsetX) / this.camera.zoom;
    const worldY = (screenY - this.camera.offsetY) / this.camera.zoom;
    
    return { x: worldX, y: worldY };
  }

  /**
   * Convert screen coordinates to grid coordinates for this elevation
   */
  screenToGrid(screenX, screenY) {
    const world = this.screenToWorld(screenX, screenY);
    
    let gridX, gridY, gridZ;
    
    switch (this.direction) {
      case 'north':
        gridX = Math.floor(world.x / this.settings.blockSize);
        gridY = 50; // Default depth
        gridZ = Math.floor(world.y / this.settings.levelHeight);
        break;
      case 'south':
        gridX = 99 - Math.floor(world.x / this.settings.blockSize);
        gridY = 50;
        gridZ = Math.floor(world.y / this.settings.levelHeight);
        break;
      case 'east':
        gridX = 50;
        gridY = Math.floor(world.x / this.settings.blockSize);
        gridZ = Math.floor(world.y / this.settings.levelHeight);
        break;
      case 'west':
        gridX = 50;
        gridY = 99 - Math.floor(world.x / this.settings.blockSize);
        gridZ = Math.floor(world.y / this.settings.levelHeight);
        break;
      default:
        gridX = Math.floor(world.x / this.settings.blockSize);
        gridY = 50;
        gridZ = Math.floor(world.y / this.settings.levelHeight);
    }
    
    return { x: gridX, y: gridY, z: gridZ };
  }

  /**
   * Get the block at screen coordinates
   */
  getBlockAtScreen(screenX, screenY) {
    // Block detection removed
    return null;
    return this.screenToGrid(screenX, screenY);
  }

  /**
   * Highlight a grid cell (not typically used in elevation view)
   */
  highlightGridCell(gridX, gridY, gridZ, color = 'rgba(100, 181, 246, 0.5)') {
    // Implementation would depend on how to represent 3D coordinates in 2D elevation
  }

  /**
   * Reset view to show entire build from this elevation angle
   */
  resetView(blockData) {
    if (!blockData) return;
    
    const bounds = blockData.getBounds();
    
    // Check if we have any blocks
    if (bounds.minX === bounds.maxX && bounds.minY === bounds.maxY && bounds.minZ === bounds.maxZ) {
      // No blocks or single block - center view with closer zoom
      this.camera.offsetX = this.viewportBounds.width / 2;
      this.camera.offsetY = this.viewportBounds.height / 2;
      this.camera.zoom = 2.0; // Start with closer zoom for better detail
      return;
    }
    
    // Calculate dimensions based on elevation direction
    let buildWidth, buildHeight;
    
    switch (this.direction) {
      case 'north':
      case 'south':
        // X axis (width) and Z axis (height) are visible
        buildWidth = (bounds.maxX - bounds.minX + 1) * this.settings.blockSize;
        buildHeight = (bounds.maxZ - bounds.minZ + 1) * this.settings.levelHeight;
        break;
      case 'east':
      case 'west':
        // Y axis (width) and Z axis (height) are visible
        buildWidth = (bounds.maxY - bounds.minY + 1) * this.settings.blockSize;
        buildHeight = (bounds.maxZ - bounds.minZ + 1) * this.settings.levelHeight;
        break;
      default:
        buildWidth = (bounds.maxX - bounds.minX + 1) * this.settings.blockSize;
        buildHeight = (bounds.maxZ - bounds.minZ + 1) * this.settings.levelHeight;
    }
    
    // Calculate zoom to fit all blocks with some margin
    const scaleX = (this.viewportBounds.width * 0.8) / buildWidth;
    const scaleY = (this.viewportBounds.height * 0.8) / buildHeight;
    
    // Start with closer zoom for better detail view
    this.camera.zoom = Math.min(scaleX, scaleY, 2.0);
    
    // Calculate center position based on elevation direction
    let centerX, centerY;
    
    switch (this.direction) {
      case 'north':
        centerX = (bounds.minX + bounds.maxX) * this.settings.blockSize / 2;
        centerY = (bounds.minZ + bounds.maxZ) * this.settings.levelHeight / 2;
        break;
      case 'south':
        centerX = (bounds.minX + bounds.maxX) * this.settings.blockSize / 2;
        centerY = (bounds.minZ + bounds.maxZ) * this.settings.levelHeight / 2;
        break;
      case 'east':
        centerX = (bounds.minY + bounds.maxY) * this.settings.blockSize / 2;
        centerY = (bounds.minZ + bounds.maxZ) * this.settings.levelHeight / 2;
        break;
      case 'west':
        centerX = (bounds.minY + bounds.maxY) * this.settings.blockSize / 2;
        centerY = (bounds.minZ + bounds.maxZ) * this.settings.levelHeight / 2;
        break;
      default:
        centerX = (bounds.minX + bounds.maxX) * this.settings.blockSize / 2;
        centerY = (bounds.minZ + bounds.maxZ) * this.settings.levelHeight / 2;
    }
    
    // Center the view horizontally and position ground level at bottom
    this.camera.offsetX = this.viewportBounds.width / 2 - centerX * this.camera.zoom;
    // Position so that level 0 (ground) is at the bottom, level 49 at the top
    this.camera.offsetY = this.viewportBounds.height - (bounds.maxZ * this.settings.levelHeight * this.camera.zoom);
    
    console.log(`${this.direction} elevation view reset: build(${buildWidth.toFixed(1)}x${buildHeight.toFixed(1)}), zoom(${this.camera.zoom.toFixed(2)}), center(${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
  }

  /**
   * Pan the elevation view
   */
  pan(deltaX, deltaY) {
    this.camera.offsetX += deltaX;
    this.camera.offsetY += deltaY;
    
    // Update camera state in app state manager
    if (this.appStateManager) {
      this.appStateManager.updateCameraState(this.direction, this.camera);
    }
    
    // Force a re-render to show the updated view
    this.forceUpdate();
  }

  /**
   * Zoom the elevation view
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
      
      // Update camera state in app state manager
      if (this.appStateManager) {
        this.appStateManager.updateCameraState(this.direction, this.camera);
      }
      
      // Force a re-render to show the updated view
      this.forceUpdate();
    }
  }

  /**
   * Connect to app state manager
   */
  connect(appStateManager) {
    this.appStateManager = appStateManager;
    console.log(`${this.direction} elevation renderer connected to app state manager`);
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    super.updateSettings(newSettings);
    
    if (newSettings.showDepthShading !== undefined) {
      this.settings.showDepthShading = newSettings.showDepthShading;
    }
  }

  /**
   * Set elevation direction
   */
  setDirection(direction) {
    if (this.transforms[direction]) {
      this.direction = direction;
      this.transform = this.transforms[direction];
    }
  }

  /**
   * Force a re-render of the current view
   */
  forceUpdate() {
    if (this.appStateManager && this.appStateManager.blockDataManager) {
      const blockData = this.appStateManager.blockDataManager;
      const cameraState = this.appStateManager.getCameraState(this.direction);
      this.render(blockData, cameraState, this.appStateManager.currentLevel);
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
  }
}
