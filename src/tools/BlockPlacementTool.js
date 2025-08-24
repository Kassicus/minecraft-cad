/**
 * MinecraftCAD - Block Placement Tool
 * Simple tool for placing blocks in the grid
 */

import { BaseTool } from './BaseTool.js';

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
  onMouseDown(worldPos, event) {
    if (!worldPos || !this.blockDataManager) return false;

    // Use the corrected coordinate system: snap to grid cell center
    const snappedPos = this.snapToGrid(worldPos);
    
    // Debug coordinate transformation
    console.log(`Block placement debug: worldPos=(${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}), snappedPos=(${snappedPos.x.toFixed(2)}, ${snappedPos.y.toFixed(2)})`);
    
    // Convert snapped world position to grid coordinates for storage
    const gridPos = {
      x: Math.floor(snappedPos.x / 20), // 20 is blockSize
      y: Math.floor(snappedPos.y / 20),
      z: this.appStateManager ? this.appStateManager.currentLevel : 0
    };
    
    console.log(`Snapped to grid cell: (${gridPos.x}, ${gridPos.y})`);
    
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
  onMouseMove(worldPos, event) {
    if (!worldPos) return false;

    // Use the corrected coordinate system: snap to grid cell center
    const snappedPos = this.snapToGrid(worldPos);
    
    // Convert snapped world position to grid coordinates for storage
    const gridPos = {
      x: Math.floor(snappedPos.x / 20), // 20 is blockSize
      y: Math.floor(snappedPos.y / 20),
      z: this.appStateManager ? this.appStateManager.currentLevel : 0
    };

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
  onMouseUp(worldPos, event) {
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
    // Use the BaseTool's worldToGrid method which handles coordinate transformation
    return super.worldToGrid(worldPos);
  }

  /**
   * Check if coordinates are valid
   */
  isValidCoordinate(x, y, z) {
    // Remove x,y restrictions, keep z limit for height
    return z >= 0 && z < 50;
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

