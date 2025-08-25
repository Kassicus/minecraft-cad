local BaseRenderer = require('src.rendering.BaseRenderer')
local HatchPatterns = require('src.rendering.HatchPatterns')

local TopViewRenderer = {}
TopViewRenderer.__index = TopViewRenderer

-- Set up inheritance from BaseRenderer
setmetatable(TopViewRenderer, {__index = BaseRenderer})

function TopViewRenderer:new(viewport)
    print(string.format("TopViewRenderer:new called with viewport: %s", tostring(viewport)))
    local o = BaseRenderer.new(viewport)
    print(string.format("After BaseRenderer.new, o.viewport: %s", tostring(o.viewport)))
    
    -- Ensure viewport is preserved before changing metatable
    local savedViewport = o.viewport
    local savedCamera = o.camera
    print(string.format("Saved viewport: %s, saved camera: %s", tostring(savedViewport), tostring(savedCamera)))
    
    setmetatable(o, self)
    self.__index = self
    
    -- Restore the fields that might have been lost
    o.viewport = savedViewport
    o.camera = savedCamera
    print(string.format("After restore, o.viewport: %s, o.camera: %s", tostring(o.viewport), tostring(o.camera)))
    
    o.gridSize = 20 -- pixels per block
    o.hatchPatterns = HatchPatterns:new()
    o.minGridExtent = 30 -- Minimum grid extent in all directions
    o.gridBuffer = 5 -- Buffer zone around blocks
    
    return o
end

function TopViewRenderer:render(blockData, appState)
    love.graphics.push()
    love.graphics.translate(self.viewport.width / 2, self.viewport.height / 2)
    -- Temporarily disable camera transformation for testing
    -- love.graphics.scale(self.camera.zoom)
    -- love.graphics.translate(-self.camera.x, -self.camera.y)
    
    -- Debug: Draw camera position indicator
    love.graphics.setColor(0.0, 1.0, 0.0, 0.8) -- Green camera indicator
    love.graphics.circle('line', 0, 0, 10)
    love.graphics.print(string.format("Cam(%.1f,%.1f)", self.camera.x, self.camera.y), -20, -20)
    
    self:drawGrid(blockData)
    self:drawBlocksAtLevel(blockData, appState.currentLevel)
    self:drawGhostBlocks(blockData, appState.currentLevel)
    
    -- Draw preview block if we have mouse coordinates
    local mouseX, mouseY = love.mouse.getPosition()
    if mouseX and mouseY then
        local worldX, worldY = self:screenToWorld(mouseX, mouseY)
        local gridX = math.floor(worldX)
        local gridY = math.floor(worldY)
        self:drawPreviewBlock(gridX, gridY, appState.selectedBlockType)
    end
    
    love.graphics.pop()
end

function TopViewRenderer:drawGrid(blockData)
    -- Minimal grid test - just draw a few simple lines
    love.graphics.setColor(0.4, 0.7, 0.96, 0.8) -- Blueprint blue, more visible
    love.graphics.setLineWidth(2)
    
    -- Draw a simple 5x5 grid around origin
    local gridSize = self.gridSize
    local extent = 2 -- Only 5 lines (-2 to +2)
    
    -- Horizontal lines
    for i = -extent, extent do
        local y = i * gridSize
        love.graphics.line(-extent * gridSize, y, extent * gridSize, y)
    end
    
    -- Vertical lines
    for i = -extent, extent do
        local x = i * gridSize
        love.graphics.line(x, -extent * gridSize, x, extent * gridSize)
    end
    
    -- Draw origin marker
    love.graphics.setColor(1.0, 0.8, 0.0, 1.0) -- Gold origin marker
    love.graphics.circle('fill', 0, 0, 5)
    
    -- Draw coordinate markers
    love.graphics.setColor(1.0, 0.0, 0.0, 1.0) -- Red test markers
    love.graphics.circle('fill', gridSize, 0, 3)      -- (1,0) grid position
    love.graphics.circle('fill', 0, gridSize, 3)      -- (0,1) grid position
    love.graphics.circle('fill', -gridSize, 0, 3)     -- (-1,0) grid position
    love.graphics.circle('fill', 0, -gridSize, 3)     -- (0,-1) grid position
    
    -- Reset line width
    love.graphics.setLineWidth(1)
end

function TopViewRenderer:calculateGridExtent(blockData)
    if not blockData.hasBlocks then
        return self.minGridExtent
    end
    
    local bounds = blockData:getBounds()
    local maxExtent = math.max(
        math.abs(bounds.minX), math.abs(bounds.maxX),
        math.abs(bounds.minY), math.abs(bounds.maxY)
    )
    
    -- Add buffer zone and ensure minimum extent
    local requiredExtent = maxExtent + self.gridBuffer
    
    -- Limit the maximum extent to prevent performance issues
    local maxAllowedExtent = 100
    local finalExtent = math.min(requiredExtent, maxAllowedExtent)
    
    -- Ensure minimum extent
    finalExtent = math.max(finalExtent, self.minGridExtent)
    
    return finalExtent
end

function TopViewRenderer:drawBlocksAtLevel(blockData, level)
    local blocks = blockData:getBlocksAtLevel(level)
    
    for _, block in ipairs(blocks) do
        self:drawBlock(block.x, block.y, block.type, 1.0) -- Full opacity
    end
end

function TopViewRenderer:drawGhostBlocks(blockData, currentLevel)
    -- Only draw ghost blocks for nearby levels to improve performance
    local nearbyLevels = {}
    for level = math.max(0, currentLevel - 2), math.min(49, currentLevel + 2) do
        if level ~= currentLevel then
            table.insert(nearbyLevels, level)
        end
    end
    
    for _, level in ipairs(nearbyLevels) do
        local blocks = blockData:getBlocksAtLevel(level)
        for _, block in ipairs(blocks) do
            self:drawBlock(block.x, block.y, block.type, 0.3) -- Low opacity
        end
    end
end

function TopViewRenderer:drawBlock(x, y, blockType, opacity)
    -- Convert grid coordinates to screen coordinates
    -- Grid is centered at (0,0), so coordinates can be negative
    local screenX = x * self.gridSize
    local screenY = y * self.gridSize
    
    -- Get the hatch pattern definition for this block type
    local blockDef = self.hatchPatterns.blockTypes[blockType]
    if blockDef then
        -- Draw block with hatch pattern
        self.hatchPatterns:drawPattern(screenX, screenY, self.gridSize, self.gridSize, blockDef.pattern, blockDef.color)
        
        -- Draw border
        love.graphics.setColor(0.4, 0.7, 0.96, opacity) -- Blueprint blue border
        love.graphics.setLineWidth(1)
        love.graphics.rectangle('line', screenX, screenY, self.gridSize, self.gridSize)
    end
end

function TopViewRenderer:drawPreviewBlock(x, y, blockType)
    if not blockType then return end
    
    -- Convert grid coordinates to screen coordinates
    local screenX = x * self.gridSize
    local screenY = y * self.gridSize
    
    -- Get the hatch pattern definition for this block type
    local blockDef = self.hatchPatterns.blockTypes[blockType]
    if blockDef then
        -- Draw preview block with low opacity
        self.hatchPatterns:drawPattern(screenX, screenY, self.gridSize, self.gridSize, blockDef.pattern, blockDef.color)
        
        -- Draw preview border (solid line with different color)
        love.graphics.setColor(0.8, 0.8, 0.0, 0.8) -- Yellow preview border
        love.graphics.setLineWidth(3)
        love.graphics.rectangle('line', screenX, screenY, self.gridSize, self.gridSize)
    end
end

function TopViewRenderer:screenToWorld(screenX, screenY)
    -- Simplified coordinate transformation (no camera offset/zoom for testing)
    local worldX = screenX - self.viewport.width / 2
    local worldY = screenY - self.viewport.height / 2
    
    -- Convert to world coordinates (can be negative, not snapped to grid yet)
    worldX = worldX / self.gridSize
    worldY = worldY / self.gridSize
    
    print(string.format("TopViewRenderer: Screen(%d,%d) -> World(%.2f,%.2f)", 
        screenX, screenY, worldX, worldY))
    
    return worldX, worldY
end

return TopViewRenderer
