/**
 * MinecraftCAD - Main Application Entry Point
 * Initializes and coordinates all systems
 */

import { BlockDataManager } from './src/core/BlockDataManager.js';
import { AppStateManager } from './src/core/AppStateManager.js';
import { ViewManager } from './src/rendering/ViewManager.js';
import { CameraController } from './src/input/CameraController.js';
import { InputController } from './src/input/InputController.js';
import { ToolManager } from './src/tools/ToolManager.js';
import { UIManager } from './src/ui/UIManager.js';
import { coordinateSystem } from './src/utils/CoordinateSystem.js';

class MinecraftCAD {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    
    // Core systems
    this.blockDataManager = null;
    this.appStateManager = null;
    
    // Coordinate system
    this.coordinateSystem = coordinateSystem;
    
    // Rendering
    this.viewManager = null;
    
    // Input and tools
    this.cameraController = null;
    this.inputController = null;
    this.toolManager = null;
    
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
    
    // Block data management
    this.blockDataManager = new BlockDataManager();
    
    // Application state management
    this.appStateManager = new AppStateManager();
    
    console.log('Core systems initialized');
  }

  /**
   * Initialize rendering systems
   */
  initializeRendering() {
    console.log('Initializing rendering systems...');
    
    // Initialize view manager (handles all renderers)
    this.viewManager = new ViewManager();
    
    console.log('Rendering systems initialized');
  }

  /**
   * Initialize input and tools
   */
  initializeInput() {
    console.log('Initializing input and tools...');
    
    // Camera controller
    this.cameraController = new CameraController();
    
    // Initialize tool manager
    this.toolManager = new ToolManager();
    
    // Input controller
    this.inputController = new InputController(this.appStateManager, this.viewManager);
    this.inputController.connect(this.cameraController, this.toolManager);
    this.inputController.connectToAppState();
    
    console.log('Input and tools initialized');
  }

  /**
   * This method is no longer needed - ToolManager handles tool initialization
   */

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
    
    console.log('Using coordinate system with block size:', this.coordinateSystem.getBlockSize());
    
    // Connect tool manager to other systems
    this.toolManager.connect(
      this.appStateManager,
      this.blockDataManager,
      this.inputController,
      this.uiManager
    );
    
    // Connect app state manager to other systems
    this.appStateManager.connect(
      this.blockDataManager,
      this.viewManager,
      this.toolManager,
      this.inputController,
      this.cameraController
    );
    
    // Set up event listeners for render requests
    this.appStateManager.on('renderRequested', () => {
      this.requestRender();
    });

    // Set up event listeners for immediate render requests (for panning)
    this.appStateManager.on('immediateRender', () => {
      this.immediateRender();
    });
    
    // Set up camera controller with initial viewport
    const canvas = this.viewManager.getCurrentCanvas();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      this.cameraController.setViewport(0, 0, rect.width, rect.height);
      
      // Initialize camera to center of the viewport  
      this.cameraController.resetView('top');
    }
    
    // Set up tool button handlers
    this.setupToolButtons();
    
    // Set up keyboard event handlers
    this.setupKeyboardHandlers();
    
    console.log('Systems connected');
  }

  /**
   * Set up tool button event handlers
   */
  setupToolButtons() {
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    
    toolButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const toolName = button.getAttribute('data-tool');
        
        // Only switch to implemented tools
        if (this.toolManager.getTool(toolName)) {
          // Remove active class from all buttons
          toolButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          button.classList.add('active');
          
          // Switch to the selected tool
          this.toolManager.setCurrentTool(toolName);
          
          // Update status bar
          this.updateStatusBar();
        } else {
          console.log(`Tool '${toolName}' not yet implemented`);
        }
      });
    });
    
    // Set up tool change listener to update UI
    this.toolManager.addToolChangeListener((toolName) => {
      this.updateToolButtonStates(toolName);
      this.updateStatusBar();
    });
  }

  /**
   * Update tool button visual states
   */
  updateToolButtonStates(activeTool) {
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    
    toolButtons.forEach(button => {
      const toolName = button.getAttribute('data-tool');
      if (toolName === activeTool) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  /**
   * Update status bar with current tool info
   */
  updateStatusBar() {
    const statusElement = document.querySelector('.status-text');
    if (statusElement && this.toolManager) {
      statusElement.textContent = this.toolManager.getCurrentToolStatus();
    }
  }

  /**
   * Set up keyboard event handlers
   */
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      if (this.toolManager) {
        this.toolManager.onKeyDown(event);
      }
    });

    document.addEventListener('keyup', (event) => {
      if (this.toolManager) {
        this.toolManager.onKeyUp(event);
      }
    });
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
    const currentView = this.appStateManager?.currentView || 'top';
    const currentLevel = this.appStateManager?.currentLevel || 0;
    const cameraStates = this.cameraController ? {
      ...this.cameraController.camera2D,
      '3d': this.cameraController.camera3D
    } : {};
    
    // Render current view
    if (this.viewManager && this.blockDataManager) {
      this.viewManager.render(this.blockDataManager, cameraStates, currentLevel);
      
      // Render tool overlays
      if (this.toolManager && this.toolManager.getCurrentTool()) {
        const currentTool = this.toolManager.getCurrentTool();
        if (currentTool && this.toolManager.getCurrentTool().renderOverlay) {
          const currentRenderer = this.viewManager.getCurrentRenderer();
          if (currentTool && currentRenderer) {
            currentTool.renderOverlay(currentRenderer);
          }
        }
      }
    }
  }

  /**
   * Immediate render method for responsive interactions (panning, etc.)
   */
  immediateRender() {
    if (!this.isRunning) return;
    
    // Get current view and camera state
    const currentView = this.appStateManager?.currentView || 'top';
    const currentLevel = this.appStateManager?.currentLevel || 0;
    const cameraStates = this.cameraController ? {
      ...this.cameraController.camera2D,
      '3d': this.cameraController.camera3D
    } : {};
    
    // Render current view immediately
    if (this.viewManager && this.blockDataManager) {
      this.viewManager.render(this.blockDataManager, cameraStates, currentLevel);
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
    if (this.toolManager) {
      return this.toolManager.setCurrentTool(toolName);
    }
    return false;
  }

  getCurrentTool() {
    if (this.toolManager) {
      return this.toolManager.getCurrentTool();
    }
    return null;
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
    // Update view manager (handles all canvas resizing)
    if (this.viewManager) {
      this.viewManager.onResize();
    }
    
    // Update camera controller viewport
    const canvas = this.viewManager ? this.viewManager.getCurrentCanvas() : null;
    if (canvas && this.cameraController) {
      const rect = canvas.getBoundingClientRect();
      this.cameraController.setViewport(0, 0, rect.width, rect.height);
      
      // Recenter camera after resize
      this.cameraController.resetView(this.appStateManager?.currentView || 'top');
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
    
    // Dispose of tool manager
    if (this.toolManager) {
      this.toolManager.destroy();
    }
    
    // Dispose of view manager
    if (this.viewManager) {
      this.viewManager.dispose();
    }
    
    if (this.appStateManager) {
      this.appStateManager.dispose();
    }
    
    if (this.blockDataManager) {
      this.blockDataManager.clear();
    }
    
    // Memory manager disposal removed
    
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
