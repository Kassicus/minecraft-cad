/**
 * MinecraftCAD - Selection Tool
 * Select, move, copy, and delete groups of blocks
 */

import { BaseTool } from './BaseTool.js';

export class SelectionTool extends BaseTool {
  constructor() {
    super('selection', 'Selection Tool');
    
    // Selection state
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedBlocks = new Map(); // Map of positions to block types
    this.isSelecting = false;
    this.previewBlocks = [];
    
    // Operation modes
    this.mode = 'select'; // 'select', 'move', 'copy'
    this.moveOffset = null;
    this.isMoving = false;
  }

  /**
   * Handle mouse down - start selection or confirm move/copy
   */
  onMouseDown(event, worldPos) {
    if (!worldPos) return;

    if (this.mode === 'select') {
      this.startSelection(worldPos);
    } else if (this.mode === 'move' || this.mode === 'copy') {
      this.confirmOperation(worldPos);
    }
  }

  /**
   * Handle mouse move - update selection or move preview
   */
  onMouseMove(event, worldPos) {
    if (!worldPos) return;

    if (this.isSelecting) {
      this.updateSelection(worldPos);
    } else if (this.isMoving) {
      this.updateMovePreview(worldPos);
    }
  }

  /**
   * Handle right click - cancel operation or clear selection
   */
  onRightClick(event, worldPos) {
    if (this.isSelecting) {
      this.cancelSelection();
    } else if (this.isMoving) {
      this.cancelMove();
    } else if (this.selectedBlocks.size > 0) {
      this.clearSelection();
    }
  }

  /**
   * Handle key press - various operations
   */
  onKeyDown(event) {
    if (event.key === 'Escape') {
      this.cancelCurrentOperation();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteSelected();
    } else if (event.key === 'm' || event.key === 'M') {
      this.startMove();
    } else if (event.key === 'c' || event.key === 'C') {
      this.startCopy();
    } else if (event.key === 'a' || event.key === 'A') {
      if (event.ctrlKey || event.metaKey) {
        this.selectAll();
      }
    }
  }

  /**
   * Start selection process
   */
  startSelection(worldPos) {
    this.selectionStart = { ...worldPos };
    this.isSelecting = true;
    this.setCursor('crosshair');
  }

  /**
   * Update selection area
   */
  updateSelection(worldPos) {
    this.selectionEnd = { ...worldPos };
    this.updateSelectionPreview();
  }

  /**
   * Complete selection
   */
  completeSelection() {
    if (!this.selectionStart || !this.selectionEnd) return;

    this.selectedBlocks.clear();
    
    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);
    const minZ = Math.min(this.selectionStart.z, this.selectionEnd.z);
    const maxZ = Math.max(this.selectionStart.z, this.selectionEnd.z);

    // Collect all blocks in selection area
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          // Block data access removed - tool disabled
          const blockType = null;
          if (blockType) {
            const key = `${x},${y},${z}`;
            this.selectedBlocks.set(key, { x, y, z, type: blockType });
          }
        }
      }
    }

    this.finishSelection();
    console.log(`Selected ${this.selectedBlocks.size} blocks`);
  }

  /**
   * Start move operation
   */
  startMove() {
    if (this.selectedBlocks.size === 0) return;
    
    this.mode = 'move';
    this.isMoving = true;
    this.setCursor('move');
  }

  /**
   * Start copy operation
   */
  startCopy() {
    if (this.selectedBlocks.size === 0) return;
    
    this.mode = 'copy';
    this.isMoving = true;
    this.setCursor('copy');
  }

  /**
   * Update move/copy preview
   */
  updateMovePreview(worldPos) {
    if (!this.moveOffset) {
      // Calculate offset from first selected block
      const firstBlock = this.selectedBlocks.values().next().value;
      this.moveOffset = {
        x: worldPos.x - firstBlock.x,
        y: worldPos.y - firstBlock.y,
        z: worldPos.z - firstBlock.z
      };
    }

    this.clearPreview();
    this.previewBlocks = [];

    // Show preview of moved/copied blocks
    this.selectedBlocks.forEach(block => {
      const newPos = {
        x: block.x + this.moveOffset.x,
        y: block.y + this.moveOffset.y,
        z: block.z + this.moveOffset.z
      };
      
      if (this.isValidPosition(newPos)) {
        this.previewBlocks.push({ ...newPos, type: block.type });
      }
    });

    // Add preview blocks to renderer
    if (this.renderer && this.renderer.addPreviewBlocks) {
      this.renderer.addPreviewBlocks(this.previewBlocks, this.currentBlockType);
    }
  }

  /**
   * Confirm move or copy operation
   */
  confirmOperation(worldPos) {
    if (!this.isMoving || this.previewBlocks.length === 0) return;

    // Block operations removed - tool disabled until new system is implemented
    console.log('Selection tool disabled - block placement system removed');

    // Update selection to new positions
    this.selectedBlocks.clear();
    this.previewBlocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      this.selectedBlocks.set(key, block);
    });

    this.finishMove();
    this.notifyChange();
    
    const operation = this.mode === 'move' ? 'Moved' : 'Copied';
    console.log(`${operation} ${this.previewBlocks.length} blocks`);
  }

  /**
   * Delete selected blocks
   */
  deleteSelected() {
    if (this.selectedBlocks.size === 0) return;

    // Block deletion removed - tool disabled
    console.log('Selection tool disabled - block placement system removed');

    const count = this.selectedBlocks.size;
    this.clearSelection();
    this.notifyChange();
    
    console.log(`Deleted ${count} blocks`);
  }

  /**
   * Select all blocks in the current level
   */
  selectAll() {
    this.selectedBlocks.clear();
    
    const currentLevel = this.appStateManager?.getCurrentLevel() || 0;
    
    // Get all blocks at current level
    for (let x = 0; x < 100; x++) {
      for (let y = 0; y < 100; y++) {
        // Block data access removed - tool disabled
        const blockType = null;
        if (blockType) {
          const key = `${x},${y},${currentLevel}`;
          this.selectedBlocks.set(key, { x, y, z: currentLevel, type: blockType });
        }
      }
    }
    
    console.log(`Selected all ${this.selectedBlocks.size} blocks on level ${currentLevel}`);
  }

  /**
   * Update selection preview
   */
  updateSelectionPreview() {
    // This would show the selection rectangle outline
    // Implementation depends on renderer capabilities
    this.clearPreview();
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
   * Clear current selection
   */
  clearSelection() {
    this.selectedBlocks.clear();
    this.clearPreview();
  }

  /**
   * Cancel current selection
   */
  cancelSelection() {
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.clearPreview();
    this.setCursor('default');
  }

  /**
   * Cancel move/copy operation
   */
  cancelMove() {
    this.isMoving = false;
    this.mode = 'select';
    this.moveOffset = null;
    this.clearPreview();
    this.setCursor('default');
  }

  /**
   * Finish selection process
   */
  finishSelection() {
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.clearPreview();
    this.setCursor('default');
  }

  /**
   * Finish move/copy operation
   */
  finishMove() {
    this.isMoving = false;
    this.mode = 'select';
    this.moveOffset = null;
    this.clearPreview();
    this.setCursor('default');
  }

  /**
   * Cancel any current operation
   */
  cancelCurrentOperation() {
    if (this.isSelecting) {
      this.cancelSelection();
    } else if (this.isMoving) {
      this.cancelMove();
    }
  }

  /**
   * Check if position is within valid bounds
   */
  isValidPosition(pos) {
    // Remove x,y restrictions, keep z limit for height
    return pos.z >= 0 && pos.z < 50;
  }

  /**
   * Activate the tool
   */
  activate() {
    super.activate();
    this.setCursor('default');
  }

  /**
   * Deactivate the tool
   */
  deactivate() {
    this.cancelCurrentOperation();
    this.clearSelection();
    super.deactivate();
  }

  /**
   * Get tool status text
   */
  getStatusText() {
    if (this.isSelecting) {
      return 'Drag to select blocks, right-click to cancel';
    } else if (this.isMoving) {
      const operation = this.mode === 'move' ? 'Move' : 'Copy';
      return `${operation} mode - click to place, right-click to cancel`;
    } else if (this.selectedBlocks.size > 0) {
      return `${this.selectedBlocks.size} blocks selected - M to move, C to copy, Delete to remove`;
    }
    return 'Selection Tool - drag to select blocks, Ctrl+A to select all';
  }
}
