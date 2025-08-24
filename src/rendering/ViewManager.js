/**
 * MinecraftCAD - View Manager
 * Manages multiple view renderers and smooth transitions between them
 */

import { TopViewRenderer } from './TopViewRenderer.js';
import { ThreeDRenderer } from './ThreeDRenderer.js';
import { ElevationRenderer } from './ElevationRenderer.js';

export class ViewManager {
  constructor() {
    // View renderers
    this.renderers = new Map();
    
    // Canvas elements
    this.canvases = new Map();
    
    // Current active view
    this.currentView = 'top';
    
    // View transition state
    this.isTransitioning = false;
    this.transitionDuration = 300; // ms
    
    // Cross-view synchronization
    this.cursorPosition = { x: 0, y: 0, z: 0 };
    this.selectedBlocks = new Set();
    
    // Connected systems
    this.appStateManager = null;
    
    // Performance settings
    this.settings = {
      enableTransitions: true,
      updateInactiveViews: false, // Only update active view for performance
      syncCursorAcrossViews: true,
      preloadAllViews: true
    };
    
    this.initialize();
  }

  /**
   * Connect to the app state manager
   */
  connect(appStateManager) {
    this.appStateManager = appStateManager;
    
    // Connect all renderers to the app state manager
    this.renderers.forEach(renderer => {
      if (renderer.connect) {
        renderer.connect(appStateManager);
      }
    });
    
    console.log('ViewManager connected to app state manager');
  }

  /**
   * Initialize all view renderers
   */
  initialize() {
    console.log('Initializing ViewManager...');
    
    try {
      // Get canvas elements
      this.setupCanvases();
      
      // Initialize renderers
      this.initializeRenderers();
      
      // Setup view switching
      this.setupViewSwitching();
      
      // Set initial view
      this.switchToView('top', false); // No transition for initial view
      
      console.log('ViewManager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize ViewManager:', error);
      throw error;
    }
  }

  /**
   * Setup canvas elements
   */
  setupCanvases() {
    const canvasIds = [
      'top-canvas',
      '3d-canvas', 
      'north-canvas',
      'south-canvas',
      'east-canvas',
      'west-canvas'
    ];
    
    canvasIds.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const viewType = canvas.dataset.view;
        if (viewType) {
          this.canvases.set(viewType, canvas);
          console.log(`Canvas ${id} mapped to view: ${viewType}`);
          
          // Setup canvas properties
          this.setupCanvas(canvas);
        } else {
          console.warn(`Canvas ${id} missing data-view attribute`);
        }
      } else {
        console.warn(`Canvas element ${id} not found`);
      }
    });
    
    console.log('Canvas mapping:', Array.from(this.canvases.entries()));
  }

  /**
   * Setup individual canvas properties
   */
  setupCanvas(canvas) {
    // Set initial size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  /**
   * Initialize all renderers
   */
  initializeRenderers() {
    // Top view renderer
    const topCanvas = this.canvases.get('top');
    if (topCanvas) {
      const topRenderer = new TopViewRenderer(topCanvas);
      this.renderers.set('top', topRenderer);
      
      // Connect renderer if app state manager is already available
      if (this.appStateManager && topRenderer.connect) {
        topRenderer.connect(this.appStateManager);
      }
      
      console.log('Top view renderer initialized');
    }
    
    // 3D renderer
    const threeDCanvas = this.canvases.get('3d');
    if (threeDCanvas) {
      console.log('Initializing 3D renderer...');
      try {
        const threeDRenderer = new ThreeDRenderer(threeDCanvas);
        this.renderers.set('3d', threeDRenderer);
        console.log('3D renderer added to ViewManager');
      } catch (error) {
        console.error('Failed to create 3D renderer:', error);
      }
    } else {
      console.error('3D canvas not found');
    }
    
    // Elevation renderers
    const elevationViews = ['north', 'south', 'east', 'west'];
    elevationViews.forEach(direction => {
      const canvas = this.canvases.get(direction);
      if (canvas) {
        const elevationRenderer = new ElevationRenderer(canvas, direction);
        
        // Initialize auto-centering flags
        elevationRenderer.hasBeenCentered = false;
        elevationRenderer.lastBlockCount = 0;
        
        this.renderers.set(direction, elevationRenderer);
        console.log(`${direction} elevation renderer initialized with auto-centering`);
      }
    });
    
    console.log('All renderers initialized:', Array.from(this.renderers.keys()));
  }

  /**
   * Setup view switching logic
   */
  setupViewSwitching() {
    // This will be called by the InputController/UIManager
    // when view buttons are clicked
  }

  /**
   * Switch to a different view
   */
  switchToView(viewType, animate = true) {
    if (viewType === this.currentView || this.isTransitioning) {
      return false;
    }
    
    const targetRenderer = this.renderers.get(viewType);
    const targetCanvas = this.canvases.get(viewType);
    
    if (!targetRenderer || !targetCanvas) {
      console.warn(`View ${viewType} not available`);
      return false;
    }
    
    console.log(`Switching from ${this.currentView} to ${viewType}`);
    
    // Auto-center elevation views when switching to them
    if (['north', 'south', 'east', 'west'].includes(viewType) && this.appStateManager) {
      const blockData = this.appStateManager.blockDataManager;
      if (blockData && targetRenderer.resetView) {
        this.autoCenterElevationView(viewType, targetRenderer, blockData);
      }
    }
    
    if (animate && this.settings.enableTransitions) {
      this.animateViewTransition(viewType);
    } else {
      this.instantViewSwitch(viewType);
    }
    
    return true;
  }

  /**
   * Animate transition between views
   */
  animateViewTransition(targetView) {
    this.isTransitioning = true;
    
    const currentCanvas = this.canvases.get(this.currentView);
    const targetCanvas = this.canvases.get(targetView);
    
    // Fade out current view
    if (currentCanvas) {
      currentCanvas.style.transition = `opacity ${this.transitionDuration}ms ease`;
      currentCanvas.style.opacity = '0';
    }
    
    // Fade in target view
    setTimeout(() => {
      if (currentCanvas) {
        currentCanvas.classList.remove('active');
      }
      
      targetCanvas.classList.add('active');
      targetCanvas.style.opacity = '1';
      
      this.currentView = targetView;
      this.isTransitioning = false;
      
      // Force update of new view
      this.forceUpdateCurrentView();
      
      // Emit view change event
      this.onViewChanged(targetView);
      
    }, this.transitionDuration / 2);
  }

  /**
   * Instant view switch without animation
   */
  instantViewSwitch(targetView) {
    // Hide current view
    const currentCanvas = this.canvases.get(this.currentView);
    if (currentCanvas) {
      currentCanvas.classList.remove('active');
    }
    
    // Show target view
    const targetCanvas = this.canvases.get(targetView);
    if (targetCanvas) {
      targetCanvas.classList.add('active');
    }
    
    this.currentView = targetView;
    
    // Force update of new view
    this.forceUpdateCurrentView();
    
    // Emit view change event
    this.onViewChanged(targetView);
  }

  /**
   * Render current view
   */
  render(blockData, cameraStates, currentLevel) {
    const renderer = this.renderers.get(this.currentView);
    if (!renderer) {
      console.warn(`No renderer found for view: ${this.currentView}`);
      return;
    }
    
    const cameraState = cameraStates[this.currentView];
    
    try {
      // Auto-center elevation views when they become active
      if (['north', 'south', 'east', 'west'].includes(this.currentView) && 
          this.shouldAutoCenterElevationView(this.currentView, renderer, blockData)) {
        this.autoCenterElevationView(this.currentView, renderer, blockData);
      }
      
      renderer.render(blockData, cameraState, currentLevel);
    } catch (error) {
      console.error(`Error rendering ${this.currentView} view:`, error);
      
      // If 3D view fails, try to reinitialize it
      if (this.currentView === '3d') {
        console.log('Attempting to reinitialize 3D renderer...');
        this.reinitialize3DRenderer();
      }
    }
    
    // Update inactive views if enabled
    if (this.settings.updateInactiveViews) {
      this.updateInactiveViews(blockData, cameraStates, currentLevel);
    }
  }

  /**
   * Reinitialize 3D renderer if it fails
   */
  reinitialize3DRenderer() {
    const threeDCanvas = this.canvases.get('3d');
    if (threeDCanvas && typeof THREE !== 'undefined') {
      try {
        const oldRenderer = this.renderers.get('3d');
        if (oldRenderer && oldRenderer.dispose) {
          oldRenderer.dispose();
        }
        
        const newRenderer = new ThreeDRenderer(threeDCanvas);
        this.renderers.set('3d', newRenderer);
        console.log('3D renderer reinitialized successfully');
      } catch (error) {
        console.error('Failed to reinitialize 3D renderer:', error);
      }
    }
  }

  /**
   * Update inactive views (for performance, usually disabled)
   */
  updateInactiveViews(blockData, cameraStates, currentLevel) {
    for (const [viewType, renderer] of this.renderers) {
      if (viewType !== this.currentView) {
        const cameraState = cameraStates[viewType];
        try {
          // Auto-center elevation views on first render or when block data changes
          if (this.shouldAutoCenterElevationView(viewType, renderer, blockData)) {
            this.autoCenterElevationView(viewType, renderer, blockData);
          }
          
          renderer.render(blockData, cameraState, currentLevel);
        } catch (error) {
          console.error(`Error updating ${viewType} view:`, error);
        }
      }
    }
  }

  /**
   * Check if elevation view should be auto-centered
   */
  shouldAutoCenterElevationView(viewType, renderer, blockData) {
    // Only auto-center elevation views
    if (!['north', 'south', 'east', 'west'].includes(viewType)) {
      return false;
    }
    
    // Check if this is the first render or if block data has changed significantly
    if (!renderer.hasBeenCentered) {
      return true;
    }
    
    // Check if block count has changed significantly (indicating new blocks placed)
    const currentBlockCount = blockData ? blockData.getBlockCount() : 0;
    if (Math.abs(currentBlockCount - (renderer.lastBlockCount || 0)) > 5) {
      return true;
    }
    
    return false;
  }

  /**
   * Auto-center an elevation view on the placed blocks
   */
  autoCenterElevationView(viewType, renderer, blockData) {
    if (!renderer.resetView || !blockData) return;
    
    try {
      console.log(`Auto-centering ${viewType} elevation view...`);
      renderer.resetView(blockData);
      
      // Mark as centered and store block count
      renderer.hasBeenCentered = true;
      renderer.lastBlockCount = blockData.getBlockCount();
      
      console.log(`${viewType} elevation view auto-centered successfully`);
    } catch (error) {
      console.error(`Failed to auto-center ${viewType} elevation view:`, error);
    }
  }

  /**
   * Force update of current view
   */
  forceUpdateCurrentView() {
    const renderer = this.renderers.get(this.currentView);
    if (renderer && renderer.forceUpdate) {
      renderer.forceUpdate();
    }
  }

  /**
   * Manually trigger auto-centering of all elevation views
   */
  centerAllElevationViews() {
    if (!this.appStateManager || !this.appStateManager.blockDataManager) {
      console.warn('Cannot center elevation views: no block data available');
      return;
    }
    
    const blockData = this.appStateManager.blockDataManager;
    
    ['north', 'south', 'east', 'west'].forEach(direction => {
      const renderer = this.renderers.get(direction);
      if (renderer && renderer.resetView) {
        try {
          console.log(`Manually centering ${direction} elevation view...`);
          renderer.resetView(blockData);
          renderer.hasBeenCentered = true;
          renderer.lastBlockCount = blockData.getBlockCount();
          console.log(`${direction} elevation view centered successfully`);
        } catch (error) {
          console.error(`Failed to center ${direction} elevation view:`, error);
        }
      }
    });
  }

  /**
   * Handle resize events
   */
  onResize() {
    // Update all canvas sizes
    this.canvases.forEach((canvas, viewType) => {
      this.setupCanvas(canvas);
      
      const renderer = this.renderers.get(viewType);
      if (renderer && renderer.onResize) {
        const rect = canvas.getBoundingClientRect();
        renderer.onResize(rect.width, rect.height);
      }
    });
  }

  /**
   * Get current renderer
   */
  getCurrentRenderer() {
    // Use the app state manager's current view if available
    const currentView = this.appStateManager ? this.appStateManager.getCurrentView() : this.currentView;
    return this.renderers.get(currentView);
  }

  /**
   * Get renderer for specific view
   */
  getRenderer(viewType) {
    return this.renderers.get(viewType);
  }

  /**
   * Get current canvas
   */
  getCurrentCanvas() {
    // Use the app state manager's current view if available
    const currentView = this.appStateManager ? this.appStateManager.getCurrentView() : this.currentView;
    return this.canvases.get(currentView);
  }

  /**
   * Update cursor position across views
   */
  updateCursorPosition(x, y, z) {
    this.cursorPosition = { x, y, z };
    
    if (this.settings.syncCursorAcrossViews) {
      // Update cursor visualization in other views
      this.syncCursorAcrossViews();
    }
    
    // Emit cursor change event
    this.onCursorChanged(x, y, z);
  }

  /**
   * Sync cursor position across all views
   */
  syncCursorAcrossViews() {
    const { x, y, z } = this.cursorPosition;
    
    // Update cursor indicators in all renderers
    this.renderers.forEach((renderer, viewType) => {
      if (viewType !== this.currentView && renderer.updateCursorPosition) {
        // Convert coordinates to view-specific coordinate system
        const viewCoords = this.convertCoordinatesForView(x, y, z, viewType);
        renderer.updateCursorPosition(viewCoords.x, viewCoords.y, viewCoords.z);
      }
    });
  }

  /**
   * Update selected blocks across views
   */
  updateSelectedBlocks(blockSet) {
    this.selectedBlocks = new Set(blockSet);
    
    // Update selection visualization in all views
    this.renderers.forEach(renderer => {
      if (renderer.updateSelection) {
        renderer.updateSelection(this.selectedBlocks);
      }
    });
  }

  /**
   * Convert coordinates between views
   */
  convertCoordinates(fromView, toView, coordinates) {
    // Convert coordinates from one view space to another
    // This is useful for maintaining cursor position when switching views
    
    if (fromView === toView) {
      return coordinates;
    }
    
    // For now, return as-is
    // Full implementation would handle coordinate system transformations
    return coordinates;
  }

  /**
   * Convert world coordinates for a specific view
   */
  convertCoordinatesForView(x, y, z, viewType) {
    // Convert 3D world coordinates to view-specific coordinates
    switch (viewType) {
      case 'top':
        return { x, y, z };
      case '3d':
        return { x, y, z };
      case 'north':
        return { x: x, y: z, z: y };
      case 'south':
        return { x: 99 - x, y: z, z: 99 - y };
      case 'east':
        return { x: y, y: z, z: 99 - x };
      case 'west':
        return { x: 99 - y, y: z, z: x };
      default:
        return { x, y, z };
    }
  }

  /**
   * Get world position from screen coordinates in current view
   */
  screenToWorld(screenX, screenY) {
    const renderer = this.getCurrentRenderer();
    if (renderer && renderer.screenToWorld) {
      return renderer.screenToWorld(screenX, screenY);
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Get screen position from world coordinates in current view
   */
  worldToScreen(worldX, worldY, worldZ) {
    const renderer = this.getCurrentRenderer();
    if (renderer && renderer.worldToScreen) {
      return renderer.worldToScreen(worldX, worldY, worldZ);
    }
    return { x: 0, y: 0 };
  }

  /**
   * Check if current view is compatible with a tool
   */
  isCurrentViewCompatibleWith(tool) {
    if (!tool || !tool.isCompatibleWithView) {
      return true; // Assume compatible if no check available
    }
    
    return tool.isCompatibleWithView(this.currentView);
  }

  /**
   * Get available views
   */
  getAvailableViews() {
    return Array.from(this.renderers.keys());
  }

  /**
   * Event handler for view changes
   */
  onViewChanged(newView) {
    // Emit event for other systems to handle
    const event = new CustomEvent('viewChanged', {
      detail: { 
        previous: this.currentView,
        current: newView,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Event handler for cursor changes
   */
  onCursorChanged(x, y, z) {
    // Emit cursor change event
    const event = new CustomEvent('cursorChanged', {
      detail: { x, y, z, timestamp: Date.now() }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    const renderer = this.getCurrentRenderer();
    if (renderer && renderer.screenToWorld) {
      // Ensure the renderer has the latest camera state
      this.updateRendererCameraState();
      return renderer.screenToWorld(screenX, screenY);
    }
    
    // Fallback: use camera controller directly if available
    if (this.appStateManager && this.appStateManager.cameraController) {
      return this.appStateManager.cameraController.screenToWorld(screenX, screenY, this.currentView);
    }
    
    // Last resort fallback
    return { x: screenX, y: screenY };
  }

  /**
   * Update the current renderer with the latest camera state
   */
  updateRendererCameraState() {
    const renderer = this.getCurrentRenderer();
    if (!renderer) return;

    // Get camera state from connected app state manager
    if (this.appStateManager && this.appStateManager.cameraController) {
      const cameraState = this.appStateManager.cameraController.getCameraForView(this.currentView);
      if (cameraState && renderer.updateCamera) {
        renderer.updateCamera(cameraState);
      } else if (cameraState) {
        // Direct camera assignment if updateCamera method doesn't exist
        renderer.camera = cameraState;
      }
    }
  }

  /**
   * Get camera state for current view
   */
  getCameraState() {
    // Try to get camera state from app state manager
    if (this.appStateManager && this.appStateManager.cameraStates) {
      return this.appStateManager.cameraStates[this.currentView] || { zoom: 1.0, offsetX: 0, offsetY: 0 };
    }
    
    // Fallback default state
    return { zoom: 1.0, offsetX: 0, offsetY: 0 };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Apply settings to renderers
    this.renderers.forEach(renderer => {
      if (renderer.updateSettings) {
        renderer.updateSettings(newSettings);
      }
    });
  }

  /**
   * Get statistics for all views
   */
  getStats() {
    const stats = {
      currentView: this.currentView,
      isTransitioning: this.isTransitioning,
      availableViews: this.getAvailableViews(),
      rendererStats: {}
    };
    
    // Get stats from each renderer
    this.renderers.forEach((renderer, viewType) => {
      if (renderer.getStats) {
        stats.rendererStats[viewType] = renderer.getStats();
      }
    });
    
    return stats;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    console.log('Disposing ViewManager...');
    
    // Dispose of all renderers
    this.renderers.forEach(renderer => {
      if (renderer.dispose) {
        renderer.dispose();
      }
    });
    
    // Clear references
    this.renderers.clear();
    this.canvases.clear();
    this.selectedBlocks.clear();
    
    console.log('ViewManager disposed');
  }
}
