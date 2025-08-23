/**
 * MinecraftCAD - Block Placement Tool
 * Simple tool for placing blocks in the grid
 */

import { BaseTool } from './BaseTool.js';
import { coordinateSystem } from '../utils/CoordinateSystem.js';

export class BlockPlacementTool extends BaseTool {
  constructor() {
    super('block', 'Block Placement Tool');
    
    // Tool-specific settings
    this.settings = {
      continuousPlacement: true, // Place blocks while dragging
      replaceExisting: true,     // Replace existing blocks
      showPreview: true          // Show preview of block to be placed
    };
    
    // Placement state
    this.isPlacing = false;
    this.currentBlockType = 'blockA';
    this.placedBlocks = new Set(); // Track blocks placed in current drag
  }

  /**
   * Set current block type
   */
  setCurrentBlockType(blockType) {
    this.currentBlockType = blockType;
  }

  /**
   * Get current block type
   */
  getCurrentBlockType() {
    return this.currentBlockType;
  }

  /**
   * Handle mouse down - start placing blocks
   */
  onMouseDown(event, worldPos) {
    if (!worldPos || !this.blockDataManager) return false;

    const gridPos = this.worldToGrid(worldPos);
    
    // Validate coordinates
    if (!this.isValidCoordinate(gridPos.x, gridPos.y, gridPos.z)) {
      return false;
    }

    this.isPlacing = true;
    this.placedBlocks.clear();
    
    // Place first block
    this.placeBlock(gridPos.x, gridPos.y, gridPos.z);
    
    return true;
  }

  /**
   * Handle mouse move - continue placing blocks if dragging
   */
  onMouseMove(event, worldPos) {
    if (!worldPos) return false;

    const gridPos = this.worldToGrid(worldPos);

    if (this.isPlacing && this.settings.continuousPlacement) {
      // Continue placing blocks while dragging
      if (this.isValidCoordinate(gridPos.x, gridPos.y, gridPos.z)) {
        this.placeBlock(gridPos.x, gridPos.y, gridPos.z);
      }
    }

    // Show preview (could be implemented later)
    if (this.settings.showPreview) {
      this.showBlockPreview(gridPos);
    }

    return true;
  }

  /**
   * Handle mouse up - stop placing blocks
   */
  onMouseUp(event, worldPos) {
    this.isPlacing = false;
    this.placedBlocks.clear();
    this.clearPreview();
    return true;
  }

  /**
   * Handle key press
   */
  onKeyDown(event) {
    switch (event.key) {
      case '1':
        this.setCurrentBlockType('blockA');
        return true;
      case '2':
        this.setCurrentBlockType('blockB');
        return true;
      case '3':
        this.setCurrentBlockType('blockC');
        return true;
      case '4':
        this.setCurrentBlockType('blockD');
        return true;
      case '5':
        this.setCurrentBlockType('blockE');
        return true;
      default:
        return false;
    }
  }

  /**
   * Place a block at the specified coordinates
   */
  placeBlock(x, y, z) {
    const blockKey = `${x},${y},${z}`;
    
    // Skip if already placed in this drag operation
    if (this.placedBlocks.has(blockKey)) {
      return false;
    }
    
    // Check if block already exists
    const existingBlock = this.blockDataManager.getBlock(x, y, z);
    
    if (existingBlock && !this.settings.replaceExisting) {
      return false;
    }
    
    // Get current layer from app state
    const layer = this.appStateManager?.currentLayer || 'default';
    
    // Place the block
    const success = this.blockDataManager.setBlock(x, y, z, this.currentBlockType, layer);
    
    if (success) {
      this.placedBlocks.add(blockKey);
      
      // Trigger re-render
      this.notifyChange();
      
      console.log(`Placed ${this.currentBlockType} at (${x}, ${y}, ${z})`);
    }
    
    return success;
  }

  /**
   * Convert world position to grid position
   */
  worldToGrid(worldPos) {
    const gridPos = coordinateSystem.worldToGrid(worldPos.x, worldPos.y);
    return {
      x: gridPos.x,
      y: gridPos.y,
      z: this.appStateManager ? this.appStateManager.currentLevel : 0
    };
  }

  /**
   * Check if coordinates are valid
   */
  isValidCoordinate(x, y, z) {
    return x >= 0 && x < 100 && y >= 0 && y < 100 && z >= 0 && z < 50;
  }

  /**
   * Show preview of block to be placed (placeholder for now)
   */
  showBlockPreview(gridPos) {
    // This would show a preview of the block to be placed
    // For now, just store the preview position
    this.previewPosition = gridPos;
  }

  /**
   * Clear preview
   */
  clearPreview() {
    this.previewPosition = null;
  }

  /**
   * Get tool status text
   */
  getStatusText() {
    return `Block Tool - ${this.currentBlockType} - Click to place blocks`;
  }

  /**
   * Get tool cursor
   */
  getCursor() {
    return 'crosshair';
  }

  /**
   * Tool activation
   */
  onActivate() {
    console.log('Block placement tool activated');
  }

  /**
   * Tool deactivation
   */
  onDeactivate() {
    this.isPlacing = false;
    this.placedBlocks.clear();
    this.clearPreview();
    console.log('Block placement tool deactivated');
  }
}
