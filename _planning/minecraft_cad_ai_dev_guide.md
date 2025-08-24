# MinecraftCAD - AI Development Guide

## Project Overview for AI Agents

**Project**: MinecraftCAD - A blueprint-style CAD tool for planning Minecraft builds  
**Framework**: Love2D (LÖVE) 11.4+ with Lua 5.1+  
**Architecture**: Modular, class-based system with clean separation of concerns  
**Target**: Cross-platform desktop application for technical drawing aesthetic  

## Critical Implementation Rules

### 1. Love2D Specific Requirements
```lua
-- ALWAYS use Love2D callback functions in main.lua
function love.load() end
function love.update(dt) end  
function love.draw() end
function love.mousepressed(x, y, button) end
-- etc.

-- NEVER try to create your own game loop
-- Love2D handles the main loop automatically

-- ALWAYS use love.graphics for all drawing
love.graphics.rectangle('fill', x, y, w, h)  -- CORRECT
-- Never try to use other graphics libraries

-- ALWAYS use love.filesystem for file operations
love.filesystem.write(filename, data)  -- CORRECT
-- Never use io.open() or other Lua file functions
```

### 2. Lua Module System
```lua
-- ALWAYS use this module pattern
local ModuleName = {}
ModuleName.__index = ModuleName

function ModuleName:new(params)
    local self = setmetatable({}, ModuleName)
    -- Initialize properties
    return self
end

function ModuleName:method()
    -- Method implementation
end

return ModuleName

-- ALWAYS require modules at the top of files
local BlockData = require('src.core.BlockData')
-- Use dot notation, NOT slashes: 'src.core.BlockData'
```

### 3. Class Inheritance Pattern
```lua
-- ALWAYS use this inheritance pattern for renderers/tools
local BaseClass = require('src.base.BaseClass')
local ChildClass = setmetatable({}, BaseClass)
ChildClass.__index = ChildClass

function ChildClass:new(params)
    local self = setmetatable(BaseClass:new(params), ChildClass)
    -- Child-specific initialization
    return self
end

-- NEVER try to use classical OOP patterns from other languages
```

### 4. Coordinate System Rules
```lua
-- Love2D coordinate system: (0,0) at TOP-LEFT
-- Y increases DOWNWARD
-- ALWAYS account for this when doing math

-- For blueprint grid (world coordinates):
-- Center grid at (0,0) in world space
-- Transform to screen space in renderers

function Renderer:worldToScreen(worldX, worldY)
    local screenX = (worldX - self.camera.x) * self.camera.zoom + love.graphics.getWidth() / 2
    local screenY = (worldY - self.camera.y) * self.camera.zoom + love.graphics.getHeight() / 2
    return screenX, screenY
end
```

### 5. Graphics State Management
```lua
-- ALWAYS save and restore graphics state
function Renderer:render()
    love.graphics.push()  -- Save current transform
    love.graphics.translate(x, y)
    love.graphics.scale(zoom)
    
    -- Do drawing here
    
    love.graphics.pop()   -- Restore transform
end

-- ALWAYS reset graphics state before drawing UI
love.graphics.setColor(1, 1, 1, 1)  -- Reset to white
love.graphics.setLineWidth(1)        -- Reset line width
```

## Data Structure Specifications

### Block Data Storage
```lua
-- EXACTLY this structure - do not deviate
self.blocks = {}  -- [x][y][z] = blockType string

-- ALWAYS check for nil before accessing nested tables
function BlockData:getBlock(x, y, z)
    return self.blocks[x] and self.blocks[x][y] and self.blocks[x][y][z]
end

-- ALWAYS initialize nested tables when setting
function BlockData:setBlock(x, y, z, blockType)
    if not self.blocks[x] then self.blocks[x] = {} end
    if not self.blocks[x][y] then self.blocks[x][y] = {} end
    self.blocks[x][y][z] = blockType
end
```

### Application State Structure
```lua
-- EXACTLY these property names
self.currentView = 'top'  -- 'top', 'isometric', 'north', 'south', 'east', 'west'
self.currentLevel = 0     -- 0-49 range
self.activeTool = 'place' -- 'place', 'erase', 'line'
self.selectedBlockType = 'blockA'  -- 'blockA', 'blockB', 'blockC', 'blockD', 'blockE'
self.camera = {x = 0, y = 0, zoom = 1.0}
```

## Rendering Implementation Rules

### Blueprint Color Scheme (MANDATORY)
```lua
-- EXACTLY these colors - do not change
local COLORS = {
    PRIMARY_BG = {0.12, 0.22, 0.37, 1},      -- Deep blueprint blue
    SECONDARY_BG = {0.07, 0.13, 0.20, 1},    -- Darker blue for sidebar
    WORKSPACE_BG = {0.04, 0.08, 0.13, 1},    -- Darkest blue for workspace
    ACCENT_BLUE = {0.4, 0.7, 0.96, 1},       -- Bright blueprint blue
    TEXT_PRIMARY = {0.9, 0.95, 0.97, 1},     -- Light blue-white
    GRID_COLOR = {0.4, 0.7, 0.96, 0.3},      -- Transparent blueprint blue
}

-- ALWAYS use these colors for consistency
love.graphics.setColor(unpack(COLORS.ACCENT_BLUE))
```

### Hatch Pattern Implementation
```lua
-- EXACTLY these 5 block types with these patterns
local BLOCK_TYPES = {
    blockA = { color = {0.4, 0.4, 0.4}, pattern = 'solid' },
    blockB = { color = {0.5, 0.5, 0.5}, pattern = 'diagonal' },
    blockC = { color = {0.3, 0.3, 0.3}, pattern = 'crosshatch' },
    blockD = { color = {0.35, 0.35, 0.35}, pattern = 'dots' },
    blockE = { color = {0.45, 0.45, 0.45}, pattern = 'brick' }
}

-- ALWAYS draw base fill first, then pattern overlay
function HatchPatterns:drawPattern(blockType, x, y, width, height, opacity)
    local blockDef = self.blockTypes[blockType]
    if not blockDef then return end
    
    -- Base fill
    love.graphics.setColor(blockDef.color[1], blockDef.color[2], blockDef.color[3], opacity)
    love.graphics.rectangle('fill', x, y, width, height)
    
    -- Pattern overlay
    if blockDef.pattern ~= 'solid' then
        self['draw' .. blockDef.pattern:gsub("^%l", string.upper)](self, x, y, width, height, opacity)
    end
end
```

### Grid Drawing Rules
```lua
-- ALWAYS draw grid with these exact specifications
function TopViewRenderer:drawGrid()
    love.graphics.setColor(0.4, 0.7, 0.96, 0.3)  -- EXACT transparency
    love.graphics.setLineWidth(1)                  -- EXACTLY 1 pixel
    
    local gridSize = 20  -- EXACTLY 20 pixels per block
    local gridExtent = 50 * gridSize  -- 50 blocks in each direction
    
    -- Draw horizontal lines
    for i = -gridExtent, gridExtent, gridSize do
        love.graphics.line(-gridExtent, i, gridExtent, i)
    end
    
    -- Draw vertical lines  
    for i = -gridExtent, gridExtent, gridSize do
        love.graphics.line(i, -gridExtent, i, gridExtent)
    end
end
```

## Input Handling Patterns

### Mouse Input Processing
```lua
-- ALWAYS follow this pattern for coordinate conversion
function InputHandler:mousepressed(x, y, button)
    -- Check UI first
    if self.uiManager:handleMousePressed(x, y, button) then
        return -- UI consumed the click
    end
    
    -- Convert to world coordinates
    local currentRenderer = self.viewManager:getCurrentRenderer()
    local worldX, worldY = currentRenderer:screenToWorld(x, y)
    
    -- Pass to current tool
    local currentTool = self.toolManager:getCurrentTool()
    if currentTool then
        currentTool:onMousePressed(worldX, worldY, button)
    end
end
```

### Keyboard Shortcuts (EXACT KEYS)
```lua
function InputHandler:keypressed(key)
    -- View switching
    if key == '1' then self:switchView('top')
    elseif key == '2' then self:switchView('isometric')  
    elseif key == '3' then self:switchView('north')
    elseif key == '4' then self:switchView('south')
    elseif key == '5' then self:switchView('east')
    elseif key == '6' then self:switchView('west')
    
    -- Height levels
    elseif key == 'up' then self:adjustLevel(1)
    elseif key == 'down' then self:adjustLevel(-1)
    
    -- Tools
    elseif key == 'space' then self:switchTool('place')
    elseif key == 'e' then self:switchTool('erase')
    elseif key == 'l' then self:switchTool('line')
    
    -- System
    elseif key == 'escape' then love.event.quit()
    end
end
```

## Performance Requirements

### Block Limit Handling
```lua
-- ALWAYS enforce the 500,000 block limit
function BlockData:setBlock(x, y, z, blockType)
    -- Coordinate validation
    if x < 0 or x >= 100 or y < 0 or y >= 100 or z < 0 or z >= 50 then
        return false -- Out of bounds
    end
    
    -- Block count limit
    if not self:getBlock(x, y, z) and blockType and self.blockCount >= 500000 then
        return false -- Would exceed limit
    end
    
    -- Proceed with placement...
end
```

### Rendering Optimization
```lua
-- ALWAYS use viewport culling for large datasets
function TopViewRenderer:render(blockData, appState)
    -- Calculate visible area
    local viewBounds = self:getViewBounds()
    
    -- Only render blocks in view + small buffer
    local blocks = blockData:getBlocksInRegion(
        viewBounds.minX - 5, viewBounds.minY - 5,
        viewBounds.maxX + 5, viewBounds.maxY + 5,
        appState.currentLevel
    )
    
    for _, block in ipairs(blocks) do
        self:drawBlock(block)
    end
end
```

## Common AI Agent Mistakes to Avoid

### 1. DON'T Mix Love2D with Other Libraries
```lua
-- WRONG - Don't try to use other graphics libraries
local cairo = require('cairo')  -- ❌ NO

-- CORRECT - Use Love2D's built-in graphics
love.graphics.rectangle('fill', x, y, w, h)  -- ✅ YES
```

### 2. DON'T Try to Implement WebGL-Style Rendering
```lua
-- WRONG - Don't try to port Three.js concepts
local geometry = THREE.BoxGeometry()  -- ❌ NO

-- CORRECT - Use 2D isometric projection
local isoX = (x - y) * math.cos(angle) * size  -- ✅ YES
```

### 3. DON'T Use Complex Build Systems
```lua
-- WRONG - Don't try to add webpack/babel/etc
-- package.json with build scripts  -- ❌ NO

-- CORRECT - Love2D runs Lua directly
-- Just run: love .  -- ✅ YES
```

### 4. DON'T Overcomplicate Module Loading
```lua
-- WRONG - Don't try to implement ES6 imports
import BlockData from './core/BlockData'  -- ❌ NO

-- CORRECT - Use simple Lua require
local BlockData = require('src.core.BlockData')  -- ✅ YES
```

### 5. DON'T Ignore Love2D Coordinate System
```lua
-- WRONG - Assuming Y increases upward (like math/OpenGL)
local y = y + 1  -- moves up?  -- ❌ NO

-- CORRECT - Y increases downward in Love2D
local y = y + 1  -- moves DOWN  -- ✅ YES
```

## File Organization Requirements

### EXACT Directory Structure
```
minecraft-cad/
├── main.lua                    # Entry point - EXACTLY this name
├── conf.lua                    # Config - EXACTLY this name  
├── src/
│   ├── core/                   # Core logic modules
│   ├── rendering/              # All renderer classes
│   ├── input/                  # Input handling
│   ├── tools/                  # Drawing tools
│   ├── ui/                     # User interface
│   └── utils/                  # Utilities
├── libs/                       # External Lua libraries only
├── assets/                     # Images, fonts, etc.
└── README.md
```

### File Naming Convention
- **Lua files**: PascalCase for classes (`BlockData.lua`, `TopViewRenderer.lua`)
- **Directories**: lowercase (`core`, `rendering`, `input`)
- **Module paths**: Use dots (`src.core.BlockData`)

## Error Handling Requirements

### ALWAYS Include Error Checking
```lua
-- File operations
local success, data = love.filesystem.read(filename)
if not success then
    print("Error loading file:", filename)
    return nil
end

-- Module loading
local success, module = pcall(require, 'src.optional.Module')
if not success then
    print("Optional module not found, using fallback")
    module = DefaultModule
end

-- Coordinate validation
function BlockData:setBlock(x, y, z, blockType)
    if type(x) ~= 'number' or type(y) ~= 'number' or type(z) ~= 'number' then
        error("Block coordinates must be numbers")
    end
    
    if x < 0 or x >= 100 or y < 0 or y >= 100 or z < 0 or z >= 50 then
        return false, "Coordinates out of bounds"
    end
    
    -- Proceed...
end
```

## Testing and Debugging

### Debug Output Patterns
```lua
-- ALWAYS use print() for debugging in Love2D
print("Block placed at:", x, y, z, blockType)

-- NEVER try to use console.log or other JS debugging
console.log("Debug")  -- ❌ This doesn't exist in Lua

-- Use string formatting for complex output
print(string.format("Camera: (%.2f, %.2f) zoom: %.2f", 
    camera.x, camera.y, camera.zoom))
```

### Performance Monitoring
```lua
-- Monitor frame rate and memory
function love.update(dt)
    if love.timer.getTime() % 5 < dt then  -- Every 5 seconds
        print("FPS:", love.timer.getFPS())
        print("Memory:", collectgarbage("count"), "KB")
    end
end
```

## Final Checklist for AI Implementation

Before submitting any code, verify:

- [ ] All Love2D callback functions are properly implemented
- [ ] Module system follows exact pattern with proper returns
- [ ] Color scheme matches blueprint specification exactly
- [ ] Coordinate system accounts for Love2D's Y-down orientation
- [ ] Graphics state is properly saved/restored around transforms
- [ ] Error handling is included for all file/user operations
- [ ] Block data structure uses exact [x][y][z] sparse array format
- [ ] Performance considerations include viewport culling
- [ ] UI follows exact sidebar/workspace layout specification
- [ ] No attempt to use web-specific APIs or concepts

## Quick Reference Commands

```bash
# Run the application
love .

# Run with console output
love . --console

# Create distributable
# (Love2D will package into executable)
```

Remember: Love2D handles the complexity - your job is to implement the game logic cleanly and simply. Don't overthink it!