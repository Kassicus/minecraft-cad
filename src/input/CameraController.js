/**
 * MinecraftCAD - Camera Controller
 * Unified camera system that works across all views
 */

export class CameraController {
  constructor() {
    // 2D camera states (top/elevation views)
    this.camera2D = {
      top: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      north: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      south: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      east: { offsetX: 0, offsetY: 0, zoom: 1.0 },
      west: { offsetX: 0, offsetY: 0, zoom: 1.0 }
    };
    
    // 3D camera state (for future 3D view)
    this.camera3D = {
      position: { x: 50, y: 50, z: 25 },
      rotation: { x: -30, y: 45, z: 0 },
      fov: 75,
      near: 0.1,
      far: 1000
    };
    
    // Current active view
    this.currentView = 'top';
    
    // Viewport management
    this.viewport = { x: 0, y: 0, width: 800, height: 600 };
    
    // Pan/zoom constraints
    this.constraints = {
      minZoom: 0.1,
      maxZoom: 10.0,
      maxPanDistance: 5000 // Maximum distance from origin
    };
    
    // Smooth camera transitions
    this.smoothing = {
      enabled: true,
      factor: 0.15, // Interpolation factor for smooth movement
      threshold: 0.01 // Stop smoothing when close enough
    };
    
    // Target state for smooth transitions
    this.targetState = null;
    this.isTransitioning = false;
  }

  /**
   * Set the active view type
   */
  setActiveView(viewType) {
    this.currentView = viewType;
  }

  /**
   * Update viewport dimensions
   */
  setViewport(x, y, width, height) {
    const wasFirstTime = this.viewport.width === 800 && this.viewport.height === 600; // Default values
    this.viewport = { x, y, width, height };
    
    // If this is the first time we're setting real viewport dimensions,
    // initialize cameras to be centered
    if (wasFirstTime) {
      Object.keys(this.camera2D).forEach(viewType => {
        const camera = this.camera2D[viewType];
        camera.offsetX = width / 2;
        camera.offsetY = height / 2;
      });
    }
  }

  /**
   * Get current camera state for the active view
   */
  getCurrentCamera() {
    if (this.currentView === '3d') {
      return { ...this.camera3D };
    } else {
      return { ...this.camera2D[this.currentView] };
    }
  }

  /**
   * Get camera state for a specific view
   */
  getCameraForView(viewType) {
    if (viewType === '3d') {
      return { ...this.camera3D };
    } else {
      return { ...this.camera2D[viewType] };
    }
  }

  /**
   * Pan the camera (for 2D views)
   */
  pan(deltaX, deltaY, viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') {
      // 3D panning would be handled differently
      return;
    }
    
    const camera = this.camera2D[view];
    if (!camera) return;
    
    // Apply pan with constraints
    const newOffsetX = camera.offsetX + deltaX;
    const newOffsetY = camera.offsetY + deltaY;
    
    // Check constraints
    const maxOffset = this.constraints.maxPanDistance;
    
    camera.offsetX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX));
    camera.offsetY = Math.max(-maxOffset, Math.min(maxOffset, newOffsetY));
  }

  /**
   * Zoom the camera
   */
  zoom(factor, centerX = null, centerY = null, viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') {
      // 3D zoom would modify camera position
      return;
    }
    
    const camera = this.camera2D[view];
    if (!camera) return;
    
    const oldZoom = camera.zoom;
    const newZoom = Math.max(
      this.constraints.minZoom, 
      Math.min(this.constraints.maxZoom, oldZoom * factor)
    );
    
    if (newZoom === oldZoom) return;
    
    // If center point provided, zoom towards that point
    if (centerX !== null && centerY !== null) {
      // Calculate world point at center
      const worldX = (centerX - camera.offsetX) / oldZoom;
      const worldY = (centerY - camera.offsetY) / oldZoom;
      
      // Update zoom
      camera.zoom = newZoom;
      
      // Adjust offset to keep world point at same screen position
      camera.offsetX = centerX - worldX * newZoom;
      camera.offsetY = centerY - worldY * newZoom;
    } else {
      // Simple zoom without recentering
      camera.zoom = newZoom;
    }
  }

  /**
   * Set zoom level directly
   */
  setZoom(zoom, viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') return;
    
    const camera = this.camera2D[view];
    if (!camera) return;
    
    camera.zoom = Math.max(
      this.constraints.minZoom,
      Math.min(this.constraints.maxZoom, zoom)
    );
  }

  /**
   * Reset camera to default position
   */
  resetView(viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') {
      this.camera3D = {
        position: { x: 50, y: 50, z: 25 },
        rotation: { x: -30, y: 45, z: 0 },
        fov: 75,
        near: 0.1,
        far: 1000
      };
    } else {
      const camera = this.camera2D[view];
      if (camera) {
        // Reset camera to center of viewport (world origin at viewport center)
        camera.offsetX = this.viewport.width / 2;
        camera.offsetY = this.viewport.height / 2;
        camera.zoom = 1.0;
      }
    }
  }

  /**
   * Fit view to bounds
   */
  fitToBounds(bounds, padding = 0.1, viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') {
      // 3D fitting would position camera to see all blocks
      return;
    }
    
    const camera = this.camera2D[view];
    if (!camera || !bounds) return;
    
    const { minX, minY, maxX, maxY } = bounds;
    
    if (minX === maxX && minY === maxY) {
      // Single point or no bounds - center view
      this.resetView(view);
      return;
    }
    
    // Calculate bounds size
    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    
    // Calculate zoom to fit bounds with padding
    const availableWidth = this.viewport.width * (1 - padding * 2);
    const availableHeight = this.viewport.height * (1 - padding * 2);
    
    const scaleX = availableWidth / boundsWidth;
    const scaleY = availableHeight / boundsHeight;
    
    camera.zoom = Math.max(
      this.constraints.minZoom,
      Math.min(this.constraints.maxZoom, Math.min(scaleX, scaleY))
    );
    
    // Center on bounds
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    camera.offsetX = this.viewport.width / 2 - centerX * camera.zoom;
    camera.offsetY = this.viewport.height / 2 - centerY * camera.zoom;
  }

  /**
   * Smoothly transition to target camera state
   */
  transitionTo(targetCamera, duration = 500, viewType = null) {
    const view = viewType || this.currentView;
    
    if (!this.smoothing.enabled) {
      // Instant transition
      if (view === '3d') {
        this.camera3D = { ...targetCamera };
      } else {
        this.camera2D[view] = { ...targetCamera };
      }
      return;
    }
    
    this.targetState = {
      view,
      camera: { ...targetCamera },
      startTime: Date.now(),
      duration
    };
    
    this.isTransitioning = true;
  }

  /**
   * Update smooth camera transitions
   */
  update() {
    if (!this.isTransitioning || !this.targetState) return;
    
    const now = Date.now();
    const elapsed = now - this.targetState.startTime;
    const progress = Math.min(1, elapsed / this.targetState.duration);
    
    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3);
    
    const view = this.targetState.view;
    const target = this.targetState.camera;
    
    if (view === '3d') {
      const current = this.camera3D;
      
      // Interpolate 3D camera properties
      current.position.x = this.lerp(current.position.x, target.position.x, eased);
      current.position.y = this.lerp(current.position.y, target.position.y, eased);
      current.position.z = this.lerp(current.position.z, target.position.z, eased);
      
      current.rotation.x = this.lerp(current.rotation.x, target.rotation.x, eased);
      current.rotation.y = this.lerp(current.rotation.y, target.rotation.y, eased);
      current.rotation.z = this.lerp(current.rotation.z, target.rotation.z, eased);
    } else {
      const current = this.camera2D[view];
      
      if (current) {
        // Interpolate 2D camera properties
        current.offsetX = this.lerp(current.offsetX, target.offsetX, eased);
        current.offsetY = this.lerp(current.offsetY, target.offsetY, eased);
        current.zoom = this.lerp(current.zoom, target.zoom, eased);
      }
    }
    
    // Check if transition is complete
    if (progress >= 1) {
      this.isTransitioning = false;
      this.targetState = null;
    }
  }

  /**
   * Synchronize cursor positions across views
   */
  syncViews(worldX, worldY) {
    // This would synchronize the cursor position across different views
    // For now, just store the world position for reference
    this.lastWorldPosition = { x: worldX, y: worldY };
  }

  /**
   * Get world position from screen coordinates
   */
  screenToWorld(screenX, screenY, viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') {
      // 3D screen to world conversion would be more complex
      return { x: 0, y: 0, z: 0 };
    }
    
    const camera = this.camera2D[view];
    if (!camera) return { x: 0, y: 0 };
    
    const worldX = (screenX - camera.offsetX) / camera.zoom;
    const worldY = (screenY - camera.offsetY) / camera.zoom;
    
    return { x: worldX, y: worldY };
  }

  /**
   * Get screen position from world coordinates
   */
  worldToScreen(worldX, worldY, viewType = null) {
    const view = viewType || this.currentView;
    
    if (view === '3d') {
      // 3D world to screen conversion would use projection matrix
      return { x: 0, y: 0 };
    }
    
    const camera = this.camera2D[view];
    if (!camera) return { x: 0, y: 0 };
    
    const screenX = worldX * camera.zoom + camera.offsetX;
    const screenY = worldY * camera.zoom + camera.offsetY;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Linear interpolation helper
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Save camera states to local storage
   */
  saveStates() {
    const states = {
      camera2D: this.camera2D,
      camera3D: this.camera3D
    };
    
    try {
      localStorage.setItem('minecraftcad_camera_states', JSON.stringify(states));
    } catch (error) {
      console.warn('Failed to save camera states:', error);
    }
  }

  /**
   * Load camera states from local storage
   */
  loadStates() {
    try {
      const saved = localStorage.getItem('minecraftcad_camera_states');
      if (saved) {
        const states = JSON.parse(saved);
        
        if (states.camera2D) {
          this.camera2D = { ...this.camera2D, ...states.camera2D };
        }
        
        if (states.camera3D) {
          this.camera3D = { ...this.camera3D, ...states.camera3D };
        }
      }
    } catch (error) {
      console.warn('Failed to load camera states:', error);
    }
  }

  /**
   * Get camera information for debugging
   */
  getDebugInfo() {
    const current = this.getCurrentCamera();
    
    return {
      currentView: this.currentView,
      camera: current,
      viewport: this.viewport,
      isTransitioning: this.isTransitioning,
      constraints: this.constraints
    };
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.saveStates();
    this.targetState = null;
    this.isTransitioning = false;
  }
}
