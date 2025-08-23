/**
 * MinecraftCAD - Input Controller
 * Handles all mouse, keyboard, and touch input with proper event delegation
 */

import { MathUtils } from '../utils/MathUtils.js';

export class InputController {
  constructor(appStateManager, renderers) {
    this.appStateManager = appStateManager;
    this.renderers = renderers || new Map();
    this.cameraController = null;
    this.currentTool = null;
    
    // Input state
    this.mouse = {
      x: 0,
      y: 0,
      isDown: false,
      button: -1,
      startX: 0,
      startY: 0
    };
    
    this.keyboard = {
      keys: new Set(),
      modifiers: {
        shift: false,
        ctrl: false,
        alt: false
      }
    };
    
    // Touch support
    this.touch = {
      isActive: false,
      touches: [],
      startDistance: 0,
      startMidpoint: { x: 0, y: 0 }
    };
    
    // Gesture recognition
    this.gestures = {
      isPanning: false,
      isZooming: false,
      panThreshold: 5,
      zoomThreshold: 10
    };
    
    // Canvas reference
    this.canvas = null;
    
    // Event listeners storage for cleanup
    this.eventListeners = [];
    
    this.setupEventListeners();
  }

  /**
   * Connect camera controller and tool manager
   */
  connect(cameraController, toolManager) {
    this.cameraController = cameraController;
    this.toolManager = toolManager;
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    this.canvas = document.getElementById('main-canvas');
    
    if (!this.canvas) {
      console.warn('Main canvas not found, input controller disabled');
      return;
    }
    
    // Mouse events
    this.addEventListeners(this.canvas, [
      ['mousedown', this.handleMouseDown.bind(this)],
      ['mousemove', this.handleMouseMove.bind(this)],
      ['mouseup', this.handleMouseUp.bind(this)],
      ['wheel', this.handleWheel.bind(this)],
      ['contextmenu', this.handleContextMenu.bind(this)]
    ]);
    
    // Touch events
    this.addEventListeners(this.canvas, [
      ['touchstart', this.handleTouchStart.bind(this)],
      ['touchmove', this.handleTouchMove.bind(this)],
      ['touchend', this.handleTouchEnd.bind(this)]
    ]);
    
    // Keyboard events (on document for global capture)
    this.addEventListeners(document, [
      ['keydown', this.handleKeyDown.bind(this)],
      ['keyup', this.handleKeyUp.bind(this)]
    ]);
    
    // Window events
    this.addEventListeners(window, [
      ['resize', this.handleResize.bind(this)],
      ['blur', this.handleWindowBlur.bind(this)]
    ]);
    
    // UI events
    this.setupUIEventListeners();
  }

  /**
   * Setup UI event listeners for buttons and controls
   */
  setupUIEventListeners() {
    // Tool buttons
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
      this.addEventListeners(button, [
        ['click', (event) => {
          const toolType = button.dataset.tool;
          if (toolType) {
            this.appStateManager.setActiveTool(toolType);
          }
        }]
      ]);
    });
    
    // View buttons
    const viewButtons = document.querySelectorAll('.view-button');
    viewButtons.forEach(button => {
      this.addEventListeners(button, [
        ['click', (event) => {
          const viewType = button.dataset.view;
          if (viewType) {
            this.appStateManager.setCurrentView(viewType);
          }
        }]
      ]);
    });
    
    // Block type selection
    const blockItems = document.querySelectorAll('.block-item');
    blockItems.forEach(item => {
      this.addEventListeners(item, [
        ['click', (event) => {
          const blockType = item.dataset.blockType;
          if (blockType) {
            this.appStateManager.setCurrentBlockType(blockType);
          }
        }]
      ]);
    });
    
    // Height level controls
    const levelUpBtn = document.getElementById('level-up');
    const levelDownBtn = document.getElementById('level-down');
    
    if (levelUpBtn) {
      this.addEventListeners(levelUpBtn, [
        ['click', () => {
          const currentLevel = this.appStateManager.currentLevel;
          this.appStateManager.setCurrentLevel(currentLevel + 1);
        }]
      ]);
    }
    
    if (levelDownBtn) {
      this.addEventListeners(levelDownBtn, [
        ['click', () => {
          const currentLevel = this.appStateManager.currentLevel;
          this.appStateManager.setCurrentLevel(currentLevel - 1);
        }]
      ]);
    }
  }

  /**
   * Helper to add event listeners and track them for cleanup
   */
  addEventListeners(element, events) {
    events.forEach(([event, handler]) => {
      element.addEventListener(event, handler);
      this.eventListeners.push({ element, event, handler });
    });
  }

  /**
   * Handle mouse down events
   */
  handleMouseDown(event) {
    event.preventDefault();
    
    this.mouse.isDown = true;
    this.mouse.button = event.button;
    this.mouse.startX = event.clientX;
    this.mouse.startY = event.clientY;
    
    this.updateMousePosition(event);
    this.updateKeyboardModifiers(event);
    
    const worldPos = this.getWorldPosition(event);
    
    // Handle different mouse buttons
    switch (event.button) {
      case 0: // Left button
        this.handleLeftMouseDown(worldPos, event);
        break;
      case 1: // Middle button
        this.handleMiddleMouseDown(worldPos, event);
        break;
      case 2: // Right button
        this.handleRightMouseDown(worldPos, event);
        break;
    }
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event) {
    this.updateMousePosition(event);
    this.updateKeyboardModifiers(event);
    
    const worldPos = this.getWorldPosition(event);
    
    // Update cursor coordinates in UI
    this.updateCursorDisplay(worldPos);
    
    if (this.mouse.isDown) {
      const deltaX = event.clientX - this.mouse.startX;
      const deltaY = event.clientY - this.mouse.startY;
      
      // Detect gestures
      this.detectGestures(deltaX, deltaY);
      
      if (this.gestures.isPanning) {
        this.handlePanning(deltaX, deltaY);
      } else if (this.currentTool) {
        this.currentTool.handleMouseMove(worldPos, event);
      }
    } else if (this.currentTool) {
      // Tool hover/preview
      this.currentTool.handleMouseMove(worldPos, event);
    }
  }

  /**
   * Handle mouse up events
   */
  handleMouseUp(event) {
    this.updateMousePosition(event);
    this.updateKeyboardModifiers(event);
    
    const worldPos = this.getWorldPosition(event);
    
    if (this.gestures.isPanning) {
      this.gestures.isPanning = false;
    } else if (this.currentTool) {
      this.currentTool.handleMouseUp(worldPos, event);
    }
    
    this.mouse.isDown = false;
    this.mouse.button = -1;
  }

  /**
   * Handle wheel events (zoom)
   */
  handleWheel(event) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const centerX = event.clientX - this.canvas.getBoundingClientRect().left;
    const centerY = event.clientY - this.canvas.getBoundingClientRect().top;
    
    if (this.cameraController) {
      this.cameraController.zoom(delta, centerX, centerY);
    }
    
    // Trigger re-render
    this.requestRender();
  }

  /**
   * Handle left mouse button
   */
  handleLeftMouseDown(worldPos, event) {
    if (this.currentTool) {
      this.currentTool.handleMouseDown(worldPos, event);
    }
  }

  /**
   * Handle middle mouse button (pan)
   */
  handleMiddleMouseDown(worldPos, event) {
    this.gestures.isPanning = true;
  }

  /**
   * Handle right mouse button
   */
  handleRightMouseDown(worldPos, event) {
    // Could be used for context menu or alternate tool action
    if (this.currentTool && this.currentTool.handleRightClick) {
      this.currentTool.handleRightClick(worldPos, event);
    }
  }

  /**
   * Handle panning gesture
   */
  handlePanning(deltaX, deltaY) {
    if (this.cameraController) {
      this.cameraController.pan(deltaX, deltaY);
    }
    
    // Update start position for continuous panning
    this.mouse.startX += deltaX;
    this.mouse.startY += deltaY;
    
    // Trigger re-render
    this.requestRender();
  }

  /**
   * Detect pan/zoom gestures
   */
  detectGestures(deltaX, deltaY) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (!this.gestures.isPanning && distance > this.gestures.panThreshold) {
      if (this.mouse.button === 1 || this.keyboard.modifiers.alt) {
        this.gestures.isPanning = true;
      }
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    
    this.keyboard.keys.add(key);
    this.updateKeyboardModifiers(event);
    
    // Handle global shortcuts first
    if (this.handleGlobalShortcuts(key, event)) {
      return;
    }
    
    // Pass to current tool
    if (this.currentTool) {
      if (this.currentTool.handleKeyDown(key, event)) {
        return;
      }
    }
    
    // Handle view-specific shortcuts
    this.handleViewShortcuts(key, event);
  }

  /**
   * Handle key up events
   */
  handleKeyUp(event) {
    const key = event.key.toLowerCase();
    
    this.keyboard.keys.delete(key);
    this.updateKeyboardModifiers(event);
    
    if (this.currentTool && this.currentTool.handleKeyUp) {
      this.currentTool.handleKeyUp(key, event);
    }
  }

  /**
   * Handle global keyboard shortcuts
   */
  handleGlobalShortcuts(key, event) {
    // Prevent default for handled shortcuts
    const handled = true;
    
    switch (key) {
      case 'escape':
        if (this.currentTool) {
          this.currentTool.cancel();
        }
        return handled;
        
      case 'z':
        if (this.keyboard.modifiers.ctrl) {
          if (this.keyboard.modifiers.shift) {
            // Redo
            this.appStateManager.blockDataManager?.redo();
          } else {
            // Undo
            this.appStateManager.blockDataManager?.undo();
          }
          this.requestRender();
          return handled;
        }
        break;
        
      case 's':
        if (this.keyboard.modifiers.ctrl) {
          event.preventDefault();
          this.saveProject();
          return handled;
        }
        break;
        
      case 'o':
        if (this.keyboard.modifiers.ctrl) {
          event.preventDefault();
          this.loadProject();
          return handled;
        }
        break;
    }
    
    return false;
  }

  /**
   * Handle view-specific shortcuts
   */
  handleViewShortcuts(key, event) {
    switch (key) {
      case '1':
        this.appStateManager.setCurrentView('top');
        break;
      case '2':
        this.appStateManager.setCurrentView('3d');
        break;
      case '3':
        this.appStateManager.setCurrentView('north');
        break;
      case '4':
        this.appStateManager.setCurrentView('south');
        break;
      case '5':
        this.appStateManager.setCurrentView('east');
        break;
      case '6':
        this.appStateManager.setCurrentView('west');
        break;
      case 'pageup':
        event.preventDefault();
        this.appStateManager.setCurrentLevel(this.appStateManager.currentLevel + 1);
        break;
      case 'pagedown':
        event.preventDefault();
        this.appStateManager.setCurrentLevel(this.appStateManager.currentLevel - 1);
        break;
    }
  }

  /**
   * Touch event handlers
   */
  handleTouchStart(event) {
    event.preventDefault();
    
    this.touch.isActive = true;
    this.touch.touches = Array.from(event.touches);
    
    if (this.touch.touches.length === 2) {
      // Two finger gesture - prepare for zoom/pan
      this.touch.startDistance = this.getTouchDistance();
      this.touch.startMidpoint = this.getTouchMidpoint();
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    
    if (!this.touch.isActive) return;
    
    this.touch.touches = Array.from(event.touches);
    
    if (this.touch.touches.length === 2) {
      // Two finger zoom/pan
      const currentDistance = this.getTouchDistance();
      const currentMidpoint = this.getTouchMidpoint();
      
      // Zoom
      if (Math.abs(currentDistance - this.touch.startDistance) > this.gestures.zoomThreshold) {
        const zoomFactor = currentDistance / this.touch.startDistance;
        if (this.cameraController) {
          this.cameraController.zoom(zoomFactor, currentMidpoint.x, currentMidpoint.y);
        }
        this.touch.startDistance = currentDistance;
      }
      
      // Pan
      const deltaX = currentMidpoint.x - this.touch.startMidpoint.x;
      const deltaY = currentMidpoint.y - this.touch.startMidpoint.y;
      
      if (Math.abs(deltaX) > this.gestures.panThreshold || Math.abs(deltaY) > this.gestures.panThreshold) {
        if (this.cameraController) {
          this.cameraController.pan(deltaX, deltaY);
        }
        this.touch.startMidpoint = currentMidpoint;
      }
      
      this.requestRender();
    }
  }

  handleTouchEnd(event) {
    event.preventDefault();
    
    this.touch.isActive = false;
    this.touch.touches = [];
  }

  /**
   * Touch helper methods
   */
  getTouchDistance() {
    if (this.touch.touches.length < 2) return 0;
    
    const touch1 = this.touch.touches[0];
    const touch2 = this.touch.touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }

  getTouchMidpoint() {
    if (this.touch.touches.length < 2) return { x: 0, y: 0 };
    
    const touch1 = this.touch.touches[0];
    const touch2 = this.touch.touches[1];
    
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  /**
   * Utility methods
   */
  updateMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  updateKeyboardModifiers(event) {
    this.keyboard.modifiers.shift = event.shiftKey;
    this.keyboard.modifiers.ctrl = event.ctrlKey || event.metaKey;
    this.keyboard.modifiers.alt = event.altKey;
  }

  getWorldPosition(event) {
    if (!this.cameraController) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    return this.cameraController.screenToWorld(screenX, screenY);
  }

  updateCursorDisplay(worldPos) {
    const gridPos = this.worldToGrid(worldPos);
    
    // Update coordinate display in status bar
    const cursorX = document.getElementById('cursor-x');
    const cursorY = document.getElementById('cursor-y');
    
    if (cursorX) cursorX.textContent = `X: ${gridPos.x}`;
    if (cursorY) cursorY.textContent = `Y: ${gridPos.y}`;
  }

  worldToGrid(worldPos) {
    const gridSize = 20;
    return {
      x: Math.floor(worldPos.x / gridSize),
      y: Math.floor(worldPos.y / gridSize)
    };
  }

  /**
   * Event handlers
   */
  handleContextMenu(event) {
    event.preventDefault(); // Disable right-click context menu
  }

  handleResize(event) {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      
      // Update camera controller viewport
      if (this.cameraController) {
        this.cameraController.setViewport(0, 0, rect.width, rect.height);
      }
      
      // Notify renderers
      for (const renderer of this.renderers.values()) {
        if (renderer.onResize) {
          renderer.onResize(rect.width, rect.height);
        }
      }
      
      this.requestRender();
    }
  }

  handleWindowBlur(event) {
    // Clear keyboard state when window loses focus
    this.keyboard.keys.clear();
    this.keyboard.modifiers = { shift: false, ctrl: false, alt: false };
  }

  /**
   * Tool management
   */
  setCurrentTool(tool) {
    if (this.currentTool) {
      this.currentTool.deactivate();
    }
    
    this.currentTool = tool;
    
    if (this.currentTool) {
      this.currentTool.activate();
    }
  }

  /**
   * Project management
   */
  saveProject() {
    if (this.appStateManager) {
      const data = this.appStateManager.exportProject();
      
      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.appStateManager.projectInfo.name || 'project'}.mcd`;
      a.click();
      
      URL.revokeObjectURL(url);
    }
  }

  loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mcd,.json';
    
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (this.appStateManager) {
            this.appStateManager.importProject(data);
            this.requestRender();
          }
        } catch (error) {
          console.error('Failed to load project:', error);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * Rendering
   */
  requestRender() {
    // Request a render update
    if (this.appStateManager) {
      this.appStateManager.emit('renderRequested');
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    
    this.eventListeners = [];
    this.currentTool = null;
    this.cameraController = null;
  }
}
