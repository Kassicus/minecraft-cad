/**
 * MinecraftCAD - Block Data Manager
 * Manages the core 3D block dataset with optimized storage and fast lookups
 */

import { MathUtils } from '../utils/MathUtils.js';

export class BlockDataManager {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    
    // Primary storage: 3D sparse array for fast coordinate lookup
    this.blocks = new Map(); // key: "x,y,z", value: BlockData
    
    // Spatial indexing for performance (simplified octree)
    this.spatialIndex = new Map(); // key: "chunkX,chunkY", value: Set of block keys
    this.chunkSize = 10; // 10x10 chunks for spatial indexing
    
    // Change tracking for undo/redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 100;
    
    // Dirty region tracking for efficient rendering
    this.dirtyRegions = new Set();
    
    // Build bounds cache
    this.boundsCache = null;
    this.boundsCacheDirty = true;
    
    // Block type definitions
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
  }

  /**
   * Set a block at the specified coordinates
   */
  setBlock(x, y, z, blockType = 'blockA', layer = 'default') {
    // Validate coordinates
    if (!this.isValidCoordinate(x, y, z)) {
      console.warn(`Invalid coordinates: ${x}, ${y}, ${z}`);
      return false;
    }

    const key = MathUtils.coordKey(x, y, z);
    const existingBlock = this.blocks.get(key);
    
    // Create history entry before making changes
    this.pushHistoryState();
    
    if (existingBlock) {
      // Update existing block
      existingBlock.type = blockType;
      existingBlock.layer = layer;
      existingBlock.modified = Date.now();
      existingBlock.dirty = true;
    } else {
      // Create new block
      const block = this.memoryManager.allocateBlock(x, y, z, blockType, layer);
      this.blocks.set(key, block);
      
      // Add to spatial index
      this.addToSpatialIndex(x, y, key);
      
      // Update statistics
      this.stats.totalBlocks++;
      this.stats.blocksByType[blockType] = (this.stats.blocksByType[blockType] || 0) + 1;
      this.stats.blocksByLevel[z] = (this.stats.blocksByLevel[z] || 0) + 1;
    }
    
    // Mark region as dirty for rendering
    this.markRegionDirty(x, y, z);
    this.boundsCacheDirty = true;
    
    return true;
  }

  /**
   * Get a block at the specified coordinates
   */
  getBlock(x, y, z) {
    const key = MathUtils.coordKey(x, y, z);
    return this.blocks.get(key) || null;
  }

  /**
   * Remove a block at the specified coordinates
   */
  removeBlock(x, y, z) {
    const key = MathUtils.coordKey(x, y, z);
    const block = this.blocks.get(key);
    
    if (!block) return false;
    
    // Create history entry before making changes
    this.pushHistoryState();
    
    // Remove from storage
    this.blocks.delete(key);
    
    // Remove from spatial index
    this.removeFromSpatialIndex(x, y, key);
    
    // Update statistics
    this.stats.totalBlocks--;
    this.stats.blocksByType[block.type]--;
    if (this.stats.blocksByType[block.type] <= 0) {
      delete this.stats.blocksByType[block.type];
    }
    this.stats.blocksByLevel[z]--;
    if (this.stats.blocksByLevel[z] <= 0) {
      delete this.stats.blocksByLevel[z];
    }
    
    // Return block to memory pool
    this.memoryManager.deallocateBlock(block);
    
    // Mark region as dirty
    this.markRegionDirty(x, y, z);
    this.boundsCacheDirty = true;
    
    return true;
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
    
    // Use spatial indexing for efficiency
    const chunks = this.getChunksInRange(minX, minY, maxX, maxY);
    
    for (const chunkKey of chunks) {
      const blockKeys = this.spatialIndex.get(chunkKey);
      if (!blockKeys) continue;
      
      for (const blockKey of blockKeys) {
        const block = this.blocks.get(blockKey);
        if (!block) continue;
        
        if (block.x >= minX && block.x <= maxX &&
            block.y >= minY && block.y <= maxY &&
            block.z >= minZ && block.z <= maxZ) {
          blocks.push(block);
        }
      }
    }
    
    return blocks;
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
   * Clear all blocks at a specific level
   */
  clearLevel(level) {
    this.pushHistoryState();
    
    const blocksToRemove = this.getBlocksAtLevel(level);
    
    for (const block of blocksToRemove) {
      this.removeBlock(block.x, block.y, block.z);
    }
    
    return blocksToRemove.length;
  }

  /**
   * Get the bounds of all blocks
   */
  getBounds() {
    if (!this.boundsCacheDirty && this.boundsCache) {
      return this.boundsCache;
    }
    
    if (this.blocks.size === 0) {
      return { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
    }
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (const block of this.blocks.values()) {
      minX = Math.min(minX, block.x);
      minY = Math.min(minY, block.y);
      minZ = Math.min(minZ, block.z);
      maxX = Math.max(maxX, block.x);
      maxY = Math.max(maxY, block.y);
      maxZ = Math.max(maxZ, block.z);
    }
    
    this.boundsCache = { minX, minY, minZ, maxX, maxY, maxZ };
    this.boundsCacheDirty = false;
    
    return this.boundsCache;
  }

  /**
   * Add block to spatial index
   */
  addToSpatialIndex(x, y, blockKey) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const chunkKey = `${chunkX},${chunkY}`;
    
    if (!this.spatialIndex.has(chunkKey)) {
      this.spatialIndex.set(chunkKey, new Set());
    }
    
    this.spatialIndex.get(chunkKey).add(blockKey);
  }

  /**
   * Remove block from spatial index
   */
  removeFromSpatialIndex(x, y, blockKey) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const chunkKey = `${chunkX},${chunkY}`;
    
    const chunk = this.spatialIndex.get(chunkKey);
    if (chunk) {
      chunk.delete(blockKey);
      if (chunk.size === 0) {
        this.spatialIndex.delete(chunkKey);
      }
    }
  }

  /**
   * Get chunks that intersect with a range
   */
  getChunksInRange(minX, minY, maxX, maxY) {
    const chunks = [];
    const minChunkX = Math.floor(minX / this.chunkSize);
    const maxChunkX = Math.floor(maxX / this.chunkSize);
    const minChunkY = Math.floor(minY / this.chunkSize);
    const maxChunkY = Math.floor(maxY / this.chunkSize);
    
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
      for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
        chunks.push(`${chunkX},${chunkY}`);
      }
    }
    
    return chunks;
  }

  /**
   * Mark a region as dirty for rendering updates
   */
  markRegionDirty(x, y, z) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    this.dirtyRegions.add(`${chunkX},${chunkY},${z}`);
  }

  /**
   * Get and clear dirty regions
   */
  getDirtyRegions() {
    const regions = Array.from(this.dirtyRegions);
    this.dirtyRegions.clear();
    return regions;
  }

  /**
   * Validate coordinate bounds
   */
  isValidCoordinate(x, y, z) {
    return x >= 0 && x < 100 && y >= 0 && y < 100 && z >= 0 && z < 50;
  }

  /**
   * Push current state to history for undo/redo
   */
  pushHistoryState() {
    // Remove any redo history if we're making a new change
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Create a snapshot of current state (simplified - store only changed blocks)
    const state = {
      timestamp: Date.now(),
      blocks: new Map(this.blocks),
      stats: MathUtils.deepClone(this.stats)
    };
    
    this.history.push(state);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last operation
   */
  undo() {
    if (this.historyIndex <= 0) return false;
    
    this.historyIndex--;
    const state = this.history[this.historyIndex];
    
    // Restore state
    this.restoreState(state);
    
    return true;
  }

  /**
   * Redo last undone operation
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) return false;
    
    this.historyIndex++;
    const state = this.history[this.historyIndex];
    
    // Restore state
    this.restoreState(state);
    
    return true;
  }

  /**
   * Restore a historical state
   */
  restoreState(state) {
    // Clear current blocks and return to memory pool
    for (const block of this.blocks.values()) {
      this.memoryManager.deallocateBlock(block);
    }
    
    // Restore blocks
    this.blocks = new Map(state.blocks);
    this.stats = MathUtils.deepClone(state.stats);
    
    // Rebuild spatial index
    this.rebuildSpatialIndex();
    
    // Mark everything as dirty
    this.markAllRegionsDirty();
    this.boundsCacheDirty = true;
  }

  /**
   * Rebuild spatial index from current blocks
   */
  rebuildSpatialIndex() {
    this.spatialIndex.clear();
    
    for (const [key, block] of this.blocks) {
      this.addToSpatialIndex(block.x, block.y, key);
    }
  }

  /**
   * Mark all regions as dirty
   */
  markAllRegionsDirty() {
    for (const block of this.blocks.values()) {
      this.markRegionDirty(block.x, block.y, block.z);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalChunks: this.spatialIndex.size,
      memoryUsage: this.memoryManager.getStats(),
      historySize: this.history.length,
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.history.length - 1
    };
  }

  /**
   * Export data for saving
   */
  exportData() {
    const blocks = [];
    for (const block of this.blocks.values()) {
      blocks.push({
        x: block.x,
        y: block.y,
        z: block.z,
        type: block.type,
        layer: block.layer
      });
    }
    
    return {
      version: '1.0',
      blocks,
      blockTypes: this.blockTypes,
      stats: this.stats,
      bounds: this.getBounds()
    };
  }

  /**
   * Import data from saved file
   */
  importData(data) {
    if (!data || !data.blocks) return false;
    
    // Clear existing data
    this.clear();
    
    // Import blocks
    for (const blockData of data.blocks) {
      this.setBlock(blockData.x, blockData.y, blockData.z, blockData.type, blockData.layer || 'default');
    }
    
    // Import block types if available
    if (data.blockTypes) {
      this.blockTypes = { ...this.blockTypes, ...data.blockTypes };
    }
    
    return true;
  }

  /**
   * Clear all data
   */
  clear() {
    // Return all blocks to memory pool
    for (const block of this.blocks.values()) {
      this.memoryManager.deallocateBlock(block);
    }
    
    this.blocks.clear();
    this.spatialIndex.clear();
    this.dirtyRegions.clear();
    this.history = [];
    this.historyIndex = -1;
    this.boundsCache = null;
    this.boundsCacheDirty = true;
    
    this.stats = {
      totalBlocks: 0,
      blocksByType: {},
      blocksByLevel: {}
    };
  }
}
