/**
 * MinecraftCAD - UI Manager
 * Manages UI updates and interactions
 */

export class UIManager {
  constructor(appStateManager) {
    this.appStateManager = appStateManager;
    
    // UI element references
    this.elements = {
      // Tool buttons
      toolButtons: document.querySelectorAll('.tool-btn'),
      
      // View controls
      viewButtons: document.querySelectorAll('.view-button'),
      
      // Block type selection
      blockItems: document.querySelectorAll('.block-item'),
      
      // Height controls
      levelDisplay: document.getElementById('current-level'),
      levelStatus: document.getElementById('current-level-status'),
      levelUpBtn: document.getElementById('level-up'),
      levelDownBtn: document.getElementById('level-down'),
      
      // Status bar
      cursorX: document.getElementById('cursor-x'),
      cursorY: document.getElementById('cursor-y'),
      blockCount: document.getElementById('block-count'),
      zoomLevel: document.getElementById('zoom-level'),
      currentTool: document.getElementById('current-tool'),
      
      // Project title
      projectTitle: document.querySelector('.project-title'),
      
      // Canvas
      mainCanvas: document.getElementById('main-canvas')
    };
    
    // UI state
    this.uiState = {
      isInitialized: false,
      sidebarCollapsed: false,
      showNotifications: true,
      animationsEnabled: true
    };
    
    // Notification system
    this.notifications = [];
    this.maxNotifications = 5;
    
    this.initialize();
  }

  /**
   * Initialize UI manager
   */
  initialize() {
    if (this.uiState.isInitialized) return;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial UI update
    this.updateAll();
    
    this.uiState.isInitialized = true;
  }

  /**
   * Setup event listeners for app state changes
   */
  setupEventListeners() {
    if (!this.appStateManager) return;
    
    // Listen to app state changes
    this.appStateManager.on('viewChanged', (data) => {
      this.updateViewButtons(data.current);
      this.updateToolAvailability(data.current);
    });
    
    this.appStateManager.on('levelChanged', (data) => {
      this.updateLevelDisplay(data.current);
    });
    
    this.appStateManager.on('toolChanged', (data) => {
      this.updateToolButtons(data.current);
      this.updateStatusBar();
    });
    
    this.appStateManager.on('blockTypeChanged', (data) => {
      this.updateBlockTypeSelection(data.current);
    });
    
    this.appStateManager.on('blockCountChanged', () => {
      this.updateBlockCount();
    });
    
    this.appStateManager.on('renderRequested', () => {
      this.updateZoomLevel();
    });
  }

  /**
   * Update all UI elements
   */
  updateAll() {
    if (!this.appStateManager) return;
    
    const state = this.appStateManager.getState();
    
    this.updateViewButtons(state.currentView);
    this.updateLevelDisplay(state.currentLevel);
    this.updateToolButtons(state.activeTool);
    this.updateBlockTypeSelection(state.currentBlockType);
    this.updateStatusBar();
    this.updateProjectTitle();
    this.updateToolAvailability(state.currentView);
  }

  /**
   * Update view button states
   */
  updateViewButtons(currentView) {
    this.elements.viewButtons.forEach(button => {
      const viewType = button.dataset.view;
      const isActive = viewType === currentView;
      
      button.classList.toggle('active', isActive);
      
      // Add visual feedback
      if (this.uiState.animationsEnabled) {
        if (isActive) {
          button.style.transform = 'scale(1.05)';
          setTimeout(() => {
            button.style.transform = '';
          }, 150);
        }
      }
    });
  }

  /**
   * Update level display and controls
   */
  updateLevelDisplay(currentLevel) {
    const levelName = this.getLevelName(currentLevel);
    
    // Update level display
    if (this.elements.levelDisplay) {
      this.elements.levelDisplay.textContent = levelName;
    }
    
    if (this.elements.levelStatus) {
      this.elements.levelStatus.textContent = `Level: ${levelName}`;
    }
    
    // Update button states
    if (this.elements.levelDownBtn) {
      this.elements.levelDownBtn.disabled = currentLevel <= 0;
    }
    
    if (this.elements.levelUpBtn) {
      this.elements.levelUpBtn.disabled = currentLevel >= 49;
    }
    
    // Visual feedback for level change
    if (this.uiState.animationsEnabled) {
      this.flashElement(this.elements.levelDisplay);
    }
  }

  /**
   * Update tool button states
   */
  updateToolButtons(activeTool) {
    this.elements.toolButtons.forEach(button => {
      const toolType = button.dataset.tool;
      const isActive = toolType === activeTool;
      
      button.classList.toggle('active', isActive);
      
      // Update cursor hint
      if (isActive) {
        this.updateCanvasCursor(toolType);
      }
    });
  }

  /**
   * Update block type selection
   */
  updateBlockTypeSelection(currentBlockType) {
    this.elements.blockItems.forEach(item => {
      const blockType = item.dataset.blockType;
      const isActive = blockType === currentBlockType;
      
      item.classList.toggle('active', isActive);
      
      // Visual feedback
      if (this.uiState.animationsEnabled && isActive) {
        this.pulseElement(item);
      }
    });
  }

  /**
   * Update status bar information
   */
  updateStatusBar() {
    if (!this.appStateManager) return;
    
    const state = this.appStateManager.getState();
    
    // Update current tool
    if (this.elements.currentTool) {
      this.elements.currentTool.textContent = `Tool: ${this.getToolDisplayName(state.activeTool)}`;
    }
    
    // Update block count
    this.updateBlockCount();
  }

  /**
   * Update block count display
   */
  updateBlockCount() {
    if (!this.elements.blockCount || !this.appStateManager.blockDataManager) return;
    
    const stats = this.appStateManager.blockDataManager.getStats();
    this.elements.blockCount.textContent = `Blocks: ${stats.totalBlocks}`;
    
    // Visual feedback for count change
    if (this.uiState.animationsEnabled) {
      this.flashElement(this.elements.blockCount);
    }
  }

  /**
   * Update zoom level display
   */
  updateZoomLevel() {
    if (!this.elements.zoomLevel) return;
    
    // This would get zoom from camera controller
    // For now, just show a placeholder
    this.elements.zoomLevel.textContent = 'Zoom: 100%';
  }

  /**
   * Update cursor coordinates
   */
  updateCursorCoordinates(x, y) {
    if (this.elements.cursorX) {
      this.elements.cursorX.textContent = `X: ${x}`;
    }
    
    if (this.elements.cursorY) {
      this.elements.cursorY.textContent = `Y: ${y}`;
    }
  }

  /**
   * Update project title
   */
  updateProjectTitle() {
    if (!this.elements.projectTitle || !this.appStateManager) return;
    
    const projectName = this.appStateManager.projectInfo.name || 'New Project';
    this.elements.projectTitle.textContent = projectName;
  }

  /**
   * Update canvas cursor based on current tool
   */
  updateCanvasCursor(toolType) {
    if (!this.elements.mainCanvas) return;
    
    // Remove all cursor classes
    this.elements.mainCanvas.className = this.elements.mainCanvas.className.replace(/\btool-cursor-\w+\b/g, '');
    
    // Add appropriate cursor class
    this.elements.mainCanvas.classList.add(`tool-cursor-${toolType}`);
    
    // Set CSS cursor as fallback
    const cursors = {
      place: 'crosshair',
      erase: 'not-allowed',
      select: 'pointer',
      line: 'crosshair',
      rectangle: 'crosshair',
      fill: 'crosshair',
      measure: 'crosshair',
      pan: 'grab',
      zoom: 'zoom-in'
    };
    
    this.elements.mainCanvas.style.cursor = cursors[toolType] || 'default';
  }

  /**
   * Update tool availability based on current view
   */
  updateToolAvailability(currentView) {
    this.elements.toolButtons.forEach(button => {
      const toolType = button.dataset.tool;
      let available = true;
      
      // Some tools might not be available in certain views
      if (currentView === '3d') {
        // In 3D view, disable some 2D-specific tools
        if (['line', 'rectangle', 'fill'].includes(toolType)) {
          available = false;
        }
      }
      
      button.disabled = !available;
      button.classList.toggle('unavailable', !available);
    });
  }

  /**
   * Notification system
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (!this.uiState.showNotifications) return;
    
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: Date.now()
    };
    
    this.notifications.push(notification);
    
    // Limit number of notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }
    
    // Create and show notification element
    this.createNotificationElement(notification);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  /**
   * Create notification DOM element
   */
  createNotificationElement(notification) {
    const container = this.getOrCreateNotificationContainer();
    
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.dataset.notificationId = notification.id;
    
    element.innerHTML = `
      <span class="notification-message">${notification.message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(element);
    
    // Animate in
    if (this.uiState.animationsEnabled) {
      element.style.opacity = '0';
      element.style.transform = 'translateX(100%)';
      
      requestAnimationFrame(() => {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
      });
    }
  }

  /**
   * Get or create notification container
   */
  getOrCreateNotificationContainer() {
    let container = document.querySelector('.notification-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
      `;
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Remove notification
   */
  removeNotification(id) {
    const element = document.querySelector(`[data-notification-id="${id}"]`);
    if (element) {
      if (this.uiState.animationsEnabled) {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          element.remove();
        }, 300);
      } else {
        element.remove();
      }
    }
    
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * Animation helpers
   */
  flashElement(element) {
    if (!element || !this.uiState.animationsEnabled) return;
    
    element.style.transition = 'background-color 0.2s ease';
    element.style.backgroundColor = 'rgba(100, 181, 246, 0.3)';
    
    setTimeout(() => {
      element.style.backgroundColor = '';
    }, 200);
  }

  pulseElement(element) {
    if (!element || !this.uiState.animationsEnabled) return;
    
    element.style.transition = 'transform 0.15s ease';
    element.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      element.style.transform = '';
    }, 150);
  }

  /**
   * Helper methods
   */
  getLevelName(level) {
    return level === 0 ? 'Ground' : `+${level}`;
  }

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
   * Theme management
   */
  setTheme(themeName) {
    document.documentElement.className = `theme-${themeName}`;
  }

  toggleAnimations(enabled) {
    this.uiState.animationsEnabled = enabled;
    document.documentElement.classList.toggle('animations-disabled', !enabled);
  }

  /**
   * Sidebar management
   */
  toggleSidebar() {
    this.uiState.sidebarCollapsed = !this.uiState.sidebarCollapsed;
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.uiState.sidebarCollapsed);
    }
  }

  /**
   * Loading states
   */
  showLoadingState(message = 'Loading...') {
    this.showNotification(message, 'loading', 0);
  }

  hideLoadingState() {
    // Remove loading notifications
    const loadingNotifications = this.notifications.filter(n => n.type === 'loading');
    loadingNotifications.forEach(n => this.removeNotification(n.id));
  }

  /**
   * Error handling
   */
  showError(message) {
    this.showNotification(message, 'error', 5000);
  }

  showSuccess(message) {
    this.showNotification(message, 'success', 3000);
  }

  showWarning(message) {
    this.showNotification(message, 'warning', 4000);
  }

  /**
   * Update methods for external calls
   */
  updateFromAppState() {
    this.updateAll();
  }

  /**
   * Cleanup
   */
  dispose() {
    // Remove notification container
    const container = document.querySelector('.notification-container');
    if (container) {
      container.remove();
    }
    
    // Clear notifications
    this.notifications = [];
    
    // Remove references
    this.appStateManager = null;
    this.elements = {};
  }
}
