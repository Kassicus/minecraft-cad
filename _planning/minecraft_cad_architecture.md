# MinecraftCAD - Technical Architecture

## System Overview

The application follows a modular architecture with clear separation between data management, rendering systems, and user interface. The core principle is maintaining a single source of truth for the 3D block data while providing multiple view renderers that present this data differently.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   Application    │───▶│   Rendering     │
│   Controller    │    │   State Manager  │    │   Pipeline      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │   Block Data     │    │   View          │
         └─────────────▶│   Manager        │    │   Controllers   │
                        └──────────────────┘    └─────────────────┘
```

## Core Modules

### 1. Application State Manager (`AppStateManager`)
Central coordinator that manages application state, view switching, and cross-module communication.

**Responsibilities:**
- Current view mode (top/3d/elevation)
- Current height level (0-49)
- Active tool selection
- UI state management
- Event coordination between modules

**Key Methods:**
```javascript
class AppStateManager {
  setCurrentView(viewType)
  setCurrentLevel(level)
  setActiveTool(toolType)
  notifyViewChange(viewType, level)
  getState()
}
```

### 2. Block Data Manager (`BlockDataManager`)
Manages the core 3D block dataset with optimized storage and fast lookups.

**Data Structure:**
```javascript
class BlockDataManager {
  // Primary storage: 3D sparse array for fast coordinate lookup
  blocks = new Map() // key: "x,y,z", value: BlockData
  
  // Spatial indexing for performance
  octree = new Octree(100, 100, 50)
  
  // Change tracking for undo/redo
  history = new HistoryManager()
}
```

**Optimization Strategies:**
- **Sparse Array**: Only store occupied blocks, not empty space
- **Octree Spatial Indexing**: For efficient range queries and frustum culling
- **Dirty Region Tracking**: Only re-render changed areas
- **Batch Operations**: Group multiple block changes for performance

**Key Methods:**
```javascript
setBlock(x, y, z, blockType)
getBlock(x, y, z)
getBlocksInRange(x1, y1, z1, x2, y2, z2)
getBlocksAtLevel(level)
clearLevel(level)
getBounds()
```

### 3. Rendering Pipeline

#### 3.1 Base Renderer (`BaseRenderer`)
Abstract base class for all view renderers.

```javascript
class BaseRenderer {
  canvas = null
  context = null
  viewportBounds = {x, y, width, height}
  
  abstract render(blockData, camera, viewport)
  abstract handleResize(width, height)
  abstract worldToScreen(x, y, z)
  abstract screenToWorld(screenX, screenY)
}
```

#### 3.2 Top View Renderer (`TopViewRenderer`)
2D Canvas-based renderer for top-down plan views.

**Features:**
- Grid system with configurable spacing
- Height level filtering
- Hatch pattern rendering
- Ghost block display for other levels
- Efficient 2D drawing with viewport culling

**Implementation:**
```javascript
class TopViewRenderer extends BaseRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.hatchPatterns = new HatchPatternManager()
  }
  
  render(blockData, camera, level) {
    this.clearCanvas()
    this.drawGrid()
    this.drawBlocksAtLevel(blockData, level)
    this.drawGhostBlocks(blockData, level)
  }
}
```

#### 3.3 3D Renderer (`ThreeDRenderer`)
WebGL-based renderer using Three.js for 3D visualization.

**Features:**
- Instanced rendering for performance
- Basic lighting (ambient + directional)
- Hatch pattern textures
- Orbit controls
- Frustum culling

**Implementation:**
```javascript
class ThreeDRenderer extends BaseRenderer {
  constructor(canvas) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({canvas})
    this.controls = new THREE.OrbitControls(this.camera, canvas)
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances)
  }
  
  render(blockData) {
    this.updateInstances(blockData)
    this.renderer.render(this.scene, this.camera)
  }
}
```

#### 3.4 Elevation Renderer (`ElevationRenderer`)
2D Canvas renderer for elevation views (North, South, East, West).

**Features:**
- Orthographic projection
- External face visibility calculation
- Depth-based sorting
- Hatch pattern application

### 4. Hatch Pattern System (`HatchPatternManager`)

**Pattern Definitions:**
```javascript
const HATCH_PATTERNS = {
  solid: { type: 'fill', color: '#333' },
  diagonal: { type: 'lines', angle: 45, spacing: 4 },
  crosshatch: { type: 'lines', angle: [45, 135], spacing: 4 },
  dots: { type: 'dots', size: 2, spacing: 8 },
  brick: { type: 'custom', pattern: 'brick' }
}

const BLOCK_TYPES = {
  blockA: { name: 'Block A', hatchPattern: 'solid', color: '#666' },
  blockB: { name: 'Block B', hatchPattern: 'diagonal', color: '#888' },
  blockC: { name: 'Block C', hatchPattern: 'crosshatch', color: '#444' },
  blockD: { name: 'Block D', hatchPattern: 'dots', color: '#555' },
  blockE: { name: 'Block E', hatchPattern: 'brick', color: '#777' }
}
```

**2D Implementation (Canvas):**
```javascript
class HatchPatternManager {
  createPattern(patternType, color) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // Generate pattern based on type
    return ctx.createPattern(canvas, 'repeat')
  }
}
```

**3D Implementation (Three.js):**
```javascript
class HatchTextureManager {
  createTexture(patternType, color) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // Generate pattern - simplified for 3D performance
    // Hatch patterns render as solid colors with subtle variations
    return new THREE.CanvasTexture(canvas)
  }
  
  // For performance, 3D view uses solid colors based on hatch pattern
  getSolidColorForPattern(patternType) {
    const patternColors = {
      solid: '#666',
      diagonal: '#888', 
      crosshatch: '#444',
      dots: '#555',
      brick: '#777'
    }
    return patternColors[patternType] || '#666'
  }
}
```

### 5. Camera and Viewport System

#### 5.1 Camera Controller (`CameraController`)
Unified camera system that works across all views.

```javascript
class CameraController {
  // 2D camera (top/elevation views)
  position2D = {x: 0, y: 0}
  zoom2D = 1.0
  
  // 3D camera (Three.js camera)
  camera3D = null
  
  // Viewport management
  viewport = {x: 0, y: 0, width: 800, height: 600}
  
  pan(deltaX, deltaY, viewType)
  zoom(delta, viewType)
  resetView(viewType)
  syncViews() // Synchronize cursor positions across views
}
```

### 6. Input Management System

#### 6.1 Input Controller (`InputController`)
Handles all mouse, keyboard, and touch input with proper event delegation.

**Features:**
- Tool-specific input handling
- Cross-view coordinate translation
- Gesture recognition (pan, zoom, orbit)
- Keyboard shortcuts

**Implementation:**
```javascript
class InputController {
  constructor(appState, renderers) {
    this.appState = appState
    this.renderers = new Map() // viewType -> renderer
    this.currentTool = null
    this.setupEventListeners()
  }
  
  handleMouseDown(event) {
    const worldPos = this.screenToWorld(event.clientX, event.clientY)
    this.currentTool.onMouseDown(worldPos)
  }
}
```

### 7. Tool System

#### 7.1 Base Tool (`BaseTool`)
```javascript
abstract class BaseTool {
  abstract onMouseDown(worldPos)
  abstract onMouseMove(worldPos)
  abstract onMouseUp(worldPos)
  abstract onKeyDown(key)
}
```

#### 7.2 Block Placement Tool (`BlockPlacementTool`)
```javascript
class BlockPlacementTool extends BaseTool {
  constructor(blockDataManager, currentBlockType) {
    this.blockDataManager = blockDataManager
    this.blockType = currentBlockType
  }
  
  onMouseDown(worldPos) {
    const {x, y, z} = this.snapToGrid(worldPos)
    this.blockDataManager.setBlock(x, y, z, this.blockType)
  }
}
```

## Data Flow Architecture

### 1. User Interaction Flow
```
User Input → InputController → Tool → BlockDataManager → StateManager → Renderers
```

### 2. View Switching Flow
```
UI Event → AppStateManager.setCurrentView() → All Renderers.render() → UI Update
```

### 3. Block Modification Flow
```
Tool Action → BlockDataManager.setBlock() → History.push() → Dirty Region Marking → Renderer Update
```

## Performance Optimizations

### 1. Rendering Optimizations
- **Viewport Culling**: Only render blocks visible in current viewport
- **Level Filtering**: For top view, only process blocks at current level ±1
- **Instanced Rendering**: Use Three.js InstancedMesh for thousands of identical blocks
- **Dirty Region Tracking**: Only re-render changed areas

### 2. Data Structure Optimizations
- **Sparse Storage**: Map-based storage only for occupied blocks
- **Spatial Indexing**: Octree for fast spatial queries
- **Batch Operations**: Group multiple block changes
- **Memory Pooling**: Reuse objects for frequent operations

### 3. Memory Management
```javascript
class MemoryManager {
  // Target: Support 500,000 blocks efficiently
  maxBlocks = 500000
  blockPool = [] // Reuse block objects
  
  allocateBlock() {
    return this.blockPool.pop() || new Block()
  }
  
  deallocateBlock(block) {
    block.reset()
    this.blockPool.push(block)
  }
}
```

## File Structure

```
src/
├── core/
│   ├── AppStateManager.js
│   ├── BlockDataManager.js
│   └── MemoryManager.js
├── rendering/
│   ├── BaseRenderer.js
│   ├── TopViewRenderer.js
│   ├── ThreeDRenderer.js
│   ├── ElevationRenderer.js
│   └── HatchPatternManager.js
├── input/
│   ├── InputController.js
│   └── CameraController.js
├── tools/
│   ├── BaseTool.js
│   ├── BlockPlacementTool.js
│   ├── SelectionTool.js
│   └── MeasurementTool.js
├── ui/
│   ├── UIManager.js
│   └── components/
└── utils/
    ├── MathUtils.js
    └── SpatialIndex.js
```

## Technology Stack Details

### Core Technologies
- **HTML5 Canvas**: 2D rendering (top/elevation views)
- **WebGL/Three.js**: 3D rendering
- **Vanilla JavaScript**: Core logic (ES6+ modules)
- **Web Workers**: Background processing for large operations

### Third-Party Libraries
- **Three.js** (~600KB): 3D rendering and math utilities
- **No other dependencies**: Keep bundle size minimal

### Browser Requirements
- Modern browsers supporting:
  - WebGL 1.0
  - ES6+ modules
  - Canvas 2D
  - Local Storage

## Initialization Sequence

```javascript
// 1. Initialize core systems
const memoryManager = new MemoryManager()
const blockDataManager = new BlockDataManager(memoryManager)
const appStateManager = new AppStateManager()

// 2. Initialize rendering
const topRenderer = new TopViewRenderer(topCanvas)
const threeDRenderer = new ThreeDRenderer(threeDCanvas)
const elevationRenderer = new ElevationRenderer(elevationCanvas)

// 3. Initialize input and tools
const cameraController = new CameraController()
const inputController = new InputController(appStateManager, renderers)
const toolManager = new ToolManager(blockDataManager)

// 4. Wire up the system
appStateManager.connect(blockDataManager, renderers, toolManager)
inputController.connect(cameraController, toolManager)

// 5. Initial render
appStateManager.setCurrentView('top')
```

This architecture provides a solid foundation that can scale to handle the 100x100x50 build size while maintaining good performance and clean separation of concerns. The modular design also makes it easy to add new features like different block types, export formats, or additional view modes in the future.