### 5. Input System

#### 5.1 Input Handler (`InputHandler`)
Handles all mouse, keyboard, and input events.

**File**: `src/input/InputHandler.lua`
```lua
local InputHandler = {}
InputHandler.__index = InputHandler

function InputHandler:new(appState, viewManager, toolManager)
    local self = setmetatable({}, InputHandler)
    self.appState = appState
    self.viewManager = viewManager
    self.toolManager = toolManager
    
    self.mouseX = 0
    self.mouseY = 0
    self.mousePressed = false
    
    return self
end

function InputHandler:mousepressed(x, y, button)
    self.mouseX, self.mouseY = x, y
    self.mousePressed = true
    
    -- Convert screen coordinates to world coordinates
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local worldX, worldY = currentRenderer:screenToWorld(x, y)
    
    -- Pass to current tool
    local currentTool = self.toolManager:getCurrentTool()
    if currentTool then
        currentTool:onMousePressed(worldX, worldY, button)
    end
end

function InputHandler:mousereleased(x, y, button)
    self.mousePressed = false
    
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local worldX, worldY = currentRenderer:screenToWorld(x, y)
    
    local currentTool = self.toolManager:getCurrentTool()
    if currentTool then
        currentTool:onMouseReleased(worldX, worldY, button)
    end
end

function InputHandler:mousemoved(x, y)
    local dx, dy = x - self.mouseX, y - self.mouseY
    self.mouseX, self.mouseY = x, y
    
    -- Handle camera panning when middle mouse is held
    if love.mouse.isDown(3) then -- Middle mouse button
        local currentRenderer = self.viewManager:getCurrentRenderer()
        currentRenderer.camera.x = currentRenderer.camera.x - dx / currentRenderer.camera.zoom
        currentRenderer.camera.y = currentRenderer.camera.y - dy / currentRenderer.camera.zoom
    end
    
    -- Pass to current tool
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local worldX, worldY = currentRenderer:screenToWorld(x, y)
    
    local currentTool = self.toolManager:getCurrentTool()
    if currentTool then
        currentTool:onMouseMoved(worldX, worldY)
    end
end

function InputHandler:wheelmoved(x, y)
    -- Handle zoom
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local zoomFactor = 1.1
    
    if y > 0 then
        currentRenderer.camera.zoom = currentRenderer.camera.zoom * zoomFactor
    elseif y < 0 then
        currentRenderer.camera.zoom = currentRenderer.camera.zoom / zoomFactor
    end
    
    -- Clamp zoom levels
    currentRenderer.camera.zoom = math.max(0.1, math.min(5.0, currentRenderer.camera.zoom))
end

function InputHandler:keypressed(key)
    -- Handle keyboard shortcuts
    if key == 'escape' then
        love.event.quit()
    elseif key == '1' then
        self.appState:setCurrentView('top')
    elseif key == '2' then
        self.appState:setCurrentView('isometric')
    elseif key == '3' then
        self.appState:setCurrentView('elevation')
    elseif key == 'space' then
        self.toolManager:setCurrentTool('place')
    elseif key == 'e' then
        self.toolManager:setCurrentTool('erase')
    elseif key == 'up' then
        self.appState:setCurrentLevel(self.appState.currentLevel + 1)
    elseif key == 'down' then
        self.appState:setCurrentLevel(self.appState.currentLevel - 1)
    end
end

return InputHandler# MinecraftCAD - Technical Architecture (Love2D/Lua)

## System Overview

The application follows a modular architecture with clear separation between data management, rendering systems, and user interface. Built with Love2D (LÖVE) framework and Lua, providing excellent 2D rendering performance and simple cross-platform deployment.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Input         │───▶│   Application    │───▶│   Rendering     │
│   Handler       │    │   State Manager  │    │   Pipeline      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │   Block Data     │    │   View          │
         └─────────────▶│   Manager        │    │   Renderers     │
                        └──────────────────┘    └─────────────────┘
```

## Technology Stack

### Core Technologies
- **Love2D (LÖVE 11.4+)**: Game framework providing graphics, input, and windowing
- **Lua 5.1+**: Lightweight scripting language with excellent performance
- **Native 2D Graphics**: Love2D's built-in graphics API for all rendering
- **Cross-Platform**: Windows, macOS, Linux support out of the box

### Key Advantages of Love2D
- **Immediate Mode Graphics**: Perfect for CAD-style applications
- **High Performance 2D**: Optimized for thousands of draw calls
- **Simple Deployment**: Single executable distribution
- **Excellent Debugging**: Built-in console and error handling
- **Lightweight**: ~10MB runtime, fast startup times

### 3D Visualization Strategy
- **Isometric Projection**: 2D rendering of 3D perspective
- **Layered Rendering**: Z-sorting for proper depth display
- **Efficient 2D Operations**: Much faster than WebGL for our use case

## Core Modules

### 1. Application State Manager (`AppState`)
Central coordinator that manages application state, view switching, and cross-module communication.

**File**: `src/core/AppState.lua`
```lua
local AppState = {}
AppState.__index = AppState

function AppState:new()
    local self = setmetatable({}, AppState)
    self.currentView = 'top'
    self.currentLevel = 0 -- Ground level (0-49)
    self.activeTool = 'place'
    self.selectedBlockType = 'blockA'
    self.camera = {x = 0, y = 0, zoom = 1.0}
    self.listeners = {}
    return self
end

function AppState:setCurrentView(viewType)
    self.currentView = viewType
    self:notifyListeners('viewChanged', viewType)
end

function AppState:setCurrentLevel(level)
    if level >= 0 and level <= 49 then
        self.currentLevel = level
        self:notifyListeners('levelChanged', level)
    end
end

return AppState
```

### 2. Block Data Manager (`BlockData`)
Manages the core 3D block dataset with optimized storage and fast lookups.

**File**: `src/core/BlockData.lua`
```lua
local BlockData = {}
BlockData.__index = BlockData

function BlockData:new()
    local self = setmetatable({}, BlockData)
    self.blocks = {} -- Sparse 3D array: [x][y][z] = blockType
    self.blockCount = 0
    self.bounds = {minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0}
    return self
end

function BlockData:setBlock(x, y, z, blockType)
    -- Initialize nested tables if needed
    if not self.blocks[x] then self.blocks[x] = {} end
    if not self.blocks[x][y] then self.blocks[x][y] = {} end
    
    -- Set block and update count
    local wasEmpty = (self.blocks[x][y][z] == nil)
    self.blocks[x][y][z] = blockType
    
    if wasEmpty and blockType then
        self.blockCount = self.blockCount + 1
    elseif not wasEmpty and not blockType then
        self.blockCount = self.blockCount - 1
    end
    
    self:updateBounds(x, y, z)
end

function BlockData:getBlock(x, y, z)
    return self.blocks[x] and self.blocks[x][y] and self.blocks[x][y][z]
end

function BlockData:getBlocksAtLevel(level)
    local blocks = {}
    for x, xTable in pairs(self.blocks) do
        for y, yTable in pairs(xTable) do
            if yTable[level] then
                table.insert(blocks, {x = x, y = y, z = level, type = yTable[level]})
            end
        end
    end
    return blocks
end

return BlockData
```

### 3. Rendering System

#### 3.1 Base Renderer (`BaseRenderer`)
Abstract base class for all view renderers.

**File**: `src/rendering/BaseRenderer.lua`
```lua
local BaseRenderer = {}
BaseRenderer.__index = BaseRenderer

function BaseRenderer:new()
    local self = setmetatable({}, BaseRenderer)
    self.viewport = {x = 0, y = 0, width = love.graphics.getWidth(), height = love.graphics.getHeight()}
    self.camera = {x = 0, y = 0, zoom = 1.0}
    return self
end

function BaseRenderer:render(blockData, appState)
    -- Override in subclasses
    error("BaseRenderer:render() must be overridden")
end

function BaseRenderer:worldToScreen(worldX, worldY)
    local screenX = (worldX - self.camera.x) * self.camera.zoom + self.viewport.width / 2
    local screenY = (worldY - self.camera.y) * self.camera.zoom + self.viewport.height / 2
    return screenX, screenY
end

function BaseRenderer:screenToWorld(screenX, screenY)
    local worldX = (screenX - self.viewport.width / 2) / self.camera.zoom + self.camera.x
    local worldY = (screenY - self.viewport.height / 2) / self.camera.zoom + self.camera.y
    return worldX, worldY
end

return BaseRenderer
```

#### 3.2 Top View Renderer (`TopViewRenderer`)
2D renderer for top-down plan views with hatch patterns.

**File**: `src/rendering/TopViewRenderer.lua`
```lua
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
    love.graphics.translate(self.viewport.width / 2, self.viewport.height / 2)
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
        love.graphics.line(-gridExtent, i, gridExtent, i) -- Horizontal lines
        love.graphics.line(i, -gridExtent, i, gridExtent) -- Vertical lines
    end
end

function TopViewRenderer:drawBlocksAtLevel(blockData, level)
    local blocks = blockData:getBlocksAtLevel(level)
    for _, block in ipairs(blocks) do
        self:drawBlock(block.x, block.y, block.type, 1.0) -- Full opacity
    end
end

function TopViewRenderer:drawGhostBlocks(blockData, currentLevel)
    -- Draw blocks from other levels with transparency
    for level = 0, 49 do
        if level ~= currentLevel then
            local blocks = blockData:getBlocksAtLevel(level)
            for _, block in ipairs(blocks) do
                self:drawBlock(block.x, block.y, block.type, 0.3) -- Low opacity
            end
        end
    end
end

function TopViewRenderer:drawBlock(x, y, blockType, opacity)
    local screenX = x * self.gridSize
    local screenY = y * self.gridSize
    
    -- Draw block with hatch pattern
    self.hatchPatterns:drawPattern(blockType, screenX, screenY, self.gridSize, self.gridSize, opacity)
    
    -- Draw border
    love.graphics.setColor(0.4, 0.7, 0.96, opacity) -- Blueprint blue border
    love.graphics.setLineWidth(1)
    love.graphics.rectangle('line', screenX, screenY, self.gridSize, self.gridSize)
end

return TopViewRenderer
```

### 4. Hatch Pattern System (`HatchPatterns`)

**File**: `src/rendering/HatchPatterns.lua`
```lua
local HatchPatterns = {}
HatchPatterns.__index = HatchPatterns

function HatchPatterns:new()
    local self = setmetatable({}, HatchPatterns)
    
    -- Block type definitions with colors and patterns
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
    
    -- Draw base fill
    love.graphics.rectangle('fill', x, y, width, height)
    
    -- Draw pattern overlay
    if blockDef.pattern == 'solid' then
        -- No additional pattern needed
    elseif blockDef.pattern == 'diagonal' then
        self:drawDiagonalLines(x, y, width, height, opacity)
    elseif blockDef.pattern == 'crosshatch' then
        self:drawCrosshatch(x, y, width, height, opacity)
    elseif blockDef.pattern == 'dots' then
        self:drawDots(x, y, width, height, opacity)
    elseif blockDef.pattern == 'brick' then
        self:drawBrickPattern(x, y, width, height, opacity)
    end
end

function HatchPatterns:drawDiagonalLines(x, y, width, height, opacity)
    love.graphics.setColor(0.8, 0.8, 0.8, opacity * 0.7)
    love.graphics.setLineWidth(1)
    
    local spacing = 4
    for i = 0, width + height, spacing do
        love.graphics.line(x + i, y, x + i - height, y + height)
    end
end

function HatchPatterns:drawCrosshatch(x, y, width, height, opacity)
    love.graphics.setColor(0.7, 0.7, 0.7, opacity * 0.6)
    love.graphics.setLineWidth(1)
    
    local spacing = 4
    -- Diagonal lines one way
    for i = 0, width + height, spacing do
        love.graphics.line(x + i, y, x + i - height, y + height)
    end
    -- Diagonal lines the other way
    for i = 0, width + height, spacing do
        love.graphics.line(x - i, y, x - i + height, y + height)
    end
end

function HatchPatterns:drawDots(x, y, width, height, opacity)
    love.graphics.setColor(0.6, 0.6, 0.6, opacity * 0.8)
    
    local spacing = 6
    local radius = 1
    for dx = spacing / 2, width, spacing do
        for dy = spacing / 2, height, spacing do
            love.graphics.circle('fill', x + dx, y + dy, radius)
        end
    end
end

function HatchPatterns:drawBrickPattern(x, y, width, height, opacity)
    love.graphics.setColor(0.9, 0.9, 0.9, opacity * 0.5)
    love.graphics.setLineWidth(1)
    
    local brickHeight = 6
    local brickWidth = 12
    
    for row = 0, height, brickHeight do
        local offset = (row / brickHeight % 2 == 0) and 0 or brickWidth / 2
        for col = -brickWidth, width + brickWidth, brickWidth do
            love.graphics.rectangle('line', x + col + offset, y + row, brickWidth, brickHeight)
        end
    end
end

return HatchPatterns
```

### 6. Tool System

#### 6.1 Base Tool (`BaseTool`)
**File**: `src/tools/BaseTool.lua`
```lua
local BaseTool = {}
BaseTool.__index = BaseTool

function BaseTool:new(name, blockData, appState)
    local self = setmetatable({}, BaseTool)
    self.name = name
    self.blockData = blockData
    self.appState = appState
    return self
end

function BaseTool:onMousePressed(worldX, worldY, button)
    -- Override in subclasses
end

function BaseTool:onMouseReleased(worldX, worldY, button)
    -- Override in subclasses
end

function BaseTool:onMouseMoved(worldX, worldY)
    -- Override in subclasses
end

return BaseTool
```

#### 6.2 Block Placement Tool (`PlaceTool`)
**File**: `src/tools/PlaceTool.lua`
```lua
local BaseTool = require('src.tools.BaseTool')

local PlaceTool = setmetatable({}, BaseTool)
PlaceTool.__index = PlaceTool

function PlaceTool:new(blockData, appState)
    local self = setmetatable(BaseTool:new('place', blockData, appState), PlaceTool)
    return self
end

function PlaceTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left mouse button
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        local gridZ = self.appState.currentLevel
        
        -- Place block at current level
        self.blockData:setBlock(gridX, gridY, gridZ, self.appState.selectedBlockType)
    end
end

function PlaceTool:snapToGrid(worldX, worldY)
    local gridSize = 20 -- Match renderer grid size
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridY = math.floor(worldY / gridSize + 0.5)
    return gridX, gridY
end

return PlaceTool
```

#### 6.3 Erase Tool (`EraseTool`)
**File**: `src/tools/EraseTool.lua`
```lua
local BaseTool = require('src.tools.BaseTool')

local EraseTool = setmetatable({}, BaseTool)
EraseTool.__index = EraseTool

function EraseTool:new(blockData, appState)
    local self = setmetatable(BaseTool:new('erase', blockData, appState), EraseTool)
    return self
end

function EraseTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left mouse button
        local gridX, gridY = self:snapToGrid(worldX, worldY)
        local gridZ = self.appState.currentLevel
        
        -- Remove block at current level
        self.blockData:setBlock(gridX, gridY, gridZ, nil)
    end
end

function EraseTool:snapToGrid(worldX, worldY)
    local gridSize = 20
    local gridX = math.floor(worldX / gridSize + 0.5)
    local gridY = math.floor(worldY / gridSize + 0.5)
    return gridX, gridY
end

return EraseTool
```

### 7. File Management

#### 7.1 File Manager (`FileManager`)
**File**: `src/utils/FileManager.lua`
```lua
local json = require('libs.json') -- External JSON library

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
    
    local jsonString = json.encode(projectData)
    local success = love.filesystem.write(filename .. '.mcd', jsonString)
    
    return success
end

function FileManager:loadProject(filename)
    local contents, size = love.filesystem.read(filename .. '.mcd')
    if not contents then
        return nil, "File not found"
    end
    
    local success, projectData = pcall(json.decode, contents)
    if not success then
        return nil, "Invalid file format"
    end
    
    return projectData
end

function FileManager:serializeBlocks(blockData)
    local blocks = {}
    for x, xTable in pairs(blockData.blocks) do
        for y, yTable in pairs(xTable) do
            for z, blockType in pairs(yTable) do
                table.insert(blocks, {
                    x = x, y = y, z = z,
                    type = blockType
                })
            end
        end
    end
    return blocks
end

function FileManager:exportPNG(filename)
    local screenshot = love.graphics.newScreenshot()
    local imageData = screenshot:getData()
    imageData:encode('png', filename .. '.png')
end

return FileManager
```

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
├── libs/
│   └── json.lua               # JSON library for save/load
├── assets/
│   ├── fonts/
│   └── icons/
└── README.md
```

## Love2D Entry Points

### Main Application (`main.lua`)
```lua
local AppState = require('src.core.AppState')
local BlockData = require('src.core.BlockData')
local ViewManager = require('src.core.ViewManager')
local InputHandler = require('src.input.InputHandler')
local ToolManager = require('src.tools.ToolManager')
local UIManager = require('src.ui.UIManager')

-- Global application state
local appState
local blockData
local viewManager
local inputHandler
local toolManager
local uiManager

function love.load()
    -- Initialize core systems
    appState = AppState:new()
    blockData = BlockData:new()
    viewManager = ViewManager:new()
    toolManager = ToolManager:new(blockData, appState)
    inputHandler = InputHandler:new(appState, viewManager, toolManager)
    uiManager = UIManager:new(appState, blockData)
    
    -- Set up Love2D
    love.window.setTitle("MinecraftCAD")
    love.graphics.setBackgroundColor(0.12, 0.22, 0.37) -- Blueprint blue background
    
    -- Set default view
    appState:setCurrentView('top')
end

function love.update(dt)
    -- Update systems that need frame updates
    uiManager:update(dt)
end

function love.draw()
    -- Render current view
    local currentRenderer = viewManager:getCurrentRenderer()
    if currentRenderer then
        currentRenderer:render(blockData, appState)
    end
    
    -- Render UI overlay
    uiManager:render()
end

-- Input event handlers
function love.mousepressed(x, y, button)
    if not uiManager:handleMousePressed(x, y, button) then
        inputHandler:mousepressed(x, y, button)
    end
end

function love.mousereleased(x, y, button)
    inputHandler:mousereleased(x, y, button)
end

function love.mousemoved(x, y)
    inputHandler:mousemoved(x, y)
end

function love.wheelmoved(x, y)
    inputHandler:wheelmoved(x, y)
end

function love.keypressed(key)
    inputHandler:keypressed(key)
end

function love.resize(w, h)
    viewManager:handleResize(w, h)
    uiManager:handleResize(w, h)
end
```

### Configuration (`conf.lua`)
```lua
function love.conf(t)
    t.title = "MinecraftCAD"
    t.version = "11.4"
    t.window.width = 1200
    t.window.height = 800
    t.window.resizable = true
    t.window.minwidth = 800
    t.window.minheight = 600
    
    -- Enable required modules
    t.modules.audio = false
    t.modules.joystick = false
    t.modules.physics = false
    t.modules.sound = false
    t.modules.video = false
end
```

This Love2D architecture provides excellent performance for 2D rendering with proper separation of concerns and clean Lua module organization. The isometric 3D view gives you the 3D visualization you need without the complexity of WebGL, and the file structure is much simpler to work with than the JavaScript/Three.js approach.