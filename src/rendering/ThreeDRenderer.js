/**
 * MinecraftCAD - 3D Renderer
 * WebGL-based renderer using Three.js for 3D visualization
 */

import { BaseRenderer } from './BaseRenderer.js';
import { HatchPatternManager } from './HatchPatternManager.js';

export class ThreeDRenderer extends BaseRenderer {
  constructor(canvas) {
    super(canvas);
    
    // Three.js core objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Geometry and materials
    this.blockGeometry = null;
    this.blockMaterials = new Map();
    this.instancedMeshes = new Map(); // One per block type
    
    // Hatch pattern manager for 3D colors
    this.hatchPatterns = new HatchPatternManager();
    
    // 3D specific settings
    this.settings = {
      ...this.settings,
      maxInstances: 100000, // Maximum blocks to render
      enableShadows: false, // Shadows disabled for performance
      enableFog: true,
      fogDistance: 200,
      ambientLightIntensity: 1.2,
      directionalLightIntensity: 1.0,
      cameraFov: 75,
      cameraNear: 0.1,
      cameraFar: 1000,
      blockSize: 1.0, // Size of each block in 3D space
      levelSpacing: 1.0 // Spacing between levels
    };
    
    // Rendering state
    this.currentLevel = 0;
    this.showGhostBlocks = true;
    this.blockInstances = new Map(); // Track block instances
    this.needsUpdate = true;
    
    // Performance tracking
    this.stats = {
      blocksRendered: 0,
      drawCalls: 0,
      triangles: 0
    };
    
    this.initialize();
  }

  /**
   * Initialize Three.js components
   */
  initialize() {
    if (!this.canvas) {
      console.error('Canvas not provided for 3D renderer');
      return;
    }

    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded yet, waiting for threejs-loaded event...');
      // Listen for the custom event that indicates Three.js is ready
      window.addEventListener('threejs-loaded', () => {
        this.initialize();
      }, { once: true });
      return;
    }

    try {
      this.setupRenderer();
      this.setupScene();
      this.setupCamera();
      this.setupLighting();
      this.setupGeometry();
      this.setupMaterials();
      this.setupControls();
      
      console.log('3D renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize 3D renderer:', error);
    }
  }

  /**
   * Setup WebGL renderer
   */
  setupRenderer() {
    // Use ES modules import for Three.js (will be loaded from CDN)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    
    this.renderer.setSize(this.viewportBounds.width, this.viewportBounds.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Set background to a lighter blueprint theme for better visibility
    this.renderer.setClearColor(0x1a2530, 1.0); // Lighter blueprint background
    
    // Enable shadows if needed
    if (this.settings.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  /**
   * Setup 3D scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    
    // Add fog for depth perception
    if (this.settings.enableFog) {
      this.scene.fog = new THREE.Fog(0x0a1420, 50, this.settings.fogDistance);
    }
  }

  /**
   * Setup camera
   */
  setupCamera() {
    const aspect = this.viewportBounds.width / this.viewportBounds.height;
    
    this.camera = new THREE.PerspectiveCamera(
      this.settings.cameraFov,
      aspect,
      this.settings.cameraNear,
      this.settings.cameraFar
    );
    
    // Position camera to look at center of build area
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(25, 25, 25);
  }

  /**
   * Setup lighting
   */
  setupLighting() {
    // Bright ambient light for even illumination
    const ambientLight = new THREE.AmbientLight(
      0xffffff, // Pure white for maximum brightness
      this.settings.ambientLightIntensity
    );
    this.scene.add(ambientLight);
    
    // Primary directional light from top-right
    const directionalLight1 = new THREE.DirectionalLight(
      0xffffff,
      this.settings.directionalLightIntensity
    );
    directionalLight1.position.set(100, 100, 50);
    directionalLight1.castShadow = this.settings.enableShadows;
    
    if (this.settings.enableShadows) {
      directionalLight1.shadow.mapSize.width = 2048;
      directionalLight1.shadow.mapSize.height = 2048;
      directionalLight1.shadow.camera.near = 0.5;
      directionalLight1.shadow.camera.far = 500;
    }
    
    this.scene.add(directionalLight1);
    
    // Secondary directional light from opposite side for fill lighting
    const directionalLight2 = new THREE.DirectionalLight(
      0xffffff,
      0.5 // Softer intensity for fill
    );
    directionalLight2.position.set(-50, 80, -30);
    this.scene.add(directionalLight2);
    
    // Additional light from below to reduce harsh shadows
    const fillLight = new THREE.DirectionalLight(
      0xffffff,
      0.3 // Gentle fill from below
    );
    fillLight.position.set(0, -50, 0);
    this.scene.add(fillLight);
  }

  /**
   * Setup block geometry
   */
  setupGeometry() {
    // Create a unit cube geometry for blocks
    this.blockGeometry = new THREE.BoxGeometry(
      this.settings.blockSize,
      this.settings.blockSize,
      this.settings.blockSize
    );
    
    // Optimize geometry
    this.blockGeometry.computeBoundingSphere();
  }

  /**
   * Setup materials for different block types
   */
  setupMaterials() {
    const blockTypes = ['blockA', 'blockB', 'blockC', 'blockD', 'blockE'];
    
    // Consistent material for all block types in 3D view
    const uniformColor = 0x404040; // Darker gray for all blocks
    
    blockTypes.forEach(blockType => {
      // Create main block material - uniform for all types
      const material = new THREE.MeshLambertMaterial({
        color: uniformColor,
        transparent: false,
        opacity: 1.0
      });
      
      this.blockMaterials.set(blockType, material);
      
      // Create instanced mesh for this block type
      const instancedMesh = new THREE.InstancedMesh(
        this.blockGeometry,
        material,
        this.settings.maxInstances
      );
      
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instancedMesh.count = 0; // Start with no instances
      
      this.instancedMeshes.set(blockType, instancedMesh);
      this.scene.add(instancedMesh);
      
      // Create wireframe edges using EdgesGeometry for clean cube outlines
      const wireframeGeometry = new THREE.EdgesGeometry(this.blockGeometry);
      const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1
      });
      
      // Use LineSegments instead of InstancedMesh for better edge control
      const wireframeMesh = new THREE.LineSegments(
        wireframeGeometry,
        wireframeMaterial
      );
      
      // Store wireframe mesh with a different key
      this.instancedMeshes.set(blockType + '_wireframe', wireframeMesh);
      this.scene.add(wireframeMesh);
    });
  }

  /**
   * Setup orbit controls
   */
  setupControls() {
    // Check if OrbitControls is available
    if (typeof THREE !== 'undefined' && typeof OrbitControls !== 'undefined') {
      this.controls = new OrbitControls(this.camera, this.canvas);
      
      // Configure controls
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 10;
      this.controls.maxDistance = 200;
      this.controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground
      
      // Set target to center of build area
      this.controls.target.set(25, 25, 25);
      
      this.controls.addEventListener('change', () => {
        this.needsUpdate = true;
      });
      
      console.log('OrbitControls initialized');
    } else {
      console.warn('OrbitControls not available, 3D navigation will be limited');
      
      // Set up basic camera controls as fallback
      this.setupBasicCameraControls();
    }
  }

  /**
   * Setup basic camera controls as fallback
   */
  setupBasicCameraControls() {
    // Add basic mouse controls directly to canvas
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    this.canvas.addEventListener('mousedown', (event) => {
      isMouseDown = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    });
    
    this.canvas.addEventListener('mousemove', (event) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - lastMouseX;
      const deltaY = event.clientY - lastMouseY;
      
      // Simple orbit rotation
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(this.camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(25, 25, 25);
      
      this.needsUpdate = true;
      
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    });
    
    this.canvas.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
    
    console.log('Basic camera controls initialized');
  }

  /**
   * Main render method
   */
  render(blockData, camera, level = 0) {
    if (!this.renderer || !this.scene || !this.camera) {
      console.warn('3D renderer not fully initialized');
      return;
    }
    
    this.startPerformanceMeasurement();
    
    this.currentLevel = level;
    
    // Update instanced meshes with block data
    this.updateBlockInstances(blockData);
    
    // Update controls
    if (this.controls && this.controls.update) {
      this.controls.update();
    }
    
    // Render the scene
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('3D render error:', error);
    }
    
    this.endPerformanceMeasurement();
  }

  /**
   * Update block instances from block data
   */
  updateBlockInstances(blockData) {
    if (!this.needsUpdate) return;
    
    // Clear existing instances
    this.clearInstances();
    
    // Get all blocks
    const allBlocks = [];
    for (let level = 0; level < 50; level++) {
      // Block rendering removed - starting fresh
      const levelBlocks = [];
      allBlocks.push(...levelBlocks);
    }
    
    // Group blocks by type
    const blocksByType = new Map();
    allBlocks.forEach(block => {
      if (!blocksByType.has(block.type)) {
        blocksByType.set(block.type, []);
      }
      blocksByType.get(block.type).push(block);
    });
    
    // Update each instanced mesh
    blocksByType.forEach((blocks, blockType) => {
      this.updateInstancedMesh(blockType, blocks);
    });
    
    this.needsUpdate = false;
    this.stats.blocksRendered = allBlocks.length;
  }

  /**
   * Update an instanced mesh with blocks of a specific type
   */
  updateInstancedMesh(blockType, blocks) {
    const instancedMesh = this.instancedMeshes.get(blockType);
    const wireframeTemplate = this.instancedMeshes.get(blockType + '_wireframe');
    
    if (!instancedMesh) return;
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color(0x404040); // Darker uniform color for all blocks
    
    // Clear existing wireframes for this block type
    this.clearWireframesForBlockType(blockType);
    
    blocks.forEach((block, index) => {
      if (index >= this.settings.maxInstances) return;
      
      // Position matrix
      matrix.makeTranslation(
        block.x * this.settings.blockSize,
        block.z * this.settings.levelSpacing, // Y is up in 3D
        block.y * this.settings.blockSize
      );
      
      // Update solid block mesh
      instancedMesh.setMatrixAt(index, matrix);
      instancedMesh.setColorAt(index, color);
      
      // Create individual wireframe for this block
      if (wireframeTemplate) {
        const wireframe = wireframeTemplate.clone();
        wireframe.position.set(
          block.x * this.settings.blockSize,
          block.z * this.settings.levelSpacing,
          block.y * this.settings.blockSize
        );
        wireframe.userData = { blockType, blockIndex: index };
        this.scene.add(wireframe);
      }
    });
    
    // Update instance count for solid blocks
    const blockCount = Math.min(blocks.length, this.settings.maxInstances);
    instancedMesh.count = blockCount;
    
    // Mark for update
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Clear wireframes for a specific block type
   */
  clearWireframesForBlockType(blockType) {
    const wireframesToRemove = [];
    this.scene.traverse(child => {
      if (child.userData && child.userData.blockType === blockType) {
        wireframesToRemove.push(child);
      }
    });
    
    wireframesToRemove.forEach(wireframe => {
      this.scene.remove(wireframe);
    });
  }

  /**
   * Clear all instances
   */
  clearInstances() {
    // Clear instanced meshes
    this.instancedMeshes.forEach(mesh => {
      if (mesh.count !== undefined) {
        mesh.count = 0;
      }
    });
    
    // Clear all wireframes
    const wireframesToRemove = [];
    this.scene.traverse(child => {
      if (child.userData && child.userData.blockType) {
        wireframesToRemove.push(child);
      }
    });
    
    wireframesToRemove.forEach(wireframe => {
      this.scene.remove(wireframe);
    });
  }

  /**
   * Handle resize events
   */
  handleResize(width, height) {
    if (!this.camera || !this.renderer) return;
    
    this.viewportBounds.width = width;
    this.viewportBounds.height = height;
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    this.needsUpdate = true;
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY, worldZ) {
    if (!this.camera) return { x: 0, y: 0 };
    
    const vector = new THREE.Vector3(worldX, worldZ, worldY);
    vector.project(this.camera);
    
    const x = (vector.x * 0.5 + 0.5) * this.viewportBounds.width;
    const y = (vector.y * -0.5 + 0.5) * this.viewportBounds.height;
    
    return { x, y };
  }

  /**
   * Convert screen coordinates to world coordinates (raycast)
   */
  screenToWorld(screenX, screenY) {
    if (!this.camera) return { x: 0, y: 0, z: 0 };
    
    const mouse = new THREE.Vector2();
    mouse.x = (screenX / this.viewportBounds.width) * 2 - 1;
    mouse.y = -(screenY / this.viewportBounds.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    
    // Raycast against a ground plane at current level
    const plane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0), 
      -this.currentLevel * this.settings.levelSpacing
    );
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    return {
      x: intersection.x / this.settings.blockSize,
      y: intersection.z / this.settings.blockSize,
      z: this.currentLevel
    };
  }

  /**
   * Handle view change events
   */
  onViewChange(viewType, level, cameraState) {
    super.onViewChange(viewType, level, cameraState);
    
    this.currentLevel = level;
    this.needsUpdate = true;
    
    // Update camera if 3D state provided
    if (viewType === '3d' && cameraState && cameraState.position) {
      this.camera.position.set(
        cameraState.position.x,
        cameraState.position.z, // Y is up in 3D
        cameraState.position.y
      );
      
      if (this.controls) {
        this.controls.update();
      }
    }
  }

  /**
   * Set camera position
   */
  setCameraPosition(x, y, z) {
    if (this.camera) {
      this.camera.position.set(x, z, y); // Convert to 3D coordinates
      
      if (this.controls) {
        this.controls.update();
      }
      
      this.needsUpdate = true;
    }
  }

  /**
   * Reset camera to default position
   */
  resetCamera() {
    if (this.camera) {
      this.camera.position.set(50, 50, 50);
      this.camera.lookAt(25, 25, 25);
      
      if (this.controls) {
        this.controls.target.set(25, 25, 25);
        this.controls.update();
      }
      
      this.needsUpdate = true;
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    super.updateSettings(newSettings);
    
    if (newSettings.showGhostBlocks !== undefined) {
      this.showGhostBlocks = newSettings.showGhostBlocks;
      this.needsUpdate = true;
    }
    
    if (newSettings.enableFog !== undefined) {
      if (newSettings.enableFog && !this.scene.fog) {
        this.scene.fog = new THREE.Fog(0x0a1420, 50, this.settings.fogDistance);
      } else if (!newSettings.enableFog && this.scene.fog) {
        this.scene.fog = null;
      }
    }
  }

  /**
   * Get 3D renderer statistics
   */
  getStats() {
    const baseStats = this.getPerformanceStats();
    
    return {
      ...baseStats,
      blocksRendered: this.stats.blocksRendered,
      drawCalls: this.renderer ? this.renderer.info.render.calls : 0,
      triangles: this.renderer ? this.renderer.info.render.triangles : 0,
      geometries: this.renderer ? this.renderer.info.memory.geometries : 0,
      textures: this.renderer ? this.renderer.info.memory.textures : 0
    };
  }

  /**
   * Force update on next render
   */
  forceUpdate() {
    this.needsUpdate = true;
  }

  /**
   * Dispose of 3D resources
   */
  dispose() {
    super.dispose();
    
    // Dispose of Three.js resources
    if (this.controls) {
      this.controls.dispose();
    }
    
    if (this.blockGeometry) {
      this.blockGeometry.dispose();
    }
    
    this.blockMaterials.forEach(material => {
      material.dispose();
    });
    
    this.instancedMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.dispose();
    });
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.blockGeometry = null;
    this.blockMaterials.clear();
    this.instancedMeshes.clear();
  }
}
