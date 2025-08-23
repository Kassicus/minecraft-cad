/**
 * MinecraftCAD - Block Placement Tool
 * Tool for placing blocks in the grid
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
    this.placedBlocks = new Set(); // Track blocks placed in current drag
  }

  /**
   * Handle mouse down - start placing blocks
   */
  onMouseDown(event, worldPos) {
    const gridPos = this.worldToGrid(worldPos);
    
    // Validate coordinates
    if (!this.isValidCoordinate(gridPos.x, gridPos.y, gridPos.z)) {
      return false;
    }
    
    this.isPlacing = true;
    this.placedBlocks.clear();
    
    // Place initial block
    this.placeBlock(gridPos.x, gridPos.y, gridPos.z);
    
    return true;
  }

  /**
   * Handle mouse move - continue placing or show preview
   */
  onMouseMove(event, worldPos) {
    const gridPos = this.worldToGrid(worldPos);
    
    // Validate coordinates
    if (!this.isValidCoordinate(gridPos.x, gridPos.y, gridPos.z)) {
      this.clearPreview();
      return false;
    }
    
    if (this.isMouseDown && this.isPlacing && this.settings.continuousPlacement) {
      // Continue placing blocks while dragging
      this.placeBlock(gridPos.x, gridPos.y, gridPos.z);
    } else if (this.settings.showPreview) {
      // Show preview of block to be placed
      this.showBlockPreview(gridPos);
    }
    
    return true;
  }

  /**
   * Handle mouse up - finish placing
   */
  onMouseUp(event, worldPos) {
    this.isPlacing = false;
    this.placedBlocks.clear();
    this.clearPreview();
    
    return true;
  }

  /**
   * Handle key down events
   */
  onKeyDown(key, event) {
    switch (key.toLowerCase()) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        // Quick block type selection
        const blockTypes = ['blockA', 'blockB', 'blockC', 'blockD', 'blockE'];
        const index = parseInt(key) - 1;
        if (index >= 0 && index < blockTypes.length) {
          this.appStateManager.setCurrentBlockType(blockTypes[index]);
        }
        return true;
        
      case 'r':
        // Toggle replace existing blocks
        this.settings.replaceExisting = !this.settings.replaceExisting;
        this.showStatusMessage(`Replace existing: ${this.settings.replaceExisting ? 'ON' : 'OFF'}`);
        return true;
        
      case 'c':
        // Toggle continuous placement
        this.settings.continuousPlacement = !this.settings.continuousPlacement;
        this.showStatusMessage(`Continuous placement: ${this.settings.continuousPlacement ? 'ON' : 'OFF'}`);
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
    
    // Get current block type from app state
    const blockType = this.getCurrentBlockType();
    const layer = this.appStateManager.currentLayer;
    
    // Place the block
    const success = this.blockDataManager.setBlock(x, y, z, blockType, layer);
    
    if (success) {
      this.placedBlocks.add(blockKey);
      
      // Update UI
      this.updateBlockCount();
      
      // Show feedback
      if (!this.isMouseDown) {
        this.showStatusMessage(`Placed ${blockType} at (${x}, ${y}, ${z})`);
      }
    }
    
    return success;
  }

  /**
   * Show preview of block to be placed
   */
  showBlockPreview(gridPos) {
    const existingBlock = this.blockDataManager.getBlock(gridPos.x, gridPos.y, gridPos.z);
    
    this.setPreview({
      type: 'block',
      position: gridPos,
      blockType: this.getCurrentBlockType(),
      isReplacement: !!existingBlock,
      canPlace: this.settings.replaceExisting || !existingBlock
    });
  }

  /**
   * Tool activation
   */
  onActivate() {
    // Update cursor
    this.setCursor('crosshair');
    
    // Show help
    this.showHelpText();
  }

  /**
   * Tool deactivation
   */
  onDeactivate() {
    this.isPlacing = false;
    this.placedBlocks.clear();
  }

  /**
   * Cancel current operation
   */
  cancel() {
    super.cancel();
    this.isPlacing = false;
    this.placedBlocks.clear();
  }

  /**
   * Get tool cursor
   */
  getCursor() {
    return 'crosshair';
  }

  /**
   * Get tool status text
   */
  getStatusText() {
    const blockType = this.getCurrentBlockType();
    const level = this.getCurrentLevel();
    const levelName = level === 0 ? 'Ground' : `+${level}`;
    
    return `Place ${blockType} - Level: ${levelName}`;
  }

  /**
   * Check view compatibility
   */
  isCompatibleWithView(viewType) {
    // Block placement works in top view and elevation views
    return ['top', 'north', 'south', 'east', 'west'].includes(viewType);
  }

  /**
   * Get help text
   */
  getHelpText() {
    return [
      'Block Placement Tool',
      'Click: Place single block',
      'Drag: Place multiple blocks (if continuous mode)',
      '1-5: Select block type',
      'R: Toggle replace existing blocks',
      'C: Toggle continuous placement',
      'ESC: Cancel'
    ];
  }

  /**
   * Render tool overlay
   */
  renderOverlay(renderer) {
    const preview = this.getPreview();
    if (!preview || preview.type !== 'block') return;
    
    const { position, blockType, canPlace, isReplacement } = preview;
    
    // Render preview block
    if (renderer.highlightGridCell) {
      const color = canPlace 
        ? (isReplacement ? 'rgba(255, 165, 0, 0.5)' : 'rgba(100, 181, 246, 0.5)')
        : 'rgba(255, 85, 85, 0.3)';
      
      renderer.highlightGridCell(position.x, position.y, color);
    }
  }

  /**
   * Update block count in UI
   */
  updateBlockCount() {
    if (this.appStateManager) {
      // Trigger UI update
      this.appStateManager.emit('blockCountChanged');
    }
  }

  /**
   * Show status message
   */
  showStatusMessage(message) {
    // This would show a temporary status message
    console.log(message); // For now, just log it
  }

  /**
   * Show help text
   */
  showHelpText() {
    const helpText = this.getHelpText();
    console.log(helpText.join('\n')); // For now, just log it
  }

  /**
   * Set cursor (helper method)
   */
  setCursor(cursor) {
    const canvas = this.appStateManager?.viewManager?.getCurrentCanvas();
    if (canvas) {
      canvas.style.cursor = cursor;
    }
  }

  /**
   * Update tool settings
   */
  updateSettings(newSettings) {
    super.updateSettings(newSettings);
    
    // Handle setting changes
    if (newSettings.continuousPlacement !== undefined) {
      this.showStatusMessage(`Continuous placement: ${newSettings.continuousPlacement ? 'ON' : 'OFF'}`);
    }
    
    if (newSettings.replaceExisting !== undefined) {
      this.showStatusMessage(`Replace existing: ${newSettings.replaceExisting ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Get placement statistics
   */
  getPlacementStats() {
    const stats = this.blockDataManager.getStats();
    
    return {
      totalBlocks: stats.totalBlocks,
      blocksByType: stats.blocksByType,
      currentBlockType: this.getCurrentBlockType(),
      currentLevel: this.getCurrentLevel(),
      placedInSession: this.placedBlocks.size
    };
  }

  /**
   * Batch place blocks (for other tools to use)
   */
  batchPlaceBlocks(positions, blockType = null) {
    const type = blockType || this.getCurrentBlockType();
    const layer = this.appStateManager.currentLayer;
    let placedCount = 0;
    
    for (const pos of positions) {
      if (this.isValidCoordinate(pos.x, pos.y, pos.z)) {
        const existingBlock = this.blockDataManager.getBlock(pos.x, pos.y, pos.z);
        
        if (this.settings.replaceExisting || !existingBlock) {
          if (this.blockDataManager.setBlock(pos.x, pos.y, pos.z, type, layer)) {
            placedCount++;
          }
        }
      }
    }
    
    if (placedCount > 0) {
      this.updateBlockCount();
      this.showStatusMessage(`Placed ${placedCount} blocks`);
    }
    
    return placedCount;
  }
}
