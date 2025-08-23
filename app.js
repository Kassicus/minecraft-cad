/**
 * MinecraftCAD - Main Application Entry Point
 * Initializes and coordinates all systems
 */

import { MemoryManager } from './src/core/MemoryManager.js';
import { BlockDataManager } from './src/core/BlockDataManager.js';
import { AppStateManager } from './src/core/AppStateManager.js';
import { TopViewRenderer } from './src/rendering/TopViewRenderer.js';
import { CameraController } from './src/input/CameraController.js';
import { InputController } from './src/input/InputController.js';
import { BlockPlacementTool } from './src/tools/BlockPlacementTool.js';
import { UIManager } from './src/ui/UIManager.js';

class MinecraftCAD {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    
    // Core systems
    this.memoryManager = null;
    this.blockDataManager = null;
    this.appStateManager = null;
    
    // Rendering
    this.renderers = new Map();
    
    // Input and tools
    this.cameraController = null;
    this.inputController = null;
    this.tools = new Map();
    this.currentTool = null;
    
    // UI
    this.uiManager = null;
    
    // Render loop
    this.renderLoopId = null;
    this.lastRenderTime = 0;
    this.targetFPS = 60;
    
    // Performance monitoring
    this.performance = {
      frameCount: 0,
      lastFPSUpdate: 0,
      currentFPS: 0
    };
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing MinecraftCAD...');
    
    try {
      // Wait for DOM to be ready
      await this.waitForDOM();
      
      // Initialize core systems
      this.initializeCore();
      
      // Initialize rendering
      this.initializeRendering();
      
      // Initialize input and tools
      this.initializeInput();
      
      // Initialize UI
      this.initializeUI();
      
      // Wire up the systems
      this.connectSystems();
      
      // Load saved state if available
      this.loadSavedState();
      
      // Start render loop
      this.startRenderLoop();
      
      this.isInitialized = true;
      this.isRunning = true;
      
      console.log('MinecraftCAD initialized successfully');
      
      // Show welcome message
      if (this.uiManager) {
        this.uiManager.showNotification('MinecraftCAD ready!', 'success');
      }
      
    } catch (error) {
      console.error('Failed to initialize MinecraftCAD:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Wait for DOM to be ready
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialize core systems
   */
  initializeCore() {
    console.log('Initializing core systems...');
    
    // Memory management
    this.memoryManager = new MemoryManager();
    
    // Block data management
    this.blockDataManager = new BlockDataManager(this.memoryManager);
    
    // Application state management
    this.appStateManager = new AppStateManager();
    
    console.log('Core systems initialized');
  }

  /**
   * Initialize rendering systems
   */
  initializeRendering() {
    console.log('Initializing rendering systems...');
    
    // Get canvas element
    const canvas = document.getElementById('main-canvas');
    if (!canvas) {
      throw new Error('Main canvas element not found');
    }
    
    // Initialize top view renderer
    const topRenderer = new TopViewRenderer(canvas);
    this.renderers.set('top', topRenderer);
    
    // TODO: Initialize other renderers (3D, elevation views) in future phases
    
    console.log('Rendering systems initialized');
  }

  /**
   * Initialize input and tools
   */
  initializeInput() {
    console.log('Initializing input and tools...');
    
    // Camera controller
    this.cameraController = new CameraController();
    
    // Input controller
    this.inputController = new InputController(this.appStateManager, this.renderers);
    this.inputController.connect(this.cameraController, this);
    
    // Initialize tools
    this.initializeTools();
    
    // Set default tool
    this.setActiveTool('place');
    
    console.log('Input and tools initialized');
  }

  /**
   * Initialize all tools
   */
  initializeTools() {
    // Block placement tool
    const placementTool = new BlockPlacementTool(this.blockDataManager, this.appStateManager);
    this.tools.set('place', placementTool);
    
    // TODO: Initialize other tools in future phases
    // - Erase tool
    // - Selection tool
    // - Line tool
    // - Rectangle tool
    // - Fill tool
    // - Measure tool
    // - Pan tool
    // - Zoom tool
  }

  /**
   * Initialize UI management
   */
  initializeUI() {
    console.log('Initializing UI...');
    
    this.uiManager = new UIManager(this.appStateManager);
    
    console.log('UI initialized');
  }

  /**
   * Connect all systems together
   */
  connectSystems() {
    console.log('Connecting systems...');
    
    // Connect app state manager to other systems
    this.appStateManager.connect(
      this.blockDataManager,
      this.renderers,
      this, // tool manager
      this.inputController
    );
    
    // Set up event listeners for render requests
    this.appStateManager.on('renderRequested', () => {
      this.requestRender();
    });
    
    // Set up camera controller with initial viewport
    const canvas = document.getElementById('main-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      this.cameraController.setViewport(0, 0, rect.width, rect.height);
    }
    
    console.log('Systems connected');
  }

  /**
   * Load saved state from localStorage
   */
  loadSavedState() {
    try {
      // Load camera states
      if (this.cameraController) {
        this.cameraController.loadStates();
      }
      
      // Try to load auto-saved project
      const autoSave = localStorage.getItem('minecraftcad_autosave');
      if (autoSave) {
        const data = JSON.parse(autoSave);
        if (this.appStateManager.importProject(data)) {
          console.log('Loaded auto-saved project');
          if (this.uiManager) {
            this.uiManager.showNotification('Restored previous session', 'info');
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    console.log('Starting render loop...');
    
    const renderLoop = (currentTime) => {
      this.renderLoopId = requestAnimationFrame(renderLoop);
      
      // Calculate delta time
      const deltaTime = currentTime - this.lastRenderTime;
      
      // Limit to target FPS
      if (deltaTime >= 1000 / this.targetFPS) {
        this.render(deltaTime);
        this.lastRenderTime = currentTime;
        
        // Update performance stats
        this.updatePerformanceStats(currentTime);
      }
    };
    
    this.renderLoopId = requestAnimationFrame(renderLoop);
  }

  /**
   * Main render method
   */
  render(deltaTime) {
    if (!this.isRunning) return;
    
    // Update camera controller (for smooth transitions)
    if (this.cameraController) {
      this.cameraController.update();
    }
    
    // Get current view and camera state
    const currentView = this.appStateManager.currentView;
    const currentLevel = this.appStateManager.currentLevel;
    const cameraState = this.cameraController.getCameraForView(currentView);
    
    // Render current view
    const renderer = this.renderers.get(currentView);
    if (renderer && this.blockDataManager) {
      renderer.render(this.blockDataManager, cameraState, currentLevel);
      
      // Render tool overlays
      if (this.currentTool && this.currentTool.renderOverlay) {
        this.currentTool.renderOverlay(renderer);
      }
    }
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(currentTime) {
    this.performance.frameCount++;
    
    if (currentTime - this.performance.lastFPSUpdate >= 1000) {
      this.performance.currentFPS = this.performance.frameCount;
      this.performance.frameCount = 0;
      this.performance.lastFPSUpdate = currentTime;
      
      // Update FPS display (if debug mode)
      if (window.DEBUG) {
        console.log(`FPS: ${this.performance.currentFPS}`);
      }
    }
  }

  /**
   * Tool management methods (ToolManager interface)
   */
  setActiveTool(toolName) {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      console.warn(`Tool '${toolName}' not found`);
      return false;
    }
    
    // Deactivate current tool
    if (this.currentTool) {
      this.currentTool.deactivate();
    }
    
    // Activate new tool
    this.currentTool = tool;
    this.currentTool.activate();
    
    // Update input controller
    if (this.inputController) {
      this.inputController.setCurrentTool(tool);
    }
    
    return true;
  }

  getCurrentTool() {
    return this.currentTool;
  }

  /**
   * Request a render update
   */
  requestRender() {
    // The render loop handles this automatically
    // This method exists for compatibility with the architecture
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Update camera controller viewport
    if (this.cameraController) {
      this.cameraController.setViewport(0, 0, rect.width, rect.height);
    }
    
    // Update renderers
    for (const renderer of this.renderers.values()) {
      if (renderer.onResize) {
        renderer.onResize(rect.width, rect.height);
      }
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    
    if (this.uiManager) {
      this.uiManager.showError(message);
    } else {
      alert(message); // Fallback
    }
  }

  /**
   * Get application statistics
   */
  getStats() {
    return {
      performance: {
        fps: this.performance.currentFPS,
        isRunning: this.isRunning
      },
      memory: this.memoryManager ? this.memoryManager.getStats() : null,
      blocks: this.blockDataManager ? this.blockDataManager.getStats() : null,
      tools: {
        available: Array.from(this.tools.keys()),
        current: this.currentTool ? this.currentTool.name : null
      }
    };
  }

  /**
   * Pause the application
   */
  pause() {
    this.isRunning = false;
    console.log('MinecraftCAD paused');
  }

  /**
   * Resume the application
   */
  resume() {
    this.isRunning = true;
    console.log('MinecraftCAD resumed');
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    console.log('Disposing MinecraftCAD...');
    
    this.isRunning = false;
    
    // Stop render loop
    if (this.renderLoopId) {
      cancelAnimationFrame(this.renderLoopId);
    }
    
    // Dispose of systems in reverse order
    if (this.uiManager) {
      this.uiManager.dispose();
    }
    
    if (this.inputController) {
      this.inputController.dispose();
    }
    
    if (this.cameraController) {
      this.cameraController.dispose();
    }
    
    // Dispose of tools
    for (const tool of this.tools.values()) {
      tool.dispose();
    }
    this.tools.clear();
    
    // Dispose of renderers
    for (const renderer of this.renderers.values()) {
      renderer.dispose();
    }
    this.renderers.clear();
    
    if (this.appStateManager) {
      this.appStateManager.dispose();
    }
    
    if (this.blockDataManager) {
      this.blockDataManager.clear();
    }
    
    if (this.memoryManager) {
      this.memoryManager.dispose();
    }
    
    console.log('MinecraftCAD disposed');
  }
}

// Global application instance
let app = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  app = new MinecraftCAD();
  await app.initialize();
  
  // Make app globally accessible for debugging
  window.MinecraftCAD = app;
  
  // Handle window resize
  window.addEventListener('resize', () => {
    app.handleResize();
  });
  
  // Handle page unload
  window.addEventListener('beforeunload', () => {
    if (app) {
      app.dispose();
    }
  });
});

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  if (app) {
    app.showError('An unexpected error occurred');
  }
});

export default MinecraftCAD;
