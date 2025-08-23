/**
 * MinecraftCAD - Application State Manager
 * Central coordinator that manages application state, view switching, and cross-module communication
 */

export class AppStateManager {
  constructor() {
    // Current view mode (top/3d/elevation)
    this.currentView = 'top';
    
    // Current height level (0-49)
    this.currentLevel = 0;
    
    // Active tool selection
    this.activeTool = 'block';
    
    // Current block type and layer
    this.currentBlockType = 'blockA';
    this.currentLayer = 'default';
    
    // UI state
    this.uiState = {
      sidebarCollapsed: false,
      showGrid: true,
      showMajorGrid: true,
      showGhostBlocks: true,
      showCoordinates: true,
      showLevelIndicator: true,
      performanceMode: false
    };
    
    // Camera states for different views
    this.cameraStates = {
      top: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      '3d': { position: { x: 50, y: 50, z: 25 }, rotation: { x: 0, y: 0, z: 0 } },
      north: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      south: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      east: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      west: { offsetX: 0, offsetY: 0, zoom: 1.0 }
    };
    
    // Event listeners
    this.listeners = new Map();
    
    // Connected modules
    this.blockDataManager = null;
    this.renderers = new Map();
    this.toolManager = null;
    this.inputController = null;
    this.cameraController = null;
    
    // Project metadata
    this.projectInfo = {
      name: 'New Project',
      description: '',
      created: Date.now(),
      modified: Date.now(),
      version: '1.0'
    };
    
    // Level names mapping
    this.levelNames = this.generateLevelNames();
    
    // Auto-save settings
    this.autoSave = {
      enabled: true,
      interval: 30000, // 30 seconds
      lastSave: Date.now()
    };
    
    this.setupAutoSave();
  }

  /**
   * Connect other modules to the state manager
   */
  connect(blockDataManager, viewManager, toolManager, inputController, cameraController = null) {
    this.blockDataManager = blockDataManager;
    this.viewManager = viewManager;
    this.toolManager = toolManager;
    this.inputController = inputController;
    this.cameraController = cameraController;
    
    // Connect view manager back to us
    if (this.viewManager && this.viewManager.connect) {
      this.viewManager.connect(this);
    }
    
    // Initial state setup
    this.updateUI();
    this.notifyViewChange(this.currentView, this.currentLevel);
  }

  /**
   * Set the current view mode
   */
  setCurrentView(viewType) {
    if (viewType === this.currentView) return;
    
    const previousView = this.currentView;
    
    // Update camera controller active view
    if (this.cameraController) {
      this.cameraController.setActiveView(viewType);
    }
    
    // Switch view in view manager
    if (this.viewManager && this.viewManager.switchToView(viewType)) {
      this.currentView = viewType;
      
      // Notify listeners
      this.emit('viewChanged', { 
        previous: previousView, 
        current: viewType, 
        level: this.currentLevel 
      });
      
      // Update UI
      this.updateViewButtons();
      
      // Update tool availability based on view
      this.updateToolAvailability();
    }
  }

  /**
   * Set the current height level
   */
  setCurrentLevel(level) {
    const clampedLevel = Math.max(0, Math.min(49, level));
    
    if (clampedLevel === this.currentLevel) return;
    
    const previousLevel = this.currentLevel;
    this.currentLevel = clampedLevel;
    
    // Notify listeners
    this.emit('levelChanged', { 
      previous: previousLevel, 
      current: clampedLevel,
      view: this.currentView
    });
    
    // Update UI
    this.updateLevelDisplay();
    
    // Notify renderers
    this.notifyViewChange(this.currentView, clampedLevel);
  }

  /**
   * Set the active tool
   */
  setActiveTool(toolType) {
    if (toolType === this.activeTool) return;
    
    const previousTool = this.activeTool;
    this.activeTool = toolType;
    
    // Notify tool manager
    if (this.toolManager) {
      this.toolManager.setCurrentTool(toolType);
    }
    
    // Update UI
    this.updateToolButtons();
    this.updateStatusBar();
    
    // Notify listeners
    this.emit('toolChanged', { 
      previous: previousTool, 
      current: toolType 
    });
  }

  /**
   * Set the current block type
   */
  setCurrentBlockType(blockType) {
    if (blockType === this.currentBlockType) return;
    
    const previousType = this.currentBlockType;
    this.currentBlockType = blockType;
    
    // Update UI
    this.updateBlockTypeSelection();
    
    // Notify listeners
    this.emit('blockTypeChanged', { 
      previous: previousType, 
      current: blockType 
    });
  }

  /**
   * Get the current application state
   */
  getState() {
    return {
      currentView: this.currentView,
      currentLevel: this.currentLevel,
      activeTool: this.activeTool,
      currentBlockType: this.currentBlockType,
      currentLayer: this.currentLayer,
      uiState: { ...this.uiState },
      cameraStates: { ...this.cameraStates },
      projectInfo: { ...this.projectInfo }
    };
  }

  /**
   * Restore application state
   */
  setState(state) {
    if (!state) return;
    
    this.currentView = state.currentView || 'top';
    this.currentLevel = state.currentLevel || 0;
    this.activeTool = state.activeTool || 'place';
    this.currentBlockType = state.currentBlockType || 'blockA';
    this.currentLayer = state.currentLayer || 'default';
    
    if (state.uiState) {
      this.uiState = { ...this.uiState, ...state.uiState };
    }
    
    if (state.cameraStates) {
      this.cameraStates = { ...this.cameraStates, ...state.cameraStates };
    }
    
    if (state.projectInfo) {
      this.projectInfo = { ...this.projectInfo, ...state.projectInfo };
    }
    
    // Update UI to reflect restored state
    this.updateUI();
    this.notifyViewChange(this.currentView, this.currentLevel);
  }

  /**
   * Notify view manager of view/level changes
   */
  notifyViewChange(viewType, level) {
    // View manager handles renderer updates
    if (this.viewManager) {
      this.viewManager.forceUpdateCurrentView();
    }
    
    // Update canvas cursor based on current tool
    this.updateCanvasCursor();
  }

  /**
   * Update UI elements to reflect current state
   */
  updateUI() {
    this.updateViewButtons();
    this.updateLevelDisplay();
    this.updateToolButtons();
    this.updateBlockTypeSelection();
    this.updateStatusBar();
  }

  /**
   * Update view button states
   */
  updateViewButtons() {
    const buttons = document.querySelectorAll('.view-button');
    buttons.forEach(button => {
      const viewType = button.dataset.view;
      button.classList.toggle('active', viewType === this.currentView);
    });
  }

  /**
   * Update level display and controls
   */
  updateLevelDisplay() {
    const levelDisplay = document.getElementById('current-level');
    const levelStatus = document.getElementById('current-level-status');
    const levelDownBtn = document.getElementById('level-down');
    const levelUpBtn = document.getElementById('level-up');
    
    const levelName = this.getLevelName(this.currentLevel);
    
    if (levelDisplay) {
      levelDisplay.textContent = levelName;
    }
    
    if (levelStatus) {
      levelStatus.textContent = `Level: ${levelName}`;
    }
    
    // Update button states
    if (levelDownBtn) {
      levelDownBtn.disabled = this.currentLevel <= 0;
    }
    
    if (levelUpBtn) {
      levelUpBtn.disabled = this.currentLevel >= 49;
    }
  }

  /**
   * Update tool button states
   */
  updateToolButtons() {
    const buttons = document.querySelectorAll('.tool-btn');
    buttons.forEach(button => {
      const toolType = button.dataset.tool;
      button.classList.toggle('active', toolType === this.activeTool);
    });
  }

  /**
   * Update block type selection
   */
  updateBlockTypeSelection() {
    const items = document.querySelectorAll('.block-item');
    items.forEach(item => {
      const blockType = item.dataset.blockType;
      item.classList.toggle('active', blockType === this.currentBlockType);
    });
  }

  /**
   * Update status bar information
   */
  updateStatusBar() {
    const toolElement = document.getElementById('current-tool');
    const blockCountElement = document.getElementById('block-count');
    
    if (toolElement) {
      toolElement.textContent = `Tool: ${this.getToolDisplayName(this.activeTool)}`;
    }
    
    if (blockCountElement && this.blockDataManager) {
      const stats = this.blockDataManager.getStats();
      blockCountElement.textContent = `Blocks: ${stats.totalBlocks}`;
    }
  }

  /**
   * Update canvas cursor based on current tool
   */
  updateCanvasCursor() {
    const canvas = this.viewManager ? this.viewManager.getCurrentCanvas() : null;
    if (!canvas) return;
    
    // Remove all cursor classes
    canvas.className = canvas.className.replace(/\btool-cursor-\w+\b/g, '');
    
    // Add appropriate cursor class
    canvas.classList.add(`tool-cursor-${this.activeTool}`);
  }

  /**
   * Update tool availability based on current view
   */
  updateToolAvailability() {
    const toolButtons = document.querySelectorAll('.tool-btn');
    
    toolButtons.forEach(button => {
      const toolType = button.dataset.tool;
      let available = true;
      
      // Some tools might not be available in certain views
      if (this.currentView === '3d') {
        // In 3D view, disable some 2D-specific tools
        if (['line', 'rectangle', 'fill'].includes(toolType)) {
          available = false;
        }
      }
      
      button.disabled = !available;
    });
  }

  /**
   * Generate level names (Ground, +1, +2, etc.)
   */
  generateLevelNames() {
    const names = {};
    for (let i = 0; i < 50; i++) {
      if (i === 0) {
        names[i] = 'Ground';
      } else {
        names[i] = `+${i}`;
      }
    }
    return names;
  }

  /**
   * Get display name for a level
   */
  getLevelName(level) {
    return this.levelNames[level] || `+${level}`;
  }

  /**
   * Get display name for a tool
   */
  getToolDisplayName(tool) {
    const names = {
      place: 'Place',
      erase: 'Erase',
      select: 'Select',
      line: 'Line',
      rectangle: 'Rectangle',
      fill: 'Fill',
      measure: 'Measure',
      pan: 'Pan',
      zoom: 'Zoom'
    };
    return names[tool] || tool;
  }

  /**
   * Event system methods
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Auto-save functionality
   */
  setupAutoSave() {
    if (!this.autoSave.enabled) return;
    
    setInterval(() => {
      this.performAutoSave();
    }, this.autoSave.interval);
  }

  performAutoSave() {
    try {
      const data = this.exportProject();
      localStorage.setItem('minecraftcad_autosave', JSON.stringify(data));
      this.autoSave.lastSave = Date.now();
      
      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Project management
   */
  exportProject() {
    return {
      appState: this.getState(),
      blockData: this.blockDataManager ? this.blockDataManager.exportData() : null,
      timestamp: Date.now()
    };
  }

  importProject(data) {
    if (!data) return false;
    
    try {
      if (data.appState) {
        this.setState(data.appState);
      }
      
      if (data.blockData && this.blockDataManager) {
        this.blockDataManager.importData(data.blockData);
      }
      
      this.projectInfo.modified = Date.now();
      this.updateUI();
      
      return true;
    } catch (error) {
      console.error('Failed to import project:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.listeners.clear();
    
    // Clear auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}
