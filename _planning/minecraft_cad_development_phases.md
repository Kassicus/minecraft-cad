# MinecraftCAD - Phased Development Plan

## MVP Definition & Success Criteria

### MVP Goals
Build a functional, web-based CAD tool for Minecraft build planning that demonstrates core value proposition:
- **Fast mockup creation**: Users can sketch out builds in under 5 minutes
- **Multiple view modes**: Top-down with height levels, 3D visualization, elevation views
- **Blueprint aesthetic**: Professional technical drawing feel
- **Block differentiation**: Hatch patterns for material identification
- **Basic persistence**: Save/load capability

### MVP Success Metrics
- [ ] Place and remove blocks efficiently in all view modes
- [ ] Navigate smoothly between 50 height levels (Ground through +49)
- [ ] Switch between Top/3D/Elevation views seamlessly
- [ ] Distinguish 5 different block types via hatch patterns
- [ ] Handle builds up to 100x100x50 (500K blocks) with acceptable performance
- [ ] Save and load projects locally
- [ ] Export 2D view as PNG
- [ ] Runs smoothly in Chrome, Firefox, Safari, Edge

---

## Project Structure & Code Organization

### File Architecture
```
minecraft-cad/
├── src/
│   ├── core/                   # Core application logic
│   │   ├── AppStateManager.js
│   │   ├── BlockDataManager.js
│   │   └── MemoryManager.js
│   ├── rendering/              # View renderers
│   │   ├── BaseRenderer.js
│   │   ├── TopViewRenderer.js
│   │   ├── ThreeDRenderer.js
│   │   ├── ElevationRenderer.js
│   │   └── HatchPatternManager.js
│   ├── input/                  # Input handling
│   │   ├── InputController.js
│   │   └── CameraController.js
│   ├── tools/                  # Drawing tools
│   │   ├── BaseTool.js
│   │   ├── BlockPlacementTool.js
│   │   ├── EraserTool.js
│   │   └── PanTool.js
│   ├── ui/                     # UI components
│   │   ├── UIManager.js
│   │   ├── SidebarManager.js
│   │   └── StatusBarManager.js
│   ├── utils/                  # Utilities
│   │   ├── MathUtils.js
│   │   ├── SpatialIndex.js
│   │   └── FileManager.js
│   └── main.js                 # Application entry point
├── styles/
│   ├── variables.css           # CSS custom properties
│   ├── base.css               # Base styles, typography
│   ├── layout.css             # Grid system, main layout
│   ├── components/
│   │   ├── panels.css
│   │   ├── buttons.css
│   │   ├── patterns.css
│   │   └── workspace.css
│   └── responsive.css         # Media queries
├── assets/
│   └── icons/                 # Tool icons, UI symbols
├── tests/                     # Unit tests (future)
├── docs/                      # Documentation
│   ├── development-plan.md
│   ├── technical-architecture.md
│   └── ui-design-language.md
├── index.html
├── package.json               # Dependencies (minimal)
└── README.md
```

### Code Quality Standards
- **ES6+ Modules**: Clean import/export structure
- **Class-based Architecture**: Clear inheritance and composition
- **Consistent Naming**: camelCase for variables, PascalCase for classes
- **JSDoc Comments**: Document all public methods
- **Error Handling**: Graceful degradation and user feedback
- **Performance Focus**: Optimized for 500K block handling
- **Memory Management**: Efficient allocation and cleanup

---

## Development Phases

## Phase 1: Foundation & Core Systems (Week 1-2)
**Objective**: Establish project structure and core data management

### Phase 1 Deliverables

#### 1.1 Project Setup & Build System
```javascript
// package.json - Minimal dependencies
{
  "name": "minecraft-cad",
  "dependencies": {
    "three": "^0.158.0"
  },
  "devDependencies": {
    "vite": "^5.0.0" // Simple dev server and bundling
  }
}
```

#### 1.2 Core Data Management
```javascript
// BlockDataManager.js - Core implementation
class BlockDataManager {
  constructor(memoryManager) {
    this.blocks = new Map() // "x,y,z" -> BlockData
    this.octree = new Octree(100, 100, 50)
    this.memoryManager = memoryManager
    this.history = new HistoryManager()
  }
  
  setBlock(x, y, z, blockType) { /* Implementation */ }
  getBlock(x, y, z) { /* Implementation */ }
  getBlocksAtLevel(level) { /* Implementation */ }
  getBounds() { /* Implementation */ }
}
```

#### 1.3 Application State Management
```javascript
// AppStateManager.js
class AppStateManager {
  constructor() {
    this.currentView = 'top'
    this.currentLevel = 0 // Ground level
    this.activeTool = 'place'
    this.selectedBlockType = 'blockA'
  }
  
  setCurrentView(viewType) { /* Implementation */ }
  setCurrentLevel(level) { /* Implementation */ }
  notifyStateChange() { /* Implementation */ }
}
```

#### 1.4 Basic UI Structure
- HTML skeleton with sidebar and workspace
- CSS variables and base styling
- Responsive layout foundation
- Blueprint color scheme implementation

### Phase 1 Acceptance Criteria
- [ ] Love2D project runs with basic window and configuration
- [ ] Can store and retrieve block data efficiently using Lua tables
- [ ] Basic application structure with modular Lua files
- [ ] State management system functional
- [ ] Memory usage stays reasonable (< 50MB for empty project)

---

## Phase 2: Top View & Height Navigation (Week 3-4)
**Objective**: Implement primary working view with height level system

### Phase 2 Deliverables

#### 2.1 Top View Renderer
```lua
-- src/rendering/TopViewRenderer.lua
local BaseRenderer = require('src.rendering.BaseRenderer')
local HatchPatterns = require('src.rendering.HatchPatterns')

local TopViewRenderer = setmetatable({}, BaseRenderer)
TopViewRenderer.__index = TopViewRenderer

function TopViewRenderer:new()
    local self = setmetatable(BaseRenderer:new(), TopViewRenderer)
    self.gridSize = 20 -- pixels per block
    self.hatchPatterns = HatchPatterns:new()
    return self
end

function TopViewRenderer:render(blockData, appState)
    love.graphics.push()
    love.graphics.translate(love.graphics.getWidth() / 2, love.graphics.getHeight() / 2)
    love.graphics.scale(self.camera.zoom)
    love.graphics.translate(-self.camera.x, -self.camera.y)
    
    self:drawGrid()
    self:drawBlocksAtLevel(blockData, appState.currentLevel)
    self:drawGhostBlocks(blockData, appState.currentLevel)
    
    love.graphics.pop()
end

function TopViewRenderer:drawGrid()
    love.graphics.setColor(0.4, 0.7, 0.96, 0.3) -- Blueprint blue, transparent
    love.graphics.setLineWidth(1)
    
    local gridExtent = 50 * self.gridSize
    for i = -gridExtent, gridExtent, self.gridSize do
        love.graphics.line(-gridExtent, i, gridExtent, i)
        love.graphics.line(i, -gridExtent, i, gridExtent)
    end
end

return TopViewRenderer
```

#### 2.2 Hatch Pattern System
```lua
-- src/rendering/HatchPatterns.lua
local HatchPatterns = {}
HatchPatterns.__index = HatchPatterns

function HatchPatterns:new()
    local self = setmetatable({}, HatchPatterns)
    
    self.blockTypes = {
        blockA = { color = {0.4, 0.4, 0.4}, pattern = 'solid' },
        blockB = { color = {0.5, 0.5, 0.5}, pattern = 'diagonal' },
        blockC = { color = {0.3, 0.3, 0.3}, pattern = 'crosshatch' },
        blockD = { color = {0.35, 0.35, 0.35}, pattern = 'dots' },
        blockE = { color = {0.45, 0.45, 0.45}, pattern = 'brick' }
    }
    
    return self
end

function HatchPatterns:drawPattern(blockType, x, y, width, height, opacity)
    local blockDef = self.blockTypes[blockType]
    if not blockDef then return end
    
    local r, g, b = unpack(blockDef.color)
    love.graphics.setColor(r, g, b, opacity)
    love.graphics.rectangle('fill', x, y, width, height)
    
    -- Draw pattern overlay based on type
    if blockDef.pattern == 'diagonal' then
        self:drawDiagonalLines(x, y, width, height, opacity)
    -- ... other patterns
    end
end

return HatchPatterns
```

#### 2.3 Height Level Controls & Input
```lua
-- src/input/InputHandler.lua
function InputHandler:keypressed(key)
    if key == 'up' then
        self.appState:setCurrentLevel(self.appState.currentLevel + 1)
    elseif key == 'down' then
        self.appState:setCurrentLevel(self.appState.currentLevel - 1)
    end
end
```

#### 2.4 Basic Block Placement Tool
```lua
-- src/tools/PlaceTool.lua
local BaseTool = require('src.tools.BaseTool')

local PlaceTool = setmetatable({}, BaseTool)
PlaceTool.__index = PlaceTool

function PlaceTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left mouse button
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        local gridZ = self.appState.currentLevel
        
        self.blockData:setBlock(gridX, gridY, gridZ, self.appState.selectedBlockType)
    end
end

function PlaceTool:snapToGrid(worldX, worldY)
    local gridSize = 20
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridY = math.floor(worldY / gridSize + 0.5)
    return gridX, gridY
end

return PlaceTool
``` /* Blueprint grid implementation */ }
  drawBlocksAtLevel(blockData, level) { /* Block rendering with patterns */ }
}
```

### Phase 2 Acceptance Criteria
- [ ] Top-down view renders correctly with blueprint-style grid
- [ ] Can place blocks with mouse clicks using Love2D input
- [ ] 5 different hatch patterns display correctly using Love2D graphics
- [ ] Height level navigation works smoothly (0-49) with keyboard controls
- [ ] Ghost blocks show other levels with transparency
- [ ] Performance acceptable for 10,000+ blocks using Lua tables
- [ ] Pan and zoom controls functional with Love2D transformations

---

## Phase 3: Isometric 3D View Implementation (Week 5-6)
**Objective**: Add 3D visualization using 2D isometric projection

### Phase 3 Deliverables

#### 3.1 Isometric Renderer Setup
```lua
-- src/rendering/IsometricRenderer.lua
local BaseRenderer = require('src.rendering.BaseRenderer')

local IsometricRenderer = setmetatable({}, BaseRenderer)
IsometricRenderer.__index = IsometricRenderer

function IsometricRenderer:new()
    local self = setmetatable(BaseRenderer:new(), IsometricRenderer)
    
    -- Isometric projection constants
    self.isoAngle = math.pi / 6 -- 30 degrees
    self.blockSize = 16
    self.blockHeight = 12
    
    return self
end

function IsometricRenderer:render(blockData, appState)
    love.graphics.push()
    love.graphics.translate(love.graphics.getWidth() / 2, love.graphics.getHeight() / 2)
    love.graphics.scale(self.camera.zoom)
    love.graphics.translate(-self.camera.x, -self.camera.y)
    
    -- Collect and sort all blocks for proper depth rendering
    local allBlocks = self:collectAllBlocks(blockData)
    table.sort(allBlocks, function(a, b)
        -- Sort back-to-front for proper layering
        return (a.x + a.y + a.z) > (b.x + b.y + b.z)
    end)
    
    -- Render each block as an isometric cube
    for _, block in ipairs(allBlocks) do
        self:drawIsometricBlock(block.x, block.y, block.z, block.type)
    end
    
    love.graphics.pop()
end

function IsometricRenderer:worldToIsometric(x, y, z)
    local isoX = (x - y) * math.cos(self.isoAngle) * self.blockSize
    local isoY = (x + y) * math.sin(self.isoAngle) * self.blockSize - z * self.blockHeight
    return isoX, isoY
end

function IsometricRenderer:drawIsometricBlock(x, y, z, blockType)
    local isoX, isoY = self:worldToIsometric(x, y, z)
    
    -- Draw the three visible faces of the cube
    self:drawCubeFace(isoX, isoY, blockType, 'top', 1.0)    -- Brightest
    self:drawCubeFace(isoX, isoY, blockType, 'left', 0.8)   -- Medium
    self:drawCubeFace(isoX, isoY, blockType, 'right', 0.6)  -- Darkest
end

return IsometricRenderer
```

#### 3.2 3D Block Rendering with Shading
```lua
function IsometricRenderer:drawCubeFace(x, y, blockType, face, brightness)
    local hatchPattern = self.hatchPatterns.blockTypes[blockType]
    if not hatchPattern then return end
    
    local r, g, b = unpack(hatchPattern.color)
    love.graphics.setColor(r * brightness, g * brightness, b * brightness, 1.0)
    
    -- Define face vertices based on face type
    local vertices = self:getFaceVertices(x, y, face)
    love.graphics.polygon('fill', vertices)
    
    -- Draw face outline
    love.graphics.setColor(0.4, 0.7, 0.96, 0.8) -- Blueprint blue outline
    love.graphics.setLineWidth(1)
    love.graphics.polygon('line', vertices)
end

function IsometricRenderer:getFaceVertices(x, y, face)
    local size = self.blockSize
    local height = self.blockHeight
    
    if face == 'top' then
        return {
            x, y,
            x + size, y - size/2,
            x, y - size,
            x - size, y - size/2
        }
    elseif face == 'left' then
        return {
            x - size, y - size/2,
            x, y - size,
            x, y - size + height,
            x - size, y - size/2 + height
        }
    elseif face == 'right' then
        return {
            x, y - size,
            x + size, y - size/2,
            x + size, y - size/2 + height,
            x, y - size + height
        }
    end
end
```

#### 3.3 View Manager for Multiple Renderers
```lua
-- src/core/ViewManager.lua
local ViewManager = {}
ViewManager.__index = ViewManager

function ViewManager:new()
    local self = setmetatable({}, ViewManager)
    
    local TopViewRenderer = require('src.rendering.TopViewRenderer')
    local IsometricRenderer = require('src.rendering.IsometricRenderer')
    local ElevationRenderer = require('src.rendering.ElevationRenderer')
    
    self.renderers = {
        top = TopViewRenderer:new(),
        isometric = IsometricRenderer:new(),
        north = ElevationRenderer:new('north'),
        south = ElevationRenderer:new('south'),
        east = ElevationRenderer:new('east'),
        west = ElevationRenderer:new('west')
    }
    
    self.currentView = 'top'
    
    return self
end

function ViewManager:getCurrentRenderer()
    return self.renderers[self.currentView]
end

function ViewManager:setCurrentView(viewType)
    if self.renderers[viewType] then
        self.currentView = viewType
    end
end

return ViewManager
```

#### 3.4 Camera and Input Synchronization
```lua
-- Enhanced input handling for view switching
function InputHandler:keypressed(key)
    if key == '1' then
        self.viewManager:setCurrentView('top')
        self.appState:setCurrentView('top')
    elseif key == '2' then
        self.viewManager:setCurrentView('isometric')
        self.appState:setCurrentView('isometric')
    elseif key == '3' then
        self.viewManager:setCurrentView('north')
        self.appState:setCurrentView('north')
    end
    
    -- Height level controls
    if key == 'up' then
        self.appState:setCurrentLevel(math.min(49, self.appState.currentLevel + 1))
    elseif key == 'down' then
        self.appState:setCurrentLevel(math.max(0, self.appState.currentLevel - 1))
    end
end
```

### Phase 3 Acceptance Criteria
- [ ] Isometric 3D view renders blocks as proper 3D cubes using 2D graphics
- [ ] Camera controls work smoothly (pan, zoom) in isometric view
- [ ] Can switch between Top and Isometric views seamlessly
- [ ] Block placement works in isometric view with proper coordinate translation
- [ ] Performance good for 50,000+ blocks using efficient Lua sorting
- [ ] Camera position persists between view switches
- [ ] Proper depth sorting makes 3D structure clear

---

## Phase 4: Elevation Views (Week 7-8)
**Objective**: Add elevation views for external faces

### Phase 4 Deliverables

#### 4.1 Elevation Renderer Implementation
```lua
-- src/rendering/ElevationRenderer.lua
local BaseRenderer = require('src.rendering.BaseRenderer')

local ElevationRenderer = setmetatable({}, BaseRenderer)
ElevationRenderer.__index = ElevationRenderer

function ElevationRenderer:new(direction)
    local self = setmetatable(BaseRenderer:new(), ElevationRenderer)
    self.direction = direction -- 'north', 'south', 'east', 'west'
    self.blockSize = 20
    self.hatchPatterns = require('src.rendering.HatchPatterns'):new()
    return self
end

function ElevationRenderer:render(blockData, appState)
    love.graphics.push()
    love.graphics.translate(love.graphics.getWidth() / 2, love.graphics.getHeight() / 2)
    love.graphics.scale(self.camera.zoom)
    love.graphics.translate(-self.camera.x, -self.camera.y)
    
    self:drawGrid()
    local visibleFaces = self:calculateVisibleFaces(blockData)
    
    for _, face in ipairs(visibleFaces) do
        self:drawElevationBlock(face)
    end
    
    love.graphics.pop()
end

function ElevationRenderer:calculateVisibleFaces(blockData)
    local faces = {}
    
    for x, xTable in pairs(blockData.blocks) do
        for y, yTable in pairs(xTable) do
            for z, blockType in pairs(yTable) do
                if self:isExternalFace(blockData, x, y, z) then
                    table.insert(faces, {
                        x = x, y = y, z = z, type = blockType,
                        screenX = self:getScreenX(x, y),
                        screenY = self:getScreenY(z)
                    })
                end
            end
        end
    end
    
    return faces
end

function ElevationRenderer:isExternalFace(blockData, x, y, z)
    -- Check if this block face is visible from the elevation direction
    local checkX, checkY = x, y
    
    if self.direction == 'north' then
        checkY = y - 1
    elseif self.direction == 'south' then
        checkY = y + 1
    elseif self.direction == 'east' then
        checkX = x + 1
    elseif self.direction == 'west' then
        checkX = x - 1
    end
    
    -- Face is external if there's no block in front of it
    return not blockData:getBlock(checkX, checkY, z)
end

return ElevationRenderer
```

#### 4.2 UI System for View Selection
```lua
-- src/ui/UIManager.lua
local UIManager = {}
UIManager.__index = UIManager

function UIManager:new(appState, blockData)
    local self = setmetatable({}, UIManager)
    self.appState = appState
    self.blockData = blockData
    
    -- UI layout constants
    self.sidebarWidth = 280
    self.panelHeight = love.graphics.getHeight() / 2
    
    -- UI state
    self.hoveredButton = nil
    self.selectedBlockType = 'blockA'
    
    return self
end

function UIManager:render()
    self:drawSidebar()
    self:drawStatusBar()
end

function UIManager:drawSidebar()
    -- Sidebar background
    love.graphics.setColor(0.07, 0.13, 0.2, 1) -- Dark blue sidebar
    love.graphics.rectangle('fill', 0, 0, self.sidebarWidth, love.graphics.getHeight())
    
    -- Sidebar border
    love.graphics.setColor(0.4, 0.7, 0.96, 1) -- Blueprint blue border
    love.graphics.setLineWidth(1)
    love.graphics.line(self.sidebarWidth, 0, self.sidebarWidth, love.graphics.getHeight())
    
    self:drawBlockTypePanel()
    self:drawViewControlPanel()
end

function UIManager:drawViewControlPanel()
    local panelY = self.panelHeight
    
    -- Panel header
    love.graphics.setColor(0.12, 0.22, 0.37, 1)
    love.graphics.rectangle('fill', 0, panelY, self.sidebarWidth, 45)
    
    love.graphics.setColor(0.9, 0.95, 0.97, 1)
    love.graphics.setFont(love.graphics.newFont(14))
    love.graphics.print("VIEW CONTROLS", 12, panelY + 15)
    
    -- View buttons
    local views = {
        {name = "TOP VIEW", key = "top"},
        {name = "3D VIEW", key = "isometric"},
        {name = "NORTH ELEVATION", key = "north"},
        {name = "SOUTH ELEVATION", key = "south"},
        {name = "EAST ELEVATION", key = "east"},
        {name = "WEST ELEVATION", key = "west"}
    }
    
    for i, view in ipairs(views) do
        local buttonY = panelY + 60 + (i - 1) * 35
        local isActive = (self.appState.currentView == view.key)
        
        self:drawButton(10, buttonY, self.sidebarWidth - 20, 30, view.name, isActive)
    end
    
    -- Height level controls
    self:drawHeightControls(panelY + 300)
end

return UIManager
```

### Phase 4 Acceptance Criteria
- [ ] All 4 elevation views (N/S/E/W) render correctly using Love2D graphics
- [ ] Only external faces visible (no internal geometry)
- [ ] Can place blocks in elevation views with proper coordinate mapping
- [ ] View switching preserves camera positions across all renderers
- [ ] Hatch patterns apply correctly in elevations using Love2D drawing
- [ ] Performance acceptable for complex builds using Lua optimization

---

## Phase 5: Tools, UI & Polish (Week 9-10)
**Objective**: Complete tool set, UI system, and file management for MVP

### Phase 5 Deliverables

#### 5.1 Complete Tool System
```lua
-- src/tools/ToolManager.lua
local ToolManager = {}
ToolManager.__index = ToolManager

function ToolManager:new(blockData, appState)
    local self = setmetatable({}, ToolManager)
    self.blockData = blockData
    self.appState = appState
    
    local PlaceTool = require('src.tools.PlaceTool')
    local EraseTool = require('src.tools.EraseTool')
    local LineTool = require('src.tools.LineTool')
    
    self.tools = {
        place = PlaceTool:new(blockData, appState),
        erase = EraseTool:new(blockData, appState),
        line = LineTool:new(blockData, appState)
    }
    
    self.currentTool = 'place'
    
    return self
end

function ToolManager:getCurrentTool()
    return self.tools[self.currentTool]
end

function ToolManager:setCurrentTool(toolName)
    if self.tools[toolName] then
        self.currentTool = toolName
        self.appState.activeTool = toolName
    end
end

return ToolManager
```

#### 5.2 File Management System
```lua
-- src/utils/FileManager.lua
local FileManager = {}
FileManager.__index = FileManager

function FileManager:new()
    local self = setmetatable({}, FileManager)
    return self
end

function FileManager:saveProject(blockData, appState, filename)
    local projectData = {
        version = "1.0",
        name = filename or "untitled",
        created = os.time(),
        dimensions = {x = 100, y = 100, z = 50},
        currentView = appState.currentView,
        currentLevel = appState.currentLevel,
        blocks = self:serializeBlocks(blockData),
        blockCount = blockData.blockCount
    }
    
    -- Convert to JSON-like string (Lua table serialization)
    local dataString = self:tableToString(projectData)
    local success = love.filesystem.write(filename .. '.mcd', dataString)
    
    return success
end

function FileManager:loadProject(filename)
    local contents = love.filesystem.read(filename .. '.mcd')
    if not contents then
        return nil, "File not found"
    end
    
    -- Parse Lua table string back to data
    local success, projectData = pcall(loadstring("return " .. contents))
    if not success then
        return nil, "Invalid file format"
    end
    
    return projectData
end

function FileManager:exportPNG(filename)
    local screenshot = love.graphics.newScreenshot()
    local imageData = screenshot
    screenshot:encode('png', filename .. '.png')
    return true
end

return FileManager
```

#### 5.3 Complete UI System
```lua
-- Enhanced UIManager with complete interface
function UIManager:handleMousePressed(x, y, button)
    if x < self.sidebarWidth then
        -- Handle sidebar clicks
        if y < self.panelHeight then
            return self:handleBlockTypeClick(x, y)
        else
            return self:handleViewControlClick(x, y)
        end
    end
    
    return false -- Let input handler process workspace clicks
end

function UIManager:update(dt)
    -- Handle UI animations, hover states, etc.
    local mouseX, mouseY = love.mouse.getPosition()
    
    if mouseX < self.sidebarWidth then
        -- Update hover states for buttons
        self:updateHoverStates(mouseX, mouseY)
    end
end
```

### Phase 5 Acceptance Criteria
- [ ] All essential tools functional across views (place, erase, line)
- [ ] Complete UI system with sidebar, view controls, block selection
- [ ] Save/load works reliably using Love2D filesystem
- [ ] PNG export functional using Love2D screenshot capability
- [ ] UI responsive and polished with proper Love2D graphics
- [ ] Keyboard shortcuts implemented and documented
- [ ] Performance targets met for 500K blocks using optimized Lua
- [ ] Error states handled gracefully with Love2D error system

---

## Testing & Quality Assurance

### Manual Testing Checklist
- [ ] Block placement in all views
- [ ] View switching and synchronization
- [ ] Height level navigation (all 50 levels)
- [ ] All 5 block types and patterns
- [ ] Tool switching and functionality
- [ ] Save/load reliability
- [ ] Export functionality
- [ ] Performance with large builds
- [ ] Responsive design on different screen sizes
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)

## File Structure

```
minecraft-cad/
├── main.lua                    # Love2D entry point
├── conf.lua                    # Love2D configuration
├── src/
│   ├── core/
│   │   ├── AppState.lua
│   │   ├── BlockData.lua
│   │   └── ViewManager.lua
│   ├── rendering/
│   │   ├── BaseRenderer.lua
│   │   ├── TopViewRenderer.lua
│   │   ├── IsometricRenderer.lua
│   │   ├── ElevationRenderer.lua
│   │   └── HatchPatterns.lua
│   ├── input/
│   │   └── InputHandler.lua
│   ├── tools/
│   │   ├── BaseTool.lua
│   │   ├── PlaceTool.lua
│   │   ├── EraseTool.lua
│   │   └── ToolManager.lua
│   ├── ui/
│   │   ├── UIManager.lua
│   │   ├── Sidebar.lua
│   │   └── StatusBar.lua
│   └── utils/
│       ├── MathUtils.lua
│       └── FileManager.lua
├── libs/                       # External Lua libraries
├── assets/
│   ├── fonts/
│   └── icons/
└── README.md
```

### Performance Benchmarks (Love2D/Lua)
- [ ] 100x100x1 build (10K blocks): 60fps using Love2D graphics
- [ ] 100x100x10 build (100K blocks): 30fps minimum with Lua optimization
- [ ] 100x100x50 build (500K blocks): 15fps minimum, stable memory usage
- [ ] Memory usage < 200MB for maximum size build (Lua's efficiency)
- [ ] Initial load time < 2 seconds (Love2D fast startup)

### Love2D Deployment Strategy
- **Cross-Platform Executables**: Love2D automatically builds for Windows, macOS, Linux
- **Single File Distribution**: Zip project into .love file for easy sharing
- **Native Performance**: No browser overhead, direct access to system resources
- **Simple Installation**: Users just need Love2D runtime (11MB download)
- **Offline Capable**: Works without internet connection

---

**Estimated Timeline**: 10 weeks  
**Team Size**: 1-2 developers familiar with Lua/Love2D  
**Total Estimated Effort**: 250-350 hours (reduced due to Love2D simplicity)  
**MVP Launch Target**: [Target Date]  

**Love2D Advantages for This Project:**
- **Simpler Development**: No web browser compatibility issues
- **Better Performance**: Native graphics, efficient 2D rendering
- **Easier Debugging**: Built-in console, immediate feedback
- **Cross-Platform**: Single codebase works everywhere
- **Lightweight**: ~10MB runtime vs browser + WebGL overhead
- **File System Access**: Easy save/load without web restrictions