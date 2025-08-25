local BaseTool = require('src.tools.BaseTool')

local CircleTool = setmetatable({}, BaseTool)
CircleTool.__index = CircleTool

function CircleTool:new(blockData, appState)
    local self = setmetatable(BaseTool:new('circle', appState, blockData), CircleTool)
    
    -- Ensure we have access to appState and blockData
    self.appState = appState
    self.blockData = blockData
    
    -- Circle drawing state
    self.isDrawing = false
    self.centerX = 0
    self.centerY = 0
    self.radius = 0
    
    return self
end

function CircleTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left click only
        -- Start drawing circle
        self.isDrawing = true
        self.centerX, self.centerY = self:snapToGrid(worldX, worldY)
        self.radius = 0
        
        return true
    end
end

function CircleTool:onMouseReleased(worldX, worldY, button)
    if button == 1 and self.isDrawing then
        -- Finish drawing circle
        local endX, endY = self:snapToGrid(worldX, worldY)
        self.radius = math.max(1, math.floor(math.sqrt((endX - self.centerX)^2 + (endY - self.centerY)^2)))
        
        -- Draw the circle
        self:drawCircle()
        
        -- Reset drawing state
        self.isDrawing = false
        
        return true
    end
end

function CircleTool:onMouseMoved(worldX, worldY)
    if self.isDrawing then
        -- Update radius while dragging
        local endX, endY = self:snapToGrid(worldX, worldY)
        self.radius = math.max(1, math.floor(math.sqrt((endX - self.centerX)^2 + (endY - self.centerY)^2)))
        return true
    end
end

function CircleTool:drawCircle()
    -- Get current level and block type
    local level = self.appState.currentLevel
    local blockType = self.appState.selectedBlockType
    
    if not blockType then
        return
    end
    
    -- Use Bresenham's circle algorithm to draw circle outline
    local x = self.radius
    local y = 0
    local err = 0
    
    while x >= y do
        -- Place blocks at 8 octants of the circle
        self:placeCircleBlock(self.centerX + x, self.centerY + y, level, blockType)
        self:placeCircleBlock(self.centerX + y, self.centerY + x, level, blockType)
        self:placeCircleBlock(self.centerX - y, self.centerY + x, level, blockType)
        self:placeCircleBlock(self.centerX - x, self.centerY + y, level, blockType)
        self:placeCircleBlock(self.centerX - x, self.centerY - y, level, blockType)
        self:placeCircleBlock(self.centerX - y, self.centerY - x, level, blockType)
        self:placeCircleBlock(self.centerX + y, self.centerY - x, level, blockType)
        self:placeCircleBlock(self.centerX + x, self.centerY - y, level, blockType)
        
        if err <= 0 then
            y = y + 1
            err = err + 2 * y + 1
        end
        
        if err > 0 then
            x = x - 1
            err = err - 2 * x + 1
        end
    end
end

function CircleTool:placeCircleBlock(x, y, level, blockType)
    -- Only place block if it's within bounds
    if x >= -20 and x <= 20 and y >= -20 and y <= 20 then
        self.blockData:setBlock(x, y, level, blockType)
    end
end

function CircleTool:snapToGrid(worldX, worldY)
    -- Snap to the center of the cell containing the mouse cursor
    local gridX = math.floor(worldX)
    local gridY = math.floor(worldY)
    
    return gridX, gridY
end

function CircleTool:render()
    -- Draw preview circle while dragging
    if self.isDrawing then
        love.graphics.push()
        
        -- Set preview color (semi-transparent blue)
        love.graphics.setColor(0.392, 0.71, 0.965, 0.5)
        love.graphics.setLineWidth(2)
        
        -- Draw circle outline
        local screenX = self.centerX * 32 -- Assuming 32px grid size
        local screenY = self.centerY * 32
        local screenRadius = self.radius * 32
        
        love.graphics.circle('line', screenX, screenY, screenRadius)
        
        love.graphics.pop()
    end
end

return CircleTool
