/**
 * MinecraftCAD - Fill Tool
 * Flood fills connected empty areas or replaces connected blocks of the same type
 */

import { BaseTool } from './BaseTool.js';

export class FillTool extends BaseTool {
  constructor() {
    super('fill', 'Fill Tool');
    
    // Fill operation settings
    this.maxFillBlocks = 10000; // Prevent runaway fills
    this.replaceMode = false; // Toggle between fill empty and replace existing
  }

  /**
   * Handle mouse down - perform fill operation
   */
  onMouseDown(event, worldPos) {
    if (!worldPos) return;

    this.performFill(worldPos);
  }

  /**
   * Handle key press - R to toggle replace mode
   */
  onKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
      this.replaceMode = !this.replaceMode;
      this.notifyStatusChange();
    }
  }

  /**
   * Perform flood fill operation
   */
  performFill(startPos) {
    // Block data access removed - tool disabled until new system is implemented
    console.log('Fill tool disabled - block placement system removed');
    return;
    const fillType = this.currentBlockType;
    
    // Don't fill if target is same as fill type
    if (targetType === fillType) {
      return;
    }
    
    // In replace mode, only fill if there's a block to replace
    // In fill mode, only fill if the area is empty
    if (this.replaceMode && !targetType) {
      return; // No block to replace
    }
    
    if (!this.replaceMode && targetType) {
      return; // Area is not empty
    }

    const blocksToFill = this.floodFill(startPos, targetType, fillType);
    
    if (blocksToFill.length === 0) {
      return; // Nothing to fill
    }

    // Block placement removed - tool disabled

    // Trigger re-render
    this.notifyChange();
    
    console.log(`Filled ${blocksToFill.length} blocks`);
  }

  /**
   * Flood fill algorithm using breadth-first search
   */
  floodFill(startPos, targetType, fillType) {
    const visited = new Set();
    const queue = [startPos];
    const result = [];
    
    const getKey = (pos) => `${pos.x},${pos.y},${pos.z}`;
    
    while (queue.length > 0 && result.length < this.maxFillBlocks) {
      const current = queue.shift();
      const key = getKey(current);
      
      if (visited.has(key)) {
        continue;
      }
      
      visited.add(key);
      
      // Check if this position should be filled
      // Block data access removed - returning empty result
      const currentType = null;
      
      if (currentType !== targetType) {
        continue; // Different type, don't fill
      }
      
      // Add to result
      result.push({ ...current });
      
      // Add neighbors to queue
      const neighbors = this.getNeighbors(current);
      neighbors.forEach(neighbor => {
        const neighborKey = getKey(neighbor);
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      });
    }
    
    if (result.length >= this.maxFillBlocks) {
      console.warn(`Fill operation limited to ${this.maxFillBlocks} blocks to prevent runaway fills`);
    }
    
    return result;
  }

  /**
   * Get neighboring positions (6-connected: up, down, north, south, east, west)
   */
  getNeighbors(pos) {
    return [
      { x: pos.x + 1, y: pos.y, z: pos.z }, // East
      { x: pos.x - 1, y: pos.y, z: pos.z }, // West
      { x: pos.x, y: pos.y + 1, z: pos.z }, // North
      { x: pos.x, y: pos.y - 1, z: pos.z }, // South
      { x: pos.x, y: pos.y, z: pos.z + 1 }, // Up
      { x: pos.x, y: pos.y, z: pos.z - 1 }  // Down
    ].filter(neighbor => this.isValidPosition(neighbor));
  }

  /**
   * Check if position is within valid bounds
   */
  isValidPosition(pos) {
    // Check bounds (assuming 100x100x50 build area)
    return pos.x >= 0 && pos.x < 100 &&
           pos.y >= 0 && pos.y < 100 &&
           pos.z >= 0 && pos.z < 50;
  }

  /**
   * Activate the tool
   */
  activate() {
    super.activate();
    this.setCursor('pointer');
  }

  /**
   * Get tool status text
   */
  getStatusText() {
    const modeText = this.replaceMode ? 'replace connected blocks' : 'fill empty areas';
    return `Fill Tool (${modeText}) - click to fill, press R to toggle replace mode`;
  }

  /**
   * Handle right click - could be used for different fill modes in the future
   */
  onRightClick(event, worldPos) {
    // For now, right-click does nothing, but could be used for:
    // - Fill with different block type
    // - Sample block type from clicked position
    // - Different fill pattern
  }
}
