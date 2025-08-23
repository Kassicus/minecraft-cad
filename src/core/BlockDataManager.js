/**
 * MinecraftCAD - Block Data Manager
 * Simple, efficient storage and management of 3D block data
 */

export class BlockDataManager {
  constructor() {
    // Primary storage: 3D sparse array for fast coordinate lookup
    this.blocks = new Map(); // key: "x,y,z", value: BlockData
    
    // Block type definitions (from architecture doc)
    this.blockTypes = {
      blockA: { name: 'Block A', hatchPattern: 'solid', color: '#666' },
      blockB: { name: 'Block B', hatchPattern: 'diagonal', color: '#888' },
      blockC: { name: 'Block C', hatchPattern: 'crosshatch', color: '#444' },
      blockD: { name: 'Block D', hatchPattern: 'dots', color: '#555' },
      blockE: { name: 'Block E', hatchPattern: 'brick', color: '#777' }
    };
    
    // Statistics
    this.stats = {
      totalBlocks: 0,
      blocksByType: {},
      blocksByLevel: {}
    };
    
    // Change tracking for undo/redo (simple implementation)
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 100;
  }

  /**
   * Create coordinate key from x, y, z
   */
  coordKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  /**
   * Set a block at the specified coordinates
   */
  setBlock(x, y, z, blockType = 'blockA', layer = 'default') {
    // Validate coordinates (100x100x50 as per architecture)
    if (!this.isValidCoordinate(x, y, z)) {
      console.warn(`Invalid coordinates: ${x}, ${y}, ${z}`);
      return false;
    }

    // Validate block type
    if (!this.blockTypes[blockType]) {
      console.warn(`Invalid block type: ${blockType}`);
      return false;
    }

    const key = this.coordKey(x, y, z);
    const existingBlock = this.blocks.get(key);
    
    // Create history entry before making changes
    this.pushHistoryState();
    
    if (existingBlock) {
      // Update existing block
      const oldType = existingBlock.type;
      existingBlock.type = blockType;
      existingBlock.layer = layer;
      existingBlock.modified = Date.now();
      
      // Update statistics
      this.stats.blocksByType[oldType]--;
      this.stats.blocksByType[blockType] = (this.stats.blocksByType[blockType] || 0) + 1;
    } else {
      // Create new block
      const block = {
        x, y, z,
        type: blockType,
        layer: layer,
        visible: true,
        created: Date.now(),
        modified: Date.now()
      };
      
      this.blocks.set(key, block);
      
      // Update statistics
      this.stats.totalBlocks++;
      this.stats.blocksByType[blockType] = (this.stats.blocksByType[blockType] || 0) + 1;
      this.stats.blocksByLevel[z] = (this.stats.blocksByLevel[z] || 0) + 1;
    }
    
    return true;
  }

  /**
   * Get a block at the specified coordinates
   */
  getBlock(x, y, z) {
    const key = this.coordKey(x, y, z);
    return this.blocks.get(key);
  }

  /**
   * Remove a block at the specified coordinates
   */
  removeBlock(x, y, z) {
    const key = this.coordKey(x, y, z);
    const block = this.blocks.get(key);
    
    if (!block) {
      return false;
    }
    
    // Create history entry before making changes
    this.pushHistoryState();
    
    this.blocks.delete(key);
    
    // Update statistics
    this.stats.totalBlocks--;
    this.stats.blocksByType[block.type]--;
    this.stats.blocksByLevel[block.z]--;
    
    return true;
  }

  /**
   * Get all blocks at a specific level
   */
  getBlocksAtLevel(level) {
    const blocks = [];
    for (const block of this.blocks.values()) {
      if (block.z === level) {
        blocks.push(block);
      }
    }
    return blocks;
  }

  /**
   * Get all blocks in a range
   */
  getBlocksInRange(x1, y1, z1, x2, y2, z2) {
    const blocks = [];
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    
    for (const block of this.blocks.values()) {
      if (block.x >= minX && block.x <= maxX &&
          block.y >= minY && block.y <= maxY &&
          block.z >= minZ && block.z <= maxZ) {
        blocks.push(block);
      }
    }
    
    return blocks;
  }

  /**
   * Check if coordinates are valid (100x100x50 build size)
   */
  isValidCoordinate(x, y, z) {
    return x >= 0 && x < 100 && y >= 0 && y < 100 && z >= 0 && z < 50;
  }

  /**
   * Get all blocks
   */
  getAllBlocks() {
    return Array.from(this.blocks.values());
  }

  /**
   * Clear all blocks
   */
  clear() {
    this.pushHistoryState();
    this.blocks.clear();
    this.stats = {
      totalBlocks: 0,
      blocksByType: {},
      blocksByLevel: {}
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get available block types
   */
  getBlockTypes() {
    return { ...this.blockTypes };
  }

  /**
   * Push current state to history for undo/redo
   */
  pushHistoryState() {
    // Remove any history after current index (when we make a new change after undo)
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Create state snapshot
    const state = {
      blocks: new Map(this.blocks),
      stats: { ...this.stats }
    };
    
    this.history.push(state);
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Undo last operation
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this.blocks = new Map(state.blocks);
      this.stats = { ...state.stats };
      return true;
    }
    return false;
  }

  /**
   * Redo last undone operation
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      this.blocks = new Map(state.blocks);
      this.stats = { ...state.stats };
      return true;
    }
    return false;
  }

  /**
   * Export data for saving
   */
  exportData() {
    return {
      blocks: Array.from(this.blocks.values()),
      blockTypes: this.blockTypes,
      stats: this.stats
    };
  }

  /**
   * Import data from saved file
   */
  importData(data) {
    this.clear();
    
    if (data.blocks) {
      for (const block of data.blocks) {
        const key = this.coordKey(block.x, block.y, block.z);
        this.blocks.set(key, block);
      }
    }
    
    if (data.blockTypes) {
      this.blockTypes = { ...data.blockTypes };
    }
    
    if (data.stats) {
      this.stats = { ...data.stats };
    }
  }
}
