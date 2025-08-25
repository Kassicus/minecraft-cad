local BaseTool = require('src.tools.BaseTool')

local RectangleTool = setmetatable({}, BaseTool)
RectangleTool.__index = RectangleTool

function RectangleTool:new(blockData, appState)
    local self = setmetatable(BaseTool:new('rectangle', appState, blockData), RectangleTool)
    
    -- Ensure we have access to appState and blockData
    self.appState = appState
    self.blockData = blockData
    
    -- Rectangle drawing state
    self.isDrawing = false
    self.startX = 0
    self.startY = 0
    self.endX = 0
    self.endY = 0
    
    return self
end

function RectangleTool:onMousePressed(worldX, worldY, button)
    if button == 1 then -- Left click only
        -- Start drawing rectangle
        self.isDrawing = true
        self.startX, self.startY = self:snapToGrid(worldX, worldY)
        self.endX, self.endY = self.startX, self.startY
        
        return true
    end
    return false
end

function RectangleTool:onMouseReleased(worldX, worldY, button)
    if button == 1 and self.isDrawing then
        -- Finish drawing rectangle
        self.endX, self.endY = self:snapToGrid(worldX, worldY)
        
        -- Draw the rectangle
        local success = self:drawRectangle()
        
        -- Reset drawing state
        self.isDrawing = false
        
        return true
    end
    
    return false
end

function RectangleTool:onMouseMoved(worldX, worldY)
    if self.isDrawing then
        -- Update end position while dragging
        self.endX, self.endY = self:snapToGrid(worldX, worldY)
        return true
    end
end

function RectangleTool:drawRectangle()
    -- Get current level and block type
    local level = self.appState.currentLevel
    local blockType = self.appState.selectedBlockType
    
    if not blockType then
        return
    end
    
    if not level then
        return
    end
    
    -- Calculate rectangle bounds
    local minX = math.min(self.startX, self.endX)
    local maxX = math.max(self.startX, self.endX)
    local minY = math.min(self.startY, self.endY)
    local maxY = math.max(self.startY, self.endY)
    
    -- Place blocks to form rectangle outline
    local success = true
    local blocksPlaced = 0
    
    -- Top edge
    for x = minX, maxX do
        if self.blockData:setBlock(x, minY, level, blockType) then
            blocksPlaced = blocksPlaced + 1
        else
            success = false
        end
    end
    
    -- Bottom edge
    for x = minX, maxX do
        if self.blockData:setBlock(x, maxY, level, blockType) then
            blocksPlaced = blocksPlaced + 1
        else
            success = false
        end
    end
    
    -- Left edge
    for y = minY, maxY do
        if self.blockData:setBlock(minX, y, level, blockType) then
            blocksPlaced = blocksPlaced + 1
        else
            success = false
        end
    end
    
    -- Right edge
    for y = minY, maxY do
        if self.blockData:setBlock(maxX, y, level, blockType) then
            blocksPlaced = blocksPlaced + 1
        else
            success = false
        end
    end
    
    return success
end

function RectangleTool:snapToGrid(worldX, worldY)
    -- Snap to the center of the cell containing the mouse cursor
    local gridX = math.floor(worldX)
    local gridY = math.floor(worldY)
    
    return gridX, gridY
end

function RectangleTool:render()
    -- Draw preview rectangle while dragging
    if self.isDrawing then
        love.graphics.push()
        
        -- Set preview color (semi-transparent blue)
        love.graphics.setColor(0.392, 0.71, 0.965, 0.5)
        love.graphics.setLineWidth(2)
        
        -- Calculate rectangle bounds
        local minX = math.min(self.startX, self.endX)
        local maxX = math.max(self.startX, self.endX)
        local minY = math.min(self.startY, self.endY)
        local maxY = math.max(self.startY, self.endY)
        
        -- Draw rectangle outline
        local rectWidth = maxX - minX + 1
        local rectHeight = maxY - minY + 1
        
        -- Convert to screen coordinates (this is a simplified version)
        -- In a real implementation, you'd use the current renderer's worldToScreen method
        local screenX = minX * 32 -- Assuming 32px grid size
        local screenY = minY * 32
        
        love.graphics.rectangle('line', screenX, screenY, rectWidth * 32, rectHeight * 32)
        
        love.graphics.pop()
    end
end

return RectangleTool
