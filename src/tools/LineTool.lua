local BaseTool = require('src.tools.BaseTool')

local LineTool = setmetatable({}, BaseTool)
LineTool.__index = LineTool

function LineTool:new(blockData, appState)
    local self = setmetatable(BaseTool:new('line', appState, blockData), LineTool)
    
    -- Ensure we have access to appState and blockData
    self.appState = appState
    self.blockData = blockData
    
    -- Line drawing state
    self.isDrawing = false
    self.startX = 0
    self.startY = 0
    self.endX = 0
    self.endY = 0
    
    return self
end

function LineTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left click only
        -- Start drawing line
        self.isDrawing = true
        self.startX, self.startY = self:snapToGrid(worldX, worldY)
        self.endX, self.endY = self.startX, self.startY
        
        return true
    end
end

function LineTool:onMouseReleased(worldX, worldY, button)
    if button == 1 and self.isDrawing then
        -- Finish drawing line
        self.endX, self.endY = self:snapToGrid(worldX, worldY)
        
        -- Draw the line
        self:drawLine()
        
        -- Reset drawing state
        self.isDrawing = false
        
        return true
    end
end

function LineTool:onMouseMoved(worldX, worldY)
    if self.isDrawing then
        -- Update end position while dragging
        self.endX, self.endY = self:snapToGrid(worldX, worldY)
        return true
    end
end

function LineTool:drawLine()
    -- Get current level and block type
    local level = self.appState.currentLevel
    local blockType = self.appState.selectedBlockType
    
    if not blockType then
        return
    end
    
    -- Use Bresenham's line algorithm to draw line
    local x0, y0 = self.startX, self.startY
    local x1, y1 = self.endX, self.endY
    
    local dx = math.abs(x1 - x0)
    local dy = math.abs(y1 - y0)
    local sx = x0 < x1 and 1 or -1
    local sy = y0 < y1 and 1 or -1
    local err = dx - dy
    
    local x, y = x0, y0
    
    while true do
        -- Place block at current position
        self:placeLineBlock(x, y, level, blockType)
        
        if x == x1 and y == y1 then
            break
        end
        
        local e2 = 2 * err
        if e2 > -dy then
            err = err - dy
            x = x + sx
        end
        if e2 < dx then
            err = err + dx
            y = y + sy
        end
    end
end

function LineTool:placeLineBlock(x, y, level, blockType)
    -- Only place block if it's within bounds
    if x >= -20 and x <= 20 and y >= -20 and y <= 20 then
        self.blockData:setBlock(x, y, level, blockType)
    end
end

function LineTool:snapToGrid(worldX, worldY)
    -- Snap to the center of the cell containing the mouse cursor
    local gridX = math.floor(worldX)
    local gridY = math.floor(worldY)
    
    return gridX, gridY
end

function LineTool:render()
    -- Draw preview line while dragging
    if self.isDrawing then
        love.graphics.push()
        
        -- Set preview color (semi-transparent blue)
        love.graphics.setColor(0.392, 0.71, 0.965, 0.5)
        love.graphics.setLineWidth(2)
        
        -- Draw line preview
        local startScreenX = self.startX * 32 -- Assuming 32px grid size
        local startScreenY = self.startY * 32
        local endScreenX = self.endX * 32
        local endScreenY = self.endY * 32
        
        love.graphics.line(startScreenX, startScreenY, endScreenX, endScreenY)
        
        love.graphics.pop()
    end
end

return LineTool
