/**
 * MinecraftCAD - Memory Manager
 * Handles memory allocation and object pooling for performance
 */

export class MemoryManager {
  constructor() {
    // Target: Support 500,000 blocks efficiently
    this.maxBlocks = 500000;
    this.blockPool = [];
    this.tempObjects = [];
    
    // Statistics
    this.stats = {
      blocksAllocated: 0,
      blocksInPool: 0,
      peakMemoryUsage: 0,
      tempObjectsCreated: 0
    };
    
    // Pre-allocate some objects for better performance
    this.preallocateObjects();
  }

  /**
   * Pre-allocate a pool of reusable objects
   */
  preallocateObjects() {
    // Pre-allocate 1000 block objects
    for (let i = 0; i < 1000; i++) {
      this.blockPool.push(this.createFreshBlock());
    }
    this.stats.blocksInPool = this.blockPool.length;
  }

  /**
   * Create a fresh block object
   */
  createFreshBlock() {
    return {
      x: 0,
      y: 0,
      z: 0,
      type: 'blockA',
      layer: 'default',
      visible: true,
      selected: false,
      dirty: false,
      created: Date.now(),
      modified: Date.now()
    };
  }

  /**
   * Allocate a block object from the pool or create new one
   */
  allocateBlock(x = 0, y = 0, z = 0, type = 'blockA', layer = 'default') {
    let block;
    
    if (this.blockPool.length > 0) {
      block = this.blockPool.pop();
      this.stats.blocksInPool--;
    } else {
      block = this.createFreshBlock();
    }
    
    // Initialize block properties
    block.x = x;
    block.y = y;
    block.z = z;
    block.type = type;
    block.layer = layer;
    block.visible = true;
    block.selected = false;
    block.dirty = true;
    block.created = block.created || Date.now();
    block.modified = Date.now();
    
    this.stats.blocksAllocated++;
    this.updatePeakMemoryUsage();
    
    return block;
  }

  /**
   * Return a block object to the pool for reuse
   */
  deallocateBlock(block) {
    if (!block) return;
    
    // Reset block to default state
    this.resetBlock(block);
    
    // Return to pool if we haven't exceeded max pool size
    if (this.blockPool.length < 5000) { // Reasonable pool size limit
      this.blockPool.push(block);
      this.stats.blocksInPool++;
    }
    
    this.stats.blocksAllocated--;
  }

  /**
   * Reset a block object to default state
   */
  resetBlock(block) {
    block.x = 0;
    block.y = 0;
    block.z = 0;
    block.type = 'blockA';
    block.layer = 'default';
    block.visible = true;
    block.selected = false;
    block.dirty = false;
    // Keep created timestamp, update modified
    block.modified = Date.now();
  }

  /**
   * Allocate a temporary object for calculations
   */
  allocateTemp(type = 'vector') {
    let obj;
    
    switch (type) {
      case 'vector':
        obj = { x: 0, y: 0, z: 0 };
        break;
      case 'rect':
        obj = { x: 0, y: 0, width: 0, height: 0 };
        break;
      case 'bounds':
        obj = { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
        break;
      default:
        obj = {};
    }
    
    this.tempObjects.push(obj);
    this.stats.tempObjectsCreated++;
    
    return obj;
  }

  /**
   * Clear all temporary objects
   */
  clearTempObjects() {
    this.tempObjects.length = 0;
  }

  /**
   * Update peak memory usage statistics
   */
  updatePeakMemoryUsage() {
    const currentUsage = this.stats.blocksAllocated;
    if (currentUsage > this.stats.peakMemoryUsage) {
      this.stats.peakMemoryUsage = currentUsage;
    }
  }

  /**
   * Check if we're approaching memory limits
   */
  isMemoryLow() {
    return this.stats.blocksAllocated > (this.maxBlocks * 0.9);
  }

  /**
   * Force garbage collection of unused objects
   */
  forceGarbageCollection() {
    // Clear temp objects
    this.clearTempObjects();
    
    // Trim block pool if it's too large
    if (this.blockPool.length > 2000) {
      this.blockPool.length = 1000;
      this.stats.blocksInPool = this.blockPool.length;
    }
    
    // Force browser garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.blockPool.length,
      memoryUsagePercent: (this.stats.blocksAllocated / this.maxBlocks) * 100,
      tempObjectsActive: this.tempObjects.length
    };
  }

  /**
   * Get memory usage as a formatted string
   */
  getMemoryUsageString() {
    const stats = this.getStats();
    return `Blocks: ${stats.blocksAllocated}/${this.maxBlocks} (${stats.memoryUsagePercent.toFixed(1)}%)`;
  }

  /**
   * Estimate memory usage in bytes (rough approximation)
   */
  getEstimatedMemoryUsage() {
    // Rough estimate: each block object ~200 bytes
    const blockMemory = this.stats.blocksAllocated * 200;
    const poolMemory = this.blockPool.length * 200;
    const tempMemory = this.tempObjects.length * 50;
    
    return {
      blocks: blockMemory,
      pool: poolMemory,
      temp: tempMemory,
      total: blockMemory + poolMemory + tempMemory
    };
  }

  /**
   * Clean up all resources
   */
  dispose() {
    this.blockPool.length = 0;
    this.tempObjects.length = 0;
    this.stats = {
      blocksAllocated: 0,
      blocksInPool: 0,
      peakMemoryUsage: 0,
      tempObjectsCreated: 0
    };
  }
}
