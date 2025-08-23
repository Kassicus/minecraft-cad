/**
 * MinecraftCAD - Base Tool
 * Abstract base class for all tools
 */

export class BaseTool {
  constructor(name, blockDataManager, appStateManager) {
    if (new.target === BaseTool) {
      throw new Error('BaseTool is abstract and cannot be instantiated directly');
    }
    
    this.name = name;
    this.blockDataManager = blockDataManager;
    this.appStateManager = appStateManager;
    
    // Tool state
    this.isActive = false;
    this.isEnabled = true;
    
    // Mouse/input state
    this.isMouseDown = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.startMousePos = { x: 0, y: 0 };
    
    // Tool-specific settings
    this.settings = {};
    
    // Preview state
    this.showPreview = false;
    this.previewData = null;
    
    // Keyboard modifiers
    this.modifiers = {
      shift: false,
      ctrl: false,
      alt: false
    };
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  onMouseDown(worldPos, event) {
    throw new Error('onMouseDown() method must be implemented by subclass');
  }

  onMouseMove(worldPos, event) {
    throw new Error('onMouseMove() method must be implemented by subclass');
  }

  onMouseUp(worldPos, event) {
    throw new Error('onMouseUp() method must be implemented by subclass');
  }

  onKeyDown(key, event) {
    throw new Error('onKeyDown() method must be implemented by subclass');
  }

  onKeyUp(key, event) {
    // Optional - not all tools need key up events
  }

  /**
   * Tool lifecycle methods
   */
  activate() {
    this.isActive = true;
    this.onActivate();
  }

  deactivate() {
    this.isActive = false;
    this.cleanup();
    this.onDeactivate();
  }

  onActivate() {
    // Override in subclasses for activation logic
  }

  onDeactivate() {
    // Override in subclasses for deactivation logic
  }

  /**
   * Enable/disable tool
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Handle mouse events with common processing
   */
  handleMouseDown(worldPos, event) {
    if (!this.isActive || !this.isEnabled) return false;
    
    this.isMouseDown = true;
    this.startMousePos = { ...worldPos };
    this.lastMousePos = { ...worldPos };
    
    this.updateModifiers(event);
    
    return this.onMouseDown(worldPos, event);
  }

  handleMouseMove(worldPos, event) {
    if (!this.isActive || !this.isEnabled) return false;
    
    this.lastMousePos = { ...worldPos };
    this.updateModifiers(event);
    
    return this.onMouseMove(worldPos, event);
  }

  handleMouseUp(worldPos, event) {
    if (!this.isActive || !this.isEnabled) return false;
    
    this.isMouseDown = false;
    this.updateModifiers(event);
    
    const result = this.onMouseUp(worldPos, event);
    
    // Clear preview after mouse up
    this.clearPreview();
    
    return result;
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(key, event) {
    if (!this.isActive || !this.isEnabled) return false;
    
    this.updateModifiers(event);
    
    // Handle common shortcuts
    if (this.handleCommonShortcuts(key, event)) {
      return true;
    }
    
    return this.onKeyDown(key, event);
  }

  handleKeyUp(key, event) {
    if (!this.isActive || !this.isEnabled) return false;
    
    this.updateModifiers(event);
    
    if (this.onKeyUp) {
      return this.onKeyUp(key, event);
    }
    
    return false;
  }

  /**
   * Update modifier key states
   */
  updateModifiers(event) {
    this.modifiers.shift = event.shiftKey;
    this.modifiers.ctrl = event.ctrlKey || event.metaKey;
    this.modifiers.alt = event.altKey;
  }

  /**
   * Handle common keyboard shortcuts
   */
  handleCommonShortcuts(key, event) {
    switch (key.toLowerCase()) {
      case 'escape':
        this.cancel();
        return true;
      case 'enter':
        this.confirm();
        return true;
      default:
        return false;
    }
  }

  /**
   * Convert world position to grid position
   */
  worldToGrid(worldPos) {
    const gridSize = 20; // Should match renderer grid size
    return {
      x: Math.floor(worldPos.x / gridSize),
      y: Math.floor(worldPos.y / gridSize),
      z: this.appStateManager.currentLevel
    };
  }

  /**
   * Convert grid position to world position
   */
  gridToWorld(gridPos) {
    const gridSize = 20;
    return {
      x: gridPos.x * gridSize,
      y: gridPos.y * gridSize
    };
  }

  /**
   * Snap position to grid
   */
  snapToGrid(worldPos) {
    const gridSize = 20;
    return {
      x: Math.round(worldPos.x / gridSize) * gridSize,
      y: Math.round(worldPos.y / gridSize) * gridSize
    };
  }

  /**
   * Check if coordinates are valid
   */
  isValidCoordinate(x, y, z) {
    return x >= 0 && x < 100 && y >= 0 && y < 100 && z >= 0 && z < 50;
  }

  /**
   * Get current block type from app state
   */
  getCurrentBlockType() {
    return this.appStateManager.currentBlockType;
  }

  /**
   * Get current level from app state
   */
  getCurrentLevel() {
    return this.appStateManager.currentLevel;
  }

  /**
   * Preview management
   */
  setPreview(previewData) {
    this.showPreview = true;
    this.previewData = previewData;
  }

  clearPreview() {
    this.showPreview = false;
    this.previewData = null;
  }

  getPreview() {
    return this.showPreview ? this.previewData : null;
  }

  /**
   * Tool operation methods
   */
  cancel() {
    this.cleanup();
    this.clearPreview();
    // Override in subclasses for specific cancel behavior
  }

  confirm() {
    // Override in subclasses for specific confirm behavior
  }

  /**
   * Cleanup tool state
   */
  cleanup() {
    this.isMouseDown = false;
    this.clearPreview();
  }

  /**
   * Update tool settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get tool cursor type
   */
  getCursor() {
    return 'crosshair'; // Default cursor
  }

  /**
   * Get tool status text
   */
  getStatusText() {
    return `${this.name} tool active`;
  }

  /**
   * Check if tool is compatible with current view
   */
  isCompatibleWithView(viewType) {
    // Most tools work with top view by default
    return viewType === 'top';
  }

  /**
   * Get tool help text
   */
  getHelpText() {
    return [
      `${this.name} Tool`,
      'ESC: Cancel',
      'ENTER: Confirm'
    ];
  }

  /**
   * Render tool-specific overlays
   */
  renderOverlay(renderer) {
    // Override in subclasses to draw tool-specific overlays
  }

  /**
   * Get tool statistics/info
   */
  getToolInfo() {
    return {
      name: this.name,
      isActive: this.isActive,
      isEnabled: this.isEnabled,
      isMouseDown: this.isMouseDown,
      showPreview: this.showPreview,
      modifiers: { ...this.modifiers },
      settings: { ...this.settings }
    };
  }

  /**
   * Dispose of tool resources
   */
  dispose() {
    this.cleanup();
    this.blockDataManager = null;
    this.appStateManager = null;
  }
}
